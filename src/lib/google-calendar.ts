// Google Calendar OAuth + API helpers

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// Scopes: read/write calendar events on the user's behalf
export const GCAL_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

function clientId() {
  const v = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_CALENDAR_CLIENT_ID not set");
  return v;
}
function clientSecret() {
  const v = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_CALENDAR_CLIENT_SECRET not set");
  return v;
}
function redirectUri() {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/calendar/google/callback`;
}

// Build the Google consent-screen URL
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GCAL_SCOPES,
    access_type: "offline",
    prompt: "consent", // always request refresh_token
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  scope: string;
  token_type: string;
}

// Exchange auth code for tokens
export async function exchangeCode(code: string): Promise<TokenSet> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
}

// Use refresh_token to get a new access_token
export async function refreshAccessToken(refreshToken: string): Promise<TokenSet> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  return res.json();
}

// Revoke a token (called on disconnect)
export async function revokeToken(token: string): Promise<void> {
  await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, {
    method: "POST",
  });
}

export interface GCalEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

// Low-level API call with automatic token refresh
async function calendarFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${CALENDAR_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

// Create a Google Calendar event; returns the event ID
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GCalEvent,
): Promise<string> {
  const res = await calendarFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, {
    method: "POST",
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`createCalendarEvent failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.id as string;
}

// Update an existing Google Calendar event
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GCalEvent>,
): Promise<void> {
  const res = await calendarFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(event) },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`updateCalendarEvent failed (${res.status}): ${err}`);
  }
}

// Delete a Google Calendar event (best-effort; ignore 404)
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const res = await calendarFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const err = await res.text();
    throw new Error(`deleteCalendarEvent failed (${res.status}): ${err}`);
  }
}

// Convert a portal Event row to a Google Calendar event payload
export function portalEventToGCal(event: {
  title: string;
  description?: string | null;
  date: Date;
  endDate?: Date | null;
  time?: string | null;
  room?: string | null;
  onlineLink?: string | null;
  type: string;
  reminderMinutes?: number | null;
}): GCalEvent {
  const TZ = "Asia/Ho_Chi_Minh";

  // Parse "HH:mm – HH:mm" → extract start/end hours. Fall back to 1-hour block.
  let startDt: Date;
  let endDt: Date;

  if (event.time) {
    const parts = event.time.split(/[–-]/).map((p) => p.trim());
    const [sh, sm] = (parts[0] ?? "07:30").split(":").map(Number);
    const [eh, em] = (parts[1] ?? "08:30").split(":").map(Number);

    startDt = new Date(event.date);
    startDt.setHours(sh, sm ?? 0, 0, 0);

    endDt = event.endDate ? new Date(event.endDate) : new Date(event.date);
    endDt.setHours(eh ?? sh + 1, em ?? 0, 0, 0);
  } else {
    startDt = new Date(event.date);
    startDt.setHours(7, 30, 0, 0);
    endDt = event.endDate ? new Date(event.endDate) : new Date(startDt);
    endDt.setHours(startDt.getHours() + 1, 0, 0, 0);
  }

  const TYPE_LABELS: Record<string, string> = {
    CLASS: "📚 Buổi học",
    EXAM: "📝 Thi",
    DEADLINE: "⏰ Deadline",
    EVENT: "📌 Sự kiện",
  };

  const typeLabel = TYPE_LABELS[event.type] ?? event.type;

  let description = `${typeLabel} — ULAW VB2`;
  if (event.description) description += `\n\n${event.description}`;
  if (event.onlineLink) description += `\n\nLink tham gia: ${event.onlineLink}`;

  const location = event.room ?? event.onlineLink ?? undefined;
  const reminderMin = event.reminderMinutes ?? (event.type === "EXAM" ? 1440 : 60);

  return {
    summary: event.title,
    description,
    location,
    start: { dateTime: startDt.toISOString(), timeZone: TZ },
    end: { dateTime: endDt.toISOString(), timeZone: TZ },
    reminders: {
      useDefault: false,
      overrides: [{ method: "email", minutes: reminderMin }, { method: "popup", minutes: 30 }],
    },
    extendedProperties: {
      private: { source: "ulaw-vb2-portal" },
    },
  };
}
