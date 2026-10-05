import { executeTool } from "@/app/api/dev-agent/route";

type ToolContext = {
  userId: string;
  websiteUsername: string;
  requestUrl: string;
};

export async function executeAgentTool(
  toolName: string,
  rawArguments: string,
  context: ToolContext,
) {
  let args: Record<string, unknown> = {};

  try {
    args = rawArguments ? JSON.parse(rawArguments) : {};
  } catch {
    return { error: "The tool arguments were not valid JSON." };
  }

  try {
    return await executeTool(
      toolName,
      args,
      context.websiteUsername,
      context.userId,
      context.requestUrl,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Tool execution failed.",
    };
  }
}
