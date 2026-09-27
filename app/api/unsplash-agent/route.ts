import { NextRequest } from "next/server"

export const runtime = "edge"

const OPENAI_API_URL = "https://api.openai.com/v1/responses"
const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"

const VECTOR_STORE_ID = "vs_6aa8f8333d488191a380a51b45719aea"

/**
 * Internal endpoint used by the Edge agent to perform the actual
 * database-backed template publication.
 *
 * Example:
 * /api/agent/publish-template
 *
 * Keep this as an environment variable so the route does not
 * hard-code your production domain.
 */
const PUBLISH_TEMPLATE_API_URL =
  process.env.PUBLISH_TEMPLATE_API_URL ||
  "http://localhost:3000/api/agent/publish-template"

/* ============================================================
   UNSPLASH TOOL
   ============================================================ */

const searchUnsplashTool = {
  type: "function",
  name: "search_unsplash",
  description:
    "Convert the user's request into a short Unsplash search query. Use only when the user asks to find, browse, show, suggest, or search for photos or visual references.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "A specific Unsplash search query, usually 2 to 6 words.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
} as const

/* ============================================================
   7WINGZ KNOWLEDGE TOOL
   ============================================================ */

const searchCompanyKnowledgeTool = {
  type: "file_search",
  vector_store_ids: [VECTOR_STORE_ID],
} as const

/* ============================================================
   OPEN WEBSITE TOOL
   ============================================================ */

const openSevenWingzSiteTool = {
  type: "function",
  name: "open_7wingz_site",
  description:
    "Use when the user asks to open, show, visit, or edit their 7Wingz website.",
  strict: true,
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
} as const

/* ============================================================
   PUBLISH TEMPLATE 1 TOOL
   ============================================================ */

const publishTemplate1Tool = {
  type: "function",
  name: "publish_template_1",
  description:
    "Publish website template 1 to the user's 7Wingz website. Use this only when the user explicitly asks to publish the website, publish their website, publish template 1, launch the website, or make template 1 live. Do not use this for ordinary conversation or when the user only wants to open or edit the website.",
  strict: true,
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
} as const

/* ============================================================
   7WINGZ DETECTION
   ============================================================ */

function asksAboutSevenWingz(message: string) {
  return /7\s*wingz|7\s*wings|seven\s*wingz|seven\s*wings/i.test(
    message,
  )
}

/* ============================================================
   PUBLISH INTENT
   ============================================================ */


function asksToPublish(message: string) {
  return /\b(publish|published|publishing|launch|launched)\b/i.test(
    message,
  ) ||
    /make\s+(?:the\s+)?(?:website|site)\s+live/i.test(
      message,
    ) ||
    /put\s+(?:the\s+)?(?:website|site)\s+live/i.test(
      message,
    ) ||
    /make\s+(?:template\s*)?1\s+live/i.test(
      message,
    ) ||
    /publish\s+(?:template\s*)?1/i.test(
      message,
    )
}

