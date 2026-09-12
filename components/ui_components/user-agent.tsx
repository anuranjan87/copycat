"use client";

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

const examples = [
  "Sign out button",
  "Netflix landing page clone",
  "Google search page",
  "Reddit homepage",
  "Apple product check-out",
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Developer agent failed");
      }

      setChatHistory((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data?.answer || "No response received.",
        },
      ]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setChatHistory((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `Error: ${errorMessage}`,
          isError: true,
        },
      ]);
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
      <div className="mx-auto flex min-h-[650px] w-full max-w-3xl flex-col px-4 pb-36 pt-8 sm:px-6">
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
                    {msg.content}
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

        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {examples.map((example, index) => (
            <Button
              key={index}
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