import { GoogleGenerativeAI } from "@google/generative-ai";

// We deliberately defer the env-var check + client construction to the
// first request. Throwing at module load broke `next build` because
// Next.js imports every route module during the "collecting page data"
// phase — even when no GOOGLE_API_KEY is configured (CI, no-AI deploys).
//
// At runtime: the first call to `getModel()` validates the key and
// caches the model. If the key is missing, the chat route returns a
// graceful 503 instead of crashing the whole app.

const SYSTEM_INSTRUCTION = `
    Bạn là "Trợ lý Học tập ULAW" (ULAW AI Assistant), một chuyên gia về pháp luật Việt Nam.
    Nhiệm vụ của bạn là hỗ trợ sinh viên lớp Văn bằng 2 từ xa của Trường Đại học Luật TP.HCM (ULAW).

    Phong cách làm việc:
    1. Chuyên nghiệp, tận tâm, và am hiểu sâu sắc về hệ thống pháp luật Việt Nam.
    2. Sử dụng ngôn ngữ tiếng Việt chuẩn xác, trang trọng nhưng dễ hiểu.
    3. Khi trích dẫn luật, hãy nêu rõ số hiệu văn bản (ví dụ: Bộ luật Dân sự 2015, Hiến pháp 2013).
    4. Luôn khuyến khích sinh viên tự nghiên cứu và tư duy phản biện.
    5. Nếu câu hỏi không liên quan đến pháp luật hoặc học tập, hãy khéo léo dẫn dắt sinh viên quay lại chủ đề chính.

    Bối cảnh: Sinh viên đang học các môn như Luật Hiến pháp, Luật Dân sự, Luật Hình sự, Luật Thương mại, Luật Lao động, và Luật Tố tụng Dân sự.
  `;

type GenerativeModel = ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;
let cachedModel: GenerativeModel | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY);
}

export function getModel(): GenerativeModel {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY in environment variables");
  }
  if (!cachedModel) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    cachedModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }
  return cachedModel;
}

/**
 * @deprecated Kept for backwards compatibility with existing imports.
 * Prefer `getModel()` which fails gracefully at request time, not at
 * module load. This export now lazy-resolves on first property access
 * via a thin Proxy so legacy callers that do `model.startChat(...)`
 * still work but only hit the env-var check at call time.
 */
export const model: GenerativeModel = new Proxy({} as GenerativeModel, {
  get(_target, prop, receiver) {
    const real = getModel();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export async function getChatResponse(messages: { role: "user" | "model"; content: string }[]) {
  const m = getModel();
  const chat = m.startChat({
    history: messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
  });

  const lastMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessageStream(lastMessage);
  return result.stream;
}
