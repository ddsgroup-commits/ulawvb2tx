"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, User, Sparkles, Trash2, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: "user" | "model";
  content: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Chào bạn! Tôi là Trợ lý Học tập ULAW. Tôi có thể giúp bạn giải đáp các thắc mắc về kiến thức pháp luật hoặc hỗ trợ bạn trong quá trình học tập tại ULAW. Bạn cần hỗ trợ gì hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const assistantMessage: Message = { role: "model", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          const updated = { ...last, content: last.content + text };
          return [...prev.slice(0, -1), updated];
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "model",
        content: "Chào bạn! Tôi là Trợ lý Học tập ULAW. Tôi có thể giúp bạn giải đáp các thắc mắc về kiến thức pháp luật hoặc hỗ trợ bạn trong quá trình học tập tại ULAW. Bạn cần hỗ trợ gì hôm nay?",
      },
    ]);
  };

  const suggestions = [
    "Tóm tắt nội dung chính của Hiến pháp 2013?",
    "Thời hiệu thừa kế theo Luật Dân sự 2015?",
    "Phân biệt giữa pháp nhân và cá nhân?",
    "Quy trình giải quyết vụ án dân sự sơ thẩm?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto space-y-4 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-dark leading-none">Trợ lý Học tập ULAW</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sẵn sàng hỗ trợ 24/7
            </p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2.5 rounded-xl text-slate-400 hover:text-ulaw hover:bg-ulaw/5 transition-all"
          title="Xóa cuộc trò chuyện"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto card p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={cn(
              "flex gap-3 max-w-[85%] md:max-w-[75%]",
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1",
              m.role === "user" ? "bg-navy/10 text-navy" : "bg-ulaw/10 text-ulaw"
            )}>
              {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed",
              m.role === "user" 
                ? "bg-navy text-white rounded-tr-none shadow-md" 
                : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100"
            )}>
              <ReactMarkdown className="prose prose-sm max-w-none prose-slate prose-headings:text-navy prose-a:text-ulaw">
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1].role === "user" && (
          <div className="flex gap-3 mr-auto max-w-[75%]">
            <div className="w-8 h-8 rounded-xl bg-ulaw/10 text-ulaw flex items-center justify-center shrink-0 animate-pulse">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-ulaw" />
              <span className="text-xs text-slate-400 font-medium italic">Đang suy nghĩ...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        {messages.length === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  // Optional: trigger submit immediately
                }}
                className="text-left p-3 rounded-xl border border-slate-200 bg-white/50 text-xs 
                           text-slate-500 hover:border-navy hover:text-navy hover:bg-navy/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          className="relative group"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi pháp luật của bạn tại đây..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-5 pr-14 
                       shadow-sm outline-none ring-0 focus:border-navy focus:shadow-lg focus:shadow-navy/5 
                       transition-all placeholder:text-slate-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-3 rounded-xl bg-navy text-white 
                       disabled:opacity-20 disabled:cursor-not-allowed hover:bg-navy-dark 
                       active:scale-95 transition-all shadow-md shadow-navy/20"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400">
          AI có thể nhầm lẫn. Hãy đối chiếu với văn bản pháp luật chính thức.
        </p>
      </div>
    </div>
  );
}
