import OpenAI from "openai";
import {
  getWebsiteContent,
  getSubscription,
  getTemplateById,
} from "@/lib/website-actions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   ENVIRONMENT
============================================================ */

function validateEnvironment() {
  const missing: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    missing.push("OPENAI_API_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}`
    );
  }
}

/* ============================================================
   TUTORIAL KNOWLEDGE BASE (static – replace with DB later)
============================================================ */

const TUTORIALS = [
  {
    id: "getting-started",
    title: "Getting Started with 7wingz",
    summary: "Create your first website from a template and publish it live.",
    content: `
# Getting Started

1. **Sign up** – create your account.
2. **Choose a template** – pick a design that fits your brand.
3. **Customise** – edit the HTML, CSS, and content with our online editor.
4. **Publish** – click "Publish" and your site goes live instantly.
5. **Share** – get your unique URL and share it with the world.
    `,
    tags: ["beginner", "templates", "publishing"],
  },
  {
    id: "ai-generation",
    title: "Using AI to Generate Websites",
    summary: "Describe what you need and let the AI build a site for you.",
    content: `
# AI Website Generation

1. Open the **AI Generator** from the dashboard.
2. Describe your website (e.g., "a portfolio for a photographer").
3. Optionally provide any existing code to improve upon.
4. Click **Generate** – the AI will produce a complete HTML page.
5. Review and edit the result, then publish.
    `,
    tags: ["ai", "generation", "advanced"],
  },
  {
    id: "analytics",
    title: "Tracking Visitor Analytics",
    summary: "Understand your audience with built‑in visitor statistics.",
    content: `
# Visitor Analytics

- **Live visitors** – see who is on your site right now.
- **Daily visits** – chart of visits over time.
- **Total visits** – overall popularity.
- All data is automatically collected – no setup required.
    `,
    tags: ["analytics", "stats"],
  },
  {
    id: "subscription",
    title: "Understanding Your Subscription",
    summary: "Free vs Premium – credits, limits, and benefits.",
    content: `
# Subscription Plans

- **Free** – 5 AI generations per day, 1 website, basic templates.
- **Premium** – unlimited AI, 10 websites, all templates, email credits, Google Ads credits.
- **Upgrade** – go to your account settings to upgrade.

Your current usage is shown on the dashboard.
    `,
    tags: ["billing", "premium"],
  },
];

const PLATFORM_FEATURES = [
  {
    name: "AI Website Generator",
    description:
      "Generate complete HTML websites from a text description using OpenAI. Perfect for rapid prototyping and idea testing.",
  },
  {
    name: "Template Library",
    description:
      "Start with professionally designed templates for portfolios, business, e‑commerce, and more. Customise every pixel.",
  },
  {
    name: "Live Website Editor",
    description:
      "Edit HTML, CSS, and content directly in your browser. See changes instantly with real‑time preview.",
  },
  {
    name: "Visitor Analytics",
    description:
      "Track page views, unique visitors, and active sessions. Understand your audience behaviour.",
  },
  {
    name: "Email Integration",
    description:
      "Receive emails from your website through Resend integration. Manage enquiries directly from your dashboard.",
  },
  {
    name: "Image Upload & Management",
    description:
      "Upload images to Vercel Blob and use them anywhere in your site. Integrates with Unsplash for free stock photos.",
  },
  {
    name: "Subscription & Billing",
    description:
      "Manage your plan, view usage, and upgrade to Premium for extra features and credits.",
  },
];

/* ============================================================
   TOOL FUNCTIONS
============================================================ */

// 1. Get user's website content
async function getUserWebsite(username: string) {
  if (!username) throw new Error("Username is required.");
  const result = await getWebsiteContent(username);
  if (!result) {
    return { error: "No website found for this username." };
  }
  return result;
}

// 2. Get user subscription info
async function getUserSubscription(userId: string) {
  if (!userId) throw new Error("User ID is required.");
  const sub = await getSubscription(userId);
  if (!sub) {
    return { error: "No subscription record found for this user." };
  }
  return sub;
}

// 3. Get user AI usage for today (mock – replace with real implementation)
async function getUserUsage(userId: string) {
  // In a real implementation, import your usage-tracking function
  // and return actual data.
  return {
    used: 3,
    limit: 5,
    isPremium: false,
    message: "Today's AI usage: 3 out of 5 generations used.",
  };
}

// 4. Get template details (fix: parse templateId to number)
async function getTemplateDetails(templateId: string) {
  if (!templateId) throw new Error("Template ID is required.");
  const id = Number(templateId);
  if (isNaN(id)) throw new Error("Template ID must be a number.");
  const template = await getTemplateById(id);
  if (!template || !template.success) {
    return { error: template?.error || "Template not found." };
  }
  return template;
}

