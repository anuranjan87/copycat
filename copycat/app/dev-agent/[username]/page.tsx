"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

type ApiResponse = {
  response?: string;
  answer?: string;
  error?: string;
};

export default function DevAgentPage() {
  const params = useParams<{ username?: string }>();
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const username = params?.username?.trim() || "";

  const askAgent = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/api/dev-agent", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          username,
        }),
      });

      const data: ApiResponse = await response.json();

      console.log("Dev agent API response:", data);

      if (!response.ok) {
        throw new Error(
          data.error || "The developer agent request failed.",
        );
      }

      const agentResponse =
        data.response?.trim() ||
        data.answer?.trim() ||
        "";

      if (!agentResponse) {
        throw new Error(
          "The API returned successfully, but no response was received.",
        );
      }

      setAnswer(agentResponse);
      setMessage("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      setAnswer(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            7wingz Developer Agent
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Read-only 7wingz website analytics agent.
          </p>

          {username ? (
            <p className="mt-3 text-xs text-white/40">
              Website:{" "}
              <span className="text-white/70">{username}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-red-400">
              Username is missing from the page URL.
            </p>
          )}
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <label
            htmlFor="agent-message"
            className="mb-2 block text-sm font-medium text-white/80"
          >
            Ask the developer agent
          </label>

          <textarea
            id="agent-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.ctrlKey || event.metaKey)
              ) {
                event.preventDefault();
                askAgent();
              }
            }}
            disabled={loading}
            placeholder="Ask about visitor traffic, active visitors, or inbox enquiries..."
            className="min-h-[150px] w-full resize-y rounded-xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-white/30">
              Press Ctrl + Enter to analyze
            </span>

            <button
              type="button"
              onClick={() =>
                setMessage(
                  "What is my account status? Give me the exact action steps for my plan, expiry, and AI usage.",
                )
              }
              className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Check account status
            </button>

            <button
              type="button"
              onClick={askAgent}
              disabled={loading || !message.trim()}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </section>

        {answer && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-3">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">
                Analysis
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/80">
                {answer}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}