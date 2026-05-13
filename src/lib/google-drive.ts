import { google } from "googleapis";
import { Readable } from "stream";

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "1ICeWtc2Ga6fZOLwfECJpGezvBBFNDL1v";

function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google Drive credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_DRIVE_REFRESH_TOKEN in your .env file."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oauth2 });
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  name: string;
  mimeType: string;
  size: number;
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<DriveUploadResult> {
  const drive = getDriveClient();

  const stream = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id,name,mimeType,size,webViewLink",
  });

  const file = res.data;
  if (!file.id) throw new Error("Drive upload failed: no file ID returned");

  // Make file readable by anyone with the link
  await drive.permissions.create({
    fileId: file.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: file.id,
    webViewLink: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
    name: file.name ?? fileName,
    mimeType: file.mimeType ?? mimeType,
    size: Number(file.size ?? buffer.length),
  };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}
