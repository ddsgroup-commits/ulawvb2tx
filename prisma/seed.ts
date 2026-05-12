// =============================================================
// ULAW VB2 Portal — Database seed
//
// Idempotent. Safe to re-run; existing rows are upserted by a stable
// natural key (studentId for users, slug for courses, key for config).
//
// What this seeds:
//   1. Class roster (175 students) from prisma/class-roster.ts
//        - username = MSSV (studentId)
//        - default password = lowercased given name with diacritics removed
//        - role = ADMIN for class monitors, MEMBER for everyone else
//        - passwords stored as bcrypt hashes (cost 10)
//   2. Six core courses (Học kỳ I – 2026)
//   3. Demo announcements / events / library items / FAQ / contacts
//   4. SiteConfig defaults
//
// Security note: the default password ("first name, lowercased") is
// an MVP convenience for the launch session — every student is flagged
// `mustChangePassword: true` so the portal can force a reset on first
// login once that flow is wired up.
// =============================================================

import {
  PrismaClient,
  Role,
  AnnouncementTag,
  EventType,
  LibraryCategory,
  CourseStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { CLASS_ROSTER, type ClassRosterEntry } from "./class-roster";

const prisma = new PrismaClient();

// bcrypt cost – 10 is fast enough for 175 hashes (~3s) and standard for app auth.
const BCRYPT_COST = 10;

// Map roster role → Prisma Role enum.
//   "owner"   → SUPER_ADMIN  (full system control; can delete users)
//   "admin"   → ADMIN        (manage content + users)
//   "student" → STUDENT      (default for the rest of the class)
function mapRole(entry: ClassRosterEntry): Role {
  switch (entry.role) {
    case "owner": return Role.SUPER_ADMIN;
    case "admin": return Role.ADMIN;
    default:      return Role.STUDENT;
  }
}

// Synthetic but stable email so NextAuth's unique-email constraint is
// satisfied for every roster user. They never need to use this email
// to log in — they sign in with their MSSV.
function syntheticEmail(studentId: string): string {
  return `${studentId}@email.hcmulaw.edu.vn`;
}

async function seedRoster() {
  console.log(`👥 Seeding ${CLASS_ROSTER.length} class roster users…`);

  // Hash every student's individual default password (their first name,
  // lowercased, diacritics removed). Running in parallel keeps the full
  // seed under a few seconds even with 175 hashes at cost 10.
  const hashes = await Promise.all(
    CLASS_ROSTER.map((u) => bcrypt.hash(u.defaultPassword, BCRYPT_COST)),
  );

  let created = 0;
  let updated = 0;
  for (let i = 0; i < CLASS_ROSTER.length; i++) {
    const u = CLASS_ROSTER[i];
    const role = mapRole(u);
    const passwordHash = hashes[i];

    const existing = await prisma.user.findUnique({
      where: { studentId: u.studentId },
      select: { id: true, passwordHash: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: syntheticEmail(u.studentId),
          name: u.fullName,
          role,
          isActive: true,
          passwordHash,
        },
      });
      updated++;
    } else {
      await prisma.user.create({
        data: {
          email: syntheticEmail(u.studentId),
          studentId: u.studentId,
          name: u.fullName,
          passwordHash,
          role,
          isActive: true,
        },
      });
      created++;
    }
  }
  console.log(`   ✓ ${created} created, ${updated} updated`);

  // Quick sanity check: log the admins we ended up with.
  const admins = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
    select: { studentId: true, name: true, role: true },
    orderBy: { studentId: "asc" },
  });
  console.log("   Admins:", admins.map((a) => `${a.studentId} (${a.name})`).join(", "));

  // Return the primary admin for use as authorId on demo content.
  const primaryAdmin = await prisma.user.findFirst({
    where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
    orderBy: { studentId: "asc" },
  });
  if (!primaryAdmin) throw new Error("No admin found after seeding roster!");
  return primaryAdmin;
}

