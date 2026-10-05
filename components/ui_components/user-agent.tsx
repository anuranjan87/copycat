"use client"

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

type WebsiteTemplate = {
  id: number
  code: string
  code_script: string
  code_data: string
}

type Message = {
  role:
    | "user"
    | "assistant"

  content: string

  error?: boolean

  template?: WebsiteTemplate

  templates?: WebsiteTemplate[]

  query?: string

  button?: {
    label: string
    url: string
  }

  liveUrl?: string

  liveMessage?: string

  responseTimeMs?: number

  responseType?:
    | "website_template"
    | "template_search"
    | "chat"
    | "publish"
}

const examples = [
  "get the first website template",
  "fetch a random website template",
  "find a restaurant website",
]

type WelcomeTab = "website" | "google-ads" | "domain"

type WelcomeSuggestion = {
  label: string
  icon?: string
  iconAlt?: string
}

const welcomeExamples: WelcomeSuggestion[] = [
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
  { label: "Build My Website" },
  { label: "View Analytics" },
]

const googleAdsExamples: WelcomeSuggestion[] = [
  { label: "Check my Google Ads campaigns" },
  { label: "Which campaigns should I improve first?" },
  { label: "Suggest a low-budget search campaign" },
  { label: "Give me creative Google Ads ideas" },
]

const domainExamples: WelcomeSuggestion[] = [
  { label: "Find a domain for my business" },
  { label: "Suggest a memorable .com domain" },
  { label: "Check domain availability" },
  { label: "Suggest brandable domain names" },
]

const agents: {
  name: string
  endpoint: string
  welcomeTab: WelcomeTab
}[] = [
  {
    name: "Website Ideas",
    endpoint: "/api/unsplash-agent-one",
    welcomeTab: "website",
  },
  {
    name: "Google Ads",
    endpoint: "/api/dev-agent",
    welcomeTab: "google-ads",
  },
  {
    name: "Add Domain",
    endpoint: "/api/unsplash-agent-three",
    welcomeTab: "domain",
  },
]

function formatAssistantReply(content: string) {
  return content.replace(/\s+(?=\d+\.\s+\*\*)/g, "\n")
}

function formatResponseTime(milliseconds: number) {
  return milliseconds < 1000
    ? `${milliseconds} ms`
    : `${(milliseconds / 1000).toFixed(2)} sec`
}

