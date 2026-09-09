// app/api/chat/route.ts

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { model, messages } = await req.json();

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });

    return Response.json(response);
  } catch (error: any) {
    return Response.json(
      {
        error: {
          message: error.message || "OpenAI request failed",
        },
      },
      { status: 500 }
    );
  }
}