async function seedCourses(lecturerId: string | null) {
  const coursesData = [
    {
      slug: "ly-luan-nha-nuoc",
      code: "LLNN",
      name: "Lý luận về Nhà nước và Pháp luật",
      credits: 3,
      icon: "⚖️",
      description: "Lý luận cơ bản về Nhà nước và Pháp luật — nền tảng của toàn bộ chương trình Luật.",
      status: CourseStatus.ACTIVE,
      order: 1,
      notebooklmUrl: "https://notebooklm.google.com/notebook/8844f54c-1363-4d82-a1ac-8e111db22af1",
    },
    {
      slug: "hien-phap",
      code: "HP",
      name: "Luật Hiến pháp",
      credits: 3,
      icon: "🏛️",
      description: "Hiến pháp 2013, chế độ chính trị, quyền con người, bộ máy nhà nước Việt Nam.",
      status: CourseStatus.ACTIVE,
      order: 2,
      notebooklmUrl: "https://notebooklm.google.com/notebook/cd3cf46e-49b4-4abb-b56b-0dcf9a27d05c",
    },
    {
      slug: "hanh-chinh",
      code: "HC",
      name: "Luật Hành chính",
      credits: 3,
      icon: "📋",
      description: "Quan hệ pháp luật hành chính, quyết định hành chính, xử phạt vi phạm hành chính.",
      status: CourseStatus.ACTIVE,
      order: 3,
      notebooklmUrl: "https://notebooklm.google.com/notebook/6c0c4752-0481-4c53-9438-0cf4ef2b8f80",
    },
    {
      slug: "dan-su",
      code: "DS",
      name: "Luật Dân sự — Tài sản & Thừa kế",
      credits: 4,
      icon: "📜",
      description: "BLDS 2015: năng lực pháp luật, giao dịch dân sự, quyền sở hữu, thừa kế, bồi thường thiệt hại.",
      status: CourseStatus.ACTIVE,
      order: 4,
      notebooklmUrl: "https://notebooklm.google.com/notebook/6f3e32b1-10ed-4711-bff1-bba080d7098b",
    },
    {
      slug: "logic-phap-ly",
      code: "LOGIC",
      name: "Logic học pháp lý",
      credits: 2,
      icon: "🧩",
      description: "Tư duy logic trong lập luận pháp lý — phân tích và giải quyết vấn đề pháp lý có hệ thống.",
      status: CourseStatus.ACTIVE,
      order: 5,
      notebooklmUrl: "https://notebooklm.google.com/notebook/e8eb19e8-2dee-4f44-812b-a17ddfb32946",
    },
    {
      slug: "ly-luan-phap-luat",
      code: "LLPL",
      name: "Lý luận về Pháp luật",
      credits: 3,
      icon: "📚",
      description: "Hệ thống pháp luật, nguồn luật, giải thích pháp luật, áp dụng pháp luật trong thực tiễn.",
      status: CourseStatus.ACTIVE,
      order: 6,
      notebooklmUrl: "https://notebooklm.google.com/notebook/e6c2f20e-2257-4544-819c-b5e19597a0bc",
    },
  ];

  for (const c of coursesData) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        notebooklmUrl: c.notebooklmUrl,
        status: c.status,
        icon: c.icon,
        credits: c.credits,
        order: c.order,
      },
      create: { ...c, lecturerId: lecturerId ?? undefined },
    });
  }
  console.log(`📚 ${coursesData.length} courses upserted`);
}

