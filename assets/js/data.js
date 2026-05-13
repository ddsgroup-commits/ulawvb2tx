/* ============================================================
   ULAW VB2 – Class Portal
   Dữ liệu lớp học – chỉnh sửa file này để cập nhật nội dung
   ============================================================ */

/* ---------- CẤU HÌNH CHUNG ---------- */
window.SITE_CONFIG = {
  className: "ULAW VB2 – Lớp Văn bằng 2 Luật từ xa K1",
  classShortName: "ULAW VB2 K1",
  tagline: "Trung tâm thông tin lớp Văn bằng 2 Luật từ xa",
  centralMessage:
    "Trung tâm thông tin lớp Văn bằng 2 Luật từ xa – kết nối tri thức, lịch học, tài liệu và cộng đồng học tập trong một nền tảng duy nhất.",
  lastUpdated: "2026-05-11",
  // Thay link Google Calendar / Drive / NotebookLM thật của lớp vào đây
  links: {
    googleCalendar: "https://calendar.google.com/",
    googleDrive: "https://drive.google.com/",
    notebookLM: "https://notebooklm.google.com/",
    zaloBackup: "https://zalo.me/g/",
    formUpdate: "https://forms.gle/"
  },
  contact: {
    classMonitor: "Ban cán sự lớp",
    email: "vb2-lop@example.ulaw.edu.vn"
  }
};