// 5. List all tutorials
async function listTutorials() {
  return TUTORIALS.map(({ id, title, summary, tags }) => ({
    id,
    title,
    summary,
    tags,
  }));
}

// 6. Get full tutorial content by ID
async function getTutorialContent(tutorialId: string) {
  const tutorial = TUTORIALS.find((t) => t.id === tutorialId);
  if (!tutorial) {
    return { error: "Tutorial not found." };
  }
  return tutorial;
}

// 7. Search tutorials by keyword
async function searchTutorials(query: string) {
  if (!query) return { results: [] };
  const lowerQuery = query.toLowerCase();
  const results = TUTORIALS.filter(
    (t) =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.content.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.includes(lowerQuery))
  );
  return {
    query,
    count: results.length,
    results: results.map(({ id, title, summary }) => ({ id, title, summary })),
  };
}

// 8. List platform features
async function listPlatformFeatures() {
  return PLATFORM_FEATURES;
}

/* ============================================================
   OPENAI TOOLS DEFINITION
============================================================ */

const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_user_website",
      description:
        "Retrieve the current website content and data for a given username.",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "The username of the website owner.",
          },
        },
        required: ["username"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_subscription",
      description:
        "Get subscription details, including plan, expiry, and remaining credits for a user.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "The unique user ID.",
          },
        },
        required: ["userId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_usage",
      description:
        "Return the AI generation usage for today, including used count and daily limit.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "The unique user ID.",
          },
        },
        required: ["userId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_template_details",
      description:
        "Fetch details of a specific template by its ID (name, description, preview image).",
      parameters: {
        type: "object",
        properties: {
          templateId: {
            type: "string",
            description: "The template ID (numeric).",
          },
        },
        required: ["templateId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_tutorials",
      description:
        "List all available tutorials with their titles, summaries, and tags.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_tutorial_content",
      description:
        "Retrieve the full content of a specific tutorial by its ID.",
      parameters: {
        type: "object",
        properties: {
          tutorialId: {
            type: "string",
            description: "The tutorial ID.",
          },
        },
        required: ["tutorialId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_tutorials",
      description:
        "Search tutorials by title, content, or tags. Useful when the user asks about a specific topic.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term or phrase.",
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
      name: "list_platform_features",
      description:
        "List all key features of the 7wingz platform with brief descriptions.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];

/* ============================================================
   SYSTEM PROMPT (Customer Success Agent)
============================================================ */

const SYSTEM_PROMPT = `
You are the 7wingz Customer Success Agent.

Your role is to help users get the most out of the 7wingz platform.
You are friendly, clear, and supportive.

============================================================
CAPABILITIES
============================================================

You have access to the following tools:

- get_user_website – view a user's website content and data.
- get_user_subscription – check subscription plan, expiry, and credits.
- get_user_usage – see today's AI usage.
- get_template_details – get template info.
- list_tutorials – show all available tutorials.
- get_tutorial_content – read a specific tutorial step‑by‑step.
- search_tutorials – find tutorials on a topic.
- list_platform_features – describe all platform features.

============================================================
BEHAVIOUR
============================================================

- Always be helpful, concise, and encouraging.
- When a user asks about a feature, first check if a tutorial exists.
- If the user asks for help with their own website, use get_user_website to understand their current setup.
- If the user asks about limits or credits, use get_user_subscription and get_user_usage.
- Always provide actionable steps.
- If you don't have enough information, ask clarifying questions.

============================================================
RULES
============================================================

- You are READ‑ONLY. You never modify any data.
- You never reveal API keys or other secrets.
- You may suggest code changes, but you cannot implement them.
- You must eventually answer the user's question – don't keep investigating forever.

============================================================
ANSWER FORMAT
============================================================

When providing guidance, structure your response as:

1. **Overview** – what the user wants to achieve.
2. **Steps** – numbered instructions.
3. **Resources** – link to relevant tutorials or features.
4. **Next steps** – what the user can do next.

Be warm and approachable, like a friendly support representative.
`;

/* ============================================================
   TOOL EXECUTION
============================================================ */

async function executeTool(name: string, args: any) {
  switch (name) {
    case "get_user_website":
      return await getUserWebsite(String(args?.username || ""));
    case "get_user_subscription":
      return await getUserSubscription(String(args?.userId || ""));
    case "get_user_usage":
      return await getUserUsage(String(args?.userId || ""));
    case "get_template_details":
      return await getTemplateDetails(String(args?.templateId || ""));
    case "list_tutorials":
      return await listTutorials();
    case "get_tutorial_content":
      return await getTutorialContent(String(args?.tutorialId || ""));
    case "search_tutorials":
      return await searchTutorials(String(args?.query || ""));
    case "list_platform_features":
      return await listPlatformFeatures();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/* ============================================================
   LIMIT LARGE TOOL RESPONSES
============================================================ */

function limitToolResult(result: any) {
  const MAX_CHARS = 50000;
  const serialized = JSON.stringify(result);
  if (serialized.length <= MAX_CHARS) {
    return serialized;
  }
  return JSON.stringify({
    truncated: true,
    message:
      "The tool response was too large. Please use more specific queries.",
    data: serialized.slice(0, MAX_CHARS),
  });
}

/* ============================================================
   POST /api/dev-agent (Customer Success Agent)
============================================================ */

export async function POST(request: Request) {
  try {
    validateEnvironment();

    const body = await request.json();

    const userMessage = typeof body?.message === "string" ? body.message.trim() : "";
    const username = typeof body?.username === "string" ? body.username.trim() : undefined;
    const userId = typeof body?.userId === "string" ? body.userId.trim() : undefined;

    if (!userMessage) {
      return Response.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    console.log("\n==================================================");
    console.log("7wingz Customer Success Agent");
    console.log("User request:", userMessage);
    if (username) console.log("Username:", username);
    if (userId) console.log("User ID:", userId);
    console.log("==================================================\n");

    // Build initial messages
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ];

    if (username || userId) {
      const context = `The user${username ? ` has username "${username}"` : ""}${username && userId ? " and" : ""}${userId ? ` user ID "${userId}"` : ""}. Use this info when calling tools.`;
      messages.splice(1, 0, { role: "system", content: context });
    }

    const MAX_ITERATIONS = 8;
    const toolCallHistory = new Map<string, number>();

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      console.log(`\n===== INVESTIGATION ${iteration + 1}/${MAX_ITERATIONS} =====`);

      // Use a valid model name
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // changed from "gpt-5-mini"
        messages,
        tools,
        tool_choice: "auto",
      });

      const assistantMessage = response.choices?.[0]?.message;
      if (!assistantMessage) {
        throw new Error("OpenAI returned no assistant message.");
      }

      console.log("Assistant:", assistantMessage.content || "(tool request)");

      const toolCalls = assistantMessage.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        return Response.json({
          success: true,
          answer: assistantMessage.content || "No analysis was returned.",
        });
      }

      messages.push(assistantMessage);

      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") {
          console.warn("Unsupported tool call:", toolCall.type);
          continue;
        }

        const toolName = toolCall.function.name;
        const rawArguments = toolCall.function.arguments || "{}";
        let args: any = {};
        try {
          args = JSON.parse(rawArguments);
        } catch (error) {
          console.error("Could not parse tool arguments:", rawArguments);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: "Invalid JSON arguments supplied for this tool.",
            }),
          });
          continue;
        }

        // Repeated call detection
        const signature = `${toolName}:${JSON.stringify(args)}`;
        const previousCount = toolCallHistory.get(signature) || 0;
        const currentCount = previousCount + 1;
        toolCallHistory.set(signature, currentCount);

        console.log("Tool:", toolName);
        console.log("Arguments:", args);

        if (currentCount >= 3) {
          console.warn("Repeated tool call detected:", signature);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error:
                "This exact tool call has been attempted multiple times. Do not repeat it. Use the evidence already collected and provide the final answer.",
            }),
          });
          continue;
        }

        try {
          const result = await executeTool(toolName, args);
          const safeResult = limitToolResult(result);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: safeResult,
          });
          console.log("Tool completed:", toolName);
        } catch (error: any) {
          console.error(`Tool failed (${toolName}):`, error);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: error?.message || "Tool execution failed.",
            }),
          });
        }
      }
    }

    // Final answer pass (no tools)
    console.log("\n===== INVESTIGATION LIMIT REACHED =====");
    console.log("Requesting final answer without tools...");

    messages.push({
      role: "user",
      content: `
The investigation limit has been reached.

STOP investigating.
Do not request additional tools.
Answer the user's original question NOW using the information already collected.

Be specific, practical, and helpful.
If you identified a tutorial or feature, reference it clearly.
If you need more info that you don't have, suggest what the user should do next.

Do not claim that you changed anything.
`,
    });

    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // changed from "gpt-5-mini"
      messages,
    });

    const finalMessage = finalResponse.choices?.[0]?.message;
    const finalAnswer = finalMessage?.content?.trim();

    console.log("Final answer generated:", Boolean(finalAnswer));

    return Response.json({
      success: true,
      answer:
        finalAnswer ||
        "The agent completed its investigation but could not produce a final analysis.",
    });
  } catch (error: any) {
    console.error("\n===== 7WINGZ CUSTOMER SUCCESS AGENT ERROR =====");
    console.error(error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Customer success agent failed.",
      },
      { status: 500 }
    );
  }
}