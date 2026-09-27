import { NextRequest } from "next/server"

export const runtime = "edge"

const OPENAI_API_URL = "https://api.openai.com/v1/responses"
const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"
const VECTOR_STORE_ID = "vs_6aa8f8333d488191a380a51b45719aea"

const searchUnsplashTool = {
  type: "function",
  name: "search_unsplash",
  description: "Convert the user's request into a short Unsplash search query.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "A specific Unsplash search query, usually 2 to 6 words.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
} as const

const searchCompanyKnowledgeTool = {
  type: "file_search",
  vector_store_ids: [VECTOR_STORE_ID],
} as const

function asksAboutSevenWingz(message: string) {
  return /7\\s*wingz|seven\\s*wingz/i.test(message)
}

function parseQuery(value: unknown) {
  if (typeof value !== "string") return null

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== "object" || !("query" in parsed)) {
      return null
    }

    const query = parsed.query
    if (typeof query !== "string") return null

    const trimmed = query.trim()
    return trimmed ? trimmed.slice(0, 120) : null
  } catch {
    return null
  }
}

function getText(output: unknown) {
  if (!Array.isArray(output)) return ""
  return output
    .filter((item): item is { type: string; content?: unknown } => Boolean(item && typeof item === "object" && "type" in item))
    .filter((item) => item.type === "message")
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((part) => part && typeof part === "object" && "text" in part && typeof part.text === "string" ? part.text : "")
    .join("")
    .trim()
}

function errorResponse(error: string, status = 500, details?: unknown) {
  return Response.json(
    { ok: false, error, ...(details === undefined ? {} : { details }) },
    { status },
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const message = body && typeof body.message === "string" ? body.message.trim() : ""
    const history = Array.isArray(body?.history) ? body.history : []

    if (!message) return errorResponse("Message is required.", 400)
    if (message.length > 1000) return errorResponse("Message must be 1000 characters or fewer.", 400)

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return errorResponse("Missing OPENAI_API_KEY.")

    const safeHistory = history
      .filter((item: unknown) => item && typeof item === "object" && "role" in item && "content" in item)
      .slice(-12)
      .map((item: { role?: unknown; content?: unknown }) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: typeof item.content === "string" ? item.content.slice(0, 2000) : "",
      }))
      .filter((item: { content: string }) => item.content)

    const companyContext = [message, ...safeHistory.map((item: { content: string }) => item.content)].join(" ")

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "You are a helpful conversational assistant. Answer normal questions naturally and briefly. Use search_unsplash only when the user is asking to find, browse, show, or suggest visual references, photos, or images. Use file_search only for questions specifically about 7wingz, its company, services, people, projects, or other information in the connected knowledge base. Do not call either tool for ordinary conversation, explanations, or follow-up questions that do not need them. When answering about 7wingz, ground the answer in the knowledge base and do not invent details.",
          },
          ...safeHistory,
          { role: "user", content: message },
        ],
        tools: [
          searchUnsplashTool,
          ...(asksAboutSevenWingz(companyContext) ? [searchCompanyKnowledgeTool] : []),
        ],
        tool_choice: "auto",
      }),
    })

    const openaiData = await openaiResponse.json().catch(() => null)
    if (!openaiResponse.ok) {
      return errorResponse("OpenAI request failed.", openaiResponse.status, openaiData)
    }

    const toolCall = Array.isArray(openaiData?.output)
      ? openaiData.output.find(
          (item: unknown) =>
            item &&
            typeof item === "object" &&
            "type" in item &&
            item.type === "function_call" &&
            "name" in item &&
            item.name === "search_unsplash",
        )
      : null

    const query = parseQuery(
      toolCall && typeof toolCall === "object" && "arguments" in toolCall
        ? toolCall.arguments
        : null,
    )

    if (!query) {
      const reply = getText(openaiData?.output)
      return Response.json({
        ok: true,
        type: "chat",
        reply: reply || "I’m here to help. What would you like to talk about?",
      })
    }

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
    if (!unsplashKey) return errorResponse("Missing UNSPLASH_ACCESS_KEY.")

    const unsplashUrl = new URL(UNSPLASH_API_URL)
    unsplashUrl.searchParams.set("query", query)
    unsplashUrl.searchParams.set("per_page", "5")
    unsplashUrl.searchParams.set("orientation", "landscape")

    const unsplashResponse = await fetch(unsplashUrl, {
      headers: {
        Authorization: `Client-ID ${unsplashKey}`,
        "Accept-Version": "v1",
      },
    })

    const unsplashData = await unsplashResponse.json().catch(() => null)
    if (!unsplashResponse.ok) {
      return errorResponse("Unsplash request failed.", unsplashResponse.status, unsplashData)
    }

    const images = Array.isArray(unsplashData?.results)
      ? unsplashData.results
          .map((image: any) => ({
            id: image?.id ?? null,
            url: image?.urls?.regular ?? null,
            thumb: image?.urls?.small ?? image?.urls?.thumb ?? null,
            width: image?.width ?? null,
            height: image?.height ?? null,
            description: image?.alt_description ?? image?.description ?? null,
            photographer: image?.user?.name ?? null,
            photographerUrl: image?.user?.links?.html ?? null,
            unsplashUrl: image?.links?.html ?? null,
          }))
          .filter((image: { url: string | null }) => Boolean(image.url))
      : []

    return Response.json({ ok: true, query, count: images.length, images })
  } catch (error) {
    console.error("[Unsplash Agent] Unexpected error", error)
    return errorResponse(
      error instanceof Error ? error.message : "Something went wrong.",
    )
  }
}
