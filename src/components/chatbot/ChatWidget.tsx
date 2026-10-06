"use client";

import { useState, useRef, useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface Message {
  role: "user" | "model";
  content: string;
}

const SUGGESTED = [
  "What is Learnzo?",
  "How much does it cost?",
  "How do I solve a question?",
  "What subjects do you support?"
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hi! I am the Learnzo assistant. Ask me anything about Learnzo." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setError(null);
    setInput("");
    const newHistory = [...messages, { role: "user" as const, content: message }];
    setMessages(newHistory);
    setBusy(true);
    try {
      const r = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: messages, message })
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error ?? "Could not reply."); return; }
      setMessages([...newHistory, { role: "model", content: j.reply }]);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        aria-label="Open chat"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition flex items-center justify-center"
        style={{ width: 56, height: 56 }}
      >
        {open ? <span className="text-2xl leading-none">&times;</span> : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2.5rem))] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ maxHeight: "min(560px, calc(100vh - 8rem))" }}>
          <div className="bg-brand-600 text-white px-4 py-3 shrink-0">
            <div className="font-semibold text-sm">Learnzo Assistant</div>
            <div className="text-xs text-brand-100">Ask about features, pricing or how to use Learnzo</div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={"max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed " + (m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800")}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-3 py-2 flex items-center gap-2 text-sm text-slate-600">
                  <Spinner className="h-4 w-4" /> Thinking...
                </div>
              </div>
            )}
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}
            {messages.length === 1 && !busy && (
              <div className="pt-2 space-y-2">
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={() => send(q)} className="block w-full text-left rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:border-brand-400 hover:bg-brand-50 transition">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 p-3 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={busy}
                maxLength={1000}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
              <button type="submit" disabled={busy || !input.trim()} className="rounded-xl bg-brand-600 text-white px-3 py-2 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
                Send
              </button>
            </form>
            <p className="mt-2 text-[10px] text-slate-400 text-center">AI assistant. Email support@learnzo.online for detailed help.</p>
          </div>
        </div>
      )}
    </>
  );
}