/* ---------- THÔNG BÁO ---------- */
window.ANNOUNCEMENTS = [
  {
    id: "TB-2026-001",
    title: "Khẩn: Đổi lịch học môn Luật Hành chính tuần này",
    date: "2026-05-10",
    author: "Ban cán sự lớp",
    audience: "Toàn lớp VB2 K1",
    tags: ["ThayDoi", "Urgent"],
    pinned: true,
    urgent: true,
    body:
      "Theo thông báo của giảng viên, buổi học Luật Hành chính ngày 12/05/2026 được dời sang ngày 14/05/2026 (cùng khung giờ 19:00–21:30). Đề nghị các bạn cập nhật vào lịch cá nhân và sắp xếp công việc phù hợp.",
    action: "Cập nhật lịch cá nhân, vào lớp đúng giờ 19:00 ngày 14/05/2026 trên Zoom.",
    deadline: "2026-05-14",
    contact: "Trưởng nhóm môn Luật Hành chính"
  },
  {
    id: "TB-2026-002",
    title: "Thông báo về kế hoạch thi giữa kỳ học kỳ I",
    date: "2026-05-08",
    author: "Cố vấn học tập",
    audience: "Toàn lớp",
    tags: ["ThiCu"],
    pinned: true,
    body:
      "Kỳ thi giữa kỳ học kỳ I dự kiến diễn ra trong khoảng 03/06–10/06/2026. Hình thức thi: trực tuyến có giám sát qua nền tảng do Nhà trường chỉ định. Lịch chi tiết sẽ được cập nhật khi có thông báo chính thức.",
    action: "Theo dõi mục Lịch học & Deadline, chuẩn bị thiết bị (máy tính, webcam, mạng ổn định) cho hình thức thi trực tuyến.",
    deadline: "2026-06-03",
    contact: "Cố vấn học tập – ulaw.advisor@example.com"
  },
  {
    id: "TB-2026-003",
    title: "Nộp bài tập nhóm môn Lý luận Nhà nước",
    date: "2026-05-07",
    author: "Trưởng nhóm môn LLNN",
    audience: "Các nhóm thảo luận",
    tags: ["Deadline"],
    pinned: true,
    body:
      "Các nhóm hoàn thành bài tập nhóm số 1 với chủ đề 'Bản chất và đặc điểm của Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam'. Bài viết khoảng 8–10 trang A4, font Times New Roman 13, có trích dẫn nguồn theo chuẩn.",
    action: "Nộp file PDF vào thư mục Drive của môn học trước 23:59 ngày 18/05/2026. Một nhóm chỉ nộp một bản, ghi rõ tên thành viên.",
    deadline: "2026-05-18",
    contact: "Trưởng nhóm môn Lý luận Nhà nước"
  },
  {
    id: "TB-2026-004",
    title: "Lịch học tuần 19/05 – 25/05/2026",
    date: "2026-05-09",
    author: "Ban cán sự lớp",
    audience: "Toàn lớp",
    tags: ["LichHoc"],
    body:
      "Tuần tới có 3 buổi học: Luật Hiến pháp (T2 – 19/05), Dân sự – Tài sản – Thừa kế (T4 – 21/05), Logic học (T6 – 23/05). Toàn bộ học online qua Zoom theo link cố định.",
    action: "Đăng nhập Zoom đúng giờ. Đọc tài liệu trước buổi học để tăng hiệu quả thảo luận.",
    deadline: "2026-05-25",
    contact: "Lớp trưởng"
  },
  {
    id: "TB-2026-005",
    title: "Cập nhật quy chế đào tạo từ xa năm 2026",
    date: "2026-05-05",
    author: "Phòng Đào tạo",
    audience: "Sinh viên Văn bằng 2",
    tags: ["HanhChinh"],
    body:
      "Nhà trường đã ban hành quy chế đào tạo từ xa cập nhật, áp dụng từ tháng 06/2026. Một số thay đổi đáng chú ý liên quan đến hình thức đánh giá, điều kiện dự thi và bảo lưu kết quả. Vui lòng đọc kỹ tài liệu trong Thư viện.",
    action: "Tải và đọc văn bản 'Quy chế đào tạo từ xa 2026' trong mục Thư viện tài liệu → Văn bản pháp luật.",
    contact: "Phòng Đào tạo"
  },
  {
    id: "TB-2026-006",
    title: "Mở đăng ký nhóm thảo luận môn Logic học",
    date: "2026-05-04",
    author: "Trưởng nhóm môn Logic",
    audience: "Toàn lớp",
    tags: ["Khac"],
    body:
      "Mỗi nhóm 5–6 thành viên, đăng ký theo form đính kèm. Nhóm sẽ làm việc xuyên suốt học kỳ, có 1 bài tập nhóm và 1 buổi thuyết trình ngắn.",
    action: "Đăng ký nhóm qua form trước 12/05/2026. Nếu không đăng ký, sẽ được phân ngẫu nhiên.",
    deadline: "2026-05-12",
    contact: "Trưởng nhóm môn Logic học"
  },
  {
    id: "TB-2026-007",
    title: "Phân công trực Zoom & ghi chú buổi học",
    date: "2026-05-03",
    author: "Lớp phó học tập",
    audience: "Các trưởng nhóm môn học",
    tags: ["HanhChinh"],
    body:
      "Theo nguyên tắc luân phiên, mỗi tuần một nhóm phụ trách: bật điểm danh trên Zoom, ghi chú nội dung buổi học, đăng tóm tắt lên Drive trước 24h sau buổi học.",
    action: "Xem lịch phân công chi tiết trong file 'phan_cong_truc_zoom.xlsx' trên Drive lớp.",
    contact: "Lớp phó học tập"
  },
  {
    id: "TB-2026-008",
    title: "Hướng dẫn sử dụng NotebookLM cho từng môn học",
    date: "2026-05-01",
    author: "Ban hỗ trợ kỹ thuật",
    audience: "Toàn lớp",
    tags: ["Khac"],
    body:
      "Mỗi môn học sẽ có một NotebookLM riêng do trưởng nhóm môn duy trì. Trong NotebookLM đã có sẵn giáo trình, slide bài giảng và một số văn bản pháp luật liên quan. Sinh viên có thể đặt câu hỏi trực tiếp với AI dựa trên nguồn tài liệu được nạp vào.",
    action: "Bookmark link NotebookLM của 6 môn học vào trình duyệt. Dùng để ôn bài và kiểm tra kiến thức.",
    contact: "Ban hỗ trợ kỹ thuật lớp"
  }
];