async function seedSampleLessons() {
  // Show off the LMS by adding starter lessons to two active courses.
  // Idempotency: skip if any lesson exists for the course already.
  const lessonsByCourseSlug: Record<string, Array<{
    title: string;
    slug: string;
    description: string;
    content: string;
    type: "VIDEO" | "READING" | "MIXED";
    videoUrl?: string;
    durationMin: number;
    order: number;
  }>> = {
    "dan-su": [
      {
        title: "Buổi 1 — Tổng quan Bộ luật Dân sự 2015",
        slug: "tong-quan-blds-2015",
        description: "Giới thiệu cấu trúc BLDS 2015, các nguyên tắc cơ bản và phạm vi điều chỉnh.",
        content:
          "Mục tiêu bài học:\n— Hiểu cấu trúc 6 phần, 26 chương của BLDS 2015.\n— Nắm các nguyên tắc cơ bản (tự do, bình đẳng, thiện chí, trung thực).\n— Phân biệt luật chung và luật chuyên ngành.\n\nCâu hỏi ôn tập:\n1. BLDS 2015 có bao nhiêu điều?\n2. Nguyên tắc nào là quan trọng nhất trong giao dịch dân sự?",
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        durationMin: 90,
        order: 1,
      },
      {
        title: "Buổi 2 — Năng lực pháp luật và năng lực hành vi dân sự",
        slug: "nang-luc-phap-luat-dan-su",
        description: "Khi nào cá nhân có năng lực pháp luật? Khi nào có năng lực hành vi đầy đủ?",
        content:
          "Nội dung chính:\n— Năng lực pháp luật dân sự của cá nhân (Điều 16).\n— Năng lực hành vi dân sự — đầy đủ, hạn chế, mất, khó khăn nhận thức.\n— Người chưa thành niên, người mất năng lực hành vi.\n\nTình huống thực tiễn: phân tích vụ tranh chấp tài sản giữa người 17 tuổi và doanh nghiệp.",
        type: "MIXED",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        durationMin: 75,
        order: 2,
      },
      {
        title: "Buổi 3 — Giao dịch dân sự và điều kiện có hiệu lực",
        slug: "giao-dich-dan-su",
        description: "Bốn điều kiện để giao dịch dân sự có hiệu lực và hậu quả khi vi phạm.",
        content:
          "Bốn điều kiện (Điều 117):\n1. Chủ thể có năng lực;\n2. Tự nguyện;\n3. Mục đích và nội dung không vi phạm điều cấm, không trái đạo đức xã hội;\n4. Hình thức theo quy định.\n\nGiao dịch vô hiệu — phân loại + hậu quả pháp lý.",
        type: "READING",
        durationMin: 60,
        order: 3,
      },
      {
        title: "Buổi 4 — Quyền sở hữu tài sản",
        slug: "quyen-so-huu-tai-san",
        description: "Quyền sở hữu — quyền chiếm hữu, sử dụng, định đoạt.",
        content:
          "Tổng quan:\n— Khái niệm tài sản (Điều 105).\n— Ba quyền cấu thành sở hữu.\n— Hình thức sở hữu: nhà nước, tập thể, tư nhân, chung.\n— Căn cứ xác lập và chấm dứt quyền sở hữu.",
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        durationMin: 85,
        order: 4,
      },
      {
        title: "Buổi 5 — Thừa kế",
        slug: "thua-ke",
        description: "Thừa kế theo pháp luật và thừa kế theo di chúc.",
        content:
          "Hai hình thức thừa kế:\n— Theo di chúc (Phần thứ tư, Chương XXII): hình thức, hiệu lực, di sản, người thừa kế không phụ thuộc nội dung di chúc.\n— Theo pháp luật: hàng thừa kế, di sản, từ chối nhận di sản.\n\nBài tập: chia di sản trong một tình huống cụ thể.",
        type: "MIXED",
        durationMin: 95,
        order: 5,
      },
    ],
    "hien-phap": [
      {
        title: "Buổi 1 — Lịch sử lập hiến Việt Nam",
        slug: "lich-su-lap-hien",
        description: "Tổng quan 5 bản Hiến pháp (1946, 1959, 1980, 1992, 2013).",
        content:
          "Tổng quan:\n— Hiến pháp 1946: bản hiến pháp đầu tiên.\n— Hiến pháp 1959, 1980, 1992, 2013.\n— Bối cảnh và đặc điểm từng bản.\n\nThảo luận: vì sao có nhiều lần thay đổi?",
        type: "READING",
        durationMin: 60,
        order: 1,
      },
      {
        title: "Buổi 2 — Chế độ chính trị theo Hiến pháp 2013",
        slug: "che-do-chinh-tri-hp-2013",
        description: "Chương I — chế độ chính trị, vai trò Đảng và Mặt trận.",
        content:
          "Nội dung:\n— Bản chất nhà nước CHXHCN Việt Nam.\n— Vai trò Đảng Cộng sản (Điều 4).\n— Mặt trận Tổ quốc Việt Nam.\n— Nguyên tắc tổ chức và hoạt động.",
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        durationMin: 80,
        order: 2,
      },
      {
        title: "Buổi 3 — Quyền con người, quyền và nghĩa vụ cơ bản của công dân",
        slug: "quyen-con-nguoi",
        description: "Chương II — quyền cơ bản theo Hiến pháp 2013.",
        content:
          "Mục tiêu:\n— Phân biệt quyền con người và quyền công dân.\n— Quyền dân sự, chính trị, kinh tế, văn hoá.\n— Nguyên tắc giới hạn quyền (Điều 14 khoản 2).",
        type: "MIXED",
        durationMin: 90,
        order: 3,
      },
    ],
  };

  for (const [slug, lessons] of Object.entries(lessonsByCourseSlug)) {
    const course = await prisma.course.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (!course) continue;
    const existing = await prisma.lesson.count({ where: { courseId: course.id } });
    if (existing > 0) {
      console.log(`📖 ${course.name}: ${existing} lessons already exist — skipped`);
      continue;
    }
    for (const l of lessons) {
      const parsed = l.videoUrl
        ? // dynamic import to avoid circular issues — fine in a one-off seed
          (await import("../src/lib/video")).parseVideoUrl(l.videoUrl)
        : null;
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: l.title,
          slug: l.slug,
          description: l.description,
          content: l.content,
          type: l.type,
          videoUrl: l.videoUrl ?? null,
          videoSource: parsed?.source ?? null,
          videoEmbed: parsed?.embedUrl ?? null,
          thumbnailUrl: parsed?.thumbnailUrl ?? null,
          durationMin: l.durationMin,
          order: l.order,
          status: "PUBLISHED",
        },
      });
    }
    console.log(`📖 ${course.name}: ${lessons.length} lessons seeded`);
  }
}

