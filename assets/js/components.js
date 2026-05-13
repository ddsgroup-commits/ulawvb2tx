/* ============================================================
   ULAW VB2 – Class Portal
   Components: header, footer, cards, helpers chung
   ============================================================ */

/* ---------- Helpers ---------- */
const VN_MONTHS = ["Th01","Th02","Th03","Th04","Th05","Th06","Th07","Th08","Th09","Th10","Th11","Th12"];

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function todayISO() { return new Date().toISOString().slice(0,10); }
function parseDate(iso) { const [y,m,d] = iso.split("-").map(Number); return new Date(y, m-1, d); }
function fmtDateVN(iso) {
  const d = parseDate(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function daysFromNow(iso) {
  const a = parseDate(iso), b = parseDate(todayISO());
  return Math.round((a - b) / 86400000);
}
function dayLabel(iso) {
  const diff = daysFromNow(iso);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  if (diff === -1) return "Hôm qua";
  if (diff > 0 && diff <= 7) return `Còn ${diff} ngày`;
  if (diff < 0 && diff >= -7) return `${-diff} ngày trước`;
  return fmtDateVN(iso);
}

/* ---------- Header ---------- */
function renderHeader(activePage) {
  const navItems = [
    { id: "home",      label: "Trang chủ",     href: "index.html" },
    { id: "notices",   label: "Thông báo",     href: "announcements.html" },
    { id: "schedule",  label: "Lịch học",      href: "schedule.html" },
    { id: "courses",   label: "Môn học",       href: "courses.html" },
    { id: "library",   label: "Thư viện",      href: "library.html" },
    { id: "contacts",  label: "Danh bạ",       href: "contacts.html" },
    { id: "faq",       label: "FAQ",           href: "faq.html" }
  ];

  // Trang con của môn học (trong /courses/) cần prefix ".."
  const base = location.pathname.includes("/courses/") ? "../" : "";

  return `
    <a href="#main" class="skip-link">Bỏ qua đến nội dung chính</a>
    <header class="site-header" role="banner">
      <div class="container">
        <a class="brand" href="${base}index.html" aria-label="Trang chủ ULAW VB2 Class Portal">
          <span class="brand-logo" aria-hidden="true">UL</span>
          <span class="brand-text">
            <span class="brand-name">ULAW VB2 – Class Portal</span>
            <span class="brand-sub">Văn bằng 2 Luật từ xa – Khóa 1</span>
          </span>
        </a>
        <button class="menu-toggle" id="menuToggle" aria-label="Mở menu" aria-expanded="false" aria-controls="mainNav">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18" stroke-linecap="round"/></svg>
        </button>
        <nav aria-label="Điều hướng chính">
          <ul class="nav-list" id="mainNav">
            ${navItems.map(n => `
              <li><a href="${base}${n.href}" class="${activePage === n.id ? 'active' : ''}">${n.label}</a></li>
            `).join("")}
          </ul>
        </nav>
      </div>
    </header>
  `;
}

/* ---------- Footer ---------- */
function renderFooter() {
  const cfg = window.SITE_CONFIG;
  const bcs = (window.MEMBERS && window.MEMBERS.bcs) || [];
  const base = location.pathname.includes("/courses/") ? "../" : "";

  return `
    <footer class="site-footer" role="contentinfo">
      <div class="container">
        <div class="footer-disclaimer">
          ⚖ Website này là cổng thông tin nội bộ phục vụ lớp học, không thay thế hệ thống LMS,
          cổng sinh viên hoặc thông báo chính thức của Trường ĐH Luật TP.HCM.
          Mọi thông tin học vụ chính thống vui lòng tham chiếu từ Phòng Đào tạo.
        </div>
        <div class="footer-grid">
          <div>
            <h4>${escapeHtml(cfg.className)}</h4>
            <p>${escapeHtml(cfg.tagline)}.</p>
            <p style="margin-top:8px; font-size:12.5px;">
              Cập nhật lần cuối: <strong>${fmtDateVN(cfg.lastUpdated)}</strong>
            </p>
          </div>
          <div>
            <h4>Ban cán sự lớp</h4>
            <ul style="list-style:none; font-size:13px; line-height:1.9;">
              ${bcs.map(m => `<li>• ${escapeHtml(m.name)} – ${escapeHtml(m.role)}</li>`).join("")}
            </ul>
          </div>
          <div>
            <h4>Truy cập nhanh</h4>
            <ul style="list-style:none; font-size:13px; line-height:1.9;">
              <li>• <a href="${cfg.links.googleCalendar}" target="_blank" rel="noopener">Google Calendar lớp</a></li>
              <li>• <a href="${cfg.links.googleDrive}" target="_blank" rel="noopener">Google Drive lớp</a></li>
              <li>• <a href="${cfg.links.notebookLM}" target="_blank" rel="noopener">NotebookLM</a></li>
              <li>• <a href="${cfg.links.zaloBackup}" target="_blank" rel="noopener">Nhóm Zalo (dự phòng)</a></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p style="font-size:13px;">${escapeHtml(cfg.contact.classMonitor)}</p>
            <p style="font-size:13px;">Email: <a href="mailto:${cfg.contact.email}">${escapeHtml(cfg.contact.email)}</a></p>
            <p style="font-size:12.5px; margin-top:10px;">
              <a href="${base}faq.html">Câu hỏi thường gặp →</a>
            </p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ULAW VB2 K1 – Class Portal. Phục vụ học tập nội bộ.</span>
          <span>Phiên bản 1.0 · Built with HTML/CSS/JS</span>
        </div>
      </div>
    </footer>
  `;
}

/* ---------- Tag rendering ---------- */
function tagHTML(tag) {
  const labels = {
    LichHoc: "#LichHoc",
    Deadline: "#Deadline",
    ThayDoi: "#ThayDoi",
    ThiCu: "#ThiCu",
    HanhChinh: "#HanhChinh",
    Khac: "#Khac",
    Urgent: "#Urgent"
  };
  return `<span class="ann-tag tag-${tag}">${labels[tag] || "#"+tag}</span>`;
}

/* ---------- Announcement card ---------- */
function announcementCard(a, opts = {}) {
  const classes = ["card","ann-card"];
  if (a.urgent) classes.push("urgent");
  if (a.pinned && !a.urgent) classes.push("pinned");

  const tags = (a.tags || []).map(tagHTML).join(" ");
  const deadline = a.deadline
    ? `<span>⏰ Hạn: <strong>${fmtDateVN(a.deadline)}</strong></span>` : "";

  return `
    <article class="${classes.join(' ')}" data-id="${escapeHtml(a.id)}">
      <div class="ann-head">
        ${tags}
        ${a.pinned ? '<span class="text-muted">📌 Ghim</span>' : ''}
      </div>
      <h3 class="ann-title">${escapeHtml(a.title)}</h3>
      <div class="ann-meta">
        <span>📅 ${fmtDateVN(a.date)}</span>
        <span>✍️ ${escapeHtml(a.author)}</span>
        <span>👥 ${escapeHtml(a.audience)}</span>
        ${deadline}
      </div>
      ${opts.short ? '' : `<p class="ann-body">${escapeHtml(a.body)}</p>`}
      ${opts.short || !a.action ? '' : `
        <div class="ann-action">
          <strong>Hành động cần làm:</strong> ${escapeHtml(a.action)}
        </div>
      `}
      ${opts.short || !a.contact ? '' : `
        <div class="text-sm text-muted">📞 Liên hệ: ${escapeHtml(a.contact)}</div>
      `}
    </article>
  `;
}

/* ---------- Event item ---------- */
function eventItem(e) {
  const d = parseDate(e.date);
  return `
    <div class="event-item type-${e.type}" data-id="${escapeHtml(e.id)}">
      <div class="event-date" aria-hidden="true">
        <div class="d">${String(d.getDate()).padStart(2,"0")}</div>
        <div class="m">${VN_MONTHS[d.getMonth()]}</div>
      </div>
      <div class="event-body">
        <div class="event-title">${escapeHtml(e.title)}</div>
        <div class="event-meta">
          <span>🕐 ${escapeHtml(e.time || "")}</span>
          <span>📍 ${escapeHtml(e.location || "")}</span>
          ${e.owner ? `<span>👤 ${escapeHtml(e.owner)}</span>` : ""}
          <span>${dayLabel(e.date)}</span>
        </div>
        ${e.note ? `<div class="text-sm text-muted mt-2">${escapeHtml(e.note)}</div>` : ""}
      </div>
    </div>
  `;
}

/* ---------- Course card ---------- */
function courseCard(c) {
  const base = location.pathname.includes("/courses/") ? "" : "courses/";
  return `
    <article class="card course-card">
      <div class="course-code">${escapeHtml(c.code)}</div>
      <h3><a href="${base}${escapeHtml(c.slug)}.html">${escapeHtml(c.title)}</a></h3>
      <p class="course-summary">${escapeHtml(c.summary)}</p>
      <div class="course-meta">
        <span>👨‍🏫 <strong>${escapeHtml(c.teacher)}</strong></span>
        <span>📚 ${c.credits} tín chỉ</span>
        <span>📘 ${escapeHtml(c.semester)}</span>
      </div>
      <div class="course-actions">
        <a class="btn btn-primary btn-sm" href="${base}${escapeHtml(c.slug)}.html">Chi tiết →</a>
        <a class="btn btn-outline btn-sm" href="${window.SITE_CONFIG.links.notebookLM}" target="_blank" rel="noopener">Mở NotebookLM</a>
      </div>
    </article>
  `;
}

/* ---------- Mount header/footer + menu toggle ---------- */
function mountLayout(activePage) {
  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  if (h) h.innerHTML = renderHeader(activePage);
  if (f) f.innerHTML = renderFooter();

  const btn = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // đóng menu khi bấm link
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded","false");
    }));
  }
}

/* ---------- Expose ---------- */
window.UI = {
  escapeHtml, todayISO, parseDate, fmtDateVN, daysFromNow, dayLabel,
  renderHeader, renderFooter, tagHTML, announcementCard, eventItem, courseCard,
  mountLayout, VN_MONTHS
};