/* ---------- SỰ KIỆN & DEADLINE ---------- */
/* type: class | exam | deadline | event */
window.EVENTS = [
  { id: "E-001", type: "class",    title: "Luật Hiến pháp – Buổi 4",        date: "2026-05-12", time: "19:00–21:30", course: "Luật Hiến pháp",     location: "Zoom (link cố định)", note: "Chương III – Bộ máy Nhà nước", owner: "TS. Nguyễn Văn A" },
  { id: "E-002", type: "class",    title: "Luật Hành chính – Buổi 4 (DỜI)", date: "2026-05-14", time: "19:00–21:30", course: "Luật Hành chính",     location: "Zoom (link cố định)", note: "Buổi đã được dời từ 12/05",   owner: "TS. Trần Thị B" },
  { id: "E-003", type: "deadline", title: "Nộp bài tập nhóm LLNN số 1",     date: "2026-05-18", time: "Trước 23:59", course: "Lý luận Nhà nước",    location: "Google Drive",        note: "Bài 8–10 trang A4, PDF",     owner: "Trưởng nhóm môn LLNN" },
  { id: "E-004", type: "class",    title: "Dân sự – Tài sản – Thừa kế",     date: "2026-05-21", time: "19:00–21:30", course: "Dân sự – TS – TK",    location: "Zoom (link cố định)", note: "Quyền sở hữu tài sản",       owner: "ThS. Lê Văn C" },
  { id: "E-005", type: "class",    title: "Logic học – Buổi 3",             date: "2026-05-23", time: "19:00–21:30", course: "Logic học",           location: "Zoom (link cố định)", note: "Phán đoán và suy luận",     owner: "TS. Phạm Thị D" },
  { id: "E-006", type: "deadline", title: "Đăng ký nhóm thảo luận Logic",   date: "2026-05-12", time: "Trước 23:59", course: "Logic học",           location: "Google Form",         note: "5–6 thành viên / nhóm",      owner: "Trưởng nhóm môn Logic" },
  { id: "E-007", type: "exam",     title: "Thi giữa kỳ Luật Hiến pháp",     date: "2026-06-03", time: "19:00–20:30", course: "Luật Hiến pháp",     location: "Trực tuyến (giám sát)", note: "Đề trắc nghiệm + tự luận", owner: "Phòng Khảo thí" },
  { id: "E-008", type: "exam",     title: "Thi giữa kỳ Luật Hành chính",    date: "2026-06-05", time: "19:00–20:30", course: "Luật Hành chính",     location: "Trực tuyến (giám sát)", note: "Đề tự luận 90 phút",       owner: "Phòng Khảo thí" },
  { id: "E-009", type: "event",    title: "Họp lớp đầu học kỳ II",          date: "2026-05-30", time: "20:00–21:00", course: "—",                   location: "Zoom – link sẽ gửi sau", note: "Tổng kết HK I, kế hoạch HK II", owner: "Ban cán sự lớp" },
  { id: "E-010", type: "deadline", title: "Nộp tiểu luận môn Dân sự",       date: "2026-05-28", time: "Trước 23:59", course: "Dân sự – TS – TK",    location: "Google Drive",         note: "15–20 trang, có trích dẫn", owner: "Trưởng nhóm môn Dân sự" }
];

