# ULAW VB2-TX LMS v2

Hệ thống quản lý học tập (LMS) cho lớp Văn bằng 2 từ xa — Trường Đại học Luật TP.HCM.

**Stack:** Next.js 15 · TypeScript · Prisma · PostgreSQL · NextAuth v5 · TailwindCSS · Docker

---

## 🚀 Chạy local (development)

### Yêu cầu
- Node.js 20+
- PostgreSQL 16+ (hoặc Docker)

### Các bước

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env
cp .env.example .env
# Điền DATABASE_URL và NEXTAUTH_SECRET

# 3. Khởi tạo database
npm run db:push
# Hoặc dùng migrations:
# npm run db:migrate

# 4. Seed dữ liệu mẫu
npm run db:seed

# 5. Chạy dev server
npm run dev
```

Truy cập: http://localhost:3000

---

## 🐳 Deploy với Docker (local)

```bash
# Build và chạy
docker compose up --build -d

# Seed dữ liệu
docker compose exec app npm run db:seed
```

---

## ☁️ Deploy lên VPS (production)

### Chuẩn bị

```bash
# 1. Tạo external Docker network cho Traefik
docker network create ulaw_proxy

# 2. Tạo file .env.prod
cp .env.example .env.prod
```

Điền vào `.env.prod`:
```env
POSTGRES_PASSWORD=your_strong_password
NEXTAUTH_SECRET=your_32_char_secret_here
NEXTAUTH_URL=https://portal.srv1559779.hstgr.cloud
GOOGLE_CLIENT_ID=...  # Optional
GOOGLE_CLIENT_SECRET=...  # Optional
ACME_EMAIL=admin@ulaw.edu.vn
```

### Deploy

```bash
# Deploy
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Xem logs
docker compose -f docker-compose.prod.yml logs -f app

# Seed (lần đầu)
docker compose -f docker-compose.prod.yml exec app sh -c "DATABASE_URL=\$DATABASE_URL npm run db:seed"
```

---

## 🔑 Tài khoản mặc định (sau seed)

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| superadmin@ulaw.edu.vn | Admin@2025! | Super Admin |
| admin@ulaw.edu.vn | Admin@2025! | Admin |
| moderator@ulaw.edu.vn | ulaw2025 | Moderator |
| creator@ulaw.edu.vn | ulaw2025 | Creator |
| 2351012001@email.hcmulaw.edu.vn | ulaw2025 | Student |
| pending@gmail.com | ulaw2025 | Pending User |

> ⚠️ **Đổi mật khẩu ngay sau khi deploy production!**

---

## 📁 Cấu trúc dự án

```
ulaw-lms-v2/
├── prisma/
│   ├── schema.prisma       # Database schema (20+ models)
│   └── seed.ts             # Seed data
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login page
│   │   ├── (portal)/       # Student portal
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   ├── videos/
│   │   │   ├── library/
│   │   │   ├── calendar/
│   │   │   ├── classmates/
│   │   │   ├── announcements/
│   │   │   ├── discussions/
│   │   │   ├── faq/
│   │   │   └── profile/
│   │   ├── (admin)/        # Admin panel
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       ├── courses/
│   │   │       ├── videos/
│   │   │       ├── announcements/
│   │   │       ├── analytics/
│   │   │       ├── audit/
│   │   │       └── settings/
│   │   ├── (moderator)/    # Content moderation queue
│   │   ├── (creator)/      # Creator Studio
│   │   ├── (pending)/      # Pending user waiting page
│   │   └── api/            # REST API routes
│   ├── components/
│   │   └── layout/
│   │       ├── PortalSidebar.tsx
│   │       └── PortalTopbar.tsx
│   ├── lib/
│   │   ├── auth.ts         # NextAuth config
│   │   ├── prisma.ts       # Prisma client
│   │   ├── utils.ts        # Utilities
│   │   └── audit.ts        # Audit logging
│   └── middleware.ts       # RBAC route protection
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🗄️ Database schema

7 Roles: `SUPER_ADMIN | ADMIN | MODERATOR | CREATOR | LECTURER | STUDENT | PENDING_USER`

Content workflow: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → REJECTED → PUBLISHED → ARCHIVED`

Key models: User, UserProfile, PrivacySetting, Course, Module, Lesson, Announcement, Event, Video, VideoBookmark, LibraryItem, Discussion, DiscussionReply, Assignment, Submission, AuditLog, SiteConfig

---

## 🔧 Scripts hữu ích

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:push      # Push schema changes (dev)
npm run db:migrate   # Apply migrations (prod)
npm run db:seed      # Seed sample data
npm run db:studio    # Prisma Studio UI
```
