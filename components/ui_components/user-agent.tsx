"use client";
import { ChevronRight} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Plus, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

type Message = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

type UserAgentProps = {
  username: string;
};

function sanitizeAgentHtml(value: string) {
  return value
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s(on\w+)\s*=\s*(["']).*?\2/gi, "")
    .trim();
}

const examples = [
  "Sign out button",
  "Netflix landing page clone",
  "Google search page",
  "Reddit homepage",
  "Apple product check-out",
   "Convert Visitors",
  "Unlock Premium",
  "Grow Traffic",
  "Find Opportunities",
  "Build My Website ✨",
  "View Analytics",
];

const googleAdsExamples = [
  "Check my Google Ads campaigns",
  "Which campaigns should I improve first?",
  "Suggest a low-budget search campaign",
  "Give me creative Google Ads ideas",
];

export default function UserAgent({ username }: UserAgentProps) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatHistory, loading]);

  const askAgent = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) return;

    setChatHistory((previous) => [
      ...previous,
      {
        role: "user",
        content: trimmedMessage,
      },
      {
        role: "assistant",
        content: "",
      },
    ]);

    setMessage("");
    setLoading(true);

    console.log("[UserAgent] Sending website username:", username);

    try {
      const response = await fetch("/api/dev-agent", {
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
        throw new Error(data?.error || "Developer agent failed");
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
        const lines = rawEvent.split("\n");
        const eventName =
          lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ||
          "message";
        const dataLine = lines.find((line) => line.startsWith("data:"));

        if (!dataLine) return;

        const data = JSON.parse(dataLine.slice(5).trim());

        if (eventName === "delta") {
          updateAssistant(data.text || "");
        }

        if (eventName === "error") {
          throw new Error(data.error || "The agent failed while streaming.");
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), {
          stream: !done,
        });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          if (event.trim()) processEvent(event);
        }

        if (done) break;
      }

      if (buffer.trim()) processEvent(buffer);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

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
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      askAgent();
    }
  };

  return (
    <div className="min-h-[650px] w-full bg-transparent text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-[650px] w-full max-w-3xl flex-col px-4 pb-3 pt-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={resetChat}
            disabled={loading}
            aria-label="New chat"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
          </button>

          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            7winks read only agent
          </span>
        </div>

        {chatHistory.length === 0 && (
          <WelcomeMessage
            setInput={setMessage}   
            inputRef={inputRef}
          />
        )}

        {chatHistory.length > 0 && (
          <div className="flex-1 space-y-7 text-sm leading-7">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
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
        )}
      </div>

      <div className="w-full px-4 pb-4 pt-8 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex h-[52px] items-center gap-0 rounded-2xl border border-zinc-200/80 bg-white px-0 shadow-sm transition-shadow focus-within:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative flex h-full shrink-0 items-center border-r border-zinc-100 dark:border-zinc-800">
              <select
                defaultValue="gpt-4o-mini"
                disabled={loading}
                aria-label="Select model"
                className="h-full w-[130px] cursor-pointer appearance-none bg-transparent pl-5 pr-8 text-sm font-medium text-zinc-800 outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200"
              >
                <option value="gpt-4o-mini">
                  GPT-4o mini
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
              placeholder="Ask a question..."
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />

            <button
              type="button"
              onClick={askAgent}
              disabled={loading || !message.trim()}
              aria-label="Send message"
              className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center text-zinc-300 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-600 dark:hover:text-zinc-300"
            >
              <Send
                className="h-4 w-4 -rotate-12"
                strokeWidth={1.5}
              />
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
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
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { user } = useUser();
  const [examplePage, setExamplePage] = useState(0);
  const [welcomeTab, setWelcomeTab] = useState<"website" | "google-ads">(
    "website",
  );

  const activeExamples =
    welcomeTab === "google-ads" ? googleAdsExamples : examples;
  const examplesPerPage = 5;
  const totalPages = Math.max(
    1,
    Math.ceil(activeExamples.length / examplesPerPage),
  );

  const visibleExamples = activeExamples.slice(
    examplePage * examplesPerPage,
    examplePage * examplesPerPage + examplesPerPage,
  );

  const showNextExamples = () => {
    setExamplePage((currentPage) => (currentPage + 1) % totalPages);
  };

  const changeWelcomeTab = (tab: "website" | "google-ads") => {
    setWelcomeTab(tab);
    setExamplePage(0);
  };

  return (
    <Card className="mx-auto max-w-screen-sm sm:mb-14 sm:w-full">
      <CardHeader>
        <CardTitle className="mx-auto" />
      </CardHeader>

      <Image
        src="https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/New%20Project%20(7)-WLAAPpQxzUsRqvKyfpfiKc8Wb0D6yw.png"
        alt="New Project"
        width={250}
        height={250}
        className="mx-auto mb-1 transition-opacity duration-300 hover:opacity-80"
      />

      <CardContent className="flex flex-col">
        <h1 className="mx-auto mb-2 text-center font-mono text-[1.1rem] font-bold">
          Welcome, {user?.firstName || "Guest"}! to the Tailwind Genie
        </h1>

        <p className="mx-auto mb-7 text-center text-muted-foreground">
          Create elegant and sophisticated components in just a few prompts
        </p>

        <Image
          src="/jas.gif"
          width={160}
          height={160}
          alt="Jis animation"
          className="giphy-embed mx-auto mb-5"
        />

       <div className="mb-6 -mt-9">
  <div className="mb-4 flex justify-center gap-2">
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
  </div>

  {welcomeTab === "google-ads" && (
    <p className="mb-3 text-center text-xs text-blue-600 dark:text-blue-300">
      Explore campaign health, high-intent searches, and practical growth experiments.
    </p>
  )}

  <div className="mb-2 flex items-center justify-end">
    <button
      type="button"
      onClick={showNextExamples}
      aria-label="Show more suggestions"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <ChevronRight className="h-2 w-2" />
    </button>
  </div>

  <div className="flex flex-wrap justify-center gap-2">
    {visibleExamples.map((example) => (
      <Button
        key={example}
        variant="outline"
        onClick={() => {
          setInput(example);
          inputRef.current?.focus();
        }}
        className="text-xs text-foreground hover:text-primary lg:text-sm"
      >
        {example}
      </Button>
    ))}
  </div>
</div>

        <p className="mt-2 px-3 text-xs">
          Hey creators! At Tailwind Genie, we embrace a free-spirited,
          anti-establishment vibe. We offer unlimited design
          generation—totally free. An assistant front-end developer buddy
          who constantly brings fresh ideas.
        </p>
      </CardContent>
    </Card>
  );
}