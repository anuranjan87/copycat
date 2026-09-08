import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   ENVIRONMENT
============================================================ */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

const GITHUB_API = "https://api.github.com";

/* ============================================================
   VALIDATE ENVIRONMENT
============================================================ */

function validateEnvironment() {
  const missing: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    missing.push("OPENAI_API_KEY");
  }

  if (!GITHUB_TOKEN) {
    missing.push("GITHUB_TOKEN");
  }

  if (!GITHUB_OWNER) {
    missing.push("GITHUB_OWNER");
  }

  if (!GITHUB_REPO) {
    missing.push("GITHUB_REPO");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}`
    );
  }
}

/* ============================================================
   GITHUB REQUEST
============================================================ */

async function githubRequest(
  url: string,
  options: RequestInit = {}
) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  const response = await fetch(url, {
    ...options,

    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },

    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `GitHub API ${response.status}: ${text}`
    );
  }

  return response.json();
}

/* ============================================================
   LIST DIRECTORY
============================================================ */

async function listDirectory(
  directory: string = ""
) {
  if (!GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error(
      "GITHUB_OWNER or GITHUB_REPO is not configured."
    );
  }

  const cleanDirectory = directory
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  const encodedPath = cleanDirectory
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  let url =
    `${GITHUB_API}/repos/` +
    `${encodeURIComponent(GITHUB_OWNER)}/` +
    `${encodeURIComponent(GITHUB_REPO)}/contents`;

  if (encodedPath) {
    url += `/${encodedPath}`;
  }

  url += `?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  console.log(
    "GitHub list directory:",
    cleanDirectory || "/"
  );

  const data = await githubRequest(url);

  if (!Array.isArray(data)) {
    return {
      path: cleanDirectory,
      type: data.type,
      name: data.name,
    };
  }

  const ignoredDirectories = new Set([
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    ".netlify",
    "coverage",
  ]);

  return data
    .filter((item: any) => {
      if (
        item.type === "dir" &&
        ignoredDirectories.has(item.name)
      ) {
        return false;
      }

      return true;
    })
    .map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
    }));
}

/* ============================================================
   READ FILE
============================================================ */

