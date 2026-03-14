"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const aiName = process.env.NEXT_PUBLIC_AI_ASSISTANT_NAME || "Teddy";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    `Hey, I'm ${aiName} — your personal hunting concierge. I know draw odds, point strategies, unit recommendations, season dates, and costs for all 50 states. Ask me anything about your next hunt.`,
};

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Create placeholder for assistant response (shows typing indicator)
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        // Build history (exclude welcome message)
        const history = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/v1/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const data = await res.json();

        // Update assistant message with Teddy's response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: data.text || "Sorry, I didn't get a response." }
              : m
          )
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: errorMessage.includes("Telegram:")
                    ? errorMessage
                    : `Sorry, I couldn't process that. ${errorMessage}`,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-sage/10 px-4 py-3 dark:border-brand-sage/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-forest text-brand-cream text-lg">
            🐻
          </div>
          <div>
            <h2 className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
              {aiName}
            </h2>
            <p className="text-xs text-brand-sage">
              Your AI hunting concierge
            </p>
          </div>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/TeddyLogicBot"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-[#229ED9]/10 px-3 py-1.5 text-xs font-medium text-[#229ED9] transition-colors hover:bg-[#229ED9]/20"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
        </a>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={isLoading && msg.id === messages[messages.length - 1]?.id && msg.role === "assistant"}
          />
        ))}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
