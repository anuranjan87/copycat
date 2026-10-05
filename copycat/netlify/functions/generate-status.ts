import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const jobs = getStore(
  "website-generation-jobs"
);

/* ============================================================
   JOB ID VALIDATION
============================================================ */

function isValidJobId(
  value: string | null
): boolean {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9_-]{8,128}$/.test(
      value
    )
  );
}

/* ============================================================
   GET STATUS
============================================================ */

export default async function handler(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const jobId =
      url.searchParams.get(
        "jobId"
      );

    if (
      !isValidJobId(jobId)
    ) {
      return Response.json(
        {
          success: false,

          error:
            "A valid jobId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const job =
      await jobs.get(
        jobId,
        {
          type: "json",

          /*
            Strong consistency is useful here because
            the frontend is polling for a freshly completed job.
          */
          consistency:
            "strong",
        }
      );

    if (!job) {
      return Response.json(
        {
          success: false,

          status: "not_found",

          error:
            "Generation job not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Still running.
    */

    if (
      job.status ===
        "processing"
    ) {
      return Response.json({
        success: true,

        status: "processing",

        stage:
          job.stage ||
          "processing",

        jobId,

        createdAt:
          job.createdAt,

        updatedAt:
          job.updatedAt,
      });
    }

    /*
      Generation failed.
    */

    if (
      job.status ===
        "failed"
    ) {
      return Response.json(
        {
          success: false,

          status: "failed",

          jobId,

          error:
            job.error ||
            "AI generation failed.",

          failedAt:
            job.failedAt,
        },
        {
          status: 500,
        }
      );
    }

    /*
      Generation completed.
    */

    if (
      job.status ===
        "completed"
    ) {
      return Response.json({
        success: true,

        status: "completed",

        jobId,

        html:
          typeof job.html ===
          "string"
            ? job.html
            : "",

        usage:
          job.usage || {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCostUsd: 0,
          },

        durationMs:
          Number(
            job.durationMs || 0
          ),

        imageCount:
          Number(
            job.imageCount || 0
          ),

        completedAt:
          job.completedAt,
      });
    }

    /*
      Unknown job state.
    */

    return Response.json(
      {
        success: false,

        status: "unknown",

        jobId,

        error:
          `Unknown generation status: ${String(
            job.status
          )}`,
      },
      {
        status: 500,
      }
    );
  } catch (error: any) {
    console.error(
      "Generation status error:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error?.message ||
          "Unable to retrieve generation status.",
      },
      {
        status: 500,
      }
    );
  }
}

export const config: Config = {
  path: "/api/ai/generate-status",

  method: "GET",
};