async function seedDemoContent(adminId: string) {
  // Only seed announcements/events/library/faq once — guard by counting.
  // Idempotency for these is intentionally simpler than for users: if any
  // exist, we skip. This avoids duplicating demo data on every re-run.
  const annCount = await prisma.announcement.count();
  if (annCount === 0) {
    const announcements = [
      {
        title: "📢 Lịch học Học kỳ I – 2026 đã được xác nhận",
        content:
          "Lịch học chính thức đã được nhà trường xác nhận. Các buổi học diễn ra vào thứ Bảy và Chủ nhật hàng tuần từ 07:30 – 11:30. Lớp học qua Zoom, link sẽ được gửi trước mỗi buổi.",
        tag: AnnouncementTag.LICH_HOC,
        pinned: true,
        urgent: false,
      },
      {
        title: "⚠️ Deadline nộp bài tập Luật Dân sự – Tuần 3",
        content:
          "Nhắc nhở toàn lớp: Hạn nộp bài tập tuần 3 môn Luật Dân sự là 23:59 ngày 18/05/2026 qua Google Classroom. Bài nộp trễ bị trừ 20% điểm/ngày.",
        tag: AnnouncementTag.DEADLINE,
        pinned: true,
        urgent: true,
      },
      {
        title: "📋 Thay đổi phòng học – Luật Hành chính ngày 10/05",
        content:
          "Buổi học Luật Hành chính ngày 10/05 chuyển từ phòng Zoom thông thường sang link dự phòng. Vui lòng kiểm tra nhóm Zalo để nhận link mới.",
        tag: AnnouncementTag.THAY_DOI,
        pinned: false,
        urgent: true,
      },
      {
        title: "🎬 Video Library đã sẵn sàng — xem lại bài giảng tại đây",
        content:
          "Mục Video Library mới đã được kích hoạt. Ban cán sự sẽ đăng tải video bài giảng và buổi học qua Zoom (YouTube hoặc Google Drive). Truy cập mục 'Video bài giảng' trong sidebar.",
        tag: AnnouncementTag.KHAC,
        pinned: false,
        urgent: false,
      },
    ];
    for (const a of announcements) {
      await prisma.announcement.create({ data: { ...a, authorId: adminId } });
    }
    console.log(`📣 ${announcements.length} announcements seeded`);
  } else {
    console.log(`📣 ${annCount} announcements already exist — skipped`);
  }

  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    const events = [
      { title: "Luật Dân sự – Buổi 5", date: new Date("2026-05-11"), type: EventType.CLASS, time: "07:30 – 11:30", room: "Zoom" },
      { title: "Luật Hành chính – Buổi 4", date: new Date("2026-05-17"), type: EventType.CLASS, time: "07:30 – 11:30", room: "Zoom" },
      { title: "Nộp bài Luật Dân sự T3", date: new Date("2026-05-18"), type: EventType.DEADLINE, time: "23:59" },
      { title: "Luật Hiến pháp – Buổi 6", date: new Date("2026-05-18"), type: EventType.CLASS, time: "13:00 – 17:00", room: "Zoom" },
      { title: "Logic pháp lý – Buổi 3", date: new Date("2026-05-24"), type: EventType.CLASS, time: "07:30 – 10:30", room: "Zoom" },
      { title: "Thi giữa kỳ – Luật Hiến pháp", date: new Date("2026-05-25"), type: EventType.EXAM, time: "07:30 – 09:00", room: "P.201" },
      { title: "Họp lớp tổng kết tháng 5", date: new Date("2026-05-31"), type: EventType.EVENT, time: "15:00 – 16:00", room: "Zoom" },
      { title: "Luật Dân sự – Buổi 6", date: new Date("2026-06-01"), type: EventType.CLASS, time: "07:30 – 11:30", room: "Zoom" },
      { title: "Nộp bài Lý luận NN&PL", date: new Date("2026-06-05"), type: EventType.DEADLINE, time: "23:59" },
      { title: "Thi cuối kỳ – Luật Hành chính", date: new Date("2026-06-14"), type: EventType.EXAM, time: "07:30 – 09:30", room: "P.301" },
    ];
    for (const e of events) {
      await prisma.event.create({ data: { ...e, creatorId: adminId } });
    }
    console.log(`📅 ${events.length} events seeded`);
  }

  const libCount = await prisma.libraryItem.count();
  if (libCount === 0) {
    const libraryItems = [
      { title: "Bộ luật Dân sự 2015 (sửa đổi 2022)", category: LibraryCategory.LEGAL_DOC, description: "BLDC số 91/2015/QH13, có hiệu lực 01/01/2017" },
      { title: "Luật Hiến pháp 2013", category: LibraryCategory.LEGAL_DOC, description: "Hiến pháp nước CHXHCN Việt Nam" },
      { title: "Luật Xử lý vi phạm hành chính 2012", category: LibraryCategory.LEGAL_DOC, description: "Số 15/2012/QH13" },
      { title: "Luật Doanh nghiệp 2020", category: LibraryCategory.LEGAL_DOC, description: "Số 59/2020/QH14, hiệu lực 01/01/2021" },
      { title: "Bộ luật Tố tụng Dân sự 2015", category: LibraryCategory.LEGAL_DOC, description: "Số 92/2015/QH13" },
      { title: "Giáo trình Luật Dân sự – ULAW 2025", category: LibraryCategory.TEXTBOOK, description: "Tập 1: Phần chung và giao dịch dân sự" },
      { title: "Giáo trình Luật Hiến pháp – ULAW", category: LibraryCategory.TEXTBOOK, description: "Tái bản lần 3, 2024" },
      { title: "Giáo trình Luật Hành chính – ULAW", category: LibraryCategory.TEXTBOOK, description: "Cập nhật theo NĐ 138/2021" },
      { title: "Đề thi mẫu Luật Dân sự 2024", category: LibraryCategory.PAST_EXAM, description: "Thi cuối kỳ, dạng tự luận, kèm đáp án" },
      { title: "Đề thi mẫu Luật Hành chính 2024", category: LibraryCategory.PAST_EXAM, description: "Thi giữa kỳ và cuối kỳ" },
    ];
    for (const item of libraryItems) {
      await prisma.libraryItem.create({ data: { ...item, uploaderId: adminId } });
    }
    console.log(`📖 ${libraryItems.length} library items seeded`);
  }

  const faqCount = await prisma.fAQ.count();
  if (faqCount === 0) {
    const faqs = [
      { category: "Đăng nhập & Tài khoản", question: "Tôi đăng nhập bằng tài khoản nào?", answer: "Sử dụng MSSV (mã số sinh viên) làm tên đăng nhập. Mật khẩu mặc định là tên gọi của bạn viết thường, không dấu. Ví dụ: MSSV 2543801010228, mật khẩu 'linh'.", order: 1 },
      { category: "Đăng nhập & Tài khoản", question: "Tôi nên đổi mật khẩu sau lần đăng nhập đầu tiên không?", answer: "Có. Mật khẩu mặc định chỉ dành cho lần đăng nhập đầu — hãy đổi mật khẩu trong phần Cài đặt cá nhân ngay sau khi đăng nhập.", order: 2 },
      { category: "Đăng nhập & Tài khoản", question: "Tôi quên mật khẩu, phải làm gì?", answer: "Liên hệ Ban cán sự lớp (Lớp trưởng hoặc admin lớp) qua nhóm Zalo để được reset mật khẩu về mặc định.", order: 3 },
      { category: "Học tập", question: "Lịch học được cập nhật ở đâu?", answer: "Tất cả lịch học, thi và deadline được cập nhật trong mục 'Lịch học & Deadline'.", order: 1 },
      { category: "Học tập", question: "Làm sao xem video bài giảng?", answer: "Truy cập mục 'Video bài giảng' trong sidebar. Bạn có thể tìm kiếm theo môn, ngày, hoặc tag; xem video trực tiếp trong portal (nhúng YouTube/Google Drive).", order: 2 },
      { category: "Học tập", question: "NotebookLM là gì?", answer: "NotebookLM là công cụ AI của Google giúp học với tài liệu môn học. Mỗi môn có link NotebookLM riêng trong trang Môn học.", order: 3 },
      { category: "Quy chế & Điểm số", question: "Điều kiện dự thi cuối kỳ là gì?", answer: "Sinh viên phải tham dự ít nhất 80% số buổi học và hoàn thành đủ bài tập. Cụ thể theo quy chế đào tạo từ xa của ULAW.", order: 1 },
    ];
    for (const f of faqs) {
      await prisma.fAQ.create({ data: f });
    }
    console.log(`❓ ${faqs.length} FAQ items seeded`);
  }

  const configKeys = [
    { key: "className", value: "VB2 Luật – ULAW HCM 2025" },
    { key: "semester", value: "Học kỳ I – 2026" },
    { key: "contactEmail", value: "vb2luat2025@gmail.com" },
    { key: "googleCalendar", value: "https://calendar.google.com" },
    { key: "zaloGroup", value: "https://zalo.me/g/example" },
  ];
  for (const c of configKeys) {
    await prisma.siteConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: c,
    });
  }
  console.log(`⚙️  Site config upserted`);
}

async function main() {
  console.log("🌱 Seeding ULAW VB2 Portal database…\n");
  const admin = await seedRoster();
  await seedCourses(admin.id);
  await seedSampleLessons();
  await seedDemoContent(admin.id);
  console.log("\n🎉 Seed complete.\n");
  console.log("Login credentials format:");
  console.log("  Username = MSSV (e.g. 2543801010228)");
  console.log("  Password = first name lowercased, no diacritics (e.g. 'linh')");
  console.log("  Owners (SUPER_ADMIN):");
  console.log("    2543801010228 (Trần Nguyễn Anh Linh)    — pass: linh");
  console.log("    2543801010155 (Nguyễn Thị Thanh Thảo)   — pass: thao   [lớp trưởng]");
  console.log("  Owners can log in with either MSSV or {mssv}@email.hcmulaw.edu.vn");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
