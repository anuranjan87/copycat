import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

type GenerationJob =
  | {
      status: "processing";
      createdAt?: string;
    }
  | {
      status: "completed";
      html: string;
      completedAt?: string;
    }
  | {
      status: "failed";
      error: string;
      failedAt?: string;
    };

export async function GET(request: Request) {
  try {
    // IMPORTANT:
    // Initialize Netlify Blobs only when the request happens.
    const jobs = getStore("website-generation-jobs");

    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId")?.trim() || "";

    if (!jobId || !/^[A-Za-z0-9_-]{8,128}$/.test(jobId)) {
      return Response.json(
        { error: "A valid jobId is required" },
        { status: 400 }
      );
    }

    const raw = await jobs.get(jobId, {
      type: "text",
    });

    if (!raw) {
      return Response.json(
        {
          status: "not_found",
          jobId,
        },
        { status: 404 }
      );
    }

    const job = JSON.parse(raw) as GenerationJob;

    return Response.json({
      jobId,
      ...job,
    });
  } catch (error: any) {
    console.error("Generation status error:", error);

    return Response.json(
      {
        error: "Failed to read generation status",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}