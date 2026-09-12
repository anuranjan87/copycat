import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";

import {
  getWebsiteContent,
  getEnquiries,
  usernameChecker,
  getVisitCount,
  getVisitChartData,
  getActiveVisitorsCount,
} from "@/lib/website-actions";

// ============================================================
// 1. CONFIGURATION
// ============================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 4;

const UNSPLASH_API_URL =
  "https://api.unsplash.com/search/photos";

// ============================================================
// 2. TYPES
// ============================================================

type ToolArgs = Record<string, unknown>;

type AgentRequestBody = {
  message?: unknown;
};

type WebsiteContent = {
  html: string;
  script: string;
  data: string;
};

type UnsplashPhoto = {
  id?: string;
  width?: number;
  height?: number;
  urls?: {
    regular?: string;
    small?: string;
    full?: string;
  };
  alt_description?: string | null;
  description?: string | null;
  user?: {
    name?: string;
    username?: string;
    links?: {
      html?: string;
    };
  };
  links?: {
    html?: string;
    download_location?: string;
  };
};

type UnsplashResponse = {
  total?: number;
  results?: UnsplashPhoto[];
};

// ============================================================
// 3. ENVIRONMENT VALIDATION
// ============================================================

function validateEnvironment() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  if (!process.env.UNSPLASH_ACCESS_KEY) {
    throw new Error("Missing UNSPLASH_ACCESS_KEY.");
  }
}

// ============================================================
// 4. VALIDATION HELPERS
// ============================================================

function requireString(
  value: unknown,
  field: string,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

function normalizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

// ============================================================
// 5. AUTHENTICATED WEBSITE USERNAME
// ============================================================

/**
 * Gets the website username linked to the currently
 * authenticated Clerk account.
 *
 * The username is never accepted from the request body.
 */
async function getAuthenticatedWebsiteUsername(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const linkedUsername = await usernameChecker(userId);

  if (
    typeof linkedUsername !== "string" ||
    !linkedUsername.trim()
  ) {
    throw new Error(
      "No website username is linked to your Clerk account.",
    );
  }

  const websiteUsername = normalizeUsername(linkedUsername);

  if (!websiteUsername) {
    throw new Error(
      "The website username linked to your account is invalid.",
    );
  }

  return websiteUsername;
}

// ============================================================
// 6. TOOL DEFINITIONS
// ============================================================

const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_unsplash_images",
      description:
        "Search Unsplash for photos and return real image URLs. Use this only when the user requests website images.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What type of image to search for.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_enquiries",
      description:
        "Retrieve enquiries submitted through the authenticated user's website. Use this when the user asks about messages, enquiries, contact form submissions, leads, or audience messages. The server automatically selects the authenticated user's website.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_visit_count",
      description:
        "Get the total number of recorded visits for the authenticated user's website. Use this when the user asks for visitor count, total visitors, website traffic, or visit count.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_visit_chart_data",
      description:
        "Get daily visit data for the authenticated user's website. Use this when the user asks about traffic trends, daily visits, monthly traffic, or visitor statistics over time.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_active_visitors_count",
      description:
        "Get the estimated number of unique active visitors to the authenticated user's website during the last five minutes.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
  type: "function" as const,
  function: {
    name: "get_7winks_tutorial",
    description:
      "Retrieve official 7winks documentation and tutorial content. Use this whenever the user asks how to use 7winks, how to configure a feature, how an agent works, how to create a website, how to use analytics, how to submit enquiries, or any other 7winks tutorial-related question.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "The 7winks feature, workflow, or tutorial topic the user wants help with.",
        },
      },
      required: ["topic"],
      additionalProperties: false,
    },
  },
},
];
// ============================================================
// 7. SYSTEM PROMPT
// ============================================================