/* ---------- MÔN HỌC ---------- */
window.COURSES = [
  {
    slug: "ly-luan-nha-nuoc",
    code: "LLNN-NN",
    title: "Lý luận Nhà nước & Pháp luật – Phần Nhà nước",
    teacher: "TS. Nguyễn Văn A",
    credits: 2,
    semester: "Học kỳ I (2026)",
    summary:
      "Cung cấp những kiến thức nền tảng về nguồn gốc, bản chất, hình thức và chức năng của Nhà nước. Đặt nền móng tư duy chính trị – pháp lý cho toàn bộ chương trình Văn bằng 2 Luật.",
    syllabus: [
      "Chương 1: Đối tượng, phương pháp nghiên cứu của Lý luận Nhà nước & Pháp luật",
      "Chương 2: Nguồn gốc và bản chất của Nhà nước",
      "Chương 3: Hình thức và chức năng của Nhà nước",
      "Chương 4: Kiểu Nhà nước trong lịch sử và Nhà nước CHXHCN Việt Nam",
      "Chương 5: Bộ máy Nhà nước CHXHCN Việt Nam"
    ],
    materials: [
      "Giáo trình Lý luận Nhà nước & Pháp luật – Trường ĐH Luật TP.HCM",
      "Tập bài giảng và slide của giảng viên",
      "Hiến pháp 2013 (văn bản nền tảng tham chiếu)"
    ],
    assignments: [
      "Bài tập nhóm số 1: Bản chất và đặc điểm của Nhà nước Việt Nam – hạn 18/05/2026",
      "Thảo luận lớp: So sánh các hình thức chính thể đương đại",
      "Bài tập cá nhân: 10 câu hỏi tự luận về bộ máy Nhà nước"
    ],
    sampleExams: [
      "Đề thi giữa kỳ mẫu (HK I – 2025)",
      "Bộ câu hỏi ôn tập 50 câu trắc nghiệm"
    ],
    notes: [
      "Buổi 3 (28/04): đã hoàn tất Chương 2, ghi chú trong Drive",
      "Lưu ý phân biệt 'bản chất' và 'đặc trưng' của Nhà nước trong bài thi"
    ],
    leader: "Trưởng nhóm môn LLNN – nhom-llnn@example.com"
  },
  {
    slug: "ly-luan-phap-luat",
    code: "LLNN-PL",
    title: "Lý luận Nhà nước & Pháp luật – Phần Pháp luật",
    teacher: "TS. Nguyễn Văn A",
    credits: 2,
    semester: "Học kỳ I (2026)",
    summary:
      "Trình bày các khái niệm cốt lõi về Pháp luật: nguồn gốc, bản chất, hệ thống, quy phạm, quan hệ pháp luật, vi phạm và trách nhiệm pháp lý. Đây là nền tảng để học các môn luật chuyên ngành.",
    syllabus: [
      "Chương 1: Nguồn gốc và bản chất của Pháp luật",
      "Chương 2: Quy phạm pháp luật và hệ thống pháp luật",
      "Chương 3: Quan hệ pháp luật",
      "Chương 4: Vi phạm pháp luật và trách nhiệm pháp lý",
      "Chương 5: Ý thức pháp luật và pháp chế xã hội chủ nghĩa"
    ],
    materials: [
      "Giáo trình Lý luận Nhà nước & Pháp luật – Trường ĐH Luật TP.HCM",
      "Tập bài giảng và slide của giảng viên",
      "Văn bản tham chiếu: Hiến pháp 2013, Bộ luật Dân sự 2015"
    ],
    assignments: [
      "Bài tập nhóm: Phân tích một quy phạm pháp luật cụ thể",
      "Bài tập cá nhân: Lập sơ đồ hệ thống pháp luật Việt Nam"
    ],
    sampleExams: [
      "Đề thi cuối kỳ mẫu (HK I – 2025)",
      "Đề tự luận 5 câu – ôn tập tổng hợp"
    ],
    notes: ["Chú ý phân biệt nguồn của pháp luật: tập quán pháp, tiền lệ pháp, văn bản quy phạm pháp luật"],
    leader: "Trưởng nhóm môn LLNN – nhom-llnn@example.com"
  },
  {
    slug: "luat-hien-phap",
    code: "LHP",
    title: "Luật Hiến pháp",
    teacher: "TS. Nguyễn Văn A",
    credits: 3,
    semester: "Học kỳ I (2026)",
    summary:
      "Nghiên cứu chế định nền tảng nhất của hệ thống pháp luật Việt Nam: chế độ chính trị, quyền con người, quyền và nghĩa vụ công dân, bộ máy Nhà nước, chính quyền địa phương theo Hiến pháp 2013.",
    syllabus: [
      "Chương 1: Khái quát về Luật Hiến pháp Việt Nam",
      "Chương 2: Chế độ chính trị",
      "Chương 3: Quyền con người, quyền và nghĩa vụ cơ bản của công dân",
      "Chương 4: Bộ máy Nhà nước CHXHCN Việt Nam",
      "Chương 5: Chính quyền địa phương",
      "Chương 6: Hội đồng bầu cử quốc gia, Kiểm toán Nhà nước"
    ],
    materials: [
      "Hiến pháp 2013 (toàn văn)",
      "Giáo trình Luật Hiến pháp – ĐH Luật TP.HCM",
      "Luật Tổ chức Quốc hội 2014, Luật Tổ chức Chính phủ 2015"
    ],
    assignments: [
      "Bài tập cá nhân: So sánh Hiến pháp 1992 và Hiến pháp 2013",
      "Bài tập nhóm: Phân tích một quyền cơ bản của công dân trong Hiến pháp 2013"
    ],
    sampleExams: [
      "Đề thi giữa kỳ – Trắc nghiệm 30 câu + tự luận 2 câu",
      "Đề ôn cuối kỳ – Tự luận 4 câu"
    ],
    notes: [
      "Học thuộc cấu trúc Hiến pháp 2013: 11 chương, 120 điều",
      "Phân biệt rõ Quốc hội – Chính phủ – Toà án – Viện kiểm sát trong bộ máy Nhà nước"
    ],
    leader: "Trưởng nhóm môn Hiến pháp – nhom-hp@example.com"
  },
  {
    slug: "luat-hanh-chinh",
    code: "LHC",
    title: "Luật Hành chính",
    teacher: "TS. Trần Thị B",
    credits: 3,
    semester: "Học kỳ I (2026)",
    summary:
      "Nghiên cứu các quan hệ pháp luật phát sinh trong hoạt động chấp hành – điều hành của Nhà nước: chủ thể hành chính, quyết định hành chính, thủ tục hành chính, xử lý vi phạm hành chính và trách nhiệm hành chính.",
    syllabus: [
      "Chương 1: Khái niệm và đối tượng điều chỉnh của Luật Hành chính",
      "Chương 2: Quy phạm và quan hệ pháp luật hành chính",
      "Chương 3: Cơ quan hành chính nhà nước",
      "Chương 4: Cán bộ, công chức, viên chức",
      "Chương 5: Quyết định hành chính và thủ tục hành chính",
      "Chương 6: Vi phạm hành chính và xử lý vi phạm hành chính",
      "Chương 7: Khiếu nại, tố cáo và tài phán hành chính"
    ],
    materials: [
      "Luật Cán bộ, công chức 2008 (sửa đổi 2019)",
      "Luật Xử lý vi phạm hành chính 2012 (sửa đổi 2020)",
      "Luật Tổ chức Chính phủ 2015 (sửa đổi 2019)",
      "Giáo trình Luật Hành chính – ĐH Luật TP.HCM"
    ],
    assignments: [
      "Bài tập tình huống: Xác định thẩm quyền xử phạt vi phạm hành chính",
      "Bài tập nhóm: Phân tích một quyết định hành chính cụ thể"
    ],
    sampleExams: [
      "Đề thi giữa kỳ – Tự luận 90 phút",
      "Bộ 50 câu trắc nghiệm ôn tập",
      "Đề tình huống mẫu – có hướng dẫn giải"
    ],
    notes: [
      "Buổi 4 (12/05) đã DỜI sang 14/05 – cập nhật lịch",
      "Trọng tâm thi: Vi phạm hành chính và xử lý vi phạm hành chính"
    ],
    leader: "Trưởng nhóm môn Hành chính – nhom-hc@example.com"
  },
  {
    slug: "dan-su",
    code: "DS-TS-TK",
    title: "Dân sự – Tài sản – Thừa kế",
    teacher: "ThS. Lê Văn C",
    credits: 3,
    semester: "Học kỳ I (2026)",
    summary:
      "Khái quát về Luật Dân sự, chế định tài sản và quyền sở hữu, chế định thừa kế (theo pháp luật và theo di chúc) trong Bộ luật Dân sự 2015. Là môn nền tảng cho hầu hết các môn luật tư.",
    syllabus: [
      "Chương 1: Khái quát về Luật Dân sự Việt Nam",
      "Chương 2: Chủ thể của quan hệ pháp luật dân sự",
      "Chương 3: Tài sản và quyền sở hữu",
      "Chương 4: Các biện pháp bảo vệ quyền sở hữu",
      "Chương 5: Thừa kế theo di chúc",
      "Chương 6: Thừa kế theo pháp luật",
      "Chương 7: Thanh toán và phân chia di sản"
    ],
    materials: [
      "Bộ luật Dân sự 2015 (toàn văn)",
      "Giáo trình Luật Dân sự (Phần chung – Tài sản – Thừa kế) – ĐH Luật TP.HCM",
      "Nghị quyết 02/2004/NQ-HĐTP về thừa kế"
    ],
    assignments: [
      "Bài tập tình huống: Phân chia di sản theo pháp luật",
      "Tiểu luận cá nhân 15–20 trang về một chế định tự chọn (hạn 28/05/2026)"
    ],
    sampleExams: [
      "Đề thi mẫu HK I – 2024 (tình huống thừa kế)",
      "Đề ôn tập – tự luận 3 câu"
    ],
    notes: [
      "Học kỹ Điều 651 BLDS 2015 về hàng thừa kế",
      "Phân biệt thừa kế thế vị và hưởng phần di sản không phụ thuộc nội dung di chúc"
    ],
    leader: "Trưởng nhóm môn Dân sự – nhom-ds@example.com"
  },
  {
    slug: "logic-hoc",
    code: "LGH",
    title: "Logic học",
    teacher: "TS. Phạm Thị D",
    credits: 2,
    semester: "Học kỳ I (2026)",
    summary:
      "Trang bị tư duy logic, kỹ năng lập luận pháp lý chặt chẽ: khái niệm, phán đoán, suy luận diễn dịch và quy nạp, các quy luật cơ bản của logic hình thức. Nền tảng cho nghiên cứu khoa học pháp lý.",
    syllabus: [
      "Chương 1: Đối tượng và ý nghĩa của Logic học",
      "Chương 2: Khái niệm",
      "Chương 3: Phán đoán",
      "Chương 4: Suy luận diễn dịch",
      "Chương 5: Suy luận quy nạp và loại suy",
      "Chương 6: Các quy luật cơ bản của logic hình thức",
      "Chương 7: Chứng minh và bác bỏ"
    ],
    materials: [
      "Giáo trình Logic học – ĐH Luật TP.HCM",
      "Bài tập Logic học – Tác giả: Nguyễn Văn X",
      "Slide bài giảng của giảng viên"
    ],
    assignments: [
      "Bài tập cá nhân: 30 bài tập logic dạng tam đoạn luận",
      "Bài tập nhóm: Phân tích một lập luận pháp lý dưới góc độ logic"
    ],
    sampleExams: [
      "Đề mẫu – 100% trắc nghiệm (60 câu / 60 phút)",
      "Ngân hàng đề 200 câu trắc nghiệm"
    ],
    notes: [
      "Học chắc 4 quy luật cơ bản: đồng nhất, mâu thuẫn, loại trừ cái thứ ba, lý do đầy đủ",
      "Luyện tam đoạn luận hằng ngày 10–15 phút"
    ],
    leader: "Trưởng nhóm môn Logic – nhom-logic@example.com"
  }
];

