import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, currentCode } = await request.json();

    if (!prompt) {
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

    console.log("AI generate request:", prompt);

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: `
You are editing a website in the user's code editor.

Apply the user's request to the current website HTML. Preserve the existing
design, content, functionality, responsive behavior, and unrelated sections.
Do not rebuild the site from scratch or remove unrelated code. If no current
HTML is provided, create a complete website based on the request.
Return the complete updated HTML document only, without markdown or explanation.

CURRENT WEBSITE HTML:
${typeof currentCode === "string" && currentCode.trim()
  ? currentCode
  : "(No existing code was provided.)"}

USER REQUEST:
${String(prompt).trim()}
      `.trim(),
      stream: false,
    });

    const html = response.output_text || "";

    if (!html.trim()) {
      return Response.json(
        { error: "AI returned an empty website." },
        { status: 502 }
      );
    }

    console.log("AI generation completed");

    return Response.json({
      success: true,
      html,
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
