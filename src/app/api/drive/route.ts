import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFileToDrive, deleteFileFromDrive } from "@/lib/google-drive";

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/zip",
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Không thể đọc form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Không có file được chọn" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File vượt quá ${MAX_SIZE_MB}MB` },
      { status: 413 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Định dạng file không được hỗ trợ" },
      { status: 415 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFileToDrive(buffer, file.name, file.type);

    return NextResponse.json({
      ok: true,
      data: {
        fileId: result.fileId,
        webViewLink: result.webViewLink,
        name: result.name,
        mimeType: result.mimeType,
        size: result.size,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ";
    console.error("[Drive Upload]", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ ok: false, error: "Thiếu fileId" }, { status: 400 });
  }

  try {
    await deleteFileFromDrive(fileId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
