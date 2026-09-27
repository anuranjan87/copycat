
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
  hasPublishedWebsite?: boolean;
};

type Suggestion = {
  label: string;
  icon?: string;
  iconAlt?: string;
};

type WelcomeTab = "website" | "google-ads" | "domain";

type BusinessIdea = {
  title: string;
  description: string;
  templateId: string;
  templateCategory: string;
  data: string;
};

type BusinessProfile = {
  businessType: string;
  goal: string;
  audience: string;
  city: string;
  style: string;
  offer: string;
};

const PUBLISHED_SITE_KEY = "workspace-site-published";

const BUSINESS_TYPE_OPTIONS = [
  "Local business",
  "Service business",
  "Startup",
  "Creator / personal brand",
  "Online store",
  "Agency / freelancer",
  "Restaurant / food brand",
  "Coaching / consulting",
];

const BUSINESS_GOAL_OPTIONS = [
  "Get leads",
  "Book appointments",
  "Sell products",
  "Build trust",
  "Grow my audience",
  "Launch an offer",
  "Get more clients",
];

const AUDIENCE_OPTIONS = [
  "Local customers",
  "Founders",
  "Professionals",
  "Families",
  "Students",
  "Small businesses",
  "Online buyers",
  "High-ticket clients",
];

const CITY_OPTIONS = [
  "My city",
  "Online only",
  "India",
  "Global",
  "I’m not sure",
];

const STYLE_OPTIONS = [
  "Minimal",
  "Modern",
  "Premium",
  "Bold",
  "Trustworthy",
  "Creative",
  "Luxury",
  "Friendly",
];

function suggestIdeaFromAnswers(profile: BusinessProfile): BusinessIdea[] {
  const goalText = profile.goal || "get leads";
  const businessLabel = profile.businessType || "business";
  const cityText = profile.city || "your city";
  const offerText = profile.offer || "help clients grow";
  const styleText = profile.style || "modern";

  const templates = [
    {
      id: "7",
      category: "Entrepreneurs & Startups",
      title: `${businessLabel} landing page`,
      description: `A ${styleText.toLowerCase()} website for ${businessLabel.toLowerCase()} that helps convert interest into ${goalText.toLowerCase()} in ${cityText}.`,
    },
    {
      id: "1",
      category: "Landing Page",
      title: `${businessLabel} focus site`,
      description: `A clean ${styleText.toLowerCase()} experience built around ${offerText.toLowerCase()} and clear calls to action for ${profile.audience.toLowerCase() || "your audience"}.`,
    },
    {
      id: "10",
      category: "Blog & Content",
      title: `${businessLabel} authority page`,
      description: `An authority-driven layout positioned for growth, trust, and stronger ${goalText.toLowerCase()} with ${cityText} visibility.`,
    },
  ];

  return templates.map((template, index) => ({
    title: template.title,
    description: template.description,
    templateId: template.id,
    templateCategory: template.category,
    data: JSON.stringify({
      profile,
      recommendationIndex: index,
      recommendedFor: goalText,
      businessName: businessLabel,
      city: cityText,
      offer: offerText,
    }),
  }));
}

const onboardingExamples: Suggestion[] = [
  { label: "Local service business" },
  { label: "Clinic or dental practice" },
  { label: "Coaching or consulting" },
  { label: "Restaurant or food brand" },
  { label: "Agency or freelance service" },
  { label: "Personal brand website" },
  { label: "Travel or tourism business" },
  { label: "Real estate business" },
  { label: "Online education offer" },
  { label: "Product or e-commerce store" },
  { label: "Fitness or wellness brand" },
  { label: "Startup launch page" },
];