/* ---------- TÀI LIỆU ---------- */
/* type: van-ban | giao-trinh | de-thi */
window.DOCUMENTS = [
  { id: "D-01", title: "Hiến pháp nước CHXHCN Việt Nam 2013 (toàn văn)",      course: "Luật Hiến pháp",     type: "van-ban",     updated: "2026-04-20", link: "#", note: "Văn bản chính thức, public" },
  { id: "D-02", title: "Bộ luật Dân sự 2015 (toàn văn)",                       course: "Dân sự – TS – TK",   type: "van-ban",     updated: "2026-04-20", link: "#", note: "Văn bản chính thức, public" },
  { id: "D-03", title: "Luật Xử lý vi phạm hành chính 2012 (sửa đổi 2020)",    course: "Luật Hành chính",    type: "van-ban",     updated: "2026-04-22", link: "#", note: "Văn bản hợp nhất" },
  { id: "D-04", title: "Luật Cán bộ, công chức 2008 (sửa đổi 2019)",            course: "Luật Hành chính",    type: "van-ban",     updated: "2026-04-22", link: "#", note: "Văn bản hợp nhất" },
  { id: "D-05", title: "Luật Tổ chức Chính phủ 2015 (sửa đổi 2019)",            course: "Luật Hiến pháp",     type: "van-ban",     updated: "2026-04-22", link: "#", note: "Văn bản hợp nhất" },
  { id: "D-06", title: "Quy chế đào tạo từ xa của ULAW – Bản 2026",             course: "Hành chính lớp",     type: "van-ban",     updated: "2026-05-05", link: "#", note: "Nội bộ – chỉ chia sẻ trong lớp" },

  { id: "D-07", title: "Giáo trình Lý luận Nhà nước & Pháp luật – ULAW",        course: "LLNN",               type: "giao-trinh",  updated: "2026-03-15", link: "#", note: "Có bản quyền – chỉ dùng nội bộ" },
  { id: "D-08", title: "Giáo trình Luật Hiến pháp – ULAW",                      course: "Luật Hiến pháp",     type: "giao-trinh",  updated: "2026-03-15", link: "#", note: "Có bản quyền – chỉ dùng nội bộ" },
  { id: "D-09", title: "Giáo trình Luật Hành chính – ULAW",                     course: "Luật Hành chính",    type: "giao-trinh",  updated: "2026-03-15", link: "#", note: "Có bản quyền – chỉ dùng nội bộ" },
  { id: "D-10", title: "Giáo trình Luật Dân sự – Phần chung, Tài sản, Thừa kế", course: "Dân sự – TS – TK",   type: "giao-trinh",  updated: "2026-03-15", link: "#", note: "Có bản quyền – chỉ dùng nội bộ" },
  { id: "D-11", title: "Giáo trình Logic học – ULAW",                           course: "Logic học",          type: "giao-trinh",  updated: "2026-03-15", link: "#", note: "Có bản quyền – chỉ dùng nội bộ" },

  { id: "D-12", title: "Đề thi giữa kỳ Luật Hiến pháp (HK I – 2025)",           course: "Luật Hiến pháp",     type: "de-thi",      updated: "2026-04-10", link: "#", note: "Đề tham khảo – có gợi ý đáp án" },
  { id: "D-13", title: "Đề thi cuối kỳ Luật Hành chính (HK I – 2024)",          course: "Luật Hành chính",    type: "de-thi",      updated: "2026-04-10", link: "#", note: "Đề tham khảo" },
  { id: "D-14", title: "Đề thi mẫu môn Dân sự – Tình huống thừa kế",            course: "Dân sự – TS – TK",   type: "de-thi",      updated: "2026-04-12", link: "#", note: "Có hướng dẫn giải" },
  { id: "D-15", title: "Ngân hàng đề trắc nghiệm Logic học (200 câu)",          course: "Logic học",          type: "de-thi",      updated: "2026-04-15", link: "#", note: "Đề ôn tập tổng hợp" }
];

