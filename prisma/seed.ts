/**
 * ULAW VB2-TX LMS v2 — Complete Seed Data
 * Run: npm run db:seed
 */
import { PrismaClient, Role, ContentStatus, VideoType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ULAW LMS v2...");

  // ============================================================
  // Site Config
  // ============================================================
  const configs = [
    { key: "siteName", value: "ULAW VB2-TX LMS" },
    { key: "siteDescription", value: "Hệ thống quản lý học tập lớp Văn bằng 2 từ xa — Trường Đại học Luật TP.HCM" },
    { key: "semester", value: "Học kỳ I – 2026" },
    { key: "contactEmail", value: "vb2luat2025@gmail.com" },
    { key: "zaloGroupUrl", value: "https://zalo.me/g/ulawvb2tx" },
    { key: "googleCalendar", value: "https://calendar.google.com/calendar/u/0/embed?src=..." },
    { key: "formUpdate", value: "https://docs.google.com/forms/d/..." },
  ];

  for (const c of configs) {
    await prisma.siteConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: c,
    });
  }

  // ============================================================
  // Users
  // ============================================================
  const passwordHash = await bcrypt.hash("ulaw2025", 10);
  const adminHash = await bcrypt.hash("Admin@2025!", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@ulaw.edu.vn" },
    update: {},
    create: {
      email: "superadmin@ulaw.edu.vn",
      name: "Super Admin",
      passwordHash: adminHash,
      role: "SUPER_ADMIN" as Role,
      isActive: true,
    },
  });

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

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@ulaw.edu.vn" },
    update: {},
    create: {
      email: "moderator@ulaw.edu.vn",
      name: "Trần Thị Moderator",
      passwordHash: passwordHash,
      role: "MODERATOR" as Role,
      isActive: true,
    },
  });

  const creator = await prisma.user.upsert({
    where: { email: "creator@ulaw.edu.vn" },
    update: {},
    create: {
      email: "creator@ulaw.edu.vn",
      name: "Lê Văn Creator",
      passwordHash: passwordHash,
      role: "CREATOR" as Role,
      isActive: true,
    },
  });

  // Lecturers
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
    prisma.user.upsert({
      where: { email: "ts.tran.thi.mai@ulaw.edu.vn" },
      update: {},
      create: {
        email: "ts.tran.thi.mai@ulaw.edu.vn",
        name: "TS. Trần Thị Mai",
        passwordHash: passwordHash,
        role: "LECTURER" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "pgsts.le.van.duc@ulaw.edu.vn" },
      update: {},
      create: {
        email: "pgsts.le.van.duc@ulaw.edu.vn",
        name: "PGS.TS. Lê Văn Đức",
        passwordHash: passwordHash,
        role: "LECTURER" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "ts.pham.thi.hong@ulaw.edu.vn" },
      update: {},
      create: {
        email: "ts.pham.thi.hong@ulaw.edu.vn",
        name: "TS. Phạm Thị Hồng",
        passwordHash: passwordHash,
        role: "LECTURER" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "ts.nguyen.minh.tuan@ulaw.edu.vn" },
      update: {},
      create: {
        email: "ts.nguyen.minh.tuan@ulaw.edu.vn",
        name: "TS. Nguyễn Minh Tuấn",
        passwordHash: passwordHash,
        role: "LECTURER" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "ts.vo.thi.lan@ulaw.edu.vn" },
      update: {},
      create: {
        email: "ts.vo.thi.lan@ulaw.edu.vn",
        name: "TS. Võ Thị Lan",
        passwordHash: passwordHash,
        role: "LECTURER" as Role,
        isActive: true,
      },
    }),
  ]);

  // Sample students
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: "2351012001@email.hcmulaw.edu.vn" },
      update: {},
      create: {
        email: "2351012001@email.hcmulaw.edu.vn",
        name: "Nguyễn Thị Lan Anh",
        passwordHash: passwordHash,
        role: "STUDENT" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "2351012002@email.hcmulaw.edu.vn" },
      update: {},
      create: {
        email: "2351012002@email.hcmulaw.edu.vn",
        name: "Trần Văn Minh",
        passwordHash: passwordHash,
        role: "STUDENT" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "2351012003@email.hcmulaw.edu.vn" },
      update: {},
      create: {
        email: "2351012003@email.hcmulaw.edu.vn",
        name: "Lê Thị Hương",
        passwordHash: passwordHash,
        role: "STUDENT" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "2351012004@email.hcmulaw.edu.vn" },
      update: {},
      create: {
        email: "2351012004@email.hcmulaw.edu.vn",
        name: "Phạm Quốc Tuấn",
        passwordHash: passwordHash,
        role: "STUDENT" as Role,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "2351012005@email.hcmulaw.edu.vn" },
      update: {},
      create: {
        email: "2351012005@email.hcmulaw.edu.vn",
        name: "Võ Thị Bích Ngọc",
        passwordHash: passwordHash,
        role: "STUDENT" as Role,
        isActive: true,
      },
    }),
  ]);

  // Pending user
  await prisma.user.upsert({
    where: { email: "pending@gmail.com" },
    update: {},
    create: {
      email: "pending@gmail.com",
      name: "Nguyễn Văn Pending",
      passwordHash: passwordHash,
      role: "PENDING_USER" as Role,
      isActive: false,
    },
  });

  // ============================================================
  // Courses — 6 subjects for VB2-TX curriculum
  // ============================================================
  const courseData = [
    {
      name: "Luật Hiến pháp",
      slug: "luat-hien-phap",
      code: "LHP-VB2",
      credits: 4,
      description: "Nghiên cứu các quy định về tổ chức nhà nước, quyền công dân và cơ chế bảo hiến theo Hiến pháp 2013.",
      status: "ACTIVE" as const,
      icon: "⚖️",
      color: "#1F3A68",
      order: 1,
      lecturerId: lecturers[0].id,
      notebooklmUrl: "https://notebooklm.google.com/notebook/ulaw-hien-phap",
      driveUrl: "https://drive.google.com/drive/folders/ulaw-hien-phap",
    },
    {
      name: "Luật Dân sự",
      slug: "luat-dan-su",
      code: "LDS-VB2",
      credits: 6,
      description: "Các quan hệ tài sản và nhân thân theo Bộ luật Dân sự 2015: hợp đồng, thừa kế, trách nhiệm bồi thường.",
      status: "ACTIVE" as const,
      icon: "📜",
      color: "#B32024",
      order: 2,
      lecturerId: lecturers[1].id,
      notebooklmUrl: "https://notebooklm.google.com/notebook/ulaw-dan-su",
      driveUrl: "https://drive.google.com/drive/folders/ulaw-dan-su",
    },
    {
      name: "Luật Hình sự",
      slug: "luat-hinh-su",
      code: "LHS-VB2",
      credits: 5,
      description: "Bộ luật Hình sự 2015 (sửa đổi 2017): các tội phạm và hình phạt, cấu thành tội phạm, trách nhiệm hình sự.",
      status: "ACTIVE" as const,
      icon: "🔏",
      color: "#7C3AED",
      order: 3,
      lecturerId: lecturers[2].id,
      notebooklmUrl: "https://notebooklm.google.com/notebook/ulaw-hinh-su",
      driveUrl: "https://drive.google.com/drive/folders/ulaw-hinh-su",
    },
    {
      name: "Luật Thương mại",
      slug: "luat-thuong-mai",
      code: "LTM-VB2",
      credits: 4,
      description: "Luật Thương mại 2005, Luật Doanh nghiệp 2020: các hành vi thương mại, thương nhân, hợp đồng mua bán.",
      status: "ACTIVE" as const,
      icon: "🏢",
      color: "#D97706",
      order: 4,
      lecturerId: lecturers[3].id,
      notebooklmUrl: "https://notebooklm.google.com/notebook/ulaw-thuong-mai",
      driveUrl: "https://drive.google.com/drive/folders/ulaw-thuong-mai",
    },
    {
      name: "Luật Lao động",
      slug: "luat-lao-dong",
      code: "LLD-VB2",
      credits: 3,
      description: "Bộ luật Lao động 2019: quan hệ lao động, hợp đồng lao động, tiền lương, bảo hiểm xã hội.",
      status: "ACTIVE" as const,
      icon: "👷",
      color: "#059669",
      order: 5,
      lecturerId: lecturers[4].id,
      notebooklmUrl: "https://notebooklm.google.com/notebook/ulaw-lao-dong",
      driveUrl: "https://drive.google.com/drive/folders/ulaw-lao-dong",
    },
    {
      name: "Luật Tố tụng Dân sự",
      slug: "luat-to-tung-dan-su",
      code: "LTDDS-VB2",
      credits: 4,
      description: "Bộ luật Tố tụng Dân sự 2015: khởi kiện, thủ tục sơ thẩm, phúc thẩm, thi hành án dân sự.",
      status: "UPCOMING" as const,
      icon: "🏛️",
      color: "#0EA5E9",
      order: 6,
      lecturerId: lecturers[5].id,
      notebooklmUrl: "https://notebooklm.google.com/notebook/ulaw-to-tung",
      driveUrl: "https://drive.google.com/drive/folders/ulaw-to-tung",
    },
  ];

  const courses = await Promise.all(
    courseData.map(c => prisma.course.upsert({
      where: { slug: c.slug },
      update: { lecturerId: c.lecturerId },
      create: c,
    }))
  );

  // ============================================================
  // Modules & Lessons for first course
  // ============================================================
  const hienPhapModules = await Promise.all([
    prisma.module.upsert({
      where: { courseId_order: { courseId: courses[0].id, order: 1 } },
      update: {},
      create: {
        courseId: courses[0].id,
        title: "Chương 1: Khái quát về Luật Hiến pháp",
        description: "Đối tượng, phương pháp điều chỉnh và lịch sử lập hiến Việt Nam",
        order: 1,
      },
    }),
    prisma.module.upsert({
      where: { courseId_order: { courseId: courses[0].id, order: 2 } },
      update: {},
      create: {
        courseId: courses[0].id,
        title: "Chương 2: Chế độ chính trị",
        description: "Bản chất nhà nước, nguyên tắc tổ chức quyền lực nhà nước",
        order: 2,
      },
    }),
    prisma.module.upsert({
      where: { courseId_order: { courseId: courses[0].id, order: 3 } },
      update: {},
      create: {
        courseId: courses[0].id,
        title: "Chương 3: Quyền con người, quyền công dân",
        description: "Quyền và nghĩa vụ cơ bản của công dân theo Hiến pháp 2013",
        order: 3,
      },
    }),
    prisma.module.upsert({
      where: { courseId_order: { courseId: courses[0].id, order: 4 } },
      update: {},
      create: {
        courseId: courses[0].id,
        title: "Chương 4: Bộ máy nhà nước",
        description: "Quốc hội, Chủ tịch nước, Chính phủ, Tòa án, Viện kiểm sát",
        order: 4,
      },
    }),
  ]);

  // ============================================================
  // Announcements
  // ============================================================
  const announcements = [
    {
      title: "🎉 Chào mừng bạn đến với ULAW VB2-TX LMS!",
      body: `Kính chào các bạn sinh viên lớp Văn bằng 2 từ xa!

Hệ thống học tập trực tuyến ULAW VB2-TX LMS đã chính thức ra mắt phiên bản nâng cấp.

Các tính năng mới bao gồm:
• Thư viện video bài giảng tích hợp YouTube
• Thư viện tài liệu với tìm kiếm nâng cao
• Lịch học và lịch thi đồng bộ
• AI học tập (NotebookLM) cho từng môn
• Thảo luận theo chủ đề

Chúc các bạn học tập hiệu quả!`,
      tags: ["general"],
      pinned: true,
      published: true,
      authorId: admin.id,
    },
    {
      title: "📅 Lịch học Kỳ 1 - Năm học 2025-2026",
      body: `Thông báo lịch học chính thức Kỳ 1 năm học 2025-2026:

• Luật Hiến pháp: Thứ 7, 7h30 - 11h30 (Phòng học trực tuyến A)
• Luật Dân sự: Chủ nhật, 7h30 - 11h30 (Phòng học trực tuyến B)
• Luật Hình sự: Thứ 7, 13h00 - 17h00 (Phòng học trực tuyến A)
• Luật Thương mại: Chủ nhật, 13h00 - 17h00 (Phòng học trực tuyến B)
• Luật Lao động: Thứ 7, 17h30 - 20h30 (Phòng học trực tuyến A)

Link Zoom sẽ được gửi trước mỗi buổi học qua nhóm Zalo lớp.`,
      tags: ["academic"],
      pinned: false,
      published: true,
      authorId: admin.id,
    },
    {
      title: "📝 Kế hoạch thi cuối kỳ - Thông báo quan trọng",
      body: `Thông báo kế hoạch thi cuối kỳ Học kỳ 1 (2025-2026):

Thời gian thi dự kiến: 15/01/2026 - 30/01/2026

Hình thức thi:
• Luật Hiến pháp: Thi viết 90 phút
• Luật Dân sự: Thi viết 120 phút
• Luật Hình sự: Thi tự luận 90 phút
• Luật Thương mại: Tiểu luận nhóm + vấn đáp
• Luật Lao động: Thi trắc nghiệm kết hợp tự luận

Lịch thi chi tiết sẽ được công bố trong tháng 12/2025.`,
      tags: ["exam", "urgent"],
      pinned: false,
      published: true,
      authorId: admin.id,
    },
    {
      title: "💰 Thông báo học phí Học kỳ 2",
      body: `Thông báo về học phí Học kỳ 2 năm học 2025-2026:

Thời hạn đóng học phí: 28/02/2026

Mức học phí:
• 650,000 VNĐ/tín chỉ

Phương thức thanh toán:
• Chuyển khoản ngân hàng: STK 1234567890 - Ngân hàng Vietcombank
• Tên tài khoản: TRƯỜNG ĐẠI HỌC LUẬT TP.HCM
• Nội dung: HocPhi_MSSV_HK2_2526

Sinh viên đóng trước ngày 15/02/2026 được giảm 5% học phí.`,
      tags: ["financial"],
      pinned: false,
      published: true,
      authorId: admin.id,
    },
    {
      title: "🎯 Hội thảo Kỹ năng Pháp lý thực hành",
      body: `Ban cán sự lớp tổ chức Hội thảo Kỹ năng Pháp lý thực hành:

Thời gian: Thứ 7, 02/11/2025, 14h00 - 17h00
Hình thức: Trực tuyến qua Zoom

Nội dung:
• Kỹ năng soạn thảo hợp đồng
• Kỹ năng tư vấn pháp lý cơ bản
• Tình huống thực tế từ luật sư hành nghề

Diễn giả: LS. Nguyễn Văn Thắng (Đoàn Luật sư TP.HCM)

Đăng ký qua form trong nhóm Zalo lớp.`,
      tags: ["event"],
      pinned: false,
      published: true,
      authorId: admin.id,
    },
  ];

  for (const ann of announcements) {
    const existing = await prisma.announcement.findFirst({ where: { title: ann.title } });
    if (!existing) {
      await prisma.announcement.create({ data: ann });
    }
  }

  // ============================================================
  // Events
  // ============================================================
  const now = new Date();
  const eventData = [
    {
      title: "Thi cuối kỳ — Luật Hiến pháp",
      description: "Thi viết, không được sử dụng tài liệu. Mang theo thẻ sinh viên.",
      startAt: new Date(now.getFullYear(), now.getMonth() + 2, 15, 7, 30),
      endAt: new Date(now.getFullYear(), now.getMonth() + 2, 15, 9, 0),
      type: "EXAM",
      location: "Trường Đại học Luật TP.HCM — Phòng A301",
      isExam: true,
      courseId: courses[0].id,
    },
    {
      title: "Thi cuối kỳ — Luật Dân sự",
      description: "Thi viết 120 phút, mở sách (chỉ văn bản quy phạm pháp luật)",
      startAt: new Date(now.getFullYear(), now.getMonth() + 2, 17, 7, 30),
      endAt: new Date(now.getFullYear(), now.getMonth() + 2, 17, 9, 30),
      type: "EXAM",
      location: "Trực tuyến — Zoom",
      isExam: true,
      courseId: courses[1].id,
    },
    {
      title: "Nộp tiểu luận — Luật Thương mại",
      description: "Tiểu luận nhóm tối đa 5 người, format PDF, nộp qua hệ thống",
      startAt: new Date(now.getFullYear(), now.getMonth() + 1, 30, 23, 59),
      endAt: null,
      type: "DEADLINE",
      isExam: false,
      courseId: courses[3].id,
    },
    {
      title: "Buổi học — Luật Hiến pháp (Ch.4 Bộ máy NN)",
      description: "Chương 4: Bộ máy nhà nước. Zoom link gửi trước 30 phút.",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 7, 30),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 11, 30),
      type: "CLASS",
      location: "Zoom — ID: 123 456 789",
      isExam: false,
      courseId: courses[0].id,
    },
    {
      title: "Buổi học — Luật Dân sự (Hợp đồng)",
      description: "Chương: Hợp đồng dân sự — điều kiện có hiệu lực, vô hiệu",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 7, 30),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 11, 30),
      type: "CLASS",
      isExam: false,
      courseId: courses[1].id,
    },
    {
      title: "Hội thảo Kỹ năng Pháp lý thực hành",
      description: "Diễn giả: LS. Nguyễn Văn Thắng",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 14, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 17, 0),
      type: "OTHER",
      location: "Zoom",
      isExam: false,
    },
    {
      title: "Buổi học bù — Luật Hình sự",
      description: "Buổi học bù do nghỉ lễ Giỗ Tổ Hùng Vương",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 7, 30),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 11, 30),
      type: "MAKEUP",
      isExam: false,
      courseId: courses[2].id,
    },
    {
      title: "Hạn nộp bài tập — Luật Lao động",
      description: "Bài tập tình huống Chương 3: Hợp đồng lao động",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 23, 59),
      endAt: null,
      type: "DEADLINE",
      isExam: false,
      courseId: courses[4].id,
    },
    {
      title: "Thi giữa kỳ — Luật Hình sự",
      description: "Thi trắc nghiệm 30 câu, 45 phút, trực tuyến qua hệ thống LMS",
      startAt: new Date(now.getFullYear(), now.getMonth() + 1, 10, 9, 0),
      endAt: new Date(now.getFullYear(), now.getMonth() + 1, 10, 9, 45),
      type: "EXAM",
      isExam: true,
      courseId: courses[2].id,
    },
    {
      title: "Họp lớp định kỳ tháng 11",
      description: "Ban cán sự lớp họp định kỳ: tổng kết tháng 10, kế hoạch tháng 11",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12, 20, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12, 21, 0),
      type: "OTHER",
      location: "Zoom",
      isExam: false,
    },
  ];

  for (const event of eventData) {
    await prisma.event.create({ data: event });
  }

  // ============================================================
  // Videos
  // ============================================================
  const videoData = [
    {
      title: "Bài giảng Luật Hiến pháp — Chương 1: Khái quát",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      description: "Giới thiệu đối tượng điều chỉnh, phương pháp điều chỉnh và lịch sử lập hiến VN",
      duration: "1h 45m",
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[0].id,
      uploaderId: lecturers[0].id,
    },
    {
      title: "Bài giảng Luật Hiến pháp — Chương 2: Chế độ chính trị",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      description: "Bản chất nhà nước CHXHCN Việt Nam, nguyên tắc tổ chức quyền lực",
      duration: "2h 10m",
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[0].id,
      uploaderId: lecturers[0].id,
    },
    {
      title: "Bài giảng Luật Dân sự — Hợp đồng dân sự",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      description: "Điều kiện có hiệu lực, vô hiệu hợp đồng, thực hiện và chấm dứt hợp đồng",
      duration: "2h 30m",
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[1].id,
      uploaderId: lecturers[1].id,
    },
    {
      title: "Bài giảng Luật Dân sự — Thừa kế",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      description: "Thừa kế theo di chúc và theo pháp luật, phân chia di sản thừa kế",
      duration: "1h 55m",
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[1].id,
      uploaderId: lecturers[1].id,
    },
    {
      title: "Bài giảng Luật Hình sự — Cấu thành tội phạm",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      description: "4 yếu tố cấu thành tội phạm: khách thể, mặt khách quan, chủ thể, mặt chủ quan",
      duration: "2h 00m",
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[2].id,
      uploaderId: lecturers[2].id,
    },
    {
      title: "Bài giảng Luật Thương mại — Doanh nghiệp",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      description: "Các loại hình doanh nghiệp theo Luật DN 2020: TNHH, CP, HD, DNTN",
      duration: "1h 40m",
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[3].id,
      uploaderId: lecturers[3].id,
    },
    {
      title: "Hướng dẫn sử dụng ULAW VB2-TX LMS",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YOUTUBE" as VideoType,
      description: "Video hướng dẫn sử dụng hệ thống LMS: đăng nhập, xem video, tải tài liệu",
      duration: "15m",
      status: "PUBLISHED" as ContentStatus,
      uploaderId: admin.id,
    },
  ];

  for (const video of videoData) {
    await prisma.video.create({ data: video });
  }

  // ============================================================
  // Library Items
  // ============================================================
  const libraryData = [
    {
      title: "Hiến pháp nước CHXHCN Việt Nam 2013",
      description: "Văn bản Hiến pháp 2013 đầy đủ, có chú thích",
      fileType: "pdf",
      fileUrl: "https://drive.google.com/file/d/hien-phap-2013",
      tags: ["văn bản pháp luật", "hiến pháp"],
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[0].id,
      uploaderId: lecturers[0].id,
    },
    {
      title: "Bộ luật Dân sự 2015 — Phiên bản có annotation",
      description: "BLDS 2015 với ghi chú của giảng viên, highlight các điều quan trọng",
      fileType: "pdf",
      fileUrl: "https://drive.google.com/file/d/blds-2015-annotated",
      tags: ["văn bản pháp luật", "dân sự"],
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[1].id,
      uploaderId: lecturers[1].id,
    },
    {
      title: "Đề cương chi tiết Luật Hiến pháp",
      description: "Đề cương môn học, tiêu chí đánh giá, danh mục tài liệu tham khảo",
      fileType: "docx",
      fileUrl: "https://drive.google.com/file/d/de-cuong-hien-phap",
      tags: ["đề cương", "học tập"],
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[0].id,
      uploaderId: lecturers[0].id,
    },
    {
      title: "Slide bài giảng — Hợp đồng dân sự",
      description: "Slide PowerPoint bài giảng hợp đồng dân sự, 85 trang",
      fileType: "pptx",
      fileUrl: "https://drive.google.com/file/d/slide-hop-dong",
      tags: ["slide", "hợp đồng"],
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[1].id,
      uploaderId: lecturers[1].id,
    },
    {
      title: "Tổng hợp bài tập tình huống Luật Hình sự",
      description: "50 bài tập tình huống có đáp án, theo từng chương",
      fileType: "pdf",
      fileUrl: "https://drive.google.com/file/d/bai-tap-hinh-su",
      tags: ["bài tập", "hình sự"],
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[2].id,
      uploaderId: lecturers[2].id,
    },
    {
      title: "Link NotebookLM — Luật Hiến pháp",
      description: "AI study assistant NotebookLM được train trên toàn bộ tài liệu môn Luật HP",
      fileType: "link",
      fileUrl: "https://notebooklm.google.com/notebook/ulaw-hien-phap",
      tags: ["AI", "học tập"],
      status: "PUBLISHED" as ContentStatus,
      courseId: courses[0].id,
      uploaderId: admin.id,
    },
  ];

  for (const lib of libraryData) {
    await prisma.libraryItem.create({ data: lib });
  }

  // ============================================================
  // User Profiles & Privacy
  // ============================================================
  for (const student of students) {
    await prisma.userProfile.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        city: ["TP.HCM", "Đồng Nai", "Bình Dương", "Long An", "Tiền Giang"][students.indexOf(student)],
      },
    });

    // Move MSSV to User model
    await prisma.user.update({
      where: { id: student.id },
      data: { mssv: `2351012${students.indexOf(student) + 1}`.padStart(10, "0") }
    });

    await prisma.privacySetting.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        sharePersonalEmail: true,
        sharePhone: false,
        shareCity: true,
        shareBio: true,
        shareAvatar: true,
      },
    });
  }

  // ============================================================
  // FAQs
  // ============================================================
  const faqData = [
    {
      question: "Làm thế nào để đặt lại mật khẩu?",
      answer: "Trên trang đăng nhập, click 'Quên mật khẩu' và nhập email sinh viên. Hệ thống sẽ gửi link đặt lại mật khẩu về email trong vòng 5 phút. Nếu không nhận được, kiểm tra thư mục Spam.",
      category: "Tài khoản",
      order: 1,
      published: true,
    },
    {
      question: "Email đăng nhập là gì?",
      answer: "Email đăng nhập theo format: MSSV@email.hcmulaw.edu.vn\nVí dụ: 2351012001@email.hcmulaw.edu.vn\n\nMật khẩu mặc định: Họ tên không dấu viết thường + MSSV (ví dụ: nguyenvana2351012001)\nBạn nên đổi mật khẩu sau lần đăng nhập đầu tiên.",
      category: "Tài khoản",
      order: 2,
      published: true,
    },
    {
      question: "Làm sao để xem video bài giảng?",
      answer: "Truy cập 'Video bài giảng' từ menu bên trái. Video được nhúng trực tiếp từ YouTube. Bạn có thể:\n• Bookmark video yêu thích để xem lại nhanh\n• Lọc video theo môn học\n• Tìm kiếm theo tên bài giảng\n\nKhuyến nghị xem ở chất lượng 720p trở lên để tối ưu trải nghiệm.",
      category: "Sử dụng hệ thống",
      order: 1,
      published: true,
    },
    {
      question: "Cách tải tài liệu học tập?",
      answer: "Vào 'Thư viện tài liệu', tìm tài liệu cần tải và click nút Download (↓) hoặc mở liên kết (↗). Tài liệu được lưu trên Google Drive của trường. Bạn cần đăng nhập Google để tải về máy tính.",
      category: "Sử dụng hệ thống",
      order: 2,
      published: true,
    },
    {
      question: "NotebookLM là gì và cách sử dụng?",
      answer: "NotebookLM là công cụ AI học tập của Google, được train trên toàn bộ tài liệu môn học của ULAW VB2-TX.\n\nBạn có thể:\n• Hỏi bất kỳ câu hỏi nào về nội dung môn học\n• Yêu cầu tóm tắt, giải thích khái niệm\n• Luyện tập với câu hỏi tự sinh\n\nLink NotebookLM có trong trang chi tiết từng môn học và thư viện tài liệu.",
      category: "Sử dụng hệ thống",
      order: 3,
      published: true,
    },
    {
      question: "Thông tin cá nhân của tôi có được bảo mật không?",
      answer: "Có. Bạn toàn quyền kiểm soát thông tin nào hiển thị trong danh bạ lớp. Trong phần 'Hồ sơ' → tab 'Quyền riêng tư', bạn có thể bật/tắt hiển thị cho từng trường thông tin: email, SĐT, MSSV, Facebook, Zalo, quê quán.\n\nMặc định, email và MSSV hiển thị, SĐT và Facebook ẩn.",
      category: "Bảo mật",
      order: 1,
      published: true,
    },
    {
      question: "Liên hệ hỗ trợ kỹ thuật ở đâu?",
      answer: "Nếu gặp vấn đề kỹ thuật, bạn có thể:\n1. Nhắn tin nhóm Zalo lớp (nhanh nhất)\n2. Email: vb2luat2025@gmail.com\n3. Liên hệ Ban cán sự lớp\n\nThời gian hỗ trợ: Thứ 2 - Thứ 6, 8h00 - 17h00",
      category: "Hỗ trợ",
      order: 1,
      published: true,
    },
  ];

  for (let i = 0; i < faqData.length; i++) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faqData[i].question } });
    if (!existing) {
      await prisma.fAQ.create({ data: faqData[i] });
    }
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Test accounts:");
  console.log("  superadmin@ulaw.edu.vn / Admin@2025!");
  console.log("  admin@ulaw.edu.vn / Admin@2025!");
  console.log("  moderator@ulaw.edu.vn / ulaw2025");
  console.log("  creator@ulaw.edu.vn / ulaw2025");
  console.log("  2351012001@email.hcmulaw.edu.vn / ulaw2025");
  console.log("  pending@gmail.com / ulaw2025");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
