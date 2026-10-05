// app/chat/page.tsx (or any route you like)
'use client';

import { useState, useRef } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gpt-4o-mini');
  const streamEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Optimistically add a placeholder for the assistant
    const assistantPlaceholder = { role: 'assistant' as const, content: '…' };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [...messages, userMsg], // send full history
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

      const assistantContent =
        data.choices?.[0]?.message?.content || 'No response';

      // Replace the placeholder with the real answer
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: assistantContent,
        };
        return newMessages;
      });
    } catch (err: any) {
      // Update the placeholder with an error message
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: `❌ ${err.message}`,
        };
        return newMessages;
      });
    } finally {
      setLoading(false);
      // Scroll to bottom
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-center py-4">AI Gateway</h1>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-zinc-400 mt-20">Ask me anything!</p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={streamEndRef} />
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="gpt-4o-mini">GPT-4o mini</option>
          <option value="gpt-4o">GPT-4o</option>
        </select>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask a question..."
          className="flex-1 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          disabled={loading}
        />

        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg bg-black text-white dark:bg-white dark:text-black disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-zinc-400 text-center mt-3">Powered by your Next.js API</p>
    </div>
  );
}