"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Bot, Sparkles, CloudSun } from "lucide-react";
import { getToken } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Сайн уу!",
  "Миний дүн ямар байна? Зөвлөгөө өгөөч",
  "Улаанбаатар өнөөдөр ямар цаг агаартай вэ?",
];

export function StudentAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string = input) {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    const history = [...messages, { role: "user" as const, content: msg }];
    setMessages(history);
    setLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, token: getToken() }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? data.error ?? "Алдаа гарлаа.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Сүлжээний алдаа. Дахин оролдоно уу." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:m-4 md:mb-6 md:h-[calc(100%-2.5rem)]">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card/60 px-5 py-3.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="size-4 text-amber" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">AI Туслах</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CloudSun className="size-3 text-amber-500" />
            Groq AI · цаг агаар асууж болно (туршилт)
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2.5">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="mb-1.5 flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-sm font-semibold text-foreground">
                  Сайн уу! Юу асуумаар байна?
                </p>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Энгийн чат эсвэл цаг агаар асуувал бодит мэдээллээр хариулна.
              </p>
            </div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm text-foreground transition hover:border-primary/30 hover:bg-muted/40"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="size-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm border border-border bg-muted/50 text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="size-3.5 text-primary" />
            </div>
            <div className="rounded-2xl rounded-bl-sm border border-border bg-muted/50 px-4 py-3">
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card/60 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Мессеж бичих... (ж: Улаанбаатарт цаг агаар ямар вэ?)"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Groq AI · туршилтын горим. Цаг агаар: OpenWeatherMap.
        </p>
      </div>
    </div>
  );
}