function createSystemPrompt(
  websiteUsername: string,
  websiteAvailable: boolean,
) {
  return `
You are the 7winks User Agent.

The authenticated user's website username is:
${websiteUsername}

This username was resolved securely from the authenticated Clerk
user ID on the server. It is not the Clerk username.

Website availability:
${
  websiteAvailable
    ? "The user's website data was successfully loaded."
    : "No website data was found."
}

Your responsibilities:

1. Answer the user's request clearly.
2. When the user asks about their website, use the supplied website data.
3. Give constructive comments about the website's design,
   content, usability, responsiveness, accessibility, SEO,
   performance, and calls to action when relevant.
4. Do not claim that you visited or tested the live website.
5. Base website comments only on the supplied website code.
6. If website data is unavailable, explain that no website
   content was found for the authenticated user's website.
7. Do not retrieve or use a Clerk username.
8. Do not ask the user for a username.
9. Do not invent visitor information, analytics, website
   content, enquiry records, or image URLs.
10. Use the Unsplash tool only when the user requests images
    or image URLs.
11. Be concise, practical, and helpful.

ENQUIRY TOOL:

- When the user asks about enquiries, messages, contact form
  submissions, or leads, call get_user_enquiries.
- The tool automatically uses the authenticated user's website.
- Never request a different username.
- Answer using only the enquiry records returned by the tool.
- Do not invent enquiry records.
- Do not claim an enquiry exists unless it was returned by the tool.

ANALYTICS TOOLS:

- When the user asks for total visitors, visitor count,
  website traffic, or total visits, call get_visit_count.
- When the user asks about traffic trends, daily visits,
  monthly visits, or traffic over time, call get_visit_chart_data.
- When the user asks how many visitors are currently active,
  call get_active_visitors_count.
- Active visitors represent an estimate based on distinct IP
  addresses during the last five minutes.
- Never invent analytics values.
- Never ask the user for a username.
- The server automatically uses the authenticated user's website.

WEBSITE REVIEW:

If the user asks for a website review, provide:

- Overall impression
- Strengths
- Problems or risks
- Recommended improvements
- A short final comment about the site
`;
}

// ============================================================
// 8. WEBSITE REVIEW PROMPT
// ============================================================

function createWebsiteReviewPrompt(
  username: string,
  website: WebsiteContent,
): string {
  return `
Review the website belonging to "${username}".

The website content is provided below.

Analyse only what can be determined from the supplied HTML,
JavaScript, and data.

Provide a helpful comment covering:

1. Overall impression
2. Website purpose and target audience
3. Visual design and layout
4. User experience and navigation
5. Mobile responsiveness
6. Content clarity
7. Accessibility
8. Performance concerns
9. SEO opportunities
10. Calls to action and conversion opportunities
11. Strengths
12. Most important improvements

Rules:

- Do not claim to have opened or tested the live website.
- Do not invent missing sections or features.
- Clearly state when something cannot be determined from the code.
- Mention actual sections, text, components, or patterns when available.
- Be constructive and specific.
- Return a polished review suitable for showing directly to the user.
- Use headings and bullet points.
- Do not use code fences.

HTML:
${website.html}

SCRIPT:
${website.script}

DATA:
${website.data}
`;
}

// ============================================================
// 9. WEBSITE FETCHING
// ============================================================

async function fetchUserWebsite(
  websiteUsername: string,
): Promise<WebsiteContent | null> {
  const safeUsername = normalizeUsername(websiteUsername);

  if (!safeUsername) {
    return null;
  }

  return getWebsiteContent(safeUsername);
}

// ============================================================
// 10. UNSPLASH IMPLEMENTATION
// ============================================================

async function searchUnsplashImages(query: string) {
  const search = requireString(query, "Image search query");

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error("Missing UNSPLASH_ACCESS_KEY.");
  }

  const url = new URL(UNSPLASH_API_URL);

  url.searchParams.set("query", search);
  url.searchParams.set("per_page", "6");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  console.log("[Unsplash] Searching for:", search);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");

    throw new Error(
      `Unsplash API error ${response.status}${
        details ? `: ${details.slice(0, 300)}` : ""
      }`,
    );
  }

  const data = (await response.json()) as UnsplashResponse;

  const results = Array.isArray(data.results)
    ? data.results.map((photo) => ({
        id: photo.id ?? "",
        imageUrl:
          photo.urls?.regular ||
          photo.urls?.small ||
          "",
        imageUrlSmall: photo.urls?.small || "",
        imageUrlFull: photo.urls?.full || "",
        altDescription:
          photo.alt_description ||
          photo.description ||
          search,
        width: photo.width ?? null,
        height: photo.height ?? null,
        photographer:
          photo.user?.name || "Unknown photographer",
        photographerUsername:
          photo.user?.username || "",
        photographerUrl:
          photo.user?.links?.html || "",
        unsplashUrl:
          photo.links?.html || "",
        downloadLocation:
          photo.links?.download_location || "",
      }))
    : [];

  console.log("[Unsplash] Results found:", results.length);

  return {
    query: search,
    total: data.total ?? 0,
    results,
  };
}