function extractPublishTopic(message: string): string | null {
  const patterns = [
    /publish(?:\s+(?:my|the))?\s+(?:website|site)\s*(?:for|about|on|as)?\s*[:\-]?\s*(.+)$/i,
    /launch(?:\s+(?:my|the))?\s+(?:website|site)\s*(?:for|about|on|as)?\s*[:\-]?\s*(.+)$/i,
    /publish\s+(?:my\s+)?(.+)$/i,
    /launch\s+(?:my\s+)?(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (!match || !match[1]) continue

    const topic = match[1]
      .replace(/\b(?:website|site)\b/gi, "")
      .replace(/[?.!]+$/g, "")
      .trim()

    if (topic) return topic
  }

  return null
}



/* ============================================================
   PARSE UNSPLASH TOOL ARGUMENTS
   ============================================================ */

function parseQuery(value: unknown) {
  if (typeof value !== "string") return null

  try {
    const parsed: unknown = JSON.parse(value)

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("query" in parsed)
    ) {
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

/* ============================================================
   GET TEXT FROM RESPONSES API
   ============================================================ */

function getText(output: unknown) {
  if (!Array.isArray(output)) return ""

  return output
    .filter(
      (
        item,
      ): item is {
        type: string
        content?: unknown
      } =>
        Boolean(
          item &&
            typeof item === "object" &&
            "type" in item,
        ),
    )
    .filter((item) => item.type === "message")
    .flatMap((item) =>
      Array.isArray(item.content)
        ? item.content
        : [],
    )
    .map((part) =>
      part &&
      typeof part === "object" &&
      "text" in part &&
      typeof part.text === "string"
        ? part.text
        : "",
    )
    .join("")
    .trim()
}

/* ============================================================
   FIND FUNCTION CALL
   ============================================================ */

function findFunctionCall(
  output: unknown,
  name: string,
) {
  if (!Array.isArray(output)) return null

  return (
    output.find(
      (item: unknown) =>
        item &&
        typeof item === "object" &&
        "type" in item &&
        item.type === "function_call" &&
        "name" in item &&
        item.name === name,
    ) ?? null
  )
}

/* ============================================================
   ERROR RESPONSE
   ============================================================ */

function errorResponse(
  error: string,
  status = 500,
  details?: unknown,
) {
  return Response.json(
    {
      ok: false,
      error,
      ...(details === undefined
        ? {}
        : { details }),
    },
    { status },
  )
}

/* ============================================================
   POST
   ============================================================ */

export async function POST(request: NextRequest) {
  try {
    /* --------------------------------------------------------
       READ BODY
    -------------------------------------------------------- */

    const body = await request
      .json()
      .catch(() => null)

    const message =
      body &&
      typeof body.message === "string"
        ? body.message.trim()
        : ""

    const username =
      body &&
      typeof body.username === "string"
        ? body.username.trim()
        : ""

    const history =
      Array.isArray(body?.history)
        ? body.history
        : []

    /* --------------------------------------------------------
       VALIDATION
    -------------------------------------------------------- */

    if (!message) {
      return errorResponse(
        "Message is required.",
        400,
      )
    }

    if (message.length > 1000) {
      return errorResponse(
        "Message must be 1000 characters or fewer.",
        400,
      )
    }

    if (!username) {
      return errorResponse(
        "Username is required.",
        400,
      )
    }

    const openaiKey =
      process.env.OPENAI_API_KEY

    if (!openaiKey) {
      return errorResponse(
        "Missing OPENAI_API_KEY.",
      )
    }

    /* --------------------------------------------------------
       SAFE HISTORY
    -------------------------------------------------------- */

    const safeHistory = history
      .filter(
        (item: unknown) =>
          item &&
          typeof item === "object" &&
          "role" in item &&
          "content" in item,
      )
      .slice(-12)
      .map(
        (
          item: {
            role?: unknown
            content?: unknown
          },
        ) => ({
          role:
            item.role === "assistant"
              ? "assistant"
              : "user",
          content:
            typeof item.content === "string"
              ? item.content.slice(0, 2000)
              : "",
        }),
      )
      .filter(
        (item: { content: string }) =>
          item.content,
      )

    /* --------------------------------------------------------
       CONTEXT
    -------------------------------------------------------- */

    const companyContext = [
      message,
      ...safeHistory.map(
        (item: { content: string }) =>
          item.content,
      ),
    ].join(" ")

    /* --------------------------------------------------------
       TOOLS
    -------------------------------------------------------- */

    const tools = [
      searchUnsplashTool,
      openSevenWingzSiteTool,
      publishTemplate1Tool,
      ...(asksAboutSevenWingz(companyContext)
        ? [searchCompanyKnowledgeTool]
        : []),
    ]

    /* --------------------------------------------------------
       SYSTEM PROMPT
    -------------------------------------------------------- */

    const systemPrompt = `
You are a helpful conversational assistant for 7Wingz.

Answer normal questions naturally and briefly.

TOOLS:

1. search_unsplash
Use only when the user asks to find, browse, show, suggest, or search for photos, images, or visual references.

2. open_7wingz_site
Use when the user asks to open, show, visit, or edit their 7Wingz website.

3. publish_template_1
Use when the user explicitly asks to:
- publish the website
- publish their website
- publish template 1
- launch the website
- launch their website
- make the website live
- put the website live
- make template 1 live

The publish_template_1 tool ALWAYS publishes template ID 1.

Do NOT call publish_template_1 merely because the user is discussing publishing.
The user must actually request the website to be published or launched.

Do NOT call publish_template_1 when the user only asks to edit or open the website.

4. file_search
Use only for questions specifically about 7Wingz, its company, services, people, projects, product behavior, documentation, or information in the connected knowledge base.

IMPORTANT:
- Do not invent 7Wingz information.
- Do not use tools unnecessarily.
- If the user explicitly asks to publish, use publish_template_1.
- After a successful publish operation, the application will provide an editor button.
`

    /* --------------------------------------------------------
       OPENAI REQUEST
    -------------------------------------------------------- */

    const openaiResponse = await fetch(
      OPENAI_API_URL,
      {
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
              content: systemPrompt,
            },

            ...safeHistory,

            {
              role: "user",
              content: message,
            },
          ],

          tools,

          tool_choice: "auto",
        }),
      },
    )

    /* --------------------------------------------------------
       OPENAI RESPONSE
    -------------------------------------------------------- */

    const openaiData =
      await openaiResponse
        .json()
        .catch(() => null)

    if (!openaiResponse.ok) {
      return errorResponse(
        "OpenAI request failed.",
        openaiResponse.status,
        openaiData,
      )
    }

    /* ========================================================
       1. PUBLISH TOOL CALL
    ======================================================== */

    const publishCall =
      findFunctionCall(
        openaiData?.output,
        "publish_template_1",
      )

    if (publishCall) {
      try {
        /*
         * The actual DB write happens in the server-side
         * API endpoint.
         *
         * We deliberately do not try to import the
         * database/server action into this Edge route.
         */

        const publishTopic =
          extractPublishTopic(message)

        const publishResponse =
          await fetch(
            PUBLISH_TEMPLATE_API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                username,
                templateId: 1,
                ...(publishTopic
                  ? { topic: publishTopic }
                  : {}),
              }),
            },
          )

        const publishData =
          await publishResponse
            .json()
            .catch(() => null)

        if (!publishResponse.ok) {
          return errorResponse(
            "Failed to publish the website.",
            publishResponse.status,
            publishData,
          )
        }

        if (!publishData?.ok) {
          return errorResponse(
            publishData?.error ||
              "Failed to publish the website.",
            500,
            publishData,
          )
        }

        const editorUrl =
          `/edit_new/${encodeURIComponent(
            username,
          )}`

        return Response.json({
          ok: true,

          type: "publish",

          reply:
            "Your website has been published using Template 1.",

          templateId: 1,

          published: true,

          editorUrl,

          button: {
            label: "Open in Editor",
            url: editorUrl,
          },
        })
      } catch (error) {
        console.error(
          "[7Wingz Agent] Publish tool failed:",
          error,
        )

        return errorResponse(
          "Failed to publish the website.",
          500,
          error instanceof Error
            ? error.message
            : undefined,
        )
      }
    }

    /* ========================================================
       2. OPEN WEBSITE TOOL CALL
    ======================================================== */

    const siteCall =
      findFunctionCall(
        openaiData?.output,
        "open_7wingz_site",
      )

    if (siteCall) {
      const safeUsername =
        username || ""

      const editUrl = safeUsername
        ? `/edit_new/${encodeURIComponent(
            safeUsername,
          )}`
        : "/edit"

      return Response.json({
        ok: true,

        type: "site",

        reply:
          "Sure — here’s your editing page.",

        url: editUrl,

        editorUrl: editUrl,

        button: {
          label: "Open in Editor",
          url: editUrl,
        },
      })
    }

    /* ========================================================
       3. UNSPLASH TOOL CALL
    ======================================================== */

    const toolCall =
      findFunctionCall(
        openaiData?.output,
        "search_unsplash",
      )

    const query = parseQuery(
      toolCall &&
        typeof toolCall === "object" &&
        "arguments" in toolCall
        ? toolCall.arguments
        : null,
    )

    if (!query) {
      const reply =
        getText(openaiData?.output)

      return Response.json({
        ok: true,

        type: "chat",

        reply:
          reply ||
          "I’m here to help. What would you like to talk about?",
      })
    }

    /* --------------------------------------------------------
       UNSPLASH
    -------------------------------------------------------- */

    const unsplashKey =
      process.env.UNSPLASH_ACCESS_KEY

    if (!unsplashKey) {
      return errorResponse(
        "Missing UNSPLASH_ACCESS_KEY.",
      )
    }

    const unsplashUrl =
      new URL(UNSPLASH_API_URL)

    unsplashUrl.searchParams.set(
      "query",
      query,
    )

    unsplashUrl.searchParams.set(
      "per_page",
      "5",
    )

    unsplashUrl.searchParams.set(
      "orientation",
      "landscape",
    )

    const unsplashResponse =
      await fetch(unsplashUrl, {
        headers: {
          Authorization:
            `Client-ID ${unsplashKey}`,

          "Accept-Version": "v1",
        },
      })

    const unsplashData =
      await unsplashResponse
        .json()
        .catch(() => null)

    if (!unsplashResponse.ok) {
      return errorResponse(
        "Unsplash request failed.",
        unsplashResponse.status,
        unsplashData,
      )
    }

    /* --------------------------------------------------------
       NORMALIZE IMAGES
    -------------------------------------------------------- */

    const images =
      Array.isArray(
        unsplashData?.results,
      )
        ? unsplashData.results
            .map((image: any) => ({
              id:
                image?.id ?? null,

              url:
                image?.urls?.regular ??
                null,

              thumb:
                image?.urls?.small ??
                image?.urls?.thumb ??
                null,

              width:
                image?.width ?? null,

              height:
                image?.height ?? null,

              description:
                image?.alt_description ??
                image?.description ??
                null,

              photographer:
                image?.user?.name ??
                null,

              photographerUrl:
                image?.user?.links?.html ??
                null,

              unsplashUrl:
                image?.links?.html ??
                null,
            }))

            .filter(
              (
                image: {
                  url: string | null
                },
              ) => Boolean(image.url),
            )
        : []

    return Response.json({
      ok: true,
      query,
      count: images.length,
      images,
    })
  } catch (error) {
    console.error(
      "[Unsplash Agent] Unexpected error",
      error,
    )

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Something went wrong.",
    )
  }
}