"use client";

import { useState, useTransition } from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImportResult = {
  ok: boolean;
  preview?: {
    total: number;
    admins: number;
    students: number;
    invalid: number;
  };
  summary?: {
    created: number;
    updated: number;
    passwordsReset: number;
    failed: number;
    skipped: number;
  };
  errors?: string[];
  error?: string;
};

export function SystemActions() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [resetPasswords, setResetPasswords] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    formData.set("dryRun", String(dryRun));
    formData.set("resetPasswords", String(resetPasswords));

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/system/import-students", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as ImportResult;
        setResult(data);
      } catch (err) {
        setResult({ ok: false, error: (err as Error).message });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy-dark mb-1.5">
          Tệp CSV
        </label>
        <div className="flex items-center gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-navy hover:bg-slate-50">
              <FileText className="w-4 h-4 shrink-0" />
              {file ? (
                <span className="truncate">
                  {file.name}{" "}
                  <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </span>
              ) : (
                <span>Chọn tệp CSV…</span>
              )}
            </div>
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Định dạng cột: <code className="bg-slate-100 px-1 rounded">mssv,fullName,passwordOverride,role</code>.
          Email portal sẽ được tạo tự động <code className="bg-slate-100 px-1 rounded">{"{mssv}@email.hcmulaw.edu.vn"}</code>.
        </p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="w-4 h-4 accent-navy"
          />
          <span className="text-sm">
            <strong>Dry-run</strong>{" "}
            <span className="text-slate-500">(xem trước, không ghi DB)</span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={resetPasswords}
            onChange={(e) => setResetPasswords(e.target.checked)}
            className="w-4 h-4 accent-rose-600"
          />
          <span className="text-sm">
            <strong className="text-rose-700">Reset mật khẩu</strong>{" "}
            <span className="text-slate-500">(ghi đè mật khẩu hiện có)</span>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {dryRun
            ? "Chế độ xem trước — không có thay đổi nào được lưu."
            : "⚠️ Sẽ ghi vào CSDL. Đã tự động sao lưu? Khuyến nghị dry-run trước."}
        </p>
        <Button type="submit" disabled={!file || isPending} loading={isPending}>
          <Upload className="w-4 h-4" />
          {dryRun ? "Xem trước" : "Chạy import"}
        </Button>
      </div>

      {result && <ResultBlock result={result} />}
    </form>
  );
}

function ResultBlock({ result }: { result: ImportResult }) {
  if (!result.ok) {
    return (
      <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <AlertTriangle className="w-4 h-4" />
          Import thất bại
        </div>
        <div className="text-xs">{result.error}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-900 space-y-2">
      <div className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="w-4 h-4" />
        {result.summary ? "Import hoàn tất" : "Xem trước thành công"}
      </div>
      {result.preview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Stat label="Tổng cộng" value={result.preview.total} />
          <Stat label="ADMIN" value={result.preview.admins} />
          <Stat label="STUDENT" value={result.preview.students} />
          <Stat label="Không hợp lệ" value={result.preview.invalid} tone={result.preview.invalid > 0 ? "warn" : "ok"} />
        </div>
      )}
      {result.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <Stat label="Tạo mới" value={result.summary.created} />
          <Stat label="Cập nhật" value={result.summary.updated} />
          <Stat label="Reset MK" value={result.summary.passwordsReset} />
          <Stat label="Lỗi" value={result.summary.failed} tone={result.summary.failed > 0 ? "warn" : "ok"} />
          <Stat label="Bỏ qua" value={result.summary.skipped} />
        </div>
      )}
      {result.errors && result.errors.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-amber-800 font-medium">
            {result.errors.length} dòng có cảnh báo — bấm để xem
          </summary>
          <ul className="mt-2 list-disc pl-5 space-y-0.5 max-h-48 overflow-y-auto">
            {result.errors.slice(0, 50).map((err, i) => (
              <li key={i} className="font-mono">
                {err}
              </li>
            ))}
            {result.errors.length > 50 && (
              <li className="text-slate-500">…và {result.errors.length - 50} dòng khác</li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "ok" }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <div
      className={`rounded-md px-2 py-1.5 border ${
        tone === "warn" ? "border-amber-200 bg-amber-50" : "border-green-200 bg-white"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${tone === "warn" ? "text-amber-700" : "text-navy-dark"}`}>
        {value}
      </div>
    </div>
  );
}
