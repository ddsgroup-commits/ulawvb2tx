# Admin guide — ULAW VB2-TX LMS

## Sign in

`/login` with your admin email + password, or "Đăng nhập bằng Google" if Google OAuth is enabled.

## Daily routine

1. **Approve pending users** — `/admin/users` → filter "PENDING_USER" → review profile → "Duyệt".
2. **Post announcements** — `/admin/announcements` → "Tạo thông báo". Mark "Khẩn" to send urgent push.
3. **Check the audit log** — `/admin/audit` to spot any unusual activity.
4. **Moderate forum** (if MODERATOR) — `/moderator`.

## User management (`/admin/users`)

| Action | Who can | How |
|--------|---------|-----|
| Approve pending user | ADMIN+ | Click "Duyệt" — they get an in-app + email notification |
| Change role | ADMIN+ (ADMIN cannot promote to ADMIN/SUPER_ADMIN) | Dropdown next to user |
| Deactivate | ADMIN+ | Toggle "Hoạt động". Deactivated users keep their data but cannot sign in |
| Delete | SUPER_ADMIN only | Trash icon — cascades all owned content |

## Posting an announcement

1. `/admin/announcements` → **+ Tạo thông báo**
2. Fill title + content (Markdown supported in Phase 4)
3. Pick a **tag** — students filter by these in `/portal/announcements`
4. Optionally scope to a **course** (otherwise it's class-wide)
5. **Pinned** = stays at the top until unpinned
6. **Urgent** = red banner + push notification with 🚨 prefix
7. Click **Đăng & gửi thông báo** — every active member gets in-app + (optionally) email + push.

## Audit log (`/admin/audit`)

Read-only. Filter by action type. CSV export coming in Phase 5.

## Notifications

Admins do not need to do anything per announcement — the `notify()` service handles fan-out. You only manage **what gets sent**; users manage **how they receive** it on `/portal/profile/notifications`.

## Settings (`/admin/settings` — Phase 5 polish)

Currently controls site name, hero text, maintenance mode. Maintenance mode shows a banner on the public landing and (Phase 5) blocks portal access for non-admins.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Push notifications never arrive | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` set? Users granted permission? `PushSubscription` rows in DB? |
| Email digests not arriving | `SMTP_HOST` configured? Check `docker logs app` for SMTP errors |
| User can't sign in | Confirm `isActive = true` and `role != PENDING_USER` in `/admin/users` |
| Build fails after schema change | Run `npm run db:generate` then redeploy |