/* ---------- DANH BẠ LỚP ---------- */
/* Email chỉ hiển thị một phần để bảo mật. Không hiển thị số điện thoại mặc định. */
window.MEMBERS = {
  bcs: [
    { name: "Trần Văn Anh",   role: "Lớp trưởng",          emailMask: "tran***anh@example.com" },
    { name: "Lê Thị Bình",    role: "Lớp phó học tập",     emailMask: "leth***binh@example.com" },
    { name: "Nguyễn Văn Cường", role: "Lớp phó đời sống",  emailMask: "nvc***@example.com" },
    { name: "Phạm Thu Dung",  role: "Thủ quỹ",             emailMask: "pham***dung@example.com" },
    { name: "Hoàng Minh Khôi", role: "Bí thư chi đoàn",    emailMask: "hmk***@example.com" }
  ],
  groups: [
    { name: "Nhóm 1 – Luật Hiến pháp",     leader: "Trần Văn Anh",    members: 6 },
    { name: "Nhóm 2 – Luật Hành chính",    leader: "Lê Thị Bình",     members: 6 },
    { name: "Nhóm 3 – Lý luận NN & PL",    leader: "Nguyễn Văn Cường", members: 5 },
    { name: "Nhóm 4 – Dân sự – TS – TK",   leader: "Phạm Thu Dung",   members: 6 },
    { name: "Nhóm 5 – Logic học",          leader: "Hoàng Minh Khôi", members: 5 }
  ]
};

