/* ============================================================
   ULAW VB2 – Class Portal
   Page logic / khởi tạo từng trang
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  UI.mountLayout(page);

  // Cập nhật năm hoặc ngày cập nhật cuối nếu có placeholder
  const lastUpd = document.querySelectorAll("[data-last-updated]");
  lastUpd.forEach(el => el.textContent = UI.fmtDateVN(SITE_CONFIG.lastUpdated));

  switch (page) {
    case "home":      initHome(); break;
    case "notices":   initNotices(); break;
    case "schedule":  initSchedule(); break;
    case "courses":   initCourses(); break;
    case "course":    initCourseDetail(); break;
    case "library":   initLibrary(); break;
    case "contacts":  initContacts(); break;
    case "faq":       initFaq(); break;
  }
});

/* ============================================================
   TRANG CHỦ – DASHBOARD
   ============================================================ */
function initHome() {
  // Quick stats
  const today = UI.todayISO();
  const newCount = ANNOUNCEMENTS.filter(a => UI.daysFromNow(a.date) >= -7).length;
  const weekClass = EVENTS.filter(e => {
    const d = UI.daysFromNow(e.date);
    return d >= 0 && d <= 7 && e.type === "class";
  }).length;

  const upcomingDeadline = EVENTS
    .filter(e => e.type === "deadline" && UI.daysFromNow(e.date) >= 0)
    .sort((a,b) => a.date.localeCompare(b.date))[0];

  document.getElementById("stat-new").innerHTML = `
    <div class="stat-label">Thông báo mới</div>
    <div class="stat-value">
      <span class="stat-icon">🔔</span>${newCount}
    </div>
    <div class="stat-sub">trong 7 ngày qua</div>
  `;
  document.getElementById("stat-week").innerHTML = `
    <div class="stat-label">Lịch tuần này</div>
    <div class="stat-value">
      <span class="stat-icon">📅</span>${weekClass}
    </div>
    <div class="stat-sub">buổi học sắp diễn ra</div>
  `;
  document.getElementById("stat-deadline").innerHTML = `
    <div class="stat-label">Deadline gần nhất</div>
    <div class="stat-value">
      <span class="stat-icon">⏰</span>${upcomingDeadline ? UI.fmtDateVN(upcomingDeadline.date) : "—"}
    </div>
    <div class="stat-sub">${upcomingDeadline ? UI.escapeHtml(upcomingDeadline.title) : "Không có deadline sắp tới"}</div>
  `;

  // Pinned announcements (max 3)
  const pinned = ANNOUNCEMENTS
    .filter(a => a.pinned)
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0,3);
  document.getElementById("pinned-list").innerHTML =
    pinned.length ? pinned.map(a => UI.announcementCard(a)).join("")
                  : `<div class="notice">Chưa có thông báo được ghim.</div>`;

  // Calendar preview (7 sự kiện sắp tới)
  const upcoming = EVENTS
    .filter(e => UI.daysFromNow(e.date) >= 0)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0, 6);
  document.getElementById("calendar-preview").innerHTML =
    upcoming.length ? upcoming.map(UI.eventItem).join("")
                    : `<div class="notice">Không có sự kiện sắp tới.</div>`;

  // Quick links 6 môn
  document.getElementById("course-list").innerHTML =
    COURSES.map(UI.courseCard).join("");
}

/* ============================================================
   TRANG THÔNG BÁO
   ============================================================ */