// ============================================================
// 11. ENQUIRY IMPLEMENTATION
// ============================================================

async function getUserEnquiries(
  websiteUsername: string,
) {
  const enquiries = await getEnquiries(websiteUsername);

  return {
    total: enquiries.length,
    enquiries: enquiries.map((enquiry: any) => ({
      id: enquiry.id,
      name: enquiry.name ?? null,
      email:
        enquiry.email ??
        enquiry.Email ??
        null,
      created_at: enquiry.created_at,
      message:
        enquiry.message ??
        enquiry.Message ??
        null,
      fields: enquiry,
    })),
  };
}

// ============================================================
// 12. TOOL EXECUTOR
// ============================================================

async function executeTool(
  name: string,
  args: ToolArgs,
  websiteUsername: string,
  requestUrl: string,
) {
  console.log("[Tool] Executing:", {
    name,
    websiteUsername,
    args,
  });

  switch (name) {
    case "search_unsplash_images": {
      const query = requireString(args.query, "query");

      return searchUnsplashImages(query);
    }

    case "get_user_enquiries": {
      return getUserEnquiries(websiteUsername);
    }

     case "get_visit_count": {
      const totalVisits = await getVisitCount(
        websiteUsername,
      );

      return {
        username: websiteUsername,
        totalVisits,
      };
    }

    case "get_visit_chart_data": {
      const dailyVisits = await getVisitChartData(
        websiteUsername,
      );

      return {
        username: websiteUsername,
        dailyVisits,
      };
    }

    case "get_active_visitors_count": {
      const windowMinutes = 5;

      const activeVisitors =
        await getActiveVisitorsCount(
          websiteUsername,
          windowMinutes,
        );

      return {
        username: websiteUsername,
        activeVisitors,
        windowMinutes,
        note:
          "This is an estimate based on distinct IP addresses with visits during the selected time window.",
      };
    }

      case "get_7winks_tutorial": {
      const topic = requireString(
        args.topic,
        "topic",
      );

      return get7winksTutorial(
        topic,
        requestUrl,
      );
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
   
  }


  async function get7winksTutorial(
  topic: string,
  requestUrl: string,
) {
  const searchTopic = requireString(
    topic,
    "Tutorial topic",
  );

  const requestOrigin = new URL(requestUrl).origin;

  const pagePaths = [
    {
      title: "7winks Documentation",
      path: "/doc",
    },
    {
      title: "7winks Tutorial",
      path: "/tutorial",
    },
  ];

  const pages = await Promise.all(
    pagePaths.map(async (page) => {
      const pageUrl = new URL(
        page.path,
        requestOrigin,
      ).toString();

      const response = await fetch(pageUrl, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load ${page.title}: ${response.status}`,
        );
      }

      const html = await response.text();

      return {
        title: page.title,
        path: page.path,
        url: pageUrl,
        html,
      };
    }),
  );

  return {
    topic: searchTopic,
    sources: pages,
    instruction:
      "Use only the official 7winks documentation and tutorial content returned here. If the topic is not covered, clearly explain that it was not found in the available documentation.",
  };
}

// ============================================================
// 13. API ROUTE
// ============================================================

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  console.log("[Agent] Request started:", requestId);

  try {
    validateEnvironment();

    // --------------------------------------------------------
    // A. AUTHENTICATION
    // --------------------------------------------------------

    const { userId } = await auth();

    console.log("[Agent] Authentication status:", {
      requestId,
      authenticated: Boolean(userId),
    });

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        {
          status: 401,
        },
      );
    }

    // --------------------------------------------------------
    // B. RESOLVE WEBSITE USERNAME FROM CLERK USER ID
    // --------------------------------------------------------

    const websiteUsername =
      await getAuthenticatedWebsiteUsername();

    console.log("[Agent] Verified website username:", {
      requestId,
      websiteUsername,
    });

    // --------------------------------------------------------
    // C. READ REQUEST BODY
    // --------------------------------------------------------

    const body = (await request.json()) as AgentRequestBody;

    const userMessage =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!userMessage) {
      return Response.json(
        {
          success: false,
          error: "Message is required.",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // D. FETCH WEBSITE DATA
    // --------------------------------------------------------

    const website =
      await fetchUserWebsite(websiteUsername);

    const websiteAvailable = Boolean(website);

    console.log("[Agent] Website lookup:", {
      requestId,
      websiteUsername,
      websiteAvailable,
    });

    // --------------------------------------------------------
    // E. CREATE CONVERSATION
    // --------------------------------------------------------

    const messages: any[] = [
      {
        role: "system",
        content: createSystemPrompt(
          websiteUsername,
          websiteAvailable,
        ),
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    if (website) {
      messages.push({
        role: "system",
        content: `
The authenticated user's website data is:

HTML:
${website.html}

SCRIPT:
${website.script}

DATA:
${website.data}
`,
      });
    }

    // --------------------------------------------------------
    // F. WEBSITE REVIEW SHORTCUT
    // --------------------------------------------------------

    const reviewRequestPattern =
      /\b(review|analyse|analyze|comment|feedback|audit|impression|what do you think)\b/i;

    const websiteRequestPattern =
      /\b(website|site|webpage|page|homepage|landing page)\b/i;

    const isWebsiteReviewRequest =
      reviewRequestPattern.test(userMessage) &&
      websiteRequestPattern.test(userMessage);

    if (isWebsiteReviewRequest) {
      if (!website) {
        return Response.json({
          success: true,
          username: websiteUsername,
          answer:
            "I could not find website data for your authenticated website.",
          websiteReview: null,
        });
      }

      const reviewResponse =
        await openai.responses.create({
          model: MODEL,
          input: createWebsiteReviewPrompt(
            websiteUsername,
            website,
          ),
        });

      const review =
        reviewResponse.output_text?.trim() ||
        "I could not generate a website review.";

      return Response.json({
        success: true,
        username: websiteUsername,
        answer: review,
        websiteReview: review,
      });
    }

    // --------------------------------------------------------
    // G. TOOL-CALLING LOOP
    // --------------------------------------------------------

    for (
      let round = 0;
      round < MAX_TOOL_ROUNDS;
      round++
    ) {
      console.log("[Agent] Tool round:", {
        requestId,
        round: round + 1,
      });

      const response =
        await openai.chat.completions.create({
          model: MODEL,
          messages,
          tools,
          tool_choice: "auto",
        });

      const assistantMessage =
        response.choices?.[0]?.message;

      if (!assistantMessage) {
        throw new Error(
          "OpenAI returned no assistant message.",
        );
      }

      // ------------------------------------------------------
      // H. FINAL RESPONSE
      // ------------------------------------------------------

      if (!assistantMessage.tool_calls?.length) {
        const answer =
          assistantMessage.content?.trim() ||
          "I could not produce an answer.";

        console.log("[Agent] Final answer generated:", {
          requestId,
          websiteUsername,
          answerLength: answer.length,
        });

        return Response.json({
          success: true,
          answer,
          username: websiteUsername,
          websiteAvailable,
        });
      }

      messages.push(assistantMessage);

      // ------------------------------------------------------
      // I. EXECUTE TOOL CALLS
      // ------------------------------------------------------

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") {
          continue;
        }

        const toolName = toolCall.function.name;

        let args: ToolArgs = {};

        try {
          args = JSON.parse(
            toolCall.function.arguments || "{}",
          ) as ToolArgs;
        } catch {
          console.error("[Tool] Invalid arguments:", {
            requestId,
            toolName,
            rawArguments:
              toolCall.function.arguments,
          });

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: "Invalid tool arguments.",
            }),
          });

          continue;
        }

        try {
          const result = await executeTool(
            toolName,
            args,
            websiteUsername,
             request.url,
          );

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });

          console.log("[Tool] Completed:", {
            requestId,
            toolName,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Tool execution failed.";

          console.error("[Tool] Failed:", {
            requestId,
            toolName,
            error: errorMessage,
          });

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: errorMessage,
            }),
          });
        }
      }
    }

    // --------------------------------------------------------
    // J. TOOL LIMIT REACHED
    // --------------------------------------------------------

    console.warn("[Agent] Tool-calling limit reached:", {
      requestId,
      maxToolRounds: MAX_TOOL_ROUNDS,
    });

    return Response.json({
      success: true,
      username: websiteUsername,
      websiteAvailable,
      answer:
        "The agent reached its tool-calling limit. Please try a more specific question.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "The agent failed.";

    console.error("[Agent] Request failed:", {
      requestId,
      error: errorMessage,
    });

    const status =
      errorMessage === "You must be signed in."
        ? 401
        : errorMessage.includes(
              "No website username is linked",
            )
          ? 403
          : 500;

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status,
      },
    );
  }
}