"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ExternalLink, Send, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SubmissionType = "GOOGLE_FORM" | "DRIVE_FOLDER" | "EXTERNAL_LINK" | "PORTAL_UPLOAD";

interface Props {
  assignmentId: string;
  submissionType: SubmissionType;
  externalUrl: string | null;
  hasSubmission: boolean;
}

export function SubmitAssignmentForm({ assignmentId, submissionType, externalUrl, hasSubmission }: Props) {
  const router = useRouter();
  const [submitUrl, setSubmitUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // For Google Form / Drive folder / external link types, the submission flow
  // is "open the external URL" — the portal just records that the student
  // confirmed they submitted there.
  if (submissionType !== "PORTAL_UPLOAD" && externalUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nộp bài</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Bài tập này được nộp qua liên kết bên ngoài. Vui lòng mở và làm theo hướng dẫn:
          </p>
          <Button asChild>
            <a href={externalUrl} target="_blank" rel="noopener">
              Mở {submissionType === "GOOGLE_FORM" ? "Google Form" : submissionType === "DRIVE_FOLDER" ? "Google Drive" : "liên kết"} <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <p className="text-xs text-slate-500">
            Sau khi nộp, bấm "Xác nhận đã nộp" để hệ thống ghi nhận.
          </p>
          <Button
            variant="outline"
            disabled={busy || hasSubmission}
            onClick={async () => {
              setBusy(true);
              const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submitUrl: externalUrl, notes: "Đã nộp qua liên kết ngoài" }),
              });
              setBusy(false);
              if (res.ok) {
                toast.success("Đã ghi nhận bài nộp");
                router.refresh();
              } else {
                const j = await res.json().catch(() => ({}));
                toast.error(j.error ?? "Có lỗi xảy ra");
              }
            }}
          >
            <Send className="h-4 w-4" /> Xác nhận đã nộp
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Portal upload — accept link or text submission. (File upload to local
  // disk will be wired in Phase 4 with multipart -> /uploads/ + nginx serve.)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasSubmission ? "Nộp lại bài" : "Nộp bài"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!submitUrl && !notes.trim()) {
              toast.error("Hãy nhập liên kết hoặc nội dung");
              return;
            }
            setBusy(true);
            const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ submitUrl, notes }),
            });
            setBusy(false);
            if (res.ok) {
              toast.success("Đã nộp bài thành công");
              setSubmitUrl("");
              setNotes("");
              router.refresh();
            } else {
              const j = await res.json().catch(() => ({}));
              toast.error(j.error ?? "Có lỗi xảy ra");
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="submitUrl">Liên kết bài làm (Google Drive / Docs / GitHub…)</Label>
            <Input
              id="submitUrl"
              type="url"
              placeholder="https://docs.google.com/document/d/..."
              value={submitUrl}
              onChange={(e) => setSubmitUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Ghi chú cho giảng viên (tuỳ chọn)</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Nội dung tóm tắt, hoặc ghi chú đặc biệt…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              <Send className="h-4 w-4" />
              {busy ? "Đang nộp…" : hasSubmission ? "Nộp lại" : "Nộp bài"}
            </Button>
            <Button type="button" variant="outline" disabled>
              <Upload className="h-4 w-4" /> Tải file lên (Phase 4)
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