function initNotices() {
  const search = document.getElementById("search-input");
  const tagBar = document.getElementById("tag-bar");
  const list = document.getElementById("notice-list");
  const importantBox = document.getElementById("important-box");

  const tags = ["All","LichHoc","Deadline","ThayDoi","ThiCu","HanhChinh","Urgent","Khac"];
  tagBar.innerHTML = tags.map(t =>
    `<button class="tag-chip${t==='All' ? ' active' : ''}" data-tag="${t}">
      ${t === "All" ? "Tất cả" : "#"+t}
    </button>`
  ).join("");

  // Important = pinned hoặc urgent
  const important = ANNOUNCEMENTS.filter(a => a.urgent || a.pinned).slice(0, 3);
  importantBox.innerHTML = important.length
    ? `<h2><span class="accent-bar"></span> Thông báo quan trọng</h2>
       <div class="grid-2 mt-3">${important.map(a => UI.announcementCard(a, {short:true})).join("")}</div>`
    : "";

  let activeTag = "All";
  let q = "";

  function render() {
    let items = ANNOUNCEMENTS.slice().sort((a,b) => b.date.localeCompare(a.date));
    if (activeTag !== "All") items = items.filter(a => (a.tags||[]).includes(activeTag));
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter(a =>
        a.title.toLowerCase().includes(lq) ||
        a.body.toLowerCase().includes(lq) ||
        (a.author||"").toLowerCase().includes(lq)
      );
    }
    // Group theo tháng (archive)
    const groups = {};
    items.forEach(a => {
      const k = a.date.slice(0,7);
      (groups[k] = groups[k] || []).push(a);
    });
    const keys = Object.keys(groups).sort((a,b) => b.localeCompare(a));
    if (!keys.length) {
      list.innerHTML = `<div class="notice">Không tìm thấy thông báo phù hợp.</div>`;
      return;
    }
    list.innerHTML = keys.map(k => {
      const [y,m] = k.split("-");
      return `
        <div class="archive-group" style="margin-bottom:22px;">
          <h3 style="margin-bottom:10px; font-size:1.05rem; color:var(--navy-dark);
                     border-bottom:2px solid var(--navy); padding-bottom:6px;">
            Tháng ${m}/${y}
          </h3>
          <div class="grid-2">
            ${groups[k].map(a => UI.announcementCard(a)).join("")}
          </div>
        </div>
      `;
    }).join("");
  }

  tagBar.addEventListener("click", e => {
    const btn = e.target.closest(".tag-chip");
    if (!btn) return;
    tagBar.querySelectorAll(".tag-chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeTag = btn.dataset.tag;
    render();
  });
  search.addEventListener("input", () => { q = search.value.trim(); render(); });

  render();
}

/* ============================================================
   TRANG LỊCH HỌC & DEADLINE
   ============================================================ */
