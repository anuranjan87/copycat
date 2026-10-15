import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type HtmlPatch = {
  oldText: string;
  newText: string;
};

type EditPlan =
  | { mode: "patch"; patches: HtmlPatch[] }
  | { mode: "full" };

function parseEditPlan(raw: string): EditPlan {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as Partial<EditPlan>;

  if (parsed.mode === "full") {
    return { mode: "full" };
  }

  if (
    parsed.mode !== "patch" ||
    !Array.isArray(parsed.patches) ||
    parsed.patches.length === 0 ||
    parsed.patches.length > 30
  ) {
    throw new Error("AI returned an invalid incremental edit plan.");
  }

  const patches = parsed.patches as HtmlPatch[];
  if (
    patches.some(
      (patch) =>
        !patch ||
        typeof patch.oldText !== "string" ||
        !patch.oldText ||
        typeof patch.newText !== "string"
    )
  ) {
    throw new Error("AI returned a malformed HTML patch.");
  }

  return { mode: "patch", patches };
}

function findUniqueSnippet(
  html: string,
  snippet: string
): { start: number; end: number } | null {
  const exactStart = html.indexOf(snippet);
  if (exactStart !== -1) {
    if (html.indexOf(snippet, exactStart + snippet.length) !== -1) {
      return null;
    }

    return {
      start: exactStart,
      end: exactStart + snippet.length,
    };
  }

  const normalizedHtml: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];

  for (let index = 0; index < html.length;) {
    const start = index;
    const whitespace = /\s/.test(html[index]);
    while (
      index < html.length &&
      /\s/.test(html[index]) === whitespace
    ) {
      index += 1;
    }

    normalizedHtml.push(whitespace ? " " : html[start]);
    starts.push(start);
    ends.push(index);
  }

  const normalizedSnippet = snippet.trim().replace(/\s+/g, " ");
  const normalizedSource = normalizedHtml.join("");
  const matchStart = normalizedSource.indexOf(normalizedSnippet);

  if (
    !normalizedSnippet ||
    matchStart === -1 ||
    normalizedSource.indexOf(
      normalizedSnippet,
      matchStart + normalizedSnippet.length
    ) !== -1
  ) {
    return null;
  }

  return {
    start: starts[matchStart],
    end: ends[matchStart + normalizedSnippet.length - 1],
  };
}

function applyHtmlPatches(html: string, patches: HtmlPatch[]): string {
  const replacements = patches.map((patch) => {
    const match = findUniqueSnippet(html, patch.oldText);
    if (!match) {
      throw new Error(
        "An AI patch target was missing or ambiguous in the current HTML."
      );
    }

    return { ...patch, ...match };
  });

  replacements.sort((left, right) => left.start - right.start);
  for (let index = 1; index < replacements.length; index += 1) {
    if (replacements[index].start < replacements[index - 1].end) {
      throw new Error("AI patches overlap in the current HTML.");
    }
  }

  let result = html;
  for (const patch of replacements.reverse()) {
    result =
      result.slice(0, patch.start) +
      patch.newText +
      result.slice(patch.end);
  }

  if (!result.trim()) {
    throw new Error("AI patches produced empty HTML.");
  }

  return result;
}

function validateCompleteHtml(html: string, currentCode: string): string {
  const cleaned = html
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  if (!cleaned) {
    throw new Error("AI returned an empty website.");
  }

  if (
    /<html\b/i.test(currentCode) &&
    (!/<html\b/i.test(cleaned) || !/<\/html\s*>/i.test(cleaned))
  ) {
    throw new Error("AI returned incomplete website HTML.");
  }

  return cleaned;
}

async function generateCompleteHtml(
  prompt: string,
  currentCode: string
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: `
You are editing a website in the user's code editor.

Apply the user's request to the current website HTML. Preserve its existing
design, content, functionality, responsive behavior, and unrelated sections.
Do not rebuild the site from scratch or remove unrelated code. If no current
HTML is provided, create a complete website based on the request.
Return the complete updated HTML document only, without markdown or explanation.

CURRENT WEBSITE HTML:
${currentCode.trim() || "(No existing code was provided.)"}

USER REQUEST:
${prompt}
    `.trim(),
    stream: false,
  });

  return validateCompleteHtml(response.output_text || "", currentCode);
}

export async function POST(request: Request) {
  try {
    const { prompt, currentCode } = await request.json();

    if (typeof prompt !== "string" || !prompt.trim()) {
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (
      currentCode !== undefined &&
      typeof currentCode !== "string"
    ) {
      return Response.json(
        { error: "Current website code must be a string." },
        { status: 400 }
      );
    }

    const normalizedPrompt = prompt.trim();
    const existingCode =
      typeof currentCode === "string" ? currentCode : "";

    console.log("AI generate request:", normalizedPrompt);

    let html: string;
    let mode: "patch" | "full" = "full";

    if (existingCode.trim()) {
      const planResponse = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: `
You are planning an edit to the current website HTML.

Prefer localized patches, including adding or removing a section when it can
be done by replacing a small, unique HTML anchor. A patch's oldText must be
copied verbatim from the current HTML and occur exactly once. For insertion,
include the unchanged anchor in newText with the new markup placed beside it.
Use mode "full" only when the request requires a broad redesign or changes
across many unrelated parts of the page.

Return only one JSON object in exactly one of these forms:
{"mode":"patch","patches":[{"oldText":"exact unique source snippet","newText":"replacement snippet"}]}
{"mode":"full"}

Use no more than 30 small patches. Do not output the entire updated HTML.

CURRENT HTML:
${existingCode}

USER REQUEST:
${normalizedPrompt}
        `.trim(),
        stream: false,
      });

      let plan: EditPlan | null = null;
      try {
        plan = parseEditPlan(planResponse.output_text || "");
      } catch (error) {
        console.warn(
          "[ai-generate] Could not parse incremental edit plan; falling back to full HTML generation.",
          error
        );
      }

      if (plan?.mode === "patch") {
        try {
          html = validateCompleteHtml(
            applyHtmlPatches(existingCode, plan.patches),
            existingCode
          );
          mode = "patch";
        } catch (error) {
          console.warn(
            "[ai-generate] Incremental patches could not be safely applied; falling back to full HTML generation.",
            error
          );
          html = await generateCompleteHtml(normalizedPrompt, existingCode);
        }
      } else {
        html = await generateCompleteHtml(normalizedPrompt, existingCode);
      }
    } else {
      html = await generateCompleteHtml(normalizedPrompt, existingCode);
    }

    console.log("AI generation completed");

    return Response.json({
      success: true,
      html,
      mode,
    });
  } catch (error: any) {
    console.error("AI generation failed:", error);

    return Response.json(
      {
        error: "AI generation failed",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
