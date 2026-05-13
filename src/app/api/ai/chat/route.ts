import { auth } from "@/lib/auth";
import { getModel, isAiConfigured } from "@/lib/gemini";
import { NextResponse } from "next/server";

// Force dynamic rendering — this route hits the AI SDK at request time
// and must never be statically analysed at build.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!isAiConfigured()) {
      return NextResponse.json(
        { ok: false, error: "AI Study Hub chưa được cấu hình (thiếu GOOGLE_API_KEY)." },
        { status: 503 },
      );
    }

    const model = getModel();

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    // Convert history to Gemini format
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage);

    // Create a TransformStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("[AI_CHAT_ERROR]", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
