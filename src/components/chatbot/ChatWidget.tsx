"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "How much does it cost?",
  "What are the free printables?",
  "Tell me about the Plus plan",
  "How do I play the games?"
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hi! I am the Learnzo assistant. Ask me anything about Learnzo." }
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(textToSend: string) {
    if (!textToSend.trim() || busy) return;

    const userMsg = textToSend.trim();
    setMessage("");
    setError(null);
    setHistory((h) => [...h, { role: "user", text: userMsg }]);
    setBusy(true);

    try {
      const r = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const j = await r.json();

      if (!r.ok) {
        setError(j.error ?? "Could not get a response.");
      } else {
        setHistory((h) => [...h, { role: "bot", text: j.reply }]);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-brand-600 text-white p-4 flex items-center justify-between shrink-0">
            <div>
              <div className="font-bold">Learnzo Assistant</div>
              <div className="text-xs text-brand-100">Ask about features, pricing or how to use Learnzo</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white hover:text-brand-100 p-2 text-xl leading-none">
              &times;
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {history.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block p-3 rounded-2xl text-sm max-w-[85%] ${
                  msg.role === "user" ? "bg-brand-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {busy && <div className="text-left text-xs text-slate-500">Typing...</div>}
            {error && <div className="text-center text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</div>}

            {/* Quick Suggestions (Only show if no messages yet) */}
            {history.length === 1 && !busy && (
              <div className="mt-6">
                <div className="text-xs font-semibold text-slate-500 mb-2">Suggested questions:</div>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-left text-sm bg-white border border-brand-200 text-brand-700 px-3 py-2 rounded-xl hover:bg-brand-50 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(message); }} 
            className="p-3 bg-white border-t border-slate-200 shrink-0 flex gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={busy || !message.trim()}
              className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
      )}
    </div>
  );
}