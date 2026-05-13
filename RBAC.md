# ULAW VB2 Portal — RBAC Reference

## Role Hierarchy

```
SUPER_ADMIN (100)
  └─ ADMIN (80)
       └─ MODERATOR (60)
            └─ CREATOR (40)
                 └─ STUDENT (20)
                      └─ PENDING_USER (0)
```

Higher rank can do everything a lower rank can, plus more.

---

## Permissions Matrix

| Permission | SUPER_ADMIN | ADMIN | MODERATOR | CREATOR | STUDENT | PENDING_USER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Full system access | ✅ | — | — | — | — | — |
| Manage SUPER_ADMIN users | ✅ | — | — | — | — | — |
| Manage ADMIN and below | ✅ | ✅ | — | — | — | — |
| Approve/reject PENDING_USER | ✅ | ✅ | — | — | — | — |
| Assign roles | ✅ | ✅* | — | — | — | — |
| Delete users | ✅ | — | — | — | — | — |
| Deactivate users | ✅ | ✅ | — | — | — | — |
| System settings | ✅ | — | — | — | — | — |
| View audit logs | ✅ | ✅ | — | — | — | — |
| Google integrations | ✅ | — | — | — | — | — |
| Create content (draft) | ✅ | ✅ | ✅ | ✅ | — | — |
| Submit content for review | ✅ | ✅ | ✅ | ✅ | — | — |
| Publish content directly | ✅ | ✅ | — | — | — | — |
| Approve/reject content | ✅ | ✅ | ✅ | — | — | — |
| Edit submitted content | ✅ | ✅ | ✅ | — | — | — |
| Edit own DRAFT/REJECTED | ✅ | ✅ | ✅ | ✅ | — | — |
| Delete published content | ✅ | ✅ | — | — | — | — |
| Access admin panel | ✅ | ✅ | ✅ | — | — | — |
| Access Creator Studio | ✅ | ✅ | ✅ | ✅ | — | — |
| View published content | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Access portal at all | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️** |

\* ADMIN cannot assign/create SUPER_ADMIN  
\** PENDING_USER can log in but sees only the "waiting for approval" page

---

## Default Accounts

| MSSV | Name | Role |
|---|---|---|
| 2543801010228 | Trần Nguyễn Anh Linh | SUPER_ADMIN |
| 2543801010147 | Phạm Hoàng Thanh Thảo | ADMIN |
| All other class members | — | STUDENT |

---

## Content Approval Workflow

```
CREATOR creates content → saved as DRAFT
  ↓
CREATOR submits for review → status: SUBMITTED
  ↓
MODERATOR / ADMIN reviews
  ├─ Approve  → status: APPROVED
  ├─ Reject   → status: REJECTED  (+ rejection reason returned to creator)
  └─ Revision → status: SUBMITTED (+ revision note returned to creator)
              ↓
ADMIN publishes approved content → status: PUBLISHED
  (ADMIN can also publish DIRECTLY, skipping the approval queue)
```

### Creator workflow
1. Go to `/creator` — Creator Studio
2. Create a draft (Announcement / Video / Document)
3. Go to **Nháp của tôi** → click **Gửi duyệt**
4. Wait for MODERATOR review
5. If **REJECTED**, read the reason in Creator Studio and revise
6. If **APPROVED**, Admin can then publish it

### Moderator/Admin review
1. Go to `/admin/approvals`
2. Filter by **Chờ duyệt**
3. Preview content → Approve / Reject / Request revision
4. For approved content, Admin clicks **Đăng** to publish

---

## Assigning Roles

### Via Admin Panel (`/admin/users`)
1. Log in as ADMIN or SUPER_ADMIN
2. Go to **Quản lý Người dùng**
3. Find the user → click the role dropdown in their row
4. Confirm the change in the dialog

**Rules:**
- ADMIN cannot demote or change SUPER_ADMIN
- Only SUPER_ADMIN can promote someone to SUPER_ADMIN
- You cannot change your own role

### Via Invitation (`/admin/invitations`)
1. Click **Gửi lời mời**
2. Enter email + select role (ADMIN / MODERATOR / CREATOR / STUDENT)
3. Send → the recipient gets a link valid for N days
4. They set a password and the account is created with the specified role

### Approving PENDING_USER
1. Go to `/admin/users`
2. Users with amber **Chờ phê duyệt** badge appear at top
3. Click ✅ to approve (promotes to STUDENT) or ✗ to reject (deactivates)

---

## Restoring Admin Access

If you accidentally lose SUPER_ADMIN access, use the script:

```bash
# On VPS, inside the container:
docker compose exec app npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/make-owner.ts

# Or directly in psql:
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "studentId" = '2543801010228';
```

---

## API Protection Summary

| Helper | Location | Usage |
|---|---|---|
| `requireAuth()` | `src/lib/rbac.ts` | Any authenticated route |
| `requireRole(minRole)` | `src/lib/rbac.ts` | Routes with minimum role |
| `requirePermission(bool)` | `src/lib/rbac.ts` | Custom boolean checks |
| `canManageUser(actor, target)` | `src/lib/rbac.ts` | Before changing a user |
| `canChangeRole(actor, current, new)` | `src/lib/rbac.ts` | Before role assignment |
| `canPublishDirectly(role)` | `src/lib/rbac.ts` | Before direct publish |
| `canApproveContent(role)` | `src/lib/rbac.ts` | Before approval action |
| `canEditContent(role, actorId, authorId, status)` | `src/lib/rbac.ts` | Before content edit |

Example in an API route:
```ts
import { requireRole, canManageUser } from "@/lib/rbac";

export async function PATCH(req, props) {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return guard.response;

  if (!canManageUser(guard.role, targetRole)) {
    return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  }
  // ...proceed
}
```

---

## Manual QA Checklist

### Role access
- [ ] PENDING_USER sees only `/pending` page after login
- [ ] STUDENT cannot access `/admin` or `/creator`
- [ ] CREATOR sees Creator Studio in sidebar; cannot access `/admin/users`
- [ ] MODERATOR sees admin panel and approval queue; cannot see System Settings
- [ ] ADMIN sees all admin pages except System Settings
- [ ] SUPER_ADMIN sees all pages including System Settings

### Content workflow
- [ ] CREATOR can create a draft announcement and submit it
- [ ] MODERATOR can see it in `/admin/approvals` → approve/reject
- [ ] CREATOR sees rejection reason in Creator Studio
- [ ] Approved content only becomes PUBLISHED after Admin explicitly publishes it
- [ ] CREATOR cannot see other users' drafts
- [ ] STUDENT cannot see DRAFT/SUBMITTED content

### User management
- [ ] ADMIN cannot change SUPER_ADMIN role
- [ ] ADMIN can approve PENDING_USER → becomes STUDENT
- [ ] SUPER_ADMIN can delete users (others cannot)
- [ ] Deactivated users cannot log in
- [ ] Warning shown before demoting an ADMIN

### Audit logs
- [ ] Role change appears in `/admin/audit`
- [ ] User approval/rejection appears in audit
- [ ] Content published appears in audit
