"use client";

import { useState } from "react";

export default function DevAgentPage() {
  const [message, setMessage] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const askAgent = async () => {
    if (!message.trim()) {
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch(
        "/api/dev-agent",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Developer agent failed"
        );
      }

      setAnswer(
        data?.answer || ""
      );

    } catch (error: any) {

      setAnswer(
        `Error: ${
          error?.message ||
          "Unknown error"
        }`
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="mx-auto max-w-5xl p-8">

        <div className="mb-8">

          <h1 className="text-3xl font-semibold">
            7wingz Developer Agent
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Read-only GitHub code analysis.
          </p>

        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            onKeyDown={(event) => {

              if (
                event.key === "Enter" &&
                (event.ctrlKey ||
                  event.metaKey)
              ) {
                event.preventDefault();

                askAgent();
              }

            }}
            placeholder="Ask about your codebase..."
            className="
              min-h-[140px]
              w-full
              resize-y
              rounded-lg
              border
              border-white/10
              bg-black
              p-4
              text-sm
              text-white
              outline-none
              placeholder:text-white/30
            "
          />

          <div className="mt-3 flex items-center justify-between">

            <span className="text-xs text-white/30">
              Ctrl + Enter to analyze
            </span>

            <button
              onClick={askAgent}
              disabled={
                loading ||
                !message.trim()
              }
              className="
                rounded-lg
                bg-red-600
                px-5
                py-2.5
                text-sm
                font-medium
                transition
                hover:bg-red-500
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              {loading
                ? "Analyzing..."
                : "Analyze Code"}
            </button>

          </div>

        </div>

        {answer && (

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03]">

            <div className="border-b border-white/10 px-5 py-3">

              <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                Analysis
              </span>

            </div>

            <div className="p-6">

              <pre className="
                whitespace-pre-wrap
                break-words
                font-sans
                text-sm
                leading-7
                text-white/80
              ">
                {answer}
              </pre>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}