async function readFile(filePath: string) {
  if (!GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error(
      "GITHUB_OWNER or GITHUB_REPO is not configured."
    );
  }

  const cleanPath = filePath
    .replace(/^\/+/, "")
    .trim();

  if (!cleanPath) {
    throw new Error("File path is required.");
  }

  const encodedPath = cleanPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  const url =
    `${GITHUB_API}/repos/` +
    `${encodeURIComponent(GITHUB_OWNER)}/` +
    `${encodeURIComponent(GITHUB_REPO)}/contents/` +
    `${encodedPath}` +
    `?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  console.log(
    "GitHub read file:",
    cleanPath
  );

  const data = await githubRequest(url);

  if (data.type !== "file") {
    throw new Error(
      `${cleanPath} is not a file.`
    );
  }

  if (data.encoding !== "base64") {
    throw new Error(
      `Unsupported encoding for ${cleanPath}.`
    );
  }

  const content = Buffer.from(
    String(data.content).replace(/\n/g, ""),
    "base64"
  ).toString("utf8");

  return {
    path: cleanPath,
    size: data.size,
    sha: data.sha,
    content,
  };
}

/* ============================================================
   SEARCH CODE
============================================================ */

async function searchCode(query: string) {
  if (!GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error(
      "GITHUB_OWNER or GITHUB_REPO is not configured."
    );
  }

  const cleanQuery = query?.trim();

  if (!cleanQuery) {
    throw new Error(
      "Search query is required."
    );
  }

  const searchQuery =
    `${cleanQuery} repo:${GITHUB_OWNER}/${GITHUB_REPO}`;

  const params = new URLSearchParams();

  params.set("q", searchQuery);
  params.set("per_page", "15");

  const url =
    `${GITHUB_API}/search/code?${params.toString()}`;

  console.log(
    "GitHub search:",
    cleanQuery
  );

  const data = await githubRequest(url);

  return {
    query: cleanQuery,

    total:
      typeof data.total_count === "number"
        ? data.total_count
        : 0,

    results: Array.isArray(data.items)
      ? data.items.map((item: any) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          url: item.html_url,
        }))
      : [],
  };
}

/* ============================================================
   OPENAI TOOLS
============================================================ */

const tools = [
  {
    type: "function" as const,

    function: {
      name: "search_code",

      description:
        "Search the GitHub repository for code, symbols, functions, imports, API routes, components, filenames, or text. Use focused searches to locate relevant code.",

      parameters: {
        type: "object",

        properties: {
          query: {
            type: "string",

            description:
              "Focused search term such as handleAIGenerate, /api/ai/generate, OpenAI, netlify, background, PremiumRequiredModal, or a filename.",
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
      name: "read_file",

      description:
        "Read a source file from the GitHub repository. Only read files that are relevant to the current investigation.",

      parameters: {
        type: "object",

        properties: {
          path: {
            type: "string",

            description:
              "Repository-relative path such as app/api/ai/generate/route.ts or components/CodeEditor.tsx.",
          },
        },

        required: ["path"],

        additionalProperties: false,
      },
    },
  },

  {
    type: "function" as const,

    function: {
      name: "list_directory",

      description:
        "List files and directories in a repository directory. Use this when repository structure needs to be discovered.",

      parameters: {
        type: "object",

        properties: {
          directory: {
            type: "string",

            description:
              "Repository-relative directory. Use an empty string for the repository root.",
          },
        },

        required: [],

        additionalProperties: false,
      },
    },
  },
];

/* ============================================================
   SYSTEM PROMPT
============================================================ */

const SYSTEM_PROMPT = `
You are the private 7wingz Developer Agent.

You are assisting the developer with understanding and debugging
their own software repository.

============================================================
READ ONLY
============================================================

You are STRICTLY READ-ONLY.

You may:

- search repository code
- list repository directories
- read repository files
- trace application flows
- identify bugs
- identify architectural problems
- explain errors
- suggest code changes
- provide replacement code
- provide diffs

You MUST NOT:

- modify files
- create files
- delete files
- rename files
- commit
- push
- create pull requests
- execute shell commands
- install packages
- deploy
- change GitHub repository contents

Never claim that you changed anything.

============================================================
INVESTIGATION RULES
============================================================

Use tools only when they are necessary.

DO NOT read the entire repository.

Start with focused searches.

Then read only the relevant files.

Once you have enough evidence, STOP calling tools and answer.

Do not repeatedly search the same query.

Do not repeatedly read the same file unless absolutely necessary.

Do not continue investigating merely because another tool call is possible.

Your goal is to reach a useful answer quickly.

============================================================
DEBUGGING METHOD
============================================================

For a bug, trace the actual execution path.

For example:

Frontend
↓
React component
↓
event handler
↓
fetch()
↓
API route
↓
server logic
↓
external service
↓
response
↓
frontend response handling

Look for:

- wrong API routes
- missing routes
- incorrect imports
- request body mismatches
- response format mismatches
- authentication problems
- environment variables
- server/client boundaries
- Netlify functions
- Netlify background functions
- OpenAI calls
- database calls
- runtime errors
- TypeScript problems
- deployment configuration
- redirects
- rewrites
- incorrect assumptions

Do not assume the developer's suspected cause is correct.

Verify it from the repository.

============================================================
IMPORTANT 7WINGZ DEBUGGING EXAMPLE
============================================================

If the developer asks:

"Why is AI generation from CodeEditor not working?"

Trace:

CodeEditor
→ handleAIGenerate
→ /api/ai/generate
→ route implementation
→ OpenAI call
→ Netlify configuration/functions if relevant
→ API response
→ CodeEditor response handling

Check both sides of the request.

For example:

Frontend sends:

{
  currentCode,
  prompt
}

Then verify that the API route actually expects those fields.

Also verify that the API returns the structure the frontend expects.

For example:

{
  success: true,
  html: "..."
}

If Netlify background functions are suspected, search the repository
for:

- background
- netlify
- functions
- /.netlify/
- scheduled functions
- background functions
- redirects
- netlify.toml

But do not assume they are involved until repository evidence shows it.

============================================================
ANSWER FORMAT
============================================================

For debugging questions, structure the final response as:

1. ROOT CAUSE
2. EVIDENCE
3. EXACT FILES INVOLVED
4. WHAT IS HAPPENING
5. FIX
6. OPTIONAL IMPROVEMENT

Clearly distinguish:

CONFIRMED
LIKELY
POSSIBLE
NOT VERIFIED

Never invent repository details.

============================================================
SECURITY
============================================================

Never expose:

- API keys
- GitHub tokens
- database passwords
- Clerk secrets
- environment variable secret values

You can mention that an environment variable is required,
but never reveal its value.

============================================================
IMPORTANT
============================================================

You MUST eventually answer the developer.

Never get stuck investigating forever.

If the available evidence is sufficient, answer immediately.
`;

/* ============================================================
   TOOL EXECUTION
============================================================ */

async function executeTool(
  name: string,
  args: any
) {
  switch (name) {
    case "search_code": {
      return await searchCode(
        String(args?.query || "")
      );
    }

    case "read_file": {
      return await readFile(
        String(args?.path || "")
      );
    }

    case "list_directory": {
      return await listDirectory(
        String(args?.directory || "")
      );
    }

    default:
      throw new Error(
        `Unknown tool: ${name}`
      );
  }
}

/* ============================================================
   LIMIT LARGE TOOL RESPONSES
============================================================ */

function limitToolResult(
  result: any
) {
  const MAX_CHARS = 50000;

  const serialized =
    JSON.stringify(result);

  if (
    serialized.length <= MAX_CHARS
  ) {
    return serialized;
  }

  return JSON.stringify({
    truncated: true,

    message:
      "The tool response was too large. Use focused searches or read specific files.",

    data:
      serialized.slice(
        0,
        MAX_CHARS
      ),
  });
}

/* ============================================================
   POST /api/dev-agent
============================================================ */

export async function POST(
  request: Request
) {
  try {
    validateEnvironment();

    const body =
      await request.json();

    const userMessage =
      typeof body?.message === "string"
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
        }
      );
    }

    console.log(
      "\n=================================================="
    );

    console.log(
      "7wingz Developer Agent"
    );

    console.log(
      "Repository:",
      `${GITHUB_OWNER}/${GITHUB_REPO}`
    );

    console.log(
      "Branch:",
      GITHUB_BRANCH
    );

    console.log(
      "Developer request:",
      userMessage
    );

    console.log(
      "==================================================\n"
    );

    /* ========================================================
       MESSAGE HISTORY
    ======================================================== */

    const messages: any[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },

      {
        role: "user",
        content: userMessage,
      },
    ];

    /* ========================================================
       INVESTIGATION LIMIT
    ======================================================== */

    const MAX_ITERATIONS = 8;

    /*
      Prevent the model from repeating exactly the same
      tool call over and over.
    */

    const toolCallHistory = new Map<
      string,
      number
    >();

    /* ========================================================
       AGENT LOOP
    ======================================================== */

    for (
      let iteration = 0;
      iteration < MAX_ITERATIONS;
      iteration++
    ) {
      console.log(
        `\n===== INVESTIGATION ${iteration + 1}/${MAX_ITERATIONS} =====`
      );

      const response =
        await openai.chat.completions.create({
          model: "gpt-5-mini",

          messages,

          tools,

          tool_choice: "auto",
        });

      const assistantMessage =
        response.choices?.[0]?.message;

      if (!assistantMessage) {
        throw new Error(
          "OpenAI returned no assistant message."
        );
      }

      console.log(
        "Assistant:",
        assistantMessage.content ||
          "(tool request)"
      );

      /* ======================================================
         CHECK TOOL CALLS
      ====================================================== */

      const toolCalls =
        assistantMessage.tool_calls;

      /*
        No tool calls means the model has finished.
      */

      if (
        !toolCalls ||
        toolCalls.length === 0
      ) {
        return Response.json({
          success: true,

          answer:
            assistantMessage.content ||
            "No analysis was returned.",
        });
      }

      /*
        Store the assistant message before
        sending tool results.
      */

      messages.push(
        assistantMessage
      );

      /* ======================================================
         EXECUTE TOOLS
      ====================================================== */

      for (
        const toolCall of toolCalls
      ) {
        /*
          IMPORTANT:

          tool_calls is a union type.

          Only function tool calls contain
          toolCall.function.
        */

        if (
          toolCall.type !== "function"
        ) {
          console.warn(
            "Unsupported tool call:",
            toolCall.type
          );

          continue;
        }

        const toolName =
          toolCall.function.name;

        const rawArguments =
          toolCall.function.arguments ||
          "{}";

        let args: any = {};

        try {
          args =
            JSON.parse(
              rawArguments
            );
        } catch (error) {
          console.error(
            "Could not parse tool arguments:",
            rawArguments
          );

          messages.push({
            role: "tool",

            tool_call_id:
              toolCall.id,

            content: JSON.stringify({
              error:
                "Invalid JSON arguments supplied for this tool.",
            }),
          });

          continue;
        }

        /* ====================================================
           REPEATED CALL DETECTION
        ==================================================== */

        const signature =
          `${toolName}:${JSON.stringify(args)}`;

        const previousCount =
          toolCallHistory.get(
            signature
          ) || 0;

        const currentCount =
          previousCount + 1;

        toolCallHistory.set(
          signature,
          currentCount
        );

        console.log(
          "Tool:",
          toolName
        );

        console.log(
          "Arguments:",
          args
        );

        /*
          If the same exact call happens 3 times,
          tell the model to stop repeating it.
        */

        if (
          currentCount >= 3
        ) {
          console.warn(
            "Repeated tool call detected:",
            signature
          );

          messages.push({
            role: "tool",

            tool_call_id:
              toolCall.id,

            content: JSON.stringify({
              error:
                "This exact tool call has already been attempted multiple times. Do not repeat it. Use the evidence already collected and provide the final answer.",
            }),
          });

          continue;
        }

        /* ====================================================
           RUN TOOL
        ==================================================== */

        try {
          const result =
            await executeTool(
              toolName,
              args
            );

          const safeResult =
            limitToolResult(
              result
            );

          messages.push({
            role: "tool",

            tool_call_id:
              toolCall.id,

            content:
              safeResult,
          });

          console.log(
            "Tool completed:",
            toolName
          );
        } catch (error: any) {
          console.error(
            `Tool failed (${toolName}):`,
            error
          );

          messages.push({
            role: "tool",

            tool_call_id:
              toolCall.id,

            content:
              JSON.stringify({
                error:
                  error?.message ||
                  "Tool execution failed.",
              }),
          });
        }
      }
    }

    /* ========================================================
       FINAL ANSWER PASS
    ======================================================== */

    console.log(
      "\n===== INVESTIGATION LIMIT REACHED ====="
    );

    console.log(
      "Requesting final answer without tools..."
    );

    /*
      We deliberately DO NOT provide:
      
      tool_choice: "none"

      because OpenAI rejects tool_choice when tools
      are not included.

      This final request simply has no tools.
    */

    messages.push({
      role: "user",

      content: `
The investigation limit has been reached.

STOP investigating.

Do not request additional tools.

Answer the developer's original question NOW using
the repository evidence already collected.

Be specific and practical.

Separate your conclusions into:

CONFIRMED
LIKELY
POSSIBLE
NOT VERIFIED

If you identified a fix, give the exact file and
the exact change that should be made.

Do not claim that you changed any files.
`,
    });

    const finalResponse =
      await openai.chat.completions.create({
        model: "gpt-5-mini",

        messages,
      });

    const finalMessage =
      finalResponse.choices?.[0]?.message;

    const finalAnswer =
      finalMessage?.content?.trim();

    console.log(
      "Final answer generated:",
      Boolean(finalAnswer)
    );

    return Response.json({
      success: true,

      answer:
        finalAnswer ||
        "The agent completed its investigation but could not produce a final analysis.",
    });

  } catch (error: any) {
    console.error(
      "\n===== 7WINGZ DEVELOPER AGENT ERROR ====="
    );

    console.error(
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error?.message ||
          "Developer agent failed.",
      },
      {
        status: 500,
      }
    );
  }
}