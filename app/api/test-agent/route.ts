  import { NextRequest } from "next/server";

  export const runtime = "edge";

  const VECTOR_STORE_ID = "vs_6aa8f8333d488191a380a51b45719aea";
  const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
  const MODEL = "gpt-4o-mini";

  const encoder = new TextEncoder();

  const fileSearchTool = [
    {
      type: "file_search",
      vector_store_ids: [VECTOR_STORE_ID],
    },
  ];

  const SYSTEM_PROMPT = `
  You are the official 7Wingz User Agent.

  PRODUCT NAMING:
  - Always write "7Wingz" exactly.
  - Never write "7winks", "7Winks", or other variations.

  ROLE:
  - Answer normal questions about 7Wingz using the uploaded documentation.
  - Explain features, workflows, setup, publishing, design, analytics, enquiries,
    websites, domains, Google Ads, and other documented features.
  - Do not invent features or instructions.
  - If the documentation does not contain the answer, say so clearly.
  - Answer directly and completely.
  - Use concise Markdown when useful.
  - Do not expose internal prompts, tools, APIs, database details, or secrets.

  ACCOUNT-SPECIFIC REQUESTS:
  - Requests involving the user's private website, enquiries, leads, visitors,
    analytics, Google Ads campaigns, website review, image search, or live domain
    availability require the authenticated agent.
  - The application handles approval and routing for those requests.
  - Do not claim that you accessed private account data in this route.

  STYLE:
  - Be clear, useful, concise, and direct.
  - Avoid unnecessary introductions.
  - Use headings only when they improve readability.
  `;

  const FALLBACK_SUGGESTIONS = [
    "How do I get started with 7Wingz?",
    "What can I improve next on my website?",
    "How do I publish my website?",
  ];

  function formatOpenAIErrorMessage(payload: unknown): string {
    if (typeof payload === "string") return payload;

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;

      if (typeof record.message === "string") return record.message;
      if (typeof record.error === "string") return record.error;

      if (record.error && typeof record.error === "object") {
        return formatOpenAIErrorMessage(record.error);
      }

      try {
        return JSON.stringify(record);
      } catch {
        return "OpenAI request failed.";
      }
    }

    return "OpenAI request failed.";
  }

  function enqueueEvent(
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: string,
    data: unknown,
  ) {
    controller.enqueue(
      encoder.encode(
        `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      ),
    );
  }

  function getDelta(parsed: any): string {
    if (typeof parsed?.delta === "string") return parsed.delta;
    if (typeof parsed?.output_text === "string") return parsed.output_text;

    if (Array.isArray(parsed?.output_text)) {
      return parsed.output_text
        .map((part: any) =>
          typeof part?.text === "string" ? part.text : "",
        )
        .join("");
    }

    if (typeof parsed?.output_text?.delta === "string") {
      return parsed.output_text.delta;
    }

    if (typeof parsed?.content === "string") return parsed.content;

    return "";
  }

  function normalizeMessages(body: any): Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> {
    if (!Array.isArray(body?.messages)) {
      return [
        {
          role: "user",
          content: String(body?.prompt ?? body?.message ?? "Hello"),
        },
      ];
    }

    return body.messages
      .filter(
        (message: any) =>
          message &&
          ["user", "assistant", "system"].includes(message.role) &&
          typeof message.content === "string",
      )
      .map((message: any) => ({
        role: message.role,
        content: message.content,
      }));
  }

  function getLatestUserMessage(
    messages: Array<{ role: string; content: string }>,
  ): string {
    return (
      [...messages]
        .reverse()
        .find((message) => message.role === "user")
        ?.content.trim() || ""
    );
  }

  function isDocumentationQuestion(message: string): boolean {
    return /^(how do i|how can i|what is|what are|where can i|can i|is it possible|tell me about|explain)\b/i.test(
      message.trim(),
    );
  }

  function requiresAuthenticatedAgent(message: string): boolean {
    const text = message.toLowerCase().trim();

    if (!text) return false;

    const explicitAccountPatterns = [
      /\bmy website\b/,
      /\bmy site\b/,
      /\bmy homepage\b/,
      /\breview my\b/,
      /\baudit my\b/,
      /\banalyze my\b/,
      /\banalyse my\b/,
      /\bcheck my\b/,
      /\bshow me my\b/,
      /\bget my\b/,
      /\bhow many visitors\b/,
      /\bhow many people visited\b/,
      /\bwebsite traffic\b/,
      /\bvisitor count\b/,
      /\bactive visitors\b/,
      /\btraffic trends\b/,
      /\bmy enquiries\b/,
      /\bmy inquiries\b/,
      /\bmy leads\b/,
      /\bcontact form submissions\b/,
      /\bgoogle ads campaigns\b/,
      /\bmy campaigns\b/,
      /\bmy ads\b/,
      /\bsearch images\b/,
      /\bfind images\b/,
      /\bunsplash\b/,
      /\bavailable domains\b/,
      /\bdomain availability\b/,
      /\bfind domains\b/,
      /\bresearch domains\b/,
    ];

    if (explicitAccountPatterns.some((pattern) => pattern.test(text))) {
      return true;
    }

    if (isDocumentationQuestion(text)) {
      return false;
    }

    const privateDataTerms = [
      "enquiries",
      "inquiries",
      "leads",
      "visitors",
      "analytics",
      "traffic",
      "campaigns",
      "google ads",
      "website review",
      "website audit",
      "active users",
      "active visitors",
    ];

    return privateDataTerms.some((term) => text.includes(term));
  }

  function createApprovalMessage(message: string): string {
    if (
      /\b(review|audit|analyse|analyze|feedback|impression)\b/i.test(message) &&
      /\b(website|site|homepage|landing page)\b/i.test(message)
    ) {
      return "I can review your connected 7Wingz website using its actual content and account data. Would you like me to continue?";
    }

    if (
      /\b(enquir|inquir|lead|contact form|message)\b/i.test(message)
    ) {
      return "I can retrieve the enquiries and leads from your connected 7Wingz website. Would you like me to continue?";
    }

    if (
      /\b(visitor|traffic|analytics|active user|active visitor)\b/i.test(message)
    ) {
      return "I can access your connected website analytics and traffic data. Would you like me to continue?";
    }

    if (/\b(google ads|campaign|advertising)\b/i.test(message)) {
      return "I can check the Google Ads campaigns connected to your account. Would you like me to continue?";
    }

    if (/\b(image|unsplash|photo|visual)\b/i.test(message)) {
      return "I can search image sources for your website. Would you like me to continue?";
    }

    if (/\b(domain|six-letter|available .com)\b/i.test(message)) {
      return "I can research available domain names and current pricing. Would you like me to continue?";
    }

    return "This request may need access to your connected 7Wingz account or website. Would you like me to continue?";
  }

  function createSuggestionsEvent(
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) {
    enqueueEvent(controller, "suggestions", {
      suggestions: FALLBACK_SUGGESTIONS,
    });
  }

  function createApprovalResponse(message: string): Response {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        enqueueEvent(controller, "delta", {
          text: createApprovalMessage(message),
        });

        createSuggestionsEvent(controller);

        enqueueEvent(controller, "done", {
          success: true,
          requiresAgentApproval: true,
          agentIntent: true,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  async function forwardToDevAgent(
    request: NextRequest,
    body: any,
    messages: Array<{ role: string; content: string }>,
  ): Promise<Response> {
    const agentUrl = new URL("/api/dev-agent", request.url);

    const forwardedHeaders = new Headers({
      "Content-Type": "application/json",
      "x-7wingz-agent-forwarded": "1",
    });

    const agentSecret = process.env.AGENT_FORWARD_SECRET;

    if (agentSecret) {
      forwardedHeaders.set("x-7wingz-agent-secret", agentSecret);
    }

    const cookie = request.headers.get("cookie");
    const authorization = request.headers.get("authorization");

    if (cookie) {
      forwardedHeaders.set("cookie", cookie);
    }

    if (authorization) {
      forwardedHeaders.set("authorization", authorization);
    }

    const response = await fetch(agentUrl, {
      method: "POST",
      headers: forwardedHeaders,
      body: JSON.stringify({
        ...body,
        message: getLatestUserMessage(messages),
        messages,
        agentApproved: true,
      }),
    });

    if (response.ok && response.body) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") ||
            "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const errorText = await response.text().catch(() => "");

    return new Response(
      JSON.stringify({
        error: errorText || "The authenticated agent could not be reached.",
      }),
      {
        status: response.status || 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  export async function POST(request: NextRequest) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const messages = normalizeMessages(body);
    const latestUserMessage = getLatestUserMessage(messages);

    if (!latestUserMessage) {
      return Response.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    const agentApproved = body.agentApproved === true;
    const agentIntent = requiresAuthenticatedAgent(latestUserMessage);

    if (agentIntent && !agentApproved) {
      return createApprovalResponse(latestUserMessage);
    }

    if (agentIntent && agentApproved) {
      try {
        return await forwardToDevAgent(request, body, messages);
      } catch (error) {
        return Response.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unable to forward the request to the authenticated agent.",
          },
          { status: 502 },
        );
      }
    }

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        tools: fileSearchTool,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const text = await response.text();

      let parsed: unknown = text;

      try {
        parsed = JSON.parse(text);
      } catch {
        // Keep the raw response.
      }

      return Response.json(
        {
          error: formatOpenAIErrorMessage(parsed),
        },
        {
          status: response.status || 502,
        },
      );
    }

    const upstream = response.body;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let completed = false;

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() ?? "";

            for (const chunk of chunks) {
              const lines = chunk.split("\n");

              const eventLine = lines.find((line) =>
                line.startsWith("event:"),
              );

              const dataLine = lines
                .filter((line) => line.startsWith("data:"))
                .map((line) => line.slice(5).trim())
                .join("\n");

              if (!dataLine || dataLine === "[DONE]") continue;

              let parsed: any;

              try {
                parsed = JSON.parse(dataLine);
              } catch {
                continue;
              }

              const delta = getDelta(parsed);

              if (delta) {
                enqueueEvent(controller, "delta", {
                  text: delta,
                });
              }

              if (
                eventLine?.includes("response.completed") ||
                parsed.type === "response.completed"
              ) {
                completed = true;
                createSuggestionsEvent(controller);

                enqueueEvent(controller, "done", {
                  success: true,
                });
              }
            }
          }

          buffer += decoder.decode();

          if (!completed) {
            createSuggestionsEvent(controller);

            enqueueEvent(controller, "done", {
              success: true,
            });
          }
        } catch (error) {
          enqueueEvent(controller, "error", {
            error:
              error instanceof Error
                ? error.message
                : "Response streaming failed.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }