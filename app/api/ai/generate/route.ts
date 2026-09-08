import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("AI generate request:", prompt);

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: prompt,
      stream: false,
    });

    const html = response.output_text || "";

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
