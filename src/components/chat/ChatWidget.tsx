"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "What species are you chasing this season? I can tell you where the odds are best.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Sorry, try again." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Having trouble connecting. Try messaging me on Telegram @TeddyLogicBot — I'm always online there.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-forest text-white shadow-lg transition-all hover:bg-brand-forest/90 hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label="Chat with Grizz"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-brand-sage/20 bg-brand-cream shadow-2xl dark:bg-brand-bark dark:border-brand-sage/30 w-[360px] max-w-[calc(100vw-2rem)] md:bottom-8 md:right-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-sage/10 bg-brand-forest px-4 py-3 dark:border-brand-sage/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            G
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Grizz</div>
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Online
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "400px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto rounded-br-sm bg-brand-forest text-white"
                : "mr-auto rounded-bl-sm border border-brand-sage/10 bg-white text-brand-bark dark:bg-brand-bark/50 dark:text-brand-cream dark:border-brand-sage/20"
            )}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-sage/10 bg-white px-4 py-2.5 text-sm text-brand-sage dark:bg-brand-bark/50 dark:border-brand-sage/20">
            <span className="animate-pulse">Grizz is thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-brand-sage/10 bg-white/50 px-3 py-3 dark:bg-brand-bark/30 dark:border-brand-sage/20">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about draw odds, points, strategy..."
          className="flex-1 rounded-lg border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark placeholder:text-brand-sage/50 focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest/30 dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-forest text-white transition-colors hover:bg-brand-forest/90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