function initSchedule() {
  // ---- Calendar tháng hiện tại ----
  const calRoot = document.getElementById("calendar");
  const calLabel = document.getElementById("cal-label");
  let view = new Date();
  view.setDate(1);

  function renderCalendar() {
    const y = view.getFullYear(), m = view.getMonth();
    calLabel.textContent = `Tháng ${String(m+1).padStart(2,"0")}/${y}`;

    const first = new Date(y, m, 1);
    // Thứ 2 đầu tuần (0=CN -> 6)
    const startWd = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const cells = [];

    // Tiêu đề
    const heads = ["T2","T3","T4","T5","T6","T7","CN"];
    let html = heads.map(h => `<div class="cal-head">${h}</div>`).join("");

    const todayISO = UI.todayISO();

    // Cells (6 hàng)
    for (let i = 0; i < 42; i++) {
      let day, mm = m, yy = y, other = false;
      if (i < startWd) { day = prevDays - (startWd - 1 - i); mm = m-1; other = true; }
      else if (i >= startWd + daysInMonth) { day = i - startWd - daysInMonth + 1; mm = m+1; other = true; }
      else { day = i - startWd + 1; }
      if (mm < 0) { mm = 11; yy = y - 1; }
      if (mm > 11) { mm = 0; yy = y + 1; }
      const iso = `${yy}-${String(mm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const dayEvents = EVENTS.filter(e => e.date === iso);
      const isToday = iso === todayISO;

      cells.push(`
        <div class="cal-cell ${other ? 'other-month' : ''} ${isToday ? 'today' : ''}">
          <span class="day-num">${day}</span>
          ${dayEvents.slice(0,3).map(e =>
            `<span class="cal-evt ${e.type}" title="${UI.escapeHtml(e.title)} – ${UI.escapeHtml(e.time||"")}">
               ${UI.escapeHtml(e.title)}
             </span>`
          ).join("")}
          ${dayEvents.length > 3 ? `<span class="text-sm text-muted">+${dayEvents.length-3} sự kiện</span>` : ""}
        </div>
      `);
    }
    html += cells.join("");
    calRoot.innerHTML = html;
  }
  document.getElementById("cal-prev").addEventListener("click", () => { view.setMonth(view.getMonth()-1); renderCalendar(); });
  document.getElementById("cal-next").addEventListener("click", () => { view.setMonth(view.getMonth()+1); renderCalendar(); });
  document.getElementById("cal-today").addEventListener("click", () => { view = new Date(); view.setDate(1); renderCalendar(); });
  renderCalendar();

  // ---- Tuần này ----
  const now = new Date(); now.setHours(0,0,0,0);
  const day = (now.getDay() + 6) % 7; // T2 = 0
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - day);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);

  const weekEvents = EVENTS
    .filter(e => {
      const d = UI.parseDate(e.date);
      return d >= weekStart && d < weekEnd;
    })
    .sort((a,b) => a.date.localeCompare(b.date));

  document.getElementById("week-list").innerHTML = weekEvents.length
    ? weekEvents.map(UI.eventItem).join("")
    : `<div class="notice">Tuần này không có sự kiện được lên lịch.</div>`;

  // ---- Deadline sắp tới ----
  const upcoming = EVENTS
    .filter(e => e.type === "deadline" && UI.daysFromNow(e.date) >= -1)
    .sort((a,b) => a.date.localeCompare(b.date));
  document.getElementById("deadline-list").innerHTML = upcoming.length
    ? upcoming.map(UI.eventItem).join("")
    : `<div class="notice">Hiện chưa có deadline sắp tới.</div>`;
}

/* ============================================================
   TRANG DANH SÁCH MÔN HỌC
   ============================================================ */
function initCourses() {
  document.getElementById("course-grid").innerHTML =
    COURSES.map(UI.courseCard).join("");
}

/* ============================================================
   TRANG CHI TIẾT MÔN HỌC
   ============================================================ */
function initCourseDetail() {
  const slug = document.body.dataset.slug;
  const c = COURSES.find(x => x.slug === slug);
  if (!c) {
    document.getElementById("course-banner").innerHTML =
      `<div class="container"><h1>Không tìm thấy môn học</h1></div>`;
    return;
  }
  document.title = `${c.title} · ULAW VB2 Class Portal`;

  document.getElementById("course-banner").innerHTML = `
    <div class="container">
      <div class="course-code">${UI.escapeHtml(c.code)} · ${UI.escapeHtml(c.semester)}</div>
      <h1>${UI.escapeHtml(c.title)}</h1>
      <div class="course-info">
        <span>👨‍🏫 Giảng viên: <strong>${UI.escapeHtml(c.teacher)}</strong></span>
        <span>📚 Số tín chỉ: <strong>${c.credits}</strong></span>
      </div>
      <p style="max-width:780px; margin-top:10px; color:rgba(255,255,255,.92);">
        ${UI.escapeHtml(c.summary)}
      </p>
      <div class="actions">
        <a class="btn btn-accent" href="${SITE_CONFIG.links.notebookLM}" target="_blank" rel="noopener">📓 Mở NotebookLM</a>
        <a class="btn btn-outline" style="background:transparent; color:#fff; border-color:rgba(255,255,255,.4);"
           href="${SITE_CONFIG.links.googleDrive}" target="_blank" rel="noopener">📁 Drive môn học</a>
      </div>
    </div>
  `;

  const sections = [
    { title: "Đề cương chi tiết",   key: "syllabus" },
    { title: "Tài liệu chính",      key: "materials" },
    { title: "Bài tập & thảo luận", key: "assignments" },
    { title: "Đề thi mẫu",          key: "sampleExams" },
    { title: "Ghi chú sau buổi học",key: "notes" }
  ];
  document.getElementById("course-body").innerHTML = sections.map(s => `
    <div class="course-section">
      <h2>${s.title}</h2>
      <ul class="bullet-list">
        ${(c[s.key]||[]).map(x => `<li>${UI.escapeHtml(x)}</li>`).join("") || "<li class='text-muted'>Đang cập nhật...</li>"}
      </ul>
    </div>
  `).join("") + `
    <div class="course-section">
      <h2>Liên hệ trưởng nhóm môn học</h2>
      <p>${UI.escapeHtml(c.leader)}</p>
    </div>
  `;
}

/* ============================================================
   TRANG THƯ VIỆN TÀI LIỆU
   ============================================================ */
function initLibrary() {
  const types = [
    { key: "van-ban",    label: "Văn bản pháp luật" },
    { key: "giao-trinh", label: "Giáo trình & sách tham khảo" },
    { key: "de-thi",     label: "Đề thi & đáp án mẫu" }
  ];
  const search = document.getElementById("lib-search");
  const root = document.getElementById("lib-root");

  function typeBadge(t) {
    const label = ({ "van-ban":"Văn bản", "giao-trinh":"Giáo trình", "de-thi":"Đề thi" })[t] || t;
    return `<span class="doc-type">${label}</span>`;
  }

  function render(q) {
    const lq = (q||"").toLowerCase();
    root.innerHTML = types.map(sec => {
      const items = DOCUMENTS.filter(d => d.type === sec.key && (
        !lq || d.title.toLowerCase().includes(lq) || (d.course||"").toLowerCase().includes(lq)
      ));
      return `
        <section class="block" style="padding-top:12px;">
          <div class="section-header">
            <h2><span class="accent-bar"></span> ${sec.label}</h2>
            <span class="text-muted text-sm">${items.length} tài liệu</span>
          </div>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th style="width:46%">Tên tài liệu</th>
                  <th>Môn liên quan</th>
                  <th>Loại</th>
                  <th>Cập nhật</th>
                  <th>Ghi chú</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${items.length ? items.map(d => `
                  <tr>
                    <td><strong>${UI.escapeHtml(d.title)}</strong></td>
                    <td>${UI.escapeHtml(d.course)}</td>
                    <td>${typeBadge(d.type)}</td>
                    <td>${UI.fmtDateVN(d.updated)}</td>
                    <td class="text-sm text-muted">${UI.escapeHtml(d.note||"")}</td>
                    <td><a class="btn btn-outline btn-sm" href="${d.link}" target="_blank" rel="noopener">Mở</a></td>
                  </tr>
                `).join("") : `
                  <tr><td colspan="6" class="text-muted" style="text-align:center; padding:18px;">
                    Không có tài liệu phù hợp.
                  </td></tr>
                `}
              </tbody>
            </table>
          </div>
        </section>
      `;
    }).join("");
  }

  search.addEventListener("input", () => render(search.value.trim()));
  render("");
}

/* ============================================================
   TRANG DANH BẠ
   ============================================================ */
function initContacts() {
  const bcs = MEMBERS.bcs.map(m => {
    const parts = m.name.trim().split(/\s+/);
    const initial = (parts[parts.length - 1] || "?").charAt(0).toUpperCase();
    return `
    <div class="member-card">
      <div class="member-avatar">${UI.escapeHtml(initial)}</div>
      <div class="member-info">
        <div class="member-name">${UI.escapeHtml(m.name)}</div>
        <div class="member-role">${UI.escapeHtml(m.role)}</div>
        <div class="member-email">📧 ${UI.escapeHtml(m.emailMask)}</div>
      </div>
    </div>
  `;
  }).join("");
  document.getElementById("bcs-list").innerHTML = bcs;

  const groups = MEMBERS.groups.map(g => `
    <div class="card">
      <h3>${UI.escapeHtml(g.name)}</h3>
      <div class="text-sm text-muted mt-2">Trưởng nhóm: <strong>${UI.escapeHtml(g.leader)}</strong></div>
      <div class="text-sm text-muted">Số thành viên: ${g.members}</div>
    </div>
  `).join("");
  document.getElementById("group-list").innerHTML = groups;
}

/* ============================================================
   TRANG FAQ
   ============================================================ */
function initFaq() {
  const root = document.getElementById("faq-root");
  root.innerHTML = FAQ.map((g, gi) => `
    <div class="faq-group">
      <h3>${UI.escapeHtml(g.group)}</h3>
      ${g.items.map((it, ii) => `
        <div class="faq-item" data-key="${gi}-${ii}">
          <button class="faq-q" aria-expanded="false">
            <span>${UI.escapeHtml(it.q)}</span>
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="faq-a">${UI.escapeHtml(it.a)}</div>
        </div>
      `).join("")}
    </div>
  `).join("");

  root.addEventListener("click", e => {
    const btn = e.target.closest(".faq-q");
    if (!btn) return;
    const item = btn.parentElement;
    const open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}
