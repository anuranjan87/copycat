import { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"

const OPENAI_API_URL = "https://api.openai.com/v1/responses"

const sql = neon(process.env.POSTGRES_URL!)

type SearchArguments = {
  query: string
}

type IdArguments = {
  id: number
}

type TemplateRow = {
  id: number
  code: string
  code_script: string
  code_data: string
}

function errorResponse(
  error: string,
  status = 500,
  details?: unknown,
) {
  return Response.json(
    {
      ok: false,
      error,
      ...(details === undefined ? {} : { details }),
    },
    { status },
  )
}

function asksToPublish(message: string): boolean {
  return /\b(publish|published|publishing|launch|launched)\b/i.test(message) ||
    /make\s+(?:the\s+)?(?:website|site)\s+live/i.test(message) ||
    /put\s+(?:the\s+)?(?:website|site)\s+live/i.test(message)
}

function asksToEdit(message: string): boolean {
  return /\b(edit|modify|customize|update|change|adapt)\b/i.test(message) ||
    /\bmake\s+it\s+for\b/i.test(message)
}

function getRecentTemplate(history: unknown): TemplateRow | null {
  if (!Array.isArray(history)) return null

  for (const item of [...history].reverse()) {
    if (!item || typeof item !== "object" || !("template" in item)) {
      continue
    }

    const value = item.template

    if (!value || typeof value !== "object") continue

    const template = value as Record<string, unknown>

    if (
      typeof template.code === "string" &&
      typeof template.code_script === "string" &&
      typeof template.code_data === "string"
    ) {
      return normalizeTemplate(template)
    }
  }

  return null
}

async function publishRecentTemplate(
  request: NextRequest,
  username: string,
  template: TemplateRow,
) {
  const response = await fetch(
    new URL("/api/agent/publish-template", request.url),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        templateId: template.id,
        code: template.code,
        code_script: template.code_script,
        code_data: template.code_data,
      }),
    },
  )

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Failed to publish the website.")
  }

  return data
}

function parseJson(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string") {
    return null
  }

  try {
    const parsed = JSON.parse(value)

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null
    }

    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * -------------------------------------------------------
 * SEARCH WEBSITE TEMPLATES
 * -------------------------------------------------------
 *
 * Searches:
 *
 * public.website_template
 *
 * across:
 *
 * code
 * code_script
 * code_data
 */
async function searchWebsiteTemplates(
  query: string,
): Promise<TemplateRow[]> {
  const normalized = query.trim()

  if (!normalized) {
    return []
  }

  const tokens = normalized
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 10)

  if (!tokens.length) {
    return []
  }

  const patterns = tokens.map((token) => `%${token}%`)

  const rows = await sql`
    SELECT
      id,
      code,
      code_script,
      code_data
    FROM public.website_template
    WHERE
      code ILIKE ANY(${patterns})
      OR code_script ILIKE ANY(${patterns})
      OR code_data ILIKE ANY(${patterns})
    ORDER BY id ASC
    LIMIT 5
  `

  return rows as TemplateRow[]
}

/**
 * -------------------------------------------------------
 * FIRST TEMPLATE
 * -------------------------------------------------------
 */
async function getFirstWebsiteTemplate(): Promise<TemplateRow[]> {
  const rows = await sql`
    SELECT
      id,
      code,
      code_script,
      code_data
    FROM public.website_template
    ORDER BY id ASC
    LIMIT 1
  `

  return rows as TemplateRow[]
}

/**
 * -------------------------------------------------------
 * RANDOM TEMPLATE
 * -------------------------------------------------------
 */
async function getRandomWebsiteTemplate(): Promise<TemplateRow[]> {
  const rows = await sql`
    SELECT
      id,
      code,
      code_script,
      code_data
    FROM public.website_template
    ORDER BY RANDOM()
    LIMIT 1
  `

  return rows as TemplateRow[]
}

/**
 * -------------------------------------------------------
 * TEMPLATE BY ID
 * -------------------------------------------------------
 */
async function getWebsiteTemplateById(
  id: number,
): Promise<TemplateRow[]> {
  const rows = await sql`
    SELECT
      id,
      code,
      code_script,
      code_data
    FROM public.website_template
    WHERE id = ${id}
    LIMIT 1
  `

  return rows as TemplateRow[]
}

/**
 * -------------------------------------------------------
 * FIND OPENAI FUNCTION CALL
 * -------------------------------------------------------
 */
function findToolCall(
  output: unknown,
  name: string,
) {
  if (!Array.isArray(output)) {
    return null
  }

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

/**
 * -------------------------------------------------------
 * EXTRACT FUNCTION ARGUMENTS
 * -------------------------------------------------------
 */
function getToolArguments(
  toolCall: unknown,
): Record<string, unknown> | null {
  if (
    !toolCall ||
    typeof toolCall !== "object" ||
    !("arguments" in toolCall)
  ) {
    return null
  }

  const args = toolCall.arguments

  return parseJson(args)
}

/**
 * -------------------------------------------------------
 * NORMALIZE TEMPLATE
 * -------------------------------------------------------
 */
function normalizeTemplate(
  row: Record<string, unknown>,
): TemplateRow {
  return {
    id:
      typeof row.id === "number"
        ? row.id
        : Number(row.id),

    code:
      typeof row.code === "string"
        ? row.code
        : "",

    code_script:
      typeof row.code_script === "string"
        ? row.code_script
        : "",

    code_data:
      typeof row.code_data === "string"
        ? row.code_data
        : "",
  }
}

/**
 * -------------------------------------------------------
 * EDIT ONLY CODE_DATA
 * -------------------------------------------------------
 *
 * IMPORTANT:
 *
 * code and code_script are NEVER sent back from OpenAI
 * as editable fields.
 *
 * OpenAI receives:
 *
 * 1. Original code_data
 * 2. User request
 *
 * It returns ONLY the new code_data.
 */
async function editTemplateData(
  originalData: string,
  userRequest: string,
  openaiKey: string,
): Promise<string> {
  const response = await fetch(
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

            content: `
You are the 7Wingz Template Data Editor.

Your job is to customize an existing website template.

CRITICAL RULE:

You may ONLY modify the values inside code_data.

NEVER modify:
- HTML
- CSS
- layout
- DOM structure
- code
- JavaScript
- code_script
- object property names
- object nesting
- array structure
- data types
- template structure

The original website structure must remain completely unchanged.

You are given the original code_data.

The user will tell you what business, industry, brand, service, audience, location, or content the website should represent.

Change ONLY the content values necessary to satisfy the user's request.

Examples of values you may change:

- business name
- company name
- tagline
- hero title
- hero description
- headings
- descriptions
- services
- course names
- testimonials
- contact information
- phone number
- email
- address
- CTA text
- navigation labels
- feature descriptions
- pricing values
- image URLs if an image URL already exists as a data value
- other textual or value content already represented in code_data

DO NOT add new properties.

DO NOT remove properties.

DO NOT rename properties.

DO NOT change the nesting structure.

DO NOT change arrays into objects.

DO NOT change objects into arrays.

DO NOT change strings into numbers or numbers into strings unless the original value already uses that type and the user's request explicitly requires a different value.

If the user says:

"make this a tuition and coaching website"

then adapt the existing values to tuition/coaching while preserving the exact structure.

If the user says:

"make this for Bright Future Academy"

then use Bright Future Academy as the business identity.

Return ONLY the modified code_data.

Do not return markdown.

Do not return explanations.

Do not return code fences.

Do not return "Here is the updated data".

The output must contain ONLY the new code_data.
            `,
          },

          {
            role: "user",

            content: `
USER REQUEST:

${userRequest}

ORIGINAL CODE_DATA:

${originalData}
            `,
          },
        ],
      }),
    },
  )

  const data = await response
    .json()
    .catch(() => null)

  if (!response.ok) {
    throw new Error(
      typeof data?.error?.message === "string"
        ? data.error.message
        : "OpenAI failed while editing template data.",
    )
  }

  /**
   * Responses API normally exposes the final text
   * through output_text.
   */
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim()
  }

  /**
   * Fallback: extract text from output blocks.
   */
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (
        item &&
        typeof item === "object" &&
        Array.isArray(item.content)
      ) {
        for (const content of item.content) {
          if (
            content &&
            typeof content === "object" &&
            "text" in content &&
            typeof content.text === "string"
          ) {
            if (content.text.trim()) {
              return content.text.trim()
            }
          }
        }
      }
    }
  }

  throw new Error(
    "OpenAI returned no template data.",
  )
}