/* ---------- FAQ ---------- */
window.FAQ = [
  {
    group: "Hướng dẫn dùng website",
    items: [
      {
        q: "Tôi cần đăng nhập để xem nội dung trên website không?",
        a: "Phiên bản hiện tại không yêu cầu đăng nhập. Toàn bộ thông tin được công khai trong phạm vi nội bộ lớp. Phiên bản sau sẽ bổ sung phân quyền (Admin / Editor / Viewer)."
      },
      {
        q: "Làm sao để tìm nhanh một thông báo cũ?",
        a: "Truy cập trang Thông báo → sử dụng ô tìm kiếm theo tiêu đề / từ khóa, hoặc lọc theo tag (#LichHoc, #Deadline, #ThiCu, ...)."
      },
      {
        q: "Website hiển thị tốt trên điện thoại không?",
        a: "Có. Website được thiết kế mobile-first, tự động co giãn cho điện thoại, máy tính bảng và máy tính."
      }
    ]
  },
  {
    group: "Học tập",
    items: [
      {
        q: "Học kỳ I có bao nhiêu môn?",
        a: "Học kỳ I có 6 môn: Lý luận NN (Nhà nước), Lý luận NN (Pháp luật), Luật Hiến pháp, Luật Hành chính, Dân sự – Tài sản – Thừa kế, Logic học. Xem chi tiết tại trang Các môn học."
      },
      {
        q: "NotebookLM của môn học hoạt động như thế nào?",
        a: "Mỗi môn học có một NotebookLM được nạp sẵn giáo trình, slide bài giảng và văn bản pháp luật liên quan. Sinh viên có thể đặt câu hỏi bằng tiếng Việt và nhận câu trả lời có trích nguồn."
      }
    ]
  },
  {
    group: "Lịch học",
    items: [
      {
        q: "Khi nào lịch học được cập nhật?",
        a: "Lịch học chuẩn được Phòng Đào tạo công bố vào đầu mỗi học kỳ. Bất kỳ thay đổi nào (đổi giờ, dời buổi) sẽ được Ban cán sự đăng tại trang Thông báo với tag #ThayDoi và cập nhật trang Lịch học."
      },
      {
        q: "Tôi muốn đồng bộ lịch học vào Google Calendar cá nhân?",
        a: "Vào trang Lịch học & Deadline → bấm nút 'Mở Google Calendar' để truy cập lịch lớp. Bạn có thể thêm vào lịch cá nhân từ đó."
      }
    ]
  },
  {
    group: "Deadline",
    items: [
      {
        q: "Cách xem deadline gần nhất?",
        a: "Tại trang chủ – mục 'Deadline gần nhất' hiển thị 3 deadline sắp đến. Xem đầy đủ tại trang Lịch học & Deadline."
      },
      {
        q: "Nộp bài trễ có sao không?",
        a: "Tùy chính sách của từng giảng viên. Theo nguyên tắc chung của ULAW, bài nộp trễ có thể bị trừ điểm hoặc không được chấp nhận. Vui lòng liên hệ trưởng nhóm môn học để biết chi tiết."
      }
    ]
  },
  {
    group: "Tài liệu",
    items: [
      {
        q: "Tôi có thể chia sẻ tài liệu lớp ra ngoài không?",
        a: "Không. Tài liệu trong mục Thư viện (đặc biệt là giáo trình và đề thi) thuộc bản quyền của Trường ĐH Luật TP.HCM hoặc tác giả. Chỉ sử dụng nội bộ phục vụ học tập."
      },
      {
        q: "Làm sao đề xuất bổ sung tài liệu mới?",
        a: "Liên hệ trưởng nhóm môn học hoặc Lớp phó học tập. Sau khi rà soát bản quyền, tài liệu sẽ được thêm vào Drive lớp và cập nhật vào trang Thư viện."
      }
    ]
  },
  {
    group: "Kỹ thuật",
    items: [
      {
        q: "Tôi quên link Zoom của buổi học?",
        a: "Link Zoom cố định được ghim trong nhóm Zalo lớp và lưu trong Drive lớp (mục 'Thông tin chung'). Nếu vẫn không tìm thấy, liên hệ Ban cán sự."
      },
      {
        q: "Website bị lỗi hiển thị, tôi báo ở đâu?",
        a: "Báo cho Ban hỗ trợ kỹ thuật lớp (xem mục Danh bạ → Ban cán sự). Mô tả lỗi kèm ảnh chụp màn hình nếu có."
      }
    ]
  },
  {
    group: "Quy chế & quy định",
    items: [
      {
        q: "Tôi có thể bảo lưu kết quả không?",
        a: "Theo Quy chế đào tạo từ xa 2026 của ULAW, sinh viên có thể đăng ký bảo lưu trong các trường hợp được quy định (ốm đau, lý do gia đình, v.v.). Xem chi tiết tại văn bản 'Quy chế đào tạo từ xa 2026' trong Thư viện."
      }
    ]
  }
];
