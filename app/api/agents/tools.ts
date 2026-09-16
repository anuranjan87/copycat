export const agentTools = [
  {
    type: "function" as const,
    function: {
      name: "search_unsplash_images",
      description: "Search Unsplash for photos and return real image URLs.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_enquiries",
      description: "Retrieve enquiries submitted through the authenticated user's website.",
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
      description: "Get the total recorded visits for the authenticated user's website.",
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
      description: "Get daily visit data for the authenticated user's website.",
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
      description: "Get estimated active visitors for the authenticated user's website.",
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
      description: "Retrieve official 7Wingz documentation and tutorial content.",
      parameters: {
        type: "object",
        properties: { topic: { type: "string" } },
        required: ["topic"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_google_ads_campaigns",
      description: "Retrieve Google Ads campaigns owned by the authenticated user.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
] as const;

export const responseAgentTools = agentTools.map((tool) => ({
  type: "function" as const,
  name: tool.function.name,
  description: tool.function.description,
  parameters: tool.function.parameters,
  strict: false,
}));
