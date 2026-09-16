
"use client";

import {
  ChevronDown,
  ChevronRight,
  Plus,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";

type Message = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

type UserAgentProps = {
  username: string;
};

type Suggestion = {
  label: string;
  icon?: string;
  iconAlt?: string;
};

type WelcomeTab = "website" | "google-ads" | "domain";

const examples: Suggestion[] = [
  { label: "Sign out button" },
  {
    label: "Netflix landing page clone",
    icon: "https://img.icons8.com/plasticine/100/netflix.png",
    iconAlt: "Netflix logo",
  },
  {
    label: "Google search page",
    icon: "https://img.icons8.com/color/48/google-logo.png",
    iconAlt: "Google logo",
  },
  {
    label: "Reddit homepage",
    icon: "https://img.icons8.com/doodle/48/reddit--v4.png",
    iconAlt: "Reddit logo",
  },
  {
    label: "Apple product check-out",
    icon: "https://img.icons8.com/arcade/64/mac-os.png",
    iconAlt: "Apple logo",
  },
  { label: "Convert Visitors" },
  { label: "Unlock Premium" },
  { label: "Grow Traffic" },
  { label: "Find Opportunities" },
  { label: "Build My Website ✨" },
  { label: "View Analytics" },
];

const googleAdsExamples: Suggestion[] = [
  { label: "Check my Google Ads campaigns" },
  { label: "Which campaigns should I improve first?" },
  { label: "Suggest a low-budget search campaign" },
  { label: "Give me creative Google Ads ideas" },
];

const domainExamples: Suggestion[] = [
  { label: "Find a domain for my business" },
  { label: "Suggest a memorable .com domain" },
  { label: "Check domain availability" },
  { label: "Suggest brandable domain names" },
];

function sanitizeAgentHtml(value: string) {
  return value
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s(on\w+)\s*=\s*(["']).*?\2/gi, "")
    .trim();
}

const AGENT_API_MAP = {
  "test-agent": "/api/test-agent",
  "user-agent": "/api/dev-agent",
} as const;

export default function UserAgent({
  username,
}: UserAgentProps) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] =
    useState<keyof typeof AGENT_API_MAP>("test-agent");

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatHistory.length > 0) {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [chatHistory, loading]);

  const askAgent = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) return;

    setChatHistory((previous) => [
      ...previous,
      { role: "user", content: trimmedMessage },
      { role: "assistant", content: "" },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(AGENT_API_MAP[selectedAgent], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          username,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorText =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.error?.message === "string"
              ? data.error.message
              : typeof data?.message === "string"
                ? data.message
                : "Developer agent failed";
        throw new Error(errorText);
      }

      if (!response.body) {
        throw new Error("The agent returned no response stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const updateAssistant = (text: string) => {
        setChatHistory((previous) => {
          const next = [...previous];
          const lastIndex = next.length - 1;
          const lastMessage = next[lastIndex];

          if (lastMessage?.role === "assistant") {
            next[lastIndex] = {
              ...lastMessage,
              content: lastMessage.content + text,
            };
          }

          return next;
        });
      };

      const processEvent = (rawEvent: string) => {
        const lines = rawEvent.split(/\r?\n/);

        const eventName =
          lines
            .find((line) => line.startsWith("event:"))
            ?.slice(6)
            .trim() || "message";

        const dataLines = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        if (dataLines.length === 0) return;

        const dataText = dataLines.join("\n");

        if (dataText === "[DONE]") return;

        let data: {
          text?: string;
          error?: string;
          choices?: Array<{
            delta?: {
              content?: string;
            };
          }>;
        };

        try {
          data = JSON.parse(dataText);
        } catch {
          throw new Error("Invalid response from the agent.");
        }

        if (eventName === "delta" || data.choices) {
          updateAssistant(
            data.text ||
              data.choices?.[0]?.delta?.content ||
              "",
          );
        }

        if (eventName === "error") {
          throw new Error(
            data.error || "The agent failed while streaming."
          );
        }

      };

      while (true) {
        const { value, done } = await reader.read();

        buffer += decoder.decode(
          value || new Uint8Array(),
          { stream: !done }
        );

        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";

        for (const event of events) {
          if (event.trim()) {
            processEvent(event);
          }
        }

        if (done) break;
      }

      if (buffer.trim()) {
        processEvent(buffer);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error";

      setChatHistory((previous) => {
        const next = [...previous];
        const lastIndex = next.length - 1;

        if (next[lastIndex]?.role === "assistant") {
          next[lastIndex] = {
            role: "assistant",
            content: `Error: ${errorMessage}`,
            isError: true,
          };

          return next;
        }

        return [
          ...next,
          {
            role: "assistant",
            content: `Error: ${errorMessage}`,
            isError: true,
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    if (loading) return;

    setChatHistory([]);
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      askAgent();
    }
  };

  return (
    <div className="flex min-h-0 w-full flex-col bg-transparent text-zinc-800 dark:text-zinc-100">

      {/* Main content area */}
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 pb-3 pt-8 sm:px-6">

        {chatHistory.length === 0 && (
          <WelcomeMessage
            setInput={setMessage}
            inputRef={inputRef}
          />
        )}

        {chatHistory.length > 0 && (
          <div
            ref={chatContainerRef}
            className="relative z-20 min-h-0 w-full flex-none overflow-y-auto overscroll-auto rounded-2xl border border-white/60 bg-white/35 px-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-950/30 dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:py-8 sm:px-8"
            style={{
              aspectRatio: "958 / 950",
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="space-y-7 py-5 text-sm leading-7">

              {chatHistory.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl bg-black px-5 py-3 text-sm font-medium leading-relaxed text-white shadow-sm dark:bg-white dark:text-black">
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={
                        msg.isError
                          ? "max-w-full whitespace-pre-wrap break-words py-2 text-xs leading-6 text-red-500"
                          : "max-w-full whitespace-pre-wrap break-words py-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300"
                      }
                    >
                      {msg.isError ? (
                        msg.content
                      ) : (
                        <div
                          className="agent-html max-w-full overflow-hidden text-sm leading-6 text-zinc-700 dark:text-zinc-300 [&_a]:text-blue-600 [&_a]:underline [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_p]:leading-7 [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:space-y-1"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeAgentHtml(msg.content),
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 py-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    Analyzing your code...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input stays outside the scroll area */}
      <div className="w-full shrink-0 px-4 pb-5 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-white/60 bg-white/55 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all focus-within:border-zinc-300 focus-within:bg-white/70 focus-within:shadow-[0_16px_45px_rgba(0,0,0,0.12)] dark:border-zinc-700/60 dark:bg-zinc-950/45 dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:focus-within:border-zinc-500 dark:focus-within:bg-zinc-950/65">
            <div className="flex min-h-[54px] items-center gap-2 rounded-xl border border-white/50 bg-white/65 px-2 dark:border-zinc-800/70 dark:bg-zinc-950/65">

              <button
                type="button"
                onClick={resetChat}
                disabled={loading}
                aria-label="New chat"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 transition-all hover:scale-105 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </button>

              <div className="relative flex h-9 shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-900">
                <select
                  value={selectedAgent}
                  onChange={(event) =>
                    setSelectedAgent(
                      event.target.value as keyof typeof AGENT_API_MAP,
                    )
                  }
                  disabled={loading}
                  aria-label="Select model"
                  className="w-[130px] cursor-pointer appearance-none bg-transparent pr-5 text-[11px] font-semibold text-zinc-700 outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200"
                >
                  <option value="test-agent">
                    Help Center
                  </option>
                  <option value="user-agent">
                    Action Assistant
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-zinc-400" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Ask 7Wingz..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400 disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />

              <button
                type="button"
                onClick={askAgent}
                disabled={loading || !message.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:scale-105 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
              >
                <Send
                  className="h-[17px] w-[17px] -rotate-12"
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            AI-generated code analysis may contain mistakes.
          </p>
        </div>
      </div>
    </div>
  );
}

function WelcomeMessage({
  setInput,
  inputRef,
}: {
  setInput: (input: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const { user } = useUser();

  const [examplePage, setExamplePage] = useState(0);
  const [welcomeTab, setWelcomeTab] =
    useState<WelcomeTab>("website");

  const activeExamples =
    welcomeTab === "google-ads"
      ? googleAdsExamples
      : welcomeTab === "domain"
        ? domainExamples
        : examples;

  const examplesPerPage = 5;

  const totalPages = Math.max(
    1,
    Math.ceil(activeExamples.length / examplesPerPage)
  );

  const visibleExamples = activeExamples.slice(
    examplePage * examplesPerPage,
    examplePage * examplesPerPage + examplesPerPage
  );

  const showNextExamples = () => {
    setExamplePage((currentPage) => (currentPage + 1) % totalPages);
  };

  const changeWelcomeTab = (tab: WelcomeTab) => {
    setWelcomeTab(tab);
    setExamplePage(0);
  };

  return (
    <Card
      className="relative mx-auto max-w-2xl overflow-hidden border border-white/60 shadow-lg sm:mb-14 sm:w-full"
      style={{
        aspectRatio: "958 / 950",
        backgroundImage:
          'url("https://3xxm6vnmie4vdjlz.public.blob.vercel-storage.com/Untitled%20design%20%281%29.png")',
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "120% auto",
        borderRadius: "30px",
      }}
    >
      <CardHeader className="relative z-10">
        <CardTitle className="mx-auto" />
      </CardHeader>

      <CardContent className="relative z-10 mt-3 flex flex-col bg-white/10 dark:bg-zinc-950/10">
        <h1 className="mx-auto mb-2 text-center font-mono text-[1.1rem] font-bold">
          Welcome, {user?.firstName || "Guest"}! to 7Wingz
        </h1>

        <p className="mx-auto mb-7 text-center text-muted-foreground">
          Create elegant and sophisticated components in just a few prompts
        </p>

        <div className="mb-1 mt-[17rem]">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => changeWelcomeTab("website")}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                welcomeTab === "website"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "border border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Website ideas
            </button>

            <button
              type="button"
              onClick={() => changeWelcomeTab("google-ads")}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                welcomeTab === "google-ads"
                  ? "bg-blue-600 text-white"
                  : "border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
              }`}
            >
              Google Ads
            </button>

            <button
              type="button"
              onClick={() => changeWelcomeTab("domain")}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                welcomeTab === "domain"
                  ? "bg-emerald-600 text-white"
                  : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              }`}
            >
              Add Domain
            </button>
          </div>

          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={showNextExamples}
              aria-label="Show more suggestions"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {visibleExamples.map((example) => (
              <Button
                key={example.label}
                type="button"
                variant="outline"
                onClick={() => {
                  setInput(example.label);
                  inputRef.current?.focus();
                }}
                className="gap-2 text-xs text-foreground hover:text-primary lg:text-sm"
              >
                {example.icon && (
                  <img
                    src={example.icon}
                    alt={example.iconAlt || ""}
                    width={22}
                    height={22}
                    className="h-5 w-5 shrink-0 object-contain"
                  />
                )}

                {example.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}