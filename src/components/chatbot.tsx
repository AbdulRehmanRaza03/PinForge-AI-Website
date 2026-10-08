"use client";

/**
 * PinForge AI — Website Chatbot (floating widget, bottom-right)
 *
 * Client component using React 19, Tailwind CSS, and lucide-react.
 * Matches the PinForge AI brand: green accent (#16a34a) on a dark slate base.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Send, X, MessageCircle } from "lucide-react";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

// Brand-accurate colors pulled from the PinForge AI design system.
const BRAND = {
  primary: "#16a34a",
  primaryDark: "#15803d",
  primaryLight: "#22c55e",
  gradient: "linear-gradient(135deg, #15803d 0%, #16a34a 50%, #4ade80 100%)",
  bg: "#070712",
  surface: "#0d0d1f",
  elevated: "#161630",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textDim: "#475569",
  border: "rgba(22,163,74,.18)",
};

const QUICK_REPLIES = [
  "What is PinForge AI?",
  "How do I get started?",
  "Pricing?",
  "Features",
];

// Friendly fallback used when the API is unavailable.
const FALLBACK_REPLY =
  "I'm having trouble connecting right now. Please try again in a moment, or email the team at hello@pinforgeai.site.";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the PinForge AI Assistant. Ask me anything about automating AliExpress affiliate products on Pinterest 👋",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [unread, setUnread] = useState(1);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Auto-hide the "Chat with us" label bubble after ~8 seconds.
  useEffect(() => {
    const t = setTimeout(() => setShowLabel(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll to the newest message whenever messages or loading change.
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages, loading, prefersReducedMotion]);

  // Focus the input when the chat opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const toggle = () => {
    setOpen((prev) => {
      // Clear the unread badge on open.
      if (!prev) setUnread(0);
      return !prev;
    });
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      // Append the user message.
      const history: Message[] = [...messages, { role: "user", content: trimmed }];
      setMessages(history);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.content })) }),
        });

        let reply = FALLBACK_REPLY;
        if (res.ok) {
          const data = (await res.json()) as { reply?: string };
          reply = data.reply || FALLBACK_REPLY;
        }

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: FALLBACK_REPLY },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (qr: string) => sendMessage(qr);

  return (
    <>
      {/* ── Launcher button (closed state) ─────────────────── */}
      {!open && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
          {showLabel && (
            <button
              onClick={toggle}
              className="rounded-full bg-[#161630] px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg border border-[rgba(22,163,74,.18)] animate-bounce"
              aria-label="Chat with us"
            >
              Chat with us 👋
            </button>
          )}
          <div className="relative">
            <button
              onClick={toggle}
              aria-label="Open chat"
              className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
              style={{ background: BRAND.gradient }}
            >
              {/* Pulsing ring */}
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#16a34a] opacity-30" />
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
              {/* Green online dot */}
              <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
              </span>
              {/* Red unread badge */}
              {unread > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Chat window (open state) ────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="PinForge AI Assistant chat"
          className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[rgba(22,163,74,.25)] bg-[#0d0d1f] shadow-2xl"
          style={{ height: "min(520px, calc(100dvh - 6rem))" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ background: BRAND.gradient }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <span className="text-sm font-bold">P</span>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-300 border border-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">
                PinForge Assistant
              </p>
              <p className="text-xs text-white/80">Typically replies instantly</p>
            </div>
            <button
              onClick={toggle}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            style={{ background: BRAND.bg }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: BRAND.gradient }}
                  >
                    P
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                    m.role === "user"
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm text-slate-300"
                  }`}
                  style={{
                    background:
                      m.role === "user" ? BRAND.primary : BRAND.elevated,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2">
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: BRAND.gradient }}
                >
                  P
                </div>
                <div
                  className="flex items-center gap-1 rounded-2xl rounded-bl-sm px-3 py-2.5"
                  style={{ background: BRAND.elevated }}
                >
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick replies (only first 2 messages) */}
          {messages.length <= 2 && (
            <div
              className="flex flex-wrap gap-2 border-t px-3 py-2"
              style={{ background: BRAND.surface, borderColor: BRAND.border }}
            >
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => handleQuickReply(qr)}
                  className="rounded-full border px-3 py-1 text-xs text-slate-300 transition-colors hover:bg-[#161630]"
                  style={{ borderColor: BRAND.border }}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t px-3 py-3"
            style={{ background: BRAND.surface, borderColor: BRAND.border }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              aria-label="Message"
              className="flex-1 rounded-full border bg-[#161630] px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#16a34a]"
              style={{ borderColor: BRAND.border }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
              style={{ background: BRAND.primary }}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
