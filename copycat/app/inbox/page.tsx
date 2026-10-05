"use client";

import { useEffect, useState, useRef } from "react";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  date: string;
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [composing, setComposing] = useState<boolean>(false);
  const [sendForm, setSendForm] = useState({ to: "", subject: "", text: "" });

  // Use a ref to keep track of selected email ID across polling intervals without stale closure issues
  const selectedEmailIdRef = useRef<string | null>(null);

  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/inbound");
      const data = await res.json();
      const fetchedEmails: Email[] = data.emails || [];

      setEmails(fetchedEmails);

      if (fetchedEmails.length > 0) {
        // Check if previously selected email still exists in new data
        const currentSelectedId = selectedEmailIdRef.current;
        const matched = fetchedEmails.find((e) => e.id === currentSelectedId);

        if (matched) {
          setSelectedEmail(matched);
        } else if (!currentSelectedId) {
          // Only auto-select the first email on initial load
          setSelectedEmail(fetchedEmails[0]);
          selectedEmailIdRef.current = fetchedEmails[0].id;
        }
      }
    } catch (err) {
      console.error("Error fetching emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000); // Poll every 5s safely
    return () => clearInterval(interval);
  }, []);

  const handleSelectEmail = (mail: Email) => {
    setSelectedEmail(mail);
    selectedEmailIdRef.current = mail.id; // Store active selection in ref
    setComposing(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", ...sendForm }),
    });

    if (res.ok) {
      alert("Email sent!");
      setComposing(false);
      setSendForm({ to: "", subject: "", text: "" });
    } else {
      alert("Failed to send email");
    }
  };

  return (
    <div className="flex h-screen bg-black text-neutral-100 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-1/3 border-r border-neutral-800 flex flex-col">
        <header className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
          <h1 className="text-xs tracking-widest font-mono uppercase text-neutral-400">
            Inbox / 7wingz
          </h1>
          <button
            onClick={() => setComposing(!composing)}
            className="text-xs px-2.5 py-1 rounded bg-white text-black font-mono font-semibold hover:bg-neutral-200"
          >
            {composing ? "View Mail" : "+ Compose"}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
          {loading && emails.length === 0 ? (
            <div className="p-6 text-xs text-neutral-500 font-mono">Loading messages...</div>
          ) : emails.length === 0 ? (
            <div className="p-6 text-xs text-neutral-500 font-mono">No emails received yet.</div>
          ) : (
            emails.map((mail) => (
              <button
                key={mail.id}
                onClick={() => handleSelectEmail(mail)}
                className={`w-full text-left p-4 transition-colors block ${
                  selectedEmail?.id === mail.id && !composing
                    ? "bg-neutral-900 border-l-2 border-white"
                    : "hover:bg-neutral-950/50"
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-semibold text-neutral-200 truncate max-w-[180px]">
                    {mail.from}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {new Date(mail.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-xs font-medium text-neutral-300 truncate mb-1">
                  {mail.subject}
                </div>
                <div className="text-[11px] text-neutral-500 line-clamp-1">
                  {mail.text}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col bg-neutral-950">
        {composing ? (
          <form onSubmit={handleSend} className="p-8 max-w-xl flex flex-col gap-4 font-mono">
            <h2 className="text-sm font-semibold uppercase text-neutral-400 mb-2">New Message</h2>
            <input
              type="email"
              placeholder="To"
              required
              className="bg-neutral-900 border border-neutral-800 p-2 text-xs text-white rounded outline-none focus:border-white"
              value={sendForm.to}
              onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
            />
            <input
              type="text"
              placeholder="Subject"
              required
              className="bg-neutral-900 border border-neutral-800 p-2 text-xs text-white rounded outline-none focus:border-white"
              value={sendForm.subject}
              onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
            />
            <textarea
              placeholder="Message..."
              required
              rows={8}
              className="bg-neutral-900 border border-neutral-800 p-2 text-xs text-white rounded outline-none focus:border-white"
              value={sendForm.text}
              onChange={(e) => setSendForm({ ...sendForm, text: e.target.value })}
            />
            <button type="submit" className="bg-white text-black text-xs font-semibold py-2 rounded">
              Send Email
            </button>
          </form>
        ) : selectedEmail ? (
          <div className="flex-1 flex flex-col p-8 max-w-3xl">
            <header className="border-b border-neutral-800 pb-6 mb-6">
              <h2 className="text-xl font-medium tracking-tight mb-4 text-white">
                {selectedEmail.subject}
              </h2>
              <div className="flex justify-between text-xs font-mono text-neutral-400">
                <div>
                  <span className="text-neutral-600">From: </span>
                  <span className="text-neutral-200">{selectedEmail.from}</span>
                </div>
                <div>
                  <span className="text-neutral-600">To: </span>
                  <span className="text-neutral-200">{selectedEmail.to}</span>
                </div>
              </div>
            </header>
            <div className="flex-1 text-sm leading-relaxed text-neutral-300 font-mono whitespace-pre-wrap">
              {selectedEmail.text}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs font-mono text-neutral-600">
            Select an email to read
          </div>
        )}
      </main>
    </div>
  );
}