/**
 * -------------------------------------------------------
 * CLEAN AI CODE_DATA RESPONSE
 * -------------------------------------------------------
 */
function cleanCodeData(
  value: string,
): string {
  let result = value.trim()

  /**
   * Remove accidental markdown fences.
   */
  if (result.startsWith("```")) {
    result = result
      .replace(/^```(?:json|javascript|js)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
  }

  return result
}

/**
 * -------------------------------------------------------
 * VALIDATE CODE_DATA
 * -------------------------------------------------------
 *
 * We try to parse JSON because the current database
 * stores code_data as TEXT.
 *
 * If it is valid JSON, we compare its structure with
 * the original data.
 */
function validateDataStructure(
  originalData: string,
  newData: string,
): {
  valid: boolean
  reason?: string
} {
  const original = parseJson(originalData)
  const updated = parseJson(newData)

  /**
   * If the existing data is not JSON, don't reject it
   * here. The template may use another data format.
   */
  if (!original) {
    return {
      valid: true,
    }
  }

  if (!updated) {
    return {
      valid: false,
      reason:
        "The AI returned invalid JSON for code_data.",
    }
  }

  const getShape = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) =>
        getShape(item),
      )
    }

    if (
      value &&
      typeof value === "object"
    ) {
      const objectValue =
        value as Record<string, unknown>

      const shape: Record<string, unknown> = {}

      for (const key of Object.keys(
        objectValue,
      ).sort()) {
        shape[key] = getShape(
          objectValue[key],
        )
      }

      return shape
    }

    return typeof value
  }

  const originalShape =
    JSON.stringify(getShape(original))

  const updatedShape =
    JSON.stringify(getShape(updated))

  if (originalShape !== updatedShape) {
    return {
      valid: false,
      reason:
        "The AI changed the code_data structure. Only values are allowed to change.",
    }
  }

  return {
    valid: true,
  }
}

/**
 * -------------------------------------------------------
 * POST
 * -------------------------------------------------------
 */
export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request
        .json()
        .catch(() => null)

    const message =
      body &&
      typeof body.message === "string"
        ? body.message.trim()
        : ""

    const username =
      body && typeof body.username === "string"
        ? body.username.trim()
        : ""

    const history = body?.history

    if (!message) {
      return errorResponse(
        "Message is required.",
        400,
      )
    }

    if (asksToPublish(message)) {
      if (!username) {
        return errorResponse("Username is required to publish.", 400)
      }

      const recentTemplate = getRecentTemplate(history)

      if (!recentTemplate) {
        return errorResponse(
          "No website template is available in the recent chat to publish.",
          400,
        )
      }

      const published = await publishRecentTemplate(
        request,
        username,
        recentTemplate,
      )

      return Response.json({
        ok: true,
        type: "publish",
        reply: "Your latest website template has been published.",
        liveUrl: published.liveUrl,
        liveMessage:
          "Use this link to access your site. You can share it across the web, or ask me to run Google Ads and I will create an optimized campaign and run it with one click. After publishing your site, your next step is to keep it alive.",
        ...published,
      })
    }

    const openaiKey =
      process.env.OPENAI_API_KEY

    if (!openaiKey) {
      return errorResponse(
        "Missing OPENAI_API_KEY.",
        500,
      )
    }

    /**
     * ---------------------------------------------------
     * STEP 1
     * ASK OPENAI WHICH TEMPLATE TO FETCH
     * ---------------------------------------------------
     */
    const openaiResponse =
      await fetch(
        OPENAI_API_URL,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model: "gpt-4o-mini",

            input: [
              {
                role: "system",

                content: `
You are the 7Wingz Website Template Agent.

Your database is:

public.website_template

Columns:

id
code
code_script
code_data

You can retrieve website templates using exactly four operations.

OPERATION 1 — SEARCH

Use search_website_templates when the user wants a template based on:

- industry
- business
- topic
- website type
- style

Examples:

"tuition website"
"coaching website"
"restaurant website"
"portfolio website"
"modern SaaS website"
"coffee shop website"
"fashion website"

Extract a short useful search query.

Example:

User:
"Make me a website for tuition and coaching"

Use:

search_website_templates

query:
"tuition coaching"

IMPORTANT:

If the user wants a specific business type such as tuition, coaching, restaurant, gym, salon, etc., include that business type in the search query.

---

OPERATION 2 — FIRST TEMPLATE

Use get_first_website_template when the user explicitly asks for:

"first website"
"first template"
"give me the first website"
"show me the first template"
"get the first row"

Do not use search.

---

OPERATION 3 — RANDOM TEMPLATE

Use get_random_website_template when the user asks for:

"random website"
"random template"
"any website"
"any random website"
"fetch a random website"
"fetch any website"

Do not use search.

---

OPERATION 4 — TEMPLATE BY ID

Use get_website_template_by_id when the user gives a specific numeric template ID.

Examples:

"get template 10"
"show website 25"
"get template id 100"

---

IMPORTANT

You are selecting a template.

After the server retrieves the template, another AI step will customize ONLY code_data.

If the user asks to edit, modify, customize, update, change, or adapt the template
shown in the recent chat, reuse that recent template instead of searching for a new
template. Keep its HTML, layout, CSS, and JavaScript unchanged; customize only the
values in code_data. The user can also ask to change the business idea or language.

The HTML/code and JavaScript/code_script must remain unchanged.

Never generate SQL.

Never invent template records.

Choose exactly one retrieval operation.
                `,
              },

              {
                role: "user",
                content: message,
              },
            ],

            tools: [
              /**
               * SEARCH
               */
              {
                type: "function",

                name:
                  "search_website_templates",

                description:
                  "Search public.website_template for templates matching the user's requested website type, industry, style, or topic.",

                strict: true,

                parameters: {
                  type: "object",

                  properties: {
                    query: {
                      type: "string",

                      description:
                        "Short keywords describing the desired website template.",
                    },
                  },

                  required: [
                    "query",
                  ],

                  additionalProperties:
                    false,
                },
              },

              /**
               * FIRST
               */
              {
                type: "function",

                name:
                  "get_first_website_template",

                description:
                  "Get the first row from public.website_template ordered by id ascending.",

                strict: true,

                parameters: {
                  type: "object",

                  properties: {},

                  required: [],

                  additionalProperties:
                    false,
                },
              },

              /**
               * RANDOM
               */
              {
                type: "function",

                name:
                  "get_random_website_template",

                description:
                  "Get one random row from public.website_template.",

                strict: true,

                parameters: {
                  type: "object",

                  properties: {},

                  required: [],

                  additionalProperties:
                    false,
                },
              },

              /**
               * BY ID
               */
              {
                type: "function",

                name:
                  "get_website_template_by_id",

                description:
                  "Get one website template from public.website_template by numeric id.",

                strict: true,

                parameters: {
                  type: "object",

                  properties: {
                    id: {
                      type: "integer",

                      description:
                        "Numeric website template ID.",
                    },
                  },

                  required: [
                    "id",
                  ],

                  additionalProperties:
                    false,
                },
              },
            ],

            tool_choice: "auto",
          }),
        },
      )

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

    /**
     * ---------------------------------------------------
     * STEP 2
     * DETERMINE WHICH TEMPLATE WAS SELECTED
     * ---------------------------------------------------
     */

    let template: TemplateRow | null =
      asksToEdit(message)
        ? getRecentTemplate(history)
        : null

    let operation = template
      ? "edit_recent"
      : ""

    let searchQuery: string | null =
      null

    /**
     * FIRST TEMPLATE
     */
    const firstCall =
      findToolCall(
        openaiData?.output,
        "get_first_website_template",
      )

    if (firstCall) {
      const rows =
        await getFirstWebsiteTemplate()

      if (!rows.length) {
        return Response.json({
          ok: true,
          type: "chat",
          reply:
            "There are no website templates in public.website_template.",
        })
      }

      template =
        normalizeTemplate(
          rows[0] as Record<
            string,
            unknown
          >,
        )

      operation = "first"
    }

    /**
     * RANDOM TEMPLATE
     */
    if (!template) {
      const randomCall =
        findToolCall(
          openaiData?.output,
          "get_random_website_template",
        )

      if (randomCall) {
        const rows =
          await getRandomWebsiteTemplate()

        if (!rows.length) {
          return Response.json({
            ok: true,
            type: "chat",
            reply:
              "There are no website templates in public.website_template.",
          })
        }

        template =
          normalizeTemplate(
            rows[0] as Record<
              string,
              unknown
            >,
          )

        operation = "random"
      }
    }

    /**
     * TEMPLATE BY ID
     */
    if (!template) {
      const idCall =
        findToolCall(
          openaiData?.output,
          "get_website_template_by_id",
        )

      if (idCall) {
        const args =
          getToolArguments(idCall)

        const id =
          typeof args?.id === "number"
            ? args.id
            : null

        if (
          id === null ||
          !Number.isInteger(id) ||
          id < 1
        ) {
          return errorResponse(
            "Invalid template ID.",
            400,
          )
        }

        const rows =
          await getWebsiteTemplateById(
            id,
          )

        if (!rows.length) {
          return Response.json({
            ok: true,
            type: "chat",
            reply:
              `I could not find website template ${id}.`,
          })
        }

        template =
          normalizeTemplate(
            rows[0] as Record<
              string,
              unknown
            >,
          )

        operation = "id"
      }
    }

    /**
     * SEARCH
     */
    if (!template) {
      const searchCall =
        findToolCall(
          openaiData?.output,
          "search_website_templates",
        )

      if (searchCall) {
        let query = message

        const args =
          getToolArguments(searchCall)

        if (
          typeof args?.query === "string" &&
          args.query.trim()
        ) {
          query =
            args.query.trim()
        }

        const rows =
          await searchWebsiteTemplates(
            query,
          )

        if (!rows.length) {
          const fallbackRows =
            await getWebsiteTemplateById(11)

          if (!fallbackRows.length) {
            return errorResponse(
              "No relevant template was found and fallback template 11 is unavailable.",
              404,
            )
          }

          template = normalizeTemplate(
            fallbackRows[0] as Record<
              string,
              unknown
            >,
          )

          operation = "fallback"
          searchQuery = query
        } else {
          /**
           * Use the first matching template.
           *
           * You can later change this to return
           * all five templates if your UI needs
           * template selection.
           */
          template = normalizeTemplate(
            rows[0] as Record<
              string,
              unknown
            >,
          )

          operation = "search"
          searchQuery = query
        }
      }
    }

    /**
     * ---------------------------------------------------
     * NO TEMPLATE TOOL WAS SELECTED
     * ---------------------------------------------------
     */
    if (!template) {
      return Response.json({
        ok: true,

        type: "chat",

        reply:
          "I can find website templates, retrieve the first template, retrieve a random template, or get a template by ID.",
      })
    }

    /**
     * ---------------------------------------------------
     * STEP 3
     * CUSTOMIZE ONLY CODE_DATA
     * ---------------------------------------------------
     */

    const originalCode =
      template.code

    const originalCodeScript =
      template.code_script

    const originalCodeData =
      template.code_data

    const editedCodeDataRaw =
      await editTemplateData(
        originalCodeData,
        message,
        openaiKey,
      )

    const editedCodeData =
      cleanCodeData(
        editedCodeDataRaw,
      )

    /**
     * ---------------------------------------------------
     * STEP 4
     * VERIFY DATA STRUCTURE
     * ---------------------------------------------------
     */
    const validation =
      validateDataStructure(
        originalCodeData,
        editedCodeData,
      )

    if (!validation.valid) {
      return errorResponse(
        validation.reason ||
          "AI changed the template data structure.",
        500,
      )
    }

    /**
     * ---------------------------------------------------
     * STEP 5
     * IMPORTANT
     *
     * code and code_script come DIRECTLY from
     * PostgreSQL.
     *
     * They are NOT taken from OpenAI.
     *
     * Only code_data comes from the AI editor.
     * ---------------------------------------------------
     */
    const finalTemplate = {
      id: template.id,

      code: originalCode,

      code_script:
        originalCodeScript,

      code_data:
        editedCodeData,
    }

    /**
     * ---------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------
     */
    return Response.json({
      ok: true,

      type: "website_template",

      operation,

      ...(searchQuery
        ? {
            query: searchQuery,
          }
        : {}),

      template: finalTemplate,

      customization: {
        changed: "code_data",

        preserved: [
          "code",
          "code_script",
        ],

        structure:
          "preserved",
      },
    })
  } catch (error) {
    console.error(
      "[website-template-agent] Unexpected error:",
      error,
    )

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Something went wrong.",
      500,
    )
  }
}