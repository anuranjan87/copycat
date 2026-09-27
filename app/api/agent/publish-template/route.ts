import { NextRequest } from "next/server"

import {
  generateCodeWithAI,
  getTemplateById,
  updateWebsiteContent,
} from "@/lib/website-actions"

export const runtime = "nodejs"

function sanitizeGeneratedData(raw: string): string {
  let value = raw.trim()

  value = value.replace(/^```(?:js|javascript)?/i, "")
  value = value.replace(/```$/i, "")
  value = value.trim()

  value = value.replace(/^const\s+data\s*=\s*/i, "")
  value = value.replace(/^return\s*/i, "")
  value = value.replace(/;\s*$/i, "")
  value = value.trim()

  if (!value.startsWith("{")) {
    throw new Error("Generated template data is not a valid object literal.")
  }

  try {
    const fn = new Function(`return (${value});`)
    fn()
  } catch {
    throw new Error("Generated template data failed validation.")
  }

  return value
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const username =
      typeof body?.username === "string"
        ? body.username.trim()
        : ""

    const templateId =
      Number(body?.templateId ?? 1)

    const suppliedCode =
      typeof body?.code === "string"
        ? body.code.trim()
        : ""

    const suppliedScript =
      typeof body?.code_script === "string"
        ? body.code_script
        : ""

    const suppliedData =
      typeof body?.code_data === "string"
        ? body.code_data.trim()
        : ""

    const topic =
      typeof body?.topic === "string"
        ? body.topic.trim()
        : ""

    if (!username) {
      return Response.json(
        {
          ok: false,
          error: "Username is required.",
        },
        { status: 400 },
      )
    }

    if (
      !suppliedCode &&
      (!Number.isFinite(templateId) || templateId <= 0)
    ) {
      return Response.json(
        {
          ok: false,
          error: "Template ID must be a positive number.",
        },
        { status: 400 },
      )
    }

    let html = suppliedCode
    let script = suppliedScript
    let finalData = suppliedData || "{}"

    if (!html) {
      const template = await getTemplateById(templateId)

      if (!template.success || !template.html || !template.script) {
        return Response.json(
          {
            ok: false,
            error: template.error || "Template not found.",
          },
          { status: 404 },
        )
      }

      html = template.html
      script = template.script
      finalData = template.data || "{}"
    }

    if (topic) {
      const prompt = `
Rewrite only the data object for this website topic: ${topic}

Rules:
- Keep the exact same object structure and keys.
- Only update values that describe the content, headings, benefits, offers, CTA text, testimonials, feature text, pricing, SEO labels, and service names.
- Keep the same array lengths and nesting.
- Do not change key names.
- Keep all image URLs unchanged.
- Return only valid JavaScript object literal text, not markdown and not explanations.

Current data object:
  ${finalData}
`

      const aiResult = await generateCodeWithAI(finalData, prompt)

      if (!aiResult.success || !aiResult.generatedCode) {
        throw new Error(aiResult.error || "Failed to regenerate template data.")
      }

      finalData = sanitizeGeneratedData(aiResult.generatedCode)
    }

    const saveResult = await updateWebsiteContent(
      username,
      html,
      script,
      finalData,
    )

    if (!saveResult.success) {
      return Response.json(
        {
          ok: false,
          error: saveResult.error || "Failed to save website content.",
        },
        { status: 500 },
      )
    }

    const editorUrl = `/edit_new/${encodeURIComponent(username)}`
    const liveUrl = `/${encodeURIComponent(username)}`

    return Response.json({
      ok: true,
      username,
      templateId,
      topic: topic || null,
      published: true,
      editorUrl,
      liveUrl,
      button: {
        label: "Open in Editor",
        url: editorUrl,
      },
    })
  } catch (error) {
    console.error("[publish-template] Unexpected error:", error)

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish template.",
      },
      { status: 500 },
    )
  }
}
