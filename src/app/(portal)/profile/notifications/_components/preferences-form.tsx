"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Save, Bell, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Frequency = "INSTANT" | "DAILY" | "WEEKLY" | "OFF";

interface FormState {
  emailEnabled: boolean;
  pushEnabled: boolean;
  digestFrequency: Frequency;
  channels: Record<string, boolean>;
}

const CHANNELS: { key: string; label: string; desc: string }[] = [
  { key: "announcements", label: "Thông báo lớp", desc: "Thông báo từ ban quản lý lớp và giảng viên" },
  { key: "assignments", label: "Bài tập", desc: "Bài tập mới, hạn nộp gần kề" },
  { key: "grades", label: "Kết quả & điểm số", desc: "Khi giảng viên chấm bài hoặc trả điểm" },
  { key: "calendar", label: "Lịch học & thi", desc: "Nhắc lịch học buổi tới, lịch thi sắp tới" },
  { key: "forum", label: "Diễn đàn", desc: "Phản hồi vào bài thảo luận của bạn" },
];

export function NotificationPreferencesForm({ initial }: { initial: FormState }) {
  const [state, setState] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const res = await fetch("/api/profile/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setBusy(false);
    if (res.ok) toast.success("Đã lưu cài đặt thông báo");
    else toast.error("Lưu thất bại");
  };

  return (
    <div className="space-y-6">
      {/* Channels */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Kênh nhận</h3>

        <Row
          icon={<Bell className="h-4 w-4" />}
          label="Trong ứng dụng"
          desc="Thông báo trong chuông ở góc phải. Luôn bật."
        >
          <Switch checked disabled />
        </Row>

        <Row
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          desc="Gửi tới email đã đăng ký với tài khoản của bạn"
        >
          <Switch
            checked={state.emailEnabled}
            onCheckedChange={(v) => setState((s) => ({ ...s, emailEnabled: v }))}
          />
        </Row>

        <Row
          icon={<Smartphone className="h-4 w-4" />}
          label="Thông báo đẩy (Web Push)"
          desc="Hiện cả khi không mở Portal — yêu cầu cấp quyền trình duyệt"
        >
          <Switch
            checked={state.pushEnabled}
            onCheckedChange={(v) => setState((s) => ({ ...s, pushEnabled: v }))}
          />
        </Row>
      </div>

      <Separator />

      {/* Digest frequency */}
      <div className="space-y-1.5">
        <Label htmlFor="digest">Tần suất tổng hợp email</Label>
        <Select
          value={state.digestFrequency}
          onValueChange={(v) => setState((s) => ({ ...s, digestFrequency: v as Frequency }))}
        >
          <SelectTrigger id="digest" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INSTANT">Gửi ngay khi có sự kiện</SelectItem>
            <SelectItem value="DAILY">Tổng hợp hằng ngày</SelectItem>
            <SelectItem value="WEEKLY">Tổng hợp hằng tuần</SelectItem>
            <SelectItem value="OFF">Tắt email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Per-event toggles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Loại sự kiện</h3>
        {CHANNELS.map((c) => (
          <Row key={c.key} label={c.label} desc={c.desc}>
            <Switch
              checked={state.channels[c.key] !== false}
              onCheckedChange={(v) =>
                setState((s) => ({ ...s, channels: { ...s.channels, [c.key]: v } }))
              }
            />
          </Row>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>
          <Save className="h-4 w-4" />
          {busy ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}

function Row({
  icon, label, desc, children,
}: {
  icon?: React.ReactNode;
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-slate-50">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-navy/5 text-navy flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-navy-dark">{label}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
