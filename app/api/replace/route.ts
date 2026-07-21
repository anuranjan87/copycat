import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { currentCode, prompt } = await request.json();

    const stream = await openai.responses.create({
      model: "gpt-4.1-nano",
      stream: true,
      input: `
You are an expert HTML/Tailwind developer.  
Your task is to modify an existing HTML page.

Current code:
${currentCode}

User request:
${prompt}

Rules:
- Output ONLY a series of JSON objects, one per line.
- Each object has two properties: "find" and "replace".
- "find" must be a substring that exists in the current code (or in the code after previous replacements).
- "replace" is the new text that replaces that substring.
- Apply the edits in order – each edit builds on the previous one.
- Do not output any other text, comments, or markdown.
- Ensure the "find" strings are unique and precise so they match exactly once.
`,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Generation failed" }), {
      status: 500,
    });
  }
}