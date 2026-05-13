import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotificationPreferencesForm } from "./_components/preferences-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cài đặt thông báo" };

export default async function NotificationPreferencesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id as string;

  // Get-or-create — first visit creates a default row so the form has data.
  const pref =
    (await prisma.notificationPreference.findUnique({ where: { userId } })) ||
    (await prisma.notificationPreference.create({ data: { userId } }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Cài đặt thông báo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chọn loại sự kiện bạn muốn nhận thông báo và kênh nhận (in-app, email, thông báo đẩy).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tuỳ chỉnh</CardTitle>
          <CardDescription>
            Mặc định: nhận tất cả thông báo qua kênh in-app. Email và thông báo đẩy yêu cầu cấu hình của hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm
            initial={{
              emailEnabled: pref.emailEnabled,
              pushEnabled: pref.pushEnabled,
              digestFrequency: pref.digestFrequency as any,
              channels: pref.channels as Record<string, boolean>,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
