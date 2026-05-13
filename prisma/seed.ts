import { PrismaClient, Role, ContentStatus, VideoType, CourseStatus, AnnouncementTag, EventType, LibraryCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ULAW LMS v2...");

  // ============================================================
  // Site Config (Dynamic Content)
  // ============================================================
  await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "ULAW VB2-TX LMS",
      siteDescription: "Hệ thống quản lý học tập lớp Văn bằng 2 từ xa — Trường Đại học Luật TP.HCM",
      contactEmail: "vb2luat2025@gmail.com",
      zaloGroupUrl: "https://zalo.me/g/ulawvb2tx",
      facebookGroupUrl: "https://facebook.com/groups/ulawvb2tx",
      heroTitle: "Hệ thống quản lý học tập",
      heroSubtitle: "Lớp Văn bằng 2 Luật — Trường ĐH Luật TP.HCM",
      stats: [
        { value: "450+", label: "Sinh viên" },
        { value: "15+", label: "Giảng viên" },
        { value: "06", label: "Môn học kỳ I" },
        { value: "24/7", label: "Hỗ trợ AI" }
      ],
      features: [
        { title: "Video bài giảng", desc: "Xem lại bài giảng mọi lúc mọi nơi trên mọi thiết bị.", icon: "Video" },
        { title: "Tài liệu học tập", desc: "Thư viện giáo trình, slide và văn bản luật phong phú.", icon: "BookOpen" },
        { title: "AI Assistant", desc: "Hỗ trợ học tập thông minh với NotebookLM cho từng môn.", icon: "Bot" }
      ],
      quickLinks: [
        { label: "Vào Cổng Portal", href: "/portal" },
        { label: "Xem Lịch học", href: "/portal/schedule" },
        { label: "Video mới nhất", href: "/portal/videos" }
      ]
    },
  });

  // ============================================================
  // Users
  // ============================================================
  const passwordHash = await bcrypt.hash("ulaw2025", 10);
  const adminHash = await bcrypt.hash("Admin@2025!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ulaw.edu.vn" },
    update: {},
    create: {
      email: "admin@ulaw.edu.vn",
      name: "Nguyễn Văn Admin",
      passwordHash: adminHash,
      role: "ADMIN" as Role,
      isActive: true,
    },
  });

  const lecturers = await Promise.all([
    prisma.user.upsert({
      where: { email: "ts.nguyen.thanh.liem@ulaw.edu.vn" },
      update: {},
      create: {
        email: "ts.nguyen.thanh.liem@ulaw.edu.vn",
        name: "TS. Nguyễn Thành Liêm",
        passwordHash: passwordHash,
        role: "LECTURER" as Role,
        isActive: true,
      },
    }),
  ]);

  // ============================================================
  // Courses
  // ============================================================
  const course = await prisma.course.upsert({
    where: { slug: "luat-hien-phap" },
    update: {},
    create: {
      name: "Luật Hiến pháp",
      slug: "luat-hien-phap",
      code: "LHP-VB2",
      credits: 4,
      description: "Nghiên cứu các quy định về tổ chức nhà nước theo Hiến pháp 2013.",
      status: "ACTIVE" as CourseStatus,
      icon: "⚖️",
      lecturerId: lecturers[0].id,
    },
  });

  // ============================================================
  // Announcements
  // ============================================================
  await prisma.announcement.upsert({
    where: { id: "welcome-annc" },
    update: {},
    create: {
      id: "welcome-annc",
      title: "🎉 Chào mừng bạn đến với ULAW VB2-TX LMS!",
      content: "Hệ thống học tập trực tuyến ULAW VB2-TX LMS đã chính thức ra mắt.",
      tag: "KHAC" as AnnouncementTag,
      authorId: admin.id,
      status: "PUBLISHED" as ContentStatus,
      published: true,
    },
  });

  // ============================================================
  // Events
  // ============================================================
  await prisma.event.create({
    data: {
      title: "Buổi học — Luật Hiến pháp",
      date: new Date(),
      type: "CLASS" as EventType,
      creatorId: admin.id,
      courseId: course.id,
      isPublished: true,
    },
  });

  // ============================================================
  // Videos
  // ============================================================
  await prisma.video.create({
    data: {
      title: "Bài giảng Luật Hiến pháp — Chương 1",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      uploaderId: admin.id,
      courseId: course.id,
      status: "PUBLISHED" as ContentStatus,
      isPublished: true,
    },
  });

  // ============================================================
  // Library Items
  // ============================================================
  await prisma.libraryItem.create({
    data: {
      title: "Hiến pháp 2013",
      category: "LEGAL_DOC" as LibraryCategory,
      driveUrl: "https://drive.google.com/...",
      uploaderId: admin.id,
      courseId: course.id,
      status: "PUBLISHED" as ContentStatus,
    },
  });

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
