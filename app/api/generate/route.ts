import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper for fetching images from Unsplash
async function searchUnsplash(query: string) {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8`,
    {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Unsplash API error: ${res.status}`);
  }

  const data = await res.json();

  return data.results.map((photo: any) => ({
    url: photo.urls.regular,
    thumb: photo.urls.small,
    alt: photo.alt_description || query,
    photographer: photo.user.name,
  }));
}

export async function POST(request: Request) {
  try {
    const { currentCode = "", prompt = "" } = await request.json();

    const systemPrompt = `
You are an expert HTML/Tailwind developer.
Your task is to generate a modern aesthetic Tailwind CSS HTML page.

Follow this format:
- First line: <!-- generated code -->
- Return ONLY raw HTML.
- Never wrap the response inside Markdown code fences.
- Never include explanations.
- Always use real images from the image_search tool or inline SVGs.

Use Tailwind CDN:
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

Image Policy:
- Call "image_search" at most once if HTML requires images.
- Never invent image URLs.
- Only use URLs returned by image_search.

Current code:
${currentCode}

User request:
${prompt}
`.trim();

    // ----------------------------------------------------------------
    // Step 1: Initial call to check for function calls
    // ----------------------------------------------------------------
    const initialResponse = await openai.responses.create({
      model: "gpt-5-nano",
      stream: false,
      tools: [
        {
          type: "function",
          name: "image_search",
          description: "Search Unsplash for stock photos when HTML needs images.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (e.g., 'modern architecture', 'team office')",
              },
            },
            required: ["query"],
            additionalProperties: false,
          },
          strict: true,
        },
      ],
      input: systemPrompt,
    });

    const toolCall = initialResponse.output?.find(
      (item: any) => item.type === "function_call"
    );

    // ----------------------------------------------------------------
    // Case A: No tool call -> return output directly
    // ----------------------------------------------------------------
    if (!toolCall) {
      const htmlText = initialResponse.output_text || "";
      return new Response(htmlText, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ----------------------------------------------------------------
    // Case B: Execute tool call & stream second turn
    // ----------------------------------------------------------------
    const rawArgs = (toolCall as any).arguments;
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
    
    let imageResults = [];
    try {
      imageResults = await searchUnsplash(args.query);
    } catch (err) {
      console.error("Unsplash fetch failed, continuing without images:", err);
    }

    const finalStream = await openai.responses.create({
      model: "gpt-5-nano",
      stream: true,
      previous_response_id: initialResponse.id,
      input: [
        {
          type: "function_call_output",
          call_id: (toolCall as any).call_id,
          output: JSON.stringify(imageResults),
        },
      ],
    });

    // Transform OpenAI async iterable to standard ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of finalStream) {
            if (chunk.type === "response.output_text.delta" && chunk.delta) {
              controller.enqueue(encoder.encode(chunk.delta));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate page" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}