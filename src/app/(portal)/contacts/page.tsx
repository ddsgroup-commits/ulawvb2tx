import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { Mail, Users, GraduationCap } from "lucide-react";
import { ClassDirectory, type DirectoryEntry } from "@/components/contacts/ClassDirectory";

export const metadata: Metadata = { title: "Danh bạ lớp" };

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(0, local.length - 2))}@${domain}`;
}

export default async function ContactsPage() {
  const session = await auth();
  const viewerIsAdmin = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"].includes(session?.user?.role ?? "");

  // Pull the entire class roster from the User table — that's the source
  // of truth (seeded from prisma/class-roster.ts on first deploy).
  const [users, contacts] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "STUDENT"] },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        role: true,
      },
    }),
    prisma.contact.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  // Marshal into the directory shape — strip emails for non-admin viewers.
  const entries: DirectoryEntry[] = users.map((u) => ({
    id: u.id,
    studentId: u.studentId,
    name: u.name ?? "(chưa có tên)",
    role: u.role,
    isViewerAdmin: viewerIsAdmin,
    ...(viewerIsAdmin ? { email: u.email } : {}),
  }));

  const bcs = contacts.filter((c) => !c.groupName);
  const groupNames = Array.from(
    new Set(contacts.filter((c) => c.groupName).map((c) => c.groupName!)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-navy-dark">
          Danh bạ lớp
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Toàn bộ thành viên lớp Văn bằng 2 Luật từ xa · Tìm kiếm theo tên hoặc MSSV
        </p>
      </div>

      <div className="notice text-xs">
        🔒 <strong>Bảo vệ dữ liệu:</strong> Danh bạ chỉ hiển thị cho thành viên đã đăng nhập.
        Email không được hiển thị cho sinh viên — chỉ admin lớp mới thấy email đầy đủ.
        Không sao chép danh sách này ra ngoài lớp.
      </div>

      {/* ── Searchable class directory (NEW) ──────────────────── */}
      <ClassDirectory entries={entries} viewerIsAdmin={viewerIsAdmin} />

      {/* ── Ban cán sự (Contact model) ────────────────────────── */}
      {bcs.length > 0 && (
        <section className="pt-4 border-t border-slate-200">
          <h2 className="font-bold text-navy-dark flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" /> Ban cán sự lớp
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bcs.map((c) => (
              <div key={c.id} className="card p-5 flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-lg">
                  {c.name.split(" ").slice(-1)[0]?.[0] ?? "?"}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                  <div className="text-xs text-navy font-medium mt-0.5">{c.role}</div>
                </div>
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-xs text-slate-500 flex items-center gap-1 hover:text-navy transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    {viewerIsAdmin ? c.email : maskEmail(c.email)}
                  </a>
                )}
                {c.note && <p className="text-xs text-slate-400">{c.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Study groups ──────────────────────────────────────── */}
      {groupNames.map((gName) => {
        const members = contacts.filter((c) => c.groupName === gName);
        return (
          <section key={gName}>
            <h2 className="font-bold text-navy-dark mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> {gName}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <div key={m.id} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold font-bold shrink-0">
                    {m.name.split(" ").slice(-1)[0]?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.role}</div>
                    {m.email && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />{" "}
                        {viewerIsAdmin ? m.email : maskEmail(m.email)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