export default function Page() {
  const { user } = useUser()
  const [message, setMessage] =
    useState("")

  const [history, setHistory] =
    useState<Message[]>([])

  const [loading, setLoading] =
    useState(false)

  const [selectedAgent, setSelectedAgent] =
    useState(agents[0])

  const [isAgentMenuOpen, setIsAgentMenuOpen] =
    useState(false)

  const [dark, setDark] =
    useState(false)

  const params = useParams<{ username: string }>()
  const username = params?.username || ""

  const endRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      dark,
    )

    return () => {
      document.documentElement.classList.remove(
        "dark",
      )
    }
  }, [dark])

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [history, loading])

  async function search(
    event?: FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault()

    const value =
      message.trim()

    if (!value || loading) {
      return
    }

    setMessage("")

    setHistory((current) => [
      ...current,

      {
        role: "user",
        content: value,
      },
    ])

    setLoading(true)
    const requestStartedAt = performance.now()

    try {
      const response =
        await fetch(
          selectedAgent.endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message: value,

              username,

              history:
                history.map(
                  ({
                    role,
                    content,
                    template,
                  }) => ({
                    role,
                    content,
                    ...(template ? { template } : {}),
                  }),
                ),
            }),
          },
        )

      let data: any

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const eventText = await response.text()
        let reply = ""

        for (const event of eventText.split(/\r?\n\r?\n/)) {
          const dataLine = event
            .split(/\r?\n/)
            .find((line) => line.startsWith("data:"))

          if (!dataLine) continue

          const payload = JSON.parse(dataLine.slice(5).trim())
          if (payload.error) throw new Error(payload.error)
          if (typeof payload.text === "string") reply += payload.text
          if (typeof payload.answer === "string") reply = payload.answer
        }

        data = { ok: response.ok, type: "chat", reply }
      } else {
        data = await response.json()
        if (typeof data.success === "boolean" && data.ok === undefined) {
          data = {
            ...data,
            ok: data.success,
            type: "chat",
            reply: data.answer,
          }
        }
      }

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
            "Something went wrong.",
        )
      }

      let assistantMessage: Message

      if (data.type === "publish") {
        assistantMessage = {
          role: "assistant",
          content:
            data.reply ||
            "Your latest website template has been published.",
          button:
            data.button &&
            typeof data.button.label === "string" &&
            typeof data.button.url === "string"
              ? data.button
              : data.editorUrl
                ? {
                    label: "Open in Editor",
                    url: data.editorUrl,
                  }
                : undefined,
          liveUrl:
            typeof data.liveUrl === "string"
              ? data.liveUrl
              : undefined,
          liveMessage:
            typeof data.liveMessage === "string"
              ? data.liveMessage
              : undefined,
          responseType: "publish",
        }
      }

      /**
       * ------------------------------------------
       * SINGLE WEBSITE TEMPLATE
       * ------------------------------------------
       */
      else if (
        data.type ===
        "website_template"
      ) {
        const template =
          data.template

        let content =
          "Here is the website template."

        if (
          data.operation ===
          "first"
        ) {
          content =
            `Here is the first website template (ID ${template?.id}).`
        }

        if (
          data.operation ===
          "random"
        ) {
          content =
            `Here is a random website template (ID ${template?.id}).`
        }

        if (
          data.operation ===
          "id"
        ) {
          content =
            `Here is website template ${template?.id}.`
        }

        if (
          data.operation ===
          "edit_recent"
        ) {
          content =
            `Here is the updated website template (ID ${template?.id}).`
        }

        assistantMessage = {
          role: "assistant",

          content,

          template,

          responseType:
            "website_template",
        }
      }

      /**
       * ------------------------------------------
       * SEARCH RESULTS
       * ------------------------------------------
       */
      else if (
        data.type ===
        "template_search"
      ) {
        const templates =
          data.templates ?? []

        assistantMessage = {
          role: "assistant",

          content:
            `I found ${templates.length} matching website template${templates.length === 1 ? "" : "s"} for "${data.query}".`,

          templates,

          query:
            data.query,

          responseType:
            "template_search",
        }
      }

      /**
       * ------------------------------------------
       * CHAT
       * ------------------------------------------
       */
      else {
        assistantMessage = {
          role: "assistant",

          content:
            data.reply ||
            "I'm here to help.",

          responseType:
            "chat",
        }
      }

      setHistory((current) => [
        ...current,
        {
          ...assistantMessage,
          responseTimeMs: Math.max(1, Math.round(performance.now() - requestStartedAt)),
        },
      ])
    } catch (error) {
      setHistory((current) => [
        ...current,

        {
          role: "assistant",

          content:
            error instanceof Error
              ? error.message
              : "Request failed.",

          error: true,

          responseTimeMs: Math.max(1, Math.round(performance.now() - requestStartedAt)),

          responseType:
            "chat",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setHistory([])
    setMessage("")
  }

  return (
    <main className="min-h-screen bg-transparent text-zinc-800 antialiased transition-colors duration-200 dark:bg-transparent dark:text-zinc-100">

      {/* ---------------------------------------- */}
      {/* CONTROLS */}
      {/* ---------------------------------------- */}

     

      {/* ---------------------------------------- */}
      {/* CONTENT */}
      {/* ---------------------------------------- */}

      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-between px-4 pb-36 pt-24 sm:px-6">

        {history.length === 0 ? (
          <div className="my-auto w-full max-w-2xl">
            <WelcomeMessage
              setInput={setMessage}
              welcomeTab={selectedAgent.welcomeTab}
            />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {agents.map((agent) => (
                  <button
                    key={agent.endpoint}
                    type="button"
                    aria-pressed={selectedAgent.endpoint === agent.endpoint}
                    onClick={() => setSelectedAgent(agent)}
                    className={`rounded-full border px-3 py-2 text-xs font-medium shadow-sm transition ${
                      selectedAgent.endpoint === agent.endpoint
                        ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 bg-white/90 text-zinc-700 hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-zinc-500"
                    }`}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
            </div>
        ) : (

          <div className="w-full space-y-7 text-sm leading-relaxed sm:text-base">

            {history.map(
              (item, index) => (

                <div
                  key={`${item.role}-${index}`}
                  className={`flex ${
                    item.role ===
                    "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  {item.role ===
                  "user" ? (

                    <div className="max-w-[85%] rounded-2xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-black">
                      {item.content}
                    </div>

                  ) : (

                    <div
                      className={`w-full py-2 ${
                        item.error
                          ? "font-mono text-xs text-red-500"
                          : "text-zinc-700 dark:text-zinc-200"
                      }`}
                    >

                      <div className="agent-markdown mb-4 text-sm leading-7 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:pl-1 [&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_hr]:my-5 [&_hr]:border-zinc-300 dark:[&_hr]:border-zinc-700">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formatAssistantReply(item.content)}
                        </ReactMarkdown>
                      </div>

                      {item.responseTimeMs !== undefined && (
                        <div
                          className="mb-4 flex w-full items-center justify-end gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500"
                          aria-label={`Response time: ${formatResponseTime(item.responseTimeMs)}`}
                          title={`Response time: ${formatResponseTime(item.responseTimeMs)}`}
                        >
                          <Timer size={12} strokeWidth={1.8} aria-hidden="true" />
                          <span className="font-mono tabular-nums">
                            {formatResponseTime(item.responseTimeMs)}
                          </span>
                        </div>
                      )}

                      {item.button && (
                        <a
                          href={item.button.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-5 inline-flex items-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                          {item.button.label}
                        </a>
                      )}

                      {item.liveUrl && (
                        <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            Use this link to access your site:
                          </p>
                          <a
                            href={item.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block break-all text-sm font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400"
                          >
                            {item.liveUrl}
                          </a>
                          {item.liveMessage && (
                            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                              {item.liveMessage.replace(
                                "Use this link to access your site. ",
                                "",
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {item.template && (
                        <>
                          <TemplateCard
                            template={
                              item.template
                            }
                          />
                          <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                            If you want to edit the content, tell me and I can adapt it to your business idea or change the language while keeping the layout and style intact. If you like it and want to publish it, simply say "publish" and I will publish it for you.
                          </p>
                        </>
                      )}

                      {item.templates &&
                        item.templates
                          .length >
                          0 && (
                          <div>
                            <TemplateList
                              templates={
                                item.templates
                              }
                            />
                            <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                              Tell me which business idea or language you want, and I can customize the template while keeping its layout and style intact. Say "publish" when you are ready to publish it.
                            </p>
                          </div>
                        )}

                    </div>

                  )}

                </div>

              ),
            )}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
                  aria-label="Loading"
                />
              </div>
            )}

            <div ref={endRef} />

          </div>

        )}

      </section>

      {/* ---------------------------------------- */}
      {/* INPUT */}
      {/* ---------------------------------------- */}

     <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center bg-gradient-to-t from-[#fafafa] via-[#fafafa] p-4 to-transparent dark:from-zinc-950 dark:via-zinc-950">

  <form
    onSubmit={search}
    className="flex w-full max-w-3xl items-center gap-2"
  >

    {/* New chat */}
    <button
      type="button"
      onClick={reset}
      title="New chat"
      aria-label="New chat"
      className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <span className="text-xl leading-none">
        +
      </span>
    </button>

    
    {/* Input */}
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-sm transition-shadow focus-within:shadow-md dark:border-zinc-800 dark:bg-zinc-900">

      <div className="relative shrink-0 border-r border-zinc-100 pr-2 dark:border-zinc-800">
        <button
          type="button"
          aria-label={`Selected assistant: ${selectedAgent.name}`}
          aria-expanded={isAgentMenuOpen}
          aria-haspopup="listbox"
          onClick={() => setIsAgentMenuOpen((open) => !open)}
          className="flex max-w-40 items-center gap-1 py-2 text-left text-[11px] font-semibold text-zinc-600 dark:text-zinc-300"
        >
          <span className="truncate">{selectedAgent.name}</span>
          <ChevronDown size={14} className="shrink-0" />
        </button>
        {isAgentMenuOpen && (
          <div
            role="listbox"
            aria-label="Choose an assistant"
            className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            {agents.map((agent) => (
              <button
                key={agent.endpoint}
                type="button"
                role="option"
                aria-selected={selectedAgent.endpoint === agent.endpoint}
                onClick={() => {
                  setSelectedAgent(agent)
                  setIsAgentMenuOpen(false)
                }}
                className={`block w-full rounded-md px-3 py-2.5 text-left text-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  selectedAgent.endpoint === agent.endpoint
                    ? "font-semibold text-zinc-900 dark:text-white"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {agent.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <label
        htmlFor="website-template-request"
        className="sr-only"
      >
        Ask for a website template
      </label>

      <input
        id="website-template-request"
        value={message}
        onChange={(event) =>
          setMessage(event.target.value)
        }
        placeholder="Ask for a website template"
        maxLength={1000}
        className="min-h-10 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400"
      />

      <button
        type="submit"
        disabled={
          loading ||
          !message.trim()
        }
        aria-label="Send"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white dark:text-black"
      >
        <span className="text-lg">
          ↑
        </span>
      </button>

    </div>

  </form>

  {/* Suggestions */}
  {history.length > 0 && (
    <div className="mt-3 flex max-w-3xl flex-wrap justify-center gap-2 text-xs text-zinc-500">

    <span className="mr-1 py-1.5">
      Try an idea:
    </span>

    {examples.map(
      (example) => (
        <button
          key={example}
          type="button"
          onClick={() =>
            setMessage(example)
          }
          className="rounded-full border border-zinc-200 px-3 py-1.5 transition hover:border-zinc-500 dark:border-zinc-800 dark:hover:border-zinc-500"
        >
          {example}
        </button>
      ),
    )}

    </div>
  )}

</div>

    </main>
  )
}

function WelcomeMessage({
  setInput,
  welcomeTab,
}: {
  setInput: (input: string) => void
  welcomeTab: WelcomeTab
}) {
  const { user } = useUser()
  const [examplePage, setExamplePage] = useState(0)

  const activeExamples =
    welcomeTab === "google-ads"
      ? googleAdsExamples
      : welcomeTab === "domain"
        ? domainExamples
        : welcomeExamples
  const examplesPerPage = 5
  const totalPages = Math.max(1, Math.ceil(activeExamples.length / examplesPerPage))
  const currentPage = examplePage % totalPages
  const visibleExamples = activeExamples.slice(
    currentPage * examplesPerPage,
    currentPage * examplesPerPage + examplesPerPage,
  )

  return (
    <Card
      className="relative mx-auto flex aspect-[958/780] w-full flex-col overflow-hidden border border-white/70 shadow-xl"
      style={{ borderRadius: "30px" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://3xxm6vnmie4vdjlz.public.blob.vercel-storage.com/Untitled%20design%20%281%29.png")',
          backgroundSize: "85% auto",
          backgroundPosition: "center 38%",
          backgroundColor: "#fff",
        }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 top-7 z-10 px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Welcome to 7Wingz
        </p>
        <h1 className="mt-2 font-mono text-[1.05rem] font-bold text-zinc-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
          Hi {user?.firstName?.trim() || "there"}.
        </h1>
      </div>

      <CardContent className="relative z-10 mt-auto w-full bg-white/90 px-4 py-4 text-center backdrop-blur-md dark:bg-zinc-950/90 sm:px-6">
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
          Create elegant and sophisticated components in just a few prompts
        </p>

        <div className="mb-1 mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setExamplePage((page) => (page + 1) % totalPages)}
            aria-label="Show more suggestions"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
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
              onClick={() => setInput(example.label)}
              className="h-auto max-w-full gap-2 whitespace-normal rounded-full px-3 py-2 text-xs text-foreground hover:text-primary sm:text-sm"
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
      </CardContent>
    </Card>
  )
}

/* ================================================= */
/* SINGLE TEMPLATE */
/* ================================================= */

function TemplateCard({
  template,
}: {
  template: WebsiteTemplate
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">

        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          public.website_template
        </div>

        <div className="mt-1 flex items-center justify-between">

          <div className="text-sm font-semibold">
            Website Template #{template.id}
          </div>

          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800">
            Template
          </span>

        </div>

      </div>

      <div className="space-y-5 p-5">
        <TemplatePreview template={template} />

      </div>

    </div>
  )
}

/* ================================================= */
/* TEMPLATE LIST */
/* ================================================= */

function TemplateList({
  templates,
}: {
  templates: WebsiteTemplate[]
}) {
  return (
    <div className="space-y-3">

      {templates.map(
        (template) => (

          <details
            key={template.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >

            <summary className="cursor-pointer list-none px-5 py-4">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Website Template
                  </div>

                  <div className="mt-1 text-sm font-semibold">
                    Template #{template.id}
                  </div>

                </div>

                <span className="text-xs text-zinc-400">
                  View
                </span>

              </div>

            </summary>

            <div className="space-y-5 border-t border-zinc-100 p-5 dark:border-zinc-800">
              <TemplatePreview template={template} />

            </div>

          </details>

        ),
      )}

    </div>
  )
}

/* ================================================= */
/* TEMPLATE PREVIEW */
/* ================================================= */

function buildPreviewDocument(
  template: WebsiteTemplate,
): string {
  let html = template.code.trim()
  let data = template.code_data.trim()

  html = html.replace(
    /<script>\s*(?:var|const|let)\s+data\s*=\s*\{[\s\S]*?\}\s*;?\s*<\/script>\s*/i,
    "",
  )

  if (data) {
    data = data.replace(
      /^(?:var|const|let)\s+data\s*=\s*/i,
      "",
    )
    data = data.replace(/;\s*$/, "").trim()

    const dataScript = `<script>window.data = ${data.startsWith("{") ? data : `{${data}}`};</script>`

    html = html.includes("</body>")
      ? html.replace("</body>", `${dataScript}</body>`)
      : `${dataScript}${html}`
  }

  if (template.code_script.trim()) {
    const script = `<script>${template.code_script}</script>`

    html = html.includes('<script src="script.js"></script>')
      ? html.replace(
          '<script src="script.js"></script>',
          script,
        )
      : html.includes("</body>")
        ? html.replace("</body>", `${script}</body>`)
        : `${html}${script}`
  }

  return html
}

function TemplatePreview({
  template,
}: {
  template: WebsiteTemplate
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950">
      <div
        className="w-full"
        style={{ zoom: 0.65 }}
      >
        <iframe
          srcDoc={buildPreviewDocument(template)}
          title={`Preview of website template ${template.id}`}
          sandbox="allow-scripts allow-same-origin"
          className="h-full w-full bg-white"
          style={{ aspectRatio: "16/9" }}
        />
      </div>
    </div>
  )
}

/* ================================================= */
/* CODE BLOCK */
/* ================================================= */

function CodeBlock({
  title,
  value,
}: {
  title: string
  value: string
}) {
  if (!value) {
    return null
  }

  return (
    <div>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </div>

      <pre className="max-h-96 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs leading-5 text-zinc-200">
        {value}
      </pre>

    </div>
  )
}