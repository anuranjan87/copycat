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
import {
  ChevronDown,
  Globe2,
  LayoutTemplate,
  Mail,
  Megaphone,
  Timer,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

type GoogleAdsCampaignDraft = {
  campaignName: string
  objective: string
  campaignType: "Search"
  adGroupName: string
  keywords: string[]
  headlines: string[]
  descriptions: string[]
  finalUrl: string | null
  locationTargeting: string | null
  dailyBudget: number | null
  primaryConversionGoal: string
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

  campaignDraft?: GoogleAdsCampaignDraft

  agentName?: string

  routedFrom?: string

  responseType?:
    | "website_template"
    | "template_search"
    | "chat"
    | "publish"
    | "website_draft"
    | "google_ads_campaign_draft"
}

type WelcomeTab = "website" | "google-ads" | "domain" | "account" | "email"

type Agent = {
  name: string
  label: string
  endpoint: string
  welcomeTab: WelcomeTab
  description: string
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

function isGoogleAdsCampaignDraft(
  value: unknown,
): value is GoogleAdsCampaignDraft {
  if (!value || typeof value !== "object") return false
  const draft = value as Record<string, unknown>

  return (
    typeof draft.campaignName === "string" &&
    typeof draft.objective === "string" &&
    draft.campaignType === "Search" &&
    typeof draft.adGroupName === "string" &&
    Array.isArray(draft.keywords) &&
    draft.keywords.every((item) => typeof item === "string") &&
    Array.isArray(draft.headlines) &&
    draft.headlines.every((item) => typeof item === "string") &&
    Array.isArray(draft.descriptions) &&
    draft.descriptions.every((item) => typeof item === "string") &&
    (typeof draft.finalUrl === "string" || draft.finalUrl === null) &&
    (typeof draft.locationTargeting === "string" || draft.locationTargeting === null) &&
    (typeof draft.dailyBudget === "number" || draft.dailyBudget === null) &&
    typeof draft.primaryConversionGoal === "string"
  )
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
    label: "Website",
    endpoint: "/api/unsplash-agent-one",
    welcomeTab: "website",
    description: "Create & edit",
  },
  {
    name: "Google Ads",
    label: "Google Ads",
    endpoint: "/api/dev-agent",
    welcomeTab: "google-ads",
    description: "Get more traffic",
  },
  {
    name: "Add Domain",
    label: "Domain",
    endpoint: "/api/unsplash-agent-three",
    welcomeTab: "domain",
    description: "Find & connect",
  },
  {
    name: "Account Assistant",
    label: "Account",
    endpoint: "/api/unsplash-agent-two",
    welcomeTab: "account",
    description: "Manage settings",
  },
  {
    name: "Email Assistant",
    label: "Email",
    endpoint: "/api/unsplash-agent-four",
    welcomeTab: "email",
    description: "Send & automate",
  },
]

function AgentIcon({
  welcomeTab,
  className,
}: {
  welcomeTab: WelcomeTab
  className?: string
}) {
  const iconProps = { className: className || "size-5", "aria-hidden": true as const }

  switch (welcomeTab) {
    case "website":
      return <LayoutTemplate {...iconProps} />
    case "google-ads":
      return <Megaphone {...iconProps} />
    case "domain":
      return <Globe2 {...iconProps} />
    case "account":
      return <UserRound {...iconProps} />
    case "email":
      return <Mail {...iconProps} />
  }
}

function getAgentColor(welcomeTab: WelcomeTab) {
  switch (welcomeTab) {
    case "website":
      return {
        icon: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
        selected: "border-sky-200 ring-sky-100 dark:border-sky-800 dark:ring-sky-950",
      }
    case "google-ads":
      return {
        icon: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
        selected: "border-amber-200 ring-amber-100 dark:border-amber-800 dark:ring-amber-950",
      }
    case "domain":
      return {
        icon: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
        selected: "border-violet-200 ring-violet-100 dark:border-violet-800 dark:ring-violet-950",
      }
    case "account":
      return {
        icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
        selected: "border-emerald-200 ring-emerald-100 dark:border-emerald-800 dark:ring-emerald-950",
      }
    case "email":
      return {
        icon: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
        selected: "border-rose-200 ring-rose-100 dark:border-rose-800 dark:ring-rose-950",
      }
  }
}

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
  const normalized = message
    .toLowerCase()
    .replace(/\bgooggle\b/g, "google")
  const recentContext = history
    .slice(-6)
    .map((item) => item.content)
    .join(" ")
    .toLowerCase()
  const asksAboutSevenWingz =
    /\b(?:7\s*wingz|7\s*wings|seven\s*wingz|seven\s*wings)\b/i.test(message)
  const followsSevenWingzQuestion =
    /\b(?:7\s*wingz|7\s*wings|seven\s*wingz|seven\s*wings)\b/i.test(recentContext) &&
    /\b(?:how|what|where|which|who|why|use|tool|platform|service|company)\b/i.test(normalized)
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
  const websiteTemplateActionRequest =
    (
      /\b(?:fetch|get|retrieve|find|show|search|pick|choose)\b/.test(normalized) &&
      /\b(?:website|web)?\s*template\b/.test(normalized)
    ) ||
    /\b(?:first|random)\s+(?:website\s+)?template\b/.test(normalized) ||
    /\btemplate\s*(?:id\s*)?#?\s*\d+\b/.test(normalized) ||
    /\b(?:fetch|get|retrieve|find|show)\b.{0,30}\b(?:first|random)\s+website\b/.test(normalized)
  const recentTemplateEditRequest = hasRecentTemplate &&
    /\b(?:edit|modify|customi[sz]e|update|change|adapt)\b/.test(normalized)
  const recentTemplatePublishRequest = hasRecentTemplate &&
    /\b(?:publish|publishing|launch|launched)\b/.test(normalized)
  const asksForWebsiteTranslation =
    /\b(?:translate|translation|hindi|spanish|french|german|arabic|japanese|chinese|portuguese|italian|korean|dutch|russian|bengali|urdu|marathi|punjabi|language|locali[sz]e)\b/.test(normalized) ||
    message.includes("हिंदी") ||
    message.includes("हिन्दी")

  const asksAboutGoogleAds =
    /\b(?:google ads?|ad campaign|ads campaign|advertising campaign|keywords for ads|ad headlines|ad copy|ad ideas)\b/.test(normalized) ||
    /\b(?:run|create|draft|build|launch|start)\s+(?:\w+\s+){0,2}ads?\b/.test(normalized)

  if (asksAboutGoogleAds) {
    return agents.find((agent) => agent.welcomeTab === "google-ads") || currentAgent
  }

  if (
    (hasWebsite && asksForWebsiteTranslation) ||
    websiteCreationRequest ||
    websiteTemplateActionRequest ||
    recentTemplateEditRequest ||
    recentTemplatePublishRequest
  ) {
    return agents.find((agent) => agent.welcomeTab === "website") || currentAgent
  }

  if (asksAboutSevenWingz || followsSevenWingzQuestion) {
    return agents.find((agent) => agent.welcomeTab === "account") || currentAgent
  }

  if (
    /\b(?:write|draft|compose|create|send)\b/.test(normalized) &&
    /\b(?:email|e-mail|newsletter)\b/.test(normalized)
  ) {
    return agents.find((agent) => agent.welcomeTab === "email") || currentAgent
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

function GoogleAdsCampaignDraftCard({
  draft,
  username,
}: {
  draft: GoogleAdsCampaignDraft
  username: string
}) {
  const [finalUrl, setFinalUrl] = useState(draft.finalUrl || "")
  const [dailyBudget, setDailyBudget] = useState(
    draft.dailyBudget?.toString() || "",
  )
  const [openError, setOpenError] = useState("")

  function continueToCampaignSetup() {
    if (!username) {
      setOpenError("I couldn't identify your account. Please reopen this from your workspace.")
      return
    }

    const budget = dailyBudget.trim() ? Number(dailyBudget) : null
    if (budget !== null && (!Number.isFinite(budget) || budget <= 0)) {
      setOpenError("Enter a daily budget greater than zero, or leave it blank to choose later.")
      return
    }

    try {
      sessionStorage.setItem(
        `google-ads-campaign-draft-${username}`,
        JSON.stringify({
          ...draft,
          finalUrl: finalUrl.trim() || null,
          dailyBudget: budget,
        }),
      )
      window.location.assign(
        `/marketing/${encodeURIComponent(username)}?draft=assistant`,
      )
    } catch (error) {
      console.error("Could not open Google Ads campaign setup:", error)
      setOpenError("I couldn't open campaign setup. Please try again.")
    }
  }

  const previewUrl = draft.finalUrl
    ? draft.finalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "Final URL to be confirmed"

  return (
    <section className="mb-5 max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Google Ads campaign draft
            </p>
            <h2 className="mt-1 text-base font-semibold">
              {draft.campaignName}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {draft.objective}
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Draft
          </span>
        </div>
      </header>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">
              Campaign goal
            </p>
            <p className="mt-1 text-sm font-medium">{draft.primaryConversionGoal}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">
              Campaign type
            </p>
            <p className="mt-1 text-sm font-medium">{draft.campaignType} Ads</p>
          </div>
        </div>

        <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="text-xs font-semibold">01 · Campaign setup</h3>
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                Campaign name
              </p>
              <p className="mt-1 font-medium">{draft.campaignName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                Ad group
              </p>
              <p className="mt-1 font-medium">{draft.adGroupName}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">
              Keyword ideas
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {draft.keywords.map((keyword, index) => (
                <span
                  key={`${keyword}-${index}`}
                  className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="text-xs font-semibold">02 · Your Google ad</h3>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-[10px] text-zinc-500">
              Sponsored · Search preview
            </p>
            <p className="mt-2 text-[11px] text-blue-700 dark:text-blue-400">
              {previewUrl}
            </p>
            <p className="mt-1 font-medium leading-5 text-blue-800 dark:text-blue-300">
              {draft.headlines.join(" | ")}
            </p>
            <p className="mt-1 leading-5 text-zinc-600 dark:text-zinc-400">
              {draft.descriptions.join(" ")}
            </p>
          </div>
          <p className="mt-2 text-[10px] text-zinc-400">
            Illustrative preview. Google may combine headlines and descriptions.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="text-xs font-semibold">03 · Let’s get it ready</h3>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Add the remaining details, then review everything before creating your campaign.
          </p>
          <label className="mt-3 block text-[10px] font-medium text-zinc-500">
            Final page URL
            <input
              type="url"
              value={finalUrl}
              onChange={(event) => setFinalUrl(event.target.value)}
              placeholder="Paste the page customers should visit"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/70">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                Target location
              </p>
              <p className="mt-1 text-xs font-medium">
                {draft.locationTargeting || "Choose a location in campaign setup"}
              </p>
            </div>
            <label className="rounded-lg bg-zinc-50 p-3 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800/70">
              Daily budget · INR
              <input
                type="number"
                min="1"
                value={dailyBudget}
                onChange={(event) => setDailyBudget(event.target.value)}
                placeholder="Choose your daily budget"
                className="mt-1.5 w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>
          {openError && (
            <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
              {openError}
            </p>
          )}
          <button
            type="button"
            onClick={continueToCampaignSetup}
            className="mt-4 w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Continue to campaign setup →
          </button>
          <p className="mt-2 text-center text-[10px] leading-4 text-zinc-400">
            This is a draft for review. It won’t create, publish, or activate ads yet.
          </p>
        </section>
      </div>
    </section>
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
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false)
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
            type: data.type || "chat",
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

      if (
        data.type === "google_ads_campaign_draft" &&
        isGoogleAdsCampaignDraft(data.campaignDraft)
      ) {
        assistantMessage = {
          role: "assistant",
          content:
            data.answer ||
            "Here’s your Google Ads campaign draft, ready for review.",
          campaignDraft: data.campaignDraft,
          responseType: "google_ads_campaign_draft",
        }
      } else if (data.type === "website_draft" && isWebsiteDraft(data.draft)) {
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

        if (
          data.operation ===
          "edit_id"
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

      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col items-center justify-between px-4 pb-8 pt-24 sm:px-6">

        {history.length === 0 ? (
          <div className="my-auto w-full max-w-2xl">
            <WelcomeMessage
              setInput={setMessage}
              welcomeTab={selectedAgent.welcomeTab}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
            />
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

                      {item.campaignDraft ? (
                        <GoogleAdsCampaignDraftCard
                          draft={item.campaignDraft}
                          username={username}
                        />
                      ) : (
                        <div className="agent-markdown mb-4 text-sm leading-7 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:pl-1 [&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_hr]:my-5 [&_hr]:border-zinc-300 dark:[&_hr]:border-zinc-700">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {formatAssistantReply(item.content)}
                          </ReactMarkdown>
                        </div>
                      )}

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

     <div className="flex w-full flex-col items-center bg-gradient-to-t from-zinc-200/70 via-zinc-100/50 to-transparent px-4 pb-5 pt-3 dark:from-zinc-900/80 dark:via-zinc-900/40">

  <form
    onSubmit={search}
    className="flex w-full max-w-3xl items-center gap-2.5"
  >

    {/* New chat */}
    <button
      type="button"
      onClick={reset}
      title="New chat"
      aria-label="New chat"
      className="grid size-9 shrink-0 place-items-center rounded-full border border-zinc-200/80 bg-white/80 text-zinc-700 shadow-sm transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <span className="text-xl leading-none">
        +
      </span>
    </button>

    
    {/* Input */}
    <div className="flex min-h-11 min-w-0 flex-1 items-center gap-0 rounded-full border border-zinc-200/80 bg-white/90 p-1.5 shadow-[0_2px_8px_rgba(24,24,27,0.08)] transition-shadow focus-within:shadow-md dark:border-zinc-700 dark:bg-zinc-900/90">

      <div className="relative shrink-0 border-r border-zinc-200/80 px-2 dark:border-zinc-700">
        <button
          type="button"
          aria-label={`Selected assistant: ${selectedAgent.name}`}
          aria-expanded={isAgentMenuOpen}
          aria-haspopup="listbox"
          onClick={() => setIsAgentMenuOpen((open) => !open)}
          className="flex max-w-40 items-center gap-1 py-1.5 text-left text-[11px] font-semibold text-zinc-600 dark:text-zinc-300"
        >
          <AgentIcon
            welcomeTab={selectedAgent.welcomeTab}
            className="size-4 shrink-0"
          />
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
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  selectedAgent.endpoint === agent.endpoint
                    ? "font-semibold text-zinc-900 dark:text-white"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                <AgentIcon
                  welcomeTab={agent.welcomeTab}
                  className="size-4 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block">{agent.label}</span>
                  <span className="mt-0.5 block text-[10px] font-normal text-zinc-400">
                    {agent.description}
                  </span>
                </span>
                {selectedAgent.endpoint === agent.endpoint && (
                  <span className="text-[10px] text-emerald-600">Selected</span>
                )}
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
        className="min-h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400"
      />

      <button
        type="submit"
        disabled={
          loading ||
          !message.trim()
        }
        aria-label="Send"
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:opacity-80 dark:disabled:bg-zinc-600"
      >
        <span className="text-lg">
          ↑
        </span>
      </button>

    </div>

  </form>

  {/* Suggestions */}
  {history.length > 0 && (
    <div className="mt-3 flex max-w-3xl items-center justify-center gap-2 text-xs text-zinc-500">
      <span>Need an idea?</span>
      <button
        type="button"
        onClick={() => setIsPromptPickerOpen(true)}
        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600"
      >
        Browse suggestions
      </button>
    </div>
  )}

  <PromptSuggestionsDialog
    open={isPromptPickerOpen}
    onOpenChange={setIsPromptPickerOpen}
    suggestions={followUpIdeas.map((label) => ({ label }))}
    onSelect={(prompt) => setMessage(prompt)}
    title="Choose a prompt"
    description="Pick a suggestion to add it to your message. You can edit it before sending."
  />

</div>

    </main>
  )
}

function WelcomeMessage({
  setInput,
  welcomeTab,
  selectedAgent,
  onSelectAgent,
}: {
  setInput: (input: string) => void
  welcomeTab: WelcomeTab
  selectedAgent: Agent
  onSelectAgent: (agent: Agent) => void
}) {
  const { user } = useUser()
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false)

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
  return (
    <>
      <Card
        className="relative mx-auto w-full overflow-hidden border border-white/70"
        style={{ borderRadius: "30px" }}
      >
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                'url("https://3xxm6vnmie4vdjlz.public.blob.vercel-storage.com/Untitled%20design%20%281%29.png")',
              backgroundSize: "105% auto",
              backgroundPosition: "center 38%",
              backgroundColor: "#fff",
            }}
            aria-hidden="true"
          />

          <div
            className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90"
            aria-hidden="true"
          />

        </div>

        <CardContent className="relative z-10 flex w-full flex-col gap-4 bg-white/90 px-4 py-4 text-center dark:bg-zinc-950/90 sm:px-6">
          <div>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
              {welcomeTab === "account"
                ? "Get a clear snapshot of your account, plan, and website status"
                : welcomeTab === "google-ads"
                  ? "Plan and improve your Google Ads campaigns"
                  : welcomeTab === "domain"
                    ? "Find and check domain ideas for your business"
                    : welcomeTab === "email"
                      ? "Draft polished emails and newsletters with a few prompts"
                      : ""}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPromptPickerOpen(true)}
              className="rounded-full px-4"
            >
              Browse prompt suggestions
            </Button>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 sm:grid-cols-5">
            {agents.map((agent) => {
              const isSelected = selectedAgent.endpoint === agent.endpoint
              const colors = getAgentColor(agent.welcomeTab)

              return (
                <button
                  key={agent.endpoint}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectAgent(agent)}
                  className={`group flex min-w-0 flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${
                    isSelected
                      ? `bg-white ring-1 ${colors.selected} dark:bg-zinc-900`
                      : "border-transparent bg-white/70 hover:border-zinc-200 hover:bg-white dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span
                    className={`grid size-11 place-items-center rounded-2xl transition ${colors.icon}`}
                  >
                    <AgentIcon welcomeTab={agent.welcomeTab} className="size-5" />
                  </span>
                  <span className="max-w-full truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
                    {agent.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {agent.description}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <PromptSuggestionsDialog
        open={isPromptPickerOpen}
        onOpenChange={setIsPromptPickerOpen}
        suggestions={activeExamples}
        onSelect={(prompt) => setInput(prompt)}
        title="Choose a prompt"
        description="Select a suggestion to add it to the message box. You can edit it before sending."
      />
    </>
  )
}

function PromptSuggestionsDialog({
  open,
  onOpenChange,
  suggestions,
  onSelect,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestions: WelcomeSuggestion[]
  onSelect: (prompt: string) => void
  title: string
  description: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(80vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => {
                onSelect(suggestion.label)
                onOpenChange(false)
              }}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
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