// =============================================================
// Video URL helpers — derive embed URL + thumbnail from a source URL
// Supports YouTube (watch, youtu.be, shorts, /embed) and Google Drive
// (file/d/{id}/view or open?id=…). Falls back to raw URL.
// =============================================================

import type { VideoSource } from "@prisma/client";

export interface ParsedVideo {
  source: VideoSource;
  id: string | null;
  embedUrl: string;
  thumbnailUrl: string | null;
  watchUrl: string;
}

const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"]);
const DRIVE_HOSTS = new Set(["drive.google.com", "www.drive.google.com"]);

export function parseVideoUrl(input: string): ParsedVideo {
  const url = input.trim();
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (YT_HOSTS.has(host)) {
      const id = extractYouTubeId(u);
      if (id) {
        return {
          source: "YOUTUBE",
          id,
          embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
          thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          watchUrl: `https://www.youtube.com/watch?v=${id}`,
        };
      }
    }

    if (DRIVE_HOSTS.has(host)) {
      const id = extractDriveId(u);
      if (id) {
        return {
          source: "DRIVE",
          id,
          embedUrl: `https://drive.google.com/file/d/${id}/preview`,
          thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
          watchUrl: `https://drive.google.com/file/d/${id}/view`,
        };
      }
    }
  } catch {
    // Not a valid URL — let it fall through to OTHER.
  }

  return { source: "OTHER", id: null, embedUrl: url, thumbnailUrl: null, watchUrl: url };
}

function extractYouTubeId(u: URL): string | null {
  if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") {
    return cleanId(u.pathname.replace(/^\/+/, ""));
  }
  const v = u.searchParams.get("v");
  if (v) return cleanId(v);
  const parts = u.pathname.split("/").filter(Boolean);
  // /embed/{id}, /shorts/{id}, /v/{id}, /live/{id}
  if (parts.length >= 2 && ["embed", "shorts", "v", "live"].includes(parts[0])) {
    return cleanId(parts[1]);
  }
  return null;
}

function extractDriveId(u: URL): string | null {
  // /file/d/{id}/view  |  /open?id={id}  |  /uc?id={id}
  const m = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  const idParam = u.searchParams.get("id");
  if (idParam) return idParam;
  return null;
}

function cleanId(s: string): string | null {
  const id = s.split(/[?&#]/)[0];
  return /^[a-zA-Z0-9_-]{6,}$/.test(id) ? id : null;
}
