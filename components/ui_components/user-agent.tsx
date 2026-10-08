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

type ToolCall = {
  name: string
  label: string
  detail: string
}

type WebsiteDraft = {
  username: string
  html: string
  script: string
  data: string
  language: string
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

  toolCalls?: ToolCall[]

  websiteDraft?: WebsiteDraft

  agentName?: string

  routedFrom?: string

  responseType?:
    | "website_template"
    | "template_search"
    | "chat"
    | "publish"
    | "website_draft"
}

type WelcomeTab = "website" | "google-ads" | "domain" | "account" | "email"

type Agent = {
  name: string
  endpoint: string
  welcomeTab: WelcomeTab
}

type WelcomeSuggestion = {
  label: string
}

function readToolCalls(value: unknown): ToolCall[] | undefined {
  if (!Array.isArray(value)) return undefined

  const calls = value.filter(
    (tool: unknown): tool is ToolCall =>
      typeof tool === "object" &&
      tool !== null &&
      "name" in tool &&
      typeof tool.name === "string" &&
      "label" in tool &&
      typeof tool.label === "string" &&
      "detail" in tool &&
      typeof tool.detail === "string",
  )

  return calls.length > 0 ? calls : undefined
}

const welcomeExamples: WelcomeSuggestion[] = [
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

const accountExamples: WelcomeSuggestion[] = [
  { label: "Show my account status" },
  { label: "What plan am I on?" },
  { label: "Is my website published?" },
  { label: "Show my subscription details" },
  { label: "How many credits do I have?" },
]

const emailExamples: WelcomeSuggestion[] = [
  { label: "Draft an email to introduce my business" },
  { label: "Write a follow-up email for a new lead" },
  { label: "Create a product announcement email" },
  { label: "Draft a newsletter for my customers" },
]

const agents: Agent[] = [
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
  {
    name: "Account Assistant",
    endpoint: "/api/unsplash-agent-two",
    welcomeTab: "account",
  },
  {
    name: "Email Assistant",
    endpoint: "/api/unsplash-agent-four",
    welcomeTab: "email",
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

function getFollowUpIdeas(input: string, tab: WelcomeTab) {
  const topic = input
    .replace(/^(?:(?:please|can you|could you|help me|i want|i need|i am looking for|i'm looking for|looking for)\s+)+/i, "")
    .replace(/^(?:find|show me|create|build|design|make|generate|suggest|fetch|get|search for)\s+/i, "")
    .replace(/\b(?:a|an|the|me|my|for|please|first|random|latest|available|website|websites|site|sites|template|templates|page|pages)\b/gi, " ")
    .replace(/[?!.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase() || "my business"

  if (tab === "google-ads") {
    return [
      `Review my ${topic} campaign and suggest improvements`,
      `Find high-intent Google Ads keywords for ${topic}`,
      `Write three compelling ad headlines for ${topic}`,
    ]
  }

  if (tab === "domain") {
    return [
      `Suggest memorable domain names for ${topic}`,
      `Find short .com domain ideas for ${topic}`,
      `Suggest alternatives if my preferred ${topic} domain is taken`,
    ]
  }

  if (tab === "account") {
    return [
      "Show my account status and subscription",
      "Check whether my website is published",
      "Show the account details linked to my website",
    ]
  }

  if (tab === "email") {
    return [
      `Draft a follow-up email about ${topic}`,
      `Write a concise customer update about ${topic}`,
      `Create a newsletter section about ${topic}`,
    ]
  }

  return [
    `Find another website template for ${topic}`,
    `Show a ${topic} website with a clear call to action`,
    `Customize a ${topic} homepage for mobile visitors`,
  ]
}

function getAgentForRequest(
  message: string,
  currentAgent: Agent,
  history: Message[],
): Agent {
  const normalized = message.toLowerCase()
  const recentContext = history
    .slice(-6)
    .map((item) => item.content)
    .join(" ")
    .toLowerCase()
  const answersRecentLanguageQuestion =
    /\b(?:hindi|spanish|french|german|arabic|japanese|chinese|portuguese|italian|korean|dutch|russian|bengali|urdu|marathi|punjabi)\b/.test(normalized) &&
    history.slice(-2).some((item) => /which language.*(?:website|site).*translate/i.test(item.content)) ||
    ((message.includes("हिंदी") || message.includes("हिन्दी")) &&
      history.slice(-2).some((item) => /which language.*(?:website|site).*translate/i.test(item.content)))
  const refersToRecentWebsite =
    (
      /\b(?:it|this|that|the same|above)\b/.test(normalized) &&
      /\b(?:website|web site|site|homepage|home page|webpage|web page|template)\b/.test(recentContext)
    ) ||
    answersRecentLanguageQuestion
  const hasWebsite =
    /\b(?:website|web site|site|homepage|home page|webpage|web page|template)\b/.test(normalized) ||
    refersToRecentWebsite
  const hasRecentTemplate = history.some((item) => Boolean(item.template))
  const websiteCreationRequest = hasWebsite &&
    /\b(?:build|create|design|find|show|customi[sz]e|need|want|give me|make me|looking for)\b/.test(normalized)
  const recentTemplateEditRequest = hasRecentTemplate &&
    /\b(?:edit|modify|customi[sz]e|update|change|adapt)\b/.test(normalized)
  const recentTemplatePublishRequest = hasRecentTemplate &&
    /\b(?:publish|publishing|launch|launched)\b/.test(normalized)
  const asksForWebsiteTranslation =
    /\b(?:translate|translation|hindi|spanish|french|german|arabic|japanese|chinese|portuguese|italian|korean|dutch|russian|bengali|urdu|marathi|punjabi|language|locali[sz]e)\b/.test(normalized) ||
    message.includes("हिंदी") ||
    message.includes("हिन्दी")

  if (
    hasWebsite &&
    asksForWebsiteTranslation
  ) {
    return agents.find((agent) => agent.welcomeTab === "website") || currentAgent
  }

  if (
    /\b(?:write|draft|compose|create|send)\b/.test(normalized) &&
    /\b(?:email|e-mail|newsletter)\b/.test(normalized)
  ) {
    return agents.find((agent) => agent.welcomeTab === "email") || currentAgent
  }

  if (/\b(?:google ads|ad campaign|ads campaign|advertising campaign|keywords for ads|ad headlines|ad copy)\b/.test(normalized)) {
    return agents.find((agent) => agent.welcomeTab === "google-ads") || currentAgent
  }

  if (/\b(?:domain|domain name|availability of .+ domain|register .+ domain)\b/.test(normalized)) {
    return agents.find((agent) => agent.welcomeTab === "domain") || currentAgent
  }

  if (
    /\b(?:account|subscription|my plan|credits|website status|published status)\b/.test(normalized) ||
    /\b(?:is|check whether|check if|has)\b.*\b(?:website|site)\b.*\b(?:published|live|online)\b/.test(normalized)
  ) {
    return agents.find((agent) => agent.welcomeTab === "account") || currentAgent
  }

  if (websiteCreationRequest || recentTemplateEditRequest || recentTemplatePublishRequest) {
    return agents.find((agent) => agent.welcomeTab === "website") || currentAgent
  }

  return currentAgent
}

function isWebsiteDraft(value: unknown): value is WebsiteDraft {
  return (
    typeof value === "object" &&
    value !== null &&
    "username" in value &&
    typeof value.username === "string" &&
    "html" in value &&
    typeof value.html === "string" &&
    "script" in value &&
    typeof value.script === "string" &&
    "data" in value &&
    typeof value.data === "string" &&
    "language" in value &&
    typeof value.language === "string"
  )
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
  const [activeToolStatus, setActiveToolStatus] = useState("")
  const latestUserInput = [...history].reverse().find((item) => item.role === "user")?.content || ""
  const followUpIdeas = getFollowUpIdeas(latestUserInput, selectedAgent.welcomeTab)

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

    const requestAgent = getAgentForRequest(value, selectedAgent, history)
    const wasRouted = requestAgent.endpoint !== selectedAgent.endpoint
    if (wasRouted) setSelectedAgent(requestAgent)

    setMessage("")

    setHistory((current) => [
      ...current,

      {
        role: "user",
        content: value,
      },
    ])

    setLoading(true)
    setActiveToolStatus(
      wasRouted
        ? `Switching to ${requestAgent.name} for this request…`
        : requestAgent.welcomeTab === "website"
          ? "Website Ideas is selecting and running the right template tool…"
          : requestAgent.welcomeTab === "account"
            ? "Account Assistant is securely checking your account…"
            : `${requestAgent.name} is working on your request…`,
    )
    const requestStartedAt = performance.now()

    try {
      const response =
        await fetch(
          requestAgent.endpoint,
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

      if (data.type === "website_draft" && isWebsiteDraft(data.draft)) {
        assistantMessage = {
          role: "assistant",
          content: data.reply || "Your translated website draft is ready to review.",
          websiteDraft: data.draft,
          toolCalls: readToolCalls(data.toolCalls),
          responseType: "website_draft",
        }
      } else if (data.type === "publish") {
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
          toolCalls: readToolCalls(data.toolCalls),
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

        let content = typeof data.reply === "string"
          ? data.reply
          : "Here is the website template."

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
          toolCalls: readToolCalls(data.toolCalls),

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
          toolCalls: readToolCalls(data.toolCalls),

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
          ...(wasRouted
            ? {
                agentName: requestAgent.name,
                routedFrom: selectedAgent.name,
              }
            : { agentName: requestAgent.name }),
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
          agentName: requestAgent.name,
          ...(wasRouted ? { routedFrom: selectedAgent.name } : {}),

          responseType:
            "chat",
        },
      ])
    } finally {
      setActiveToolStatus("")
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

                      {item.routedFrom && item.agentName && (
                        <p className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                          Routed from {item.routedFrom} to {item.agentName}
                        </p>
                      )}

                      {item.websiteDraft && (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              sessionStorage.setItem(
                                `website-draft-${item.websiteDraft?.username}`,
                                JSON.stringify({
                                  html: item.websiteDraft?.html,
                                  script: item.websiteDraft?.script,
                                  data: item.websiteDraft?.data,
                                }),
                              )
                              window.location.assign(`/edit_new/${encodeURIComponent(item.websiteDraft.username)}`)
                            } catch (error) {
                              console.error("Could not open the translated website draft:", error)
                              setHistory((current) => [
                                ...current,
                                {
                                  role: "assistant",
                                  content: "I couldn't open the draft in the editor. Please try again.",
                                  error: true,
                                  agentName: item.agentName,
                                },
                              ])
                            }
                          }}
                          className="mb-4 inline-flex items-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                          Review {item.websiteDraft.language} draft
                        </button>
                      )}

                      {item.toolCalls && item.toolCalls.length > 0 && (
                        <details open className="mb-4 max-w-2xl rounded-xl border border-zinc-200 bg-zinc-50/80 text-xs dark:border-zinc-800 dark:bg-zinc-900/70">
                          <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-zinc-600 marker:hidden dark:text-zinc-300">
                            Tools called · {item.toolCalls.length}
                          </summary>
                          <ol className="space-y-2 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
                            {item.toolCalls.map((tool, toolIndex) => (
                              <li key={`${tool.name}-${toolIndex}`} className="flex gap-2.5">
                                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  ✓
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-zinc-700 dark:text-zinc-200">{tool.label}</p>
                                  <p className="mt-0.5 leading-5 text-zinc-500 dark:text-zinc-400">{tool.detail}</p>
                                  <code className="mt-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{tool.name}</code>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}

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
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3.5 py-2.5 text-xs text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300" role="status" aria-live="polite">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                  {activeToolStatus || "Working…"}
                </div>
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

    {followUpIdeas.map(
      (idea) => (
        <button
          key={idea}
          type="button"
          onClick={() =>
            setMessage(idea)
          }
          className="rounded-full border border-zinc-200 px-3 py-1.5 transition hover:border-zinc-500 dark:border-zinc-800 dark:hover:border-zinc-500"
        >
          {idea}
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
        : welcomeTab === "account"
          ? accountExamples
            : welcomeTab === "email"
              ? emailExamples
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
          {welcomeTab === "account"
            ? "Get a clear snapshot of your account, plan, and website status"
            : welcomeTab === "google-ads"
              ? "Plan and improve your Google Ads campaigns"
              : welcomeTab === "domain"
                ? "Find and check domain ideas for your business"
                : welcomeTab === "email"
                  ? "Draft polished emails and newsletters with a few prompts"
                  : "Create elegant and sophisticated components in just a few prompts"}
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