const examples: Suggestion[] = [
  { label: "What is 7Wingz?" },
  {
    label: "Netflix landing page",
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
    label: "Build My Site",
   
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
  hasPublishedWebsite: publishedOverride,
}: UserAgentProps) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] =
    useState<keyof typeof AGENT_API_MAP>("test-agent");
  const [pendingApproval, setPendingApproval] = useState<{
    message: string;
    agent: keyof typeof AGENT_API_MAP;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const streamQueueRef = useRef<{ text: string; timer: number | null }>({
    text: "",
    timer: null,
  });

  useEffect(() => {
    if (chatHistory.length > 0) {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [chatHistory, loading]);

  const appendStreamText = (text: string) => {
    if (!text) return;

    const queue = streamQueueRef.current;
    queue.text += text;

    if (queue.timer !== null) {
      return;
    }

    const flushQueue = () => {
      const currentText = queue.text;

      if (!currentText) {
        queue.timer = null;
        return;
      }

      const chunkSize = Math.min(3, currentText.length);
      const nextChunk = currentText.slice(0, chunkSize);
      queue.text = currentText.slice(chunkSize);

      setChatHistory((previous) => {
        const next = [...previous];
        const lastIndex = next.length - 1;
        const lastMessage = next[lastIndex];

        if (lastMessage?.role === "assistant") {
          next[lastIndex] = {
            ...lastMessage,
            content: lastMessage.content + nextChunk,
          };
        }

        return next;
      });

      if (queue.text.length > 0) {
        queue.timer = window.setTimeout(flushQueue, 18);
      } else {
        queue.timer = null;
      }
    };

    queue.timer = window.setTimeout(flushQueue, 18);
  };

  const askAgent = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) return;

    const approvalMessage = pendingApproval;
    const isApprovalConfirmation =
      approvalMessage?.agent === "test-agent" &&
      /^(yes|y|continue|confirm|okay|ok|sure)$/i.test(trimmedMessage);
    const isApprovalRejection =
      approvalMessage?.agent === "test-agent" &&
      /^(no|n|cancel|stop|don't|do not)$/i.test(trimmedMessage);

    if (isApprovalRejection) {
      setPendingApproval(null);
      setChatHistory((previous) => [
        ...previous,
        { role: "user", content: trimmedMessage },
        {
          role: "assistant",
          content: "Okay, I will not access your connected account or website.",
        },
      ]);
      setMessage("");
      inputRef.current?.focus();
      return;
    }

    const requestMessage = isApprovalConfirmation
      ? approvalMessage.message
      : trimmedMessage;
    const agentApproved = Boolean(isApprovalConfirmation);

    if (isApprovalConfirmation) {
      setPendingApproval(null);
    }

    if (streamQueueRef.current.timer) {
      window.clearTimeout(streamQueueRef.current.timer);
    }
    streamQueueRef.current = { text: "", timer: null };

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
          message: requestMessage,
          username,
          ...(agentApproved ? { agentApproved: true } : {}),
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
        appendStreamText(text);
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
          requiresAgentApproval?: boolean;
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

        if (
          eventName === "done" &&
          data.requiresAgentApproval &&
          selectedAgent === "test-agent"
        ) {
          setPendingApproval({
            message: trimmedMessage,
            agent: selectedAgent,
          });
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
      if (streamQueueRef.current.timer) {
        window.clearTimeout(streamQueueRef.current.timer);
      }
      streamQueueRef.current = { text: "", timer: null };
      setLoading(false);
    }
  };

  const resetChat = () => {
    if (loading) return;

    setChatHistory([]);
    setMessage("");
    setPendingApproval(null);
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
<div
  className="flex min-h-0 w-full flex-col bg-transparent text-zinc-800 dark:text-zinc-100"
  style={{ zoom: 0.9 }}
>
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
      <div className="w-full shrink-0 px-4 pb-5 pt-5 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
           <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetChat}
              disabled={loading}
              aria-label="New chat"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:scale-105 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>

            <div className="flex min-h-[54px] min-w-0 flex-1 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 shadow-lg transition-all focus-within:border-zinc-300 focus-within:shadow-[0_12px_32px_rgba(0,0,0,0.1)] dark:border-zinc-700/60 dark:bg-zinc-950 dark:shadow-[0_8px_24px_rgba(0,0,0,0.18)] dark:focus-within:border-zinc-500">
              <div className="relative flex h-9 shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-900">
                <select
                  value={selectedAgent}
                  onChange={(event) =>
                    (() => {
                      setSelectedAgent(
                        event.target.value as keyof typeof AGENT_API_MAP,
                      );
                      setPendingApproval(null);
                    })()
                  }
                  disabled={loading}
                  aria-label="Select model"
                  className="w-[130px] px-2 cursor-pointer appearance-none bg-transparent pr-5 text-[11px] font-semibold text-zinc-700 outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200"
                >
                  <option value="test-agent">Help Center</option>
                  <option value="user-agent">Action Assistant</option>
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
Choose an agent from the dropdown. Agents can make mistakes, use it at your discretion.
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
  const [hasPublishedWebsite, setHasPublishedWebsite] = useState(false);
  const [onboardingFlow, setOnboardingFlow] = useState<
    "welcome" | "questions" | "ideas"
  >("welcome");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    businessType: "",
    goal: "",
    audience: "",
    city: "",
    style: "",
    offer: "",
  });
  const [recommendedIdeas, setRecommendedIdeas] = useState<BusinessIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);

  const onboardingQuestions = [
    {
      key: "businessType" as const,
      prompt: "What kind of business do you run?",
      options: BUSINESS_TYPE_OPTIONS,
      type: "options" as const,
    },
    {
      key: "goal" as const,
      prompt: "What is your main goal for the website?",
      options: BUSINESS_GOAL_OPTIONS,
      type: "options" as const,
    },
    {
      key: "audience" as const,
      prompt: "Who is the website for?",
      options: AUDIENCE_OPTIONS,
      type: "options" as const,
    },
    {
      key: "city" as const,
      prompt: "Where are you based or targeting?",
      options: CITY_OPTIONS,
      type: "options" as const,
    },
    {
      key: "style" as const,
      prompt: "What vibe do you want the site to have?",
      options: STYLE_OPTIONS,
      type: "options" as const,
    },
    {
      key: "offer" as const,
      prompt: "What do you sell or help people with?",
      type: "text" as const,
      placeholder: "Example: I help local clinics get more bookings",
    },
  ];

  const currentQuestion = onboardingQuestions[questionIndex];

  useEffect(() => {
    try {
      const savedValue = localStorage.getItem(PUBLISHED_SITE_KEY);
      if (savedValue !== null) {
        setHasPublishedWebsite(JSON.parse(savedValue) === true);
      }
    } catch {
      setHasPublishedWebsite(false);
    }
  }, []);

  const activeExamples =
    welcomeTab === "google-ads"
      ? googleAdsExamples
      : welcomeTab === "domain"
        ? domainExamples
        : examples;

  const onboardingIdeas = onboardingExamples;
  const examplesPerPage = 5;

  const totalPages = Math.max(
    1,
    Math.ceil(activeExamples.length / examplesPerPage)
  );

  const onboardingTotalPages = Math.max(
    1,
    Math.ceil(onboardingIdeas.length / examplesPerPage)
  );

  const visibleExamples = activeExamples.slice(
    examplePage * examplesPerPage,
    examplePage * examplesPerPage + examplesPerPage
  );

  const visibleOnboardingIdeas = onboardingIdeas.slice(
    examplePage * examplesPerPage,
    examplePage * examplesPerPage + examplesPerPage
  );

  const showNextExamples = () => {
    setExamplePage((currentPage) => (currentPage + 1) % totalPages);
  };

  const showNextOnboardingIdeas = () => {
    setExamplePage((currentPage) => (currentPage + 1) % onboardingTotalPages);
  };

  const changeWelcomeTab = (tab: WelcomeTab) => {
    setWelcomeTab(tab);
    setExamplePage(0);
  };

  const handleQuestionAnswer = (answer: string) => {
    const key = currentQuestion.key;
    const profileUpdate = {
      ...businessProfile,
      [key]: answer,
    } as BusinessProfile;

    setBusinessProfile(profileUpdate);

    if (questionIndex === onboardingQuestions.length - 1) {
      const ideas = suggestIdeaFromAnswers(profileUpdate);
      setRecommendedIdeas(ideas);
      setOnboardingFlow("ideas");
      return;
    }

    setQuestionIndex((previous) => previous + 1);
  };

  const openIdeaInEditor = (idea: BusinessIdea) => {
    const safeDraft = {
      html: `<section style="font-family:Arial,sans-serif;padding:32px 24px;background:#f8fafc;color:#0f172a"><h1 style="font-size:32px;margin-bottom:16px">${idea.title}</h1><p style="font-size:18px;line-height:1.7">${idea.description}</p></section>`,
      script: "",
      data: idea.data,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem(`website-draft-${user?.id || "guest"}`, JSON.stringify(safeDraft));
      sessionStorage.setItem("website-template-selected", JSON.stringify({
        templateId: idea.templateId,
        category: idea.templateCategory,
      }));
    }

    const templateQuery = encodeURIComponent(idea.templateId);
    const categoryQuery = encodeURIComponent(idea.templateCategory);

    window.location.href = `/edit_new/${user?.username || "demo"}?templateId=${templateQuery}&category=${categoryQuery}`;
  };

  const resetUnpublishedFlow = () => {
    setOnboardingFlow("welcome");
    setQuestionIndex(0);
    setSelectedIdea(null);
    setRecommendedIdeas([]);
    setBusinessProfile({
      businessType: "",
      goal: "",
      audience: "",
      city: "",
      style: "",
      offer: "",
    });
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
          {hasPublishedWebsite ? (
            <>
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
            </>
          ) : onboardingFlow === "welcome" ? (
            <div className="flex flex-col items-center justify-center gap-5 px-4 text-center">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  New website
                </p>
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Build your website in under a minute
                </h2>
                <p className="mx-auto max-w-md text-sm text-zinc-600 dark:text-zinc-300">
                  Answer a few quick questions and we’ll suggest the right template and draft.
                </p>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => setOnboardingFlow("questions")}
                className="rounded-full px-8 py-6 text-base font-medium"
              >
                Build my website
              </Button>
            </div>
          ) : onboardingFlow === "questions" ? (
            <div className="flex flex-col gap-5 px-4">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                <span>Question {questionIndex + 1} of {onboardingQuestions.length}</span>
                <button
                  type="button"
                  onClick={resetUnpublishedFlow}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  Restart
                </button>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentQuestion.prompt}
                </h2>

                {currentQuestion.type === "options" ? (
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.options?.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={businessProfile[currentQuestion.key] === option ? "default" : "outline"}
                        onClick={() => handleQuestionAnswer(option)}
                        className="text-xs lg:text-sm"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={businessProfile.offer}
                      onChange={(event) =>
                        setBusinessProfile((previous) => ({
                          ...previous,
                          offer: event.target.value,
                        }))
                      }
                      placeholder={currentQuestion.placeholder}
                      className="min-h-[100px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuestionIndex((previous) => Math.max(0, previous - 1))}
                      >
                        Back
                      </Button>

                      <Button
                        type="button"
                        onClick={() => {
                          if (!businessProfile.offer.trim()) return;
                          handleQuestionAnswer(businessProfile.offer.trim());
                        }}
                        disabled={!businessProfile.offer.trim()}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 px-4">
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Best fits for you
                </p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Pick a direction to start from
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {recommendedIdeas.map((idea) => (
                  <Button
                    key={idea.title}
                    type="button"
                    variant={selectedIdea?.title === idea.title ? "default" : "outline"}
                    onClick={() => setSelectedIdea(idea)}
                    className="flex h-auto flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold">{idea.title}</span>
                    <span className="text-xs opacity-80">{idea.description}</span>
                  </Button>
                ))}
              </div>

              {selectedIdea && (
                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" onClick={resetUnpublishedFlow}>
                    Start over
                  </Button>
                  <Button type="button" onClick={() => openIdeaInEditor(selectedIdea)}>
                    Open in editor
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}