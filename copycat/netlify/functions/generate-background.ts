import OpenAI from "openai";
import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const jobs = getStore("website-generation-jobs");

const UNSPLASH_API = "https://api.unsplash.com";

const UNSPLASH_SOURCE =
  process.env.UNSPLASH_UTM_SOURCE ||
  process.env.NEXT_PUBLIC_APP_NAME ||
  "7wingz";

/* ============================================================
   TYPES
============================================================ */

type UnsplashImage = {
  id: number;
  photoId: string;
  url: string;
  thumb: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
  downloadLocation: string;
};

type GenerationUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

/* ============================================================
   HELPERS
============================================================ */

function estimateCost(
  inputTokens: number,
  outputTokens: number
): number {
  /*
    This is only a UI estimate.

    Do not treat this as billing information.
    Update these values when you want exact model pricing.
  */

  const inputPricePerMillion = 0.25;
  const outputPricePerMillion = 2.0;

  const cost =
    (inputTokens / 1_000_000) *
      inputPricePerMillion +
    (outputTokens / 1_000_000) *
      outputPricePerMillion;

  return Number(cost.toFixed(6));
}

function createJobId(): string {
  return crypto.randomUUID();
}

function isValidJobId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9_-]{8,128}$/.test(value)
  );
}

function jsonError(
  message: string,
  status = 500
) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/* ============================================================
   UNSPLASH SEARCH
============================================================ */

async function searchUnsplash(
  query: string
): Promise<UnsplashImage[]> {
  const accessKey =
    process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn(
      "UNSPLASH_ACCESS_KEY is not configured."
    );

    return [];
  }

  const url =
    `${UNSPLASH_API}/search/photos` +
    `?query=${encodeURIComponent(query)}` +
    `&per_page=20`;

  try {
    const response = await fetch(url, {
      method: "GET",

      headers: {
        Authorization:
          `Client-ID ${accessKey}`,

        Accept: "application/json",
      },

      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Unsplash API error: ${response.status} ${response.statusText}`
      );

      return [];
    }

    const data =
      await response.json();

    return (data.results || [])
      .filter(
        (photo: any) =>
          typeof photo?.urls?.regular ===
            "string" &&
          photo.urls.regular.length > 0
      )
      .map(
        (
          photo: any,
          index: number
        ) => ({
          id: index + 1,

          photoId:
            photo.id || "",

          url:
            photo.urls.regular,

          thumb:
            photo.urls.small ||
            photo.urls.regular,

          alt:
            photo.alt_description ||
            photo.description ||
            query,

          photographer:
            photo.user?.name ||
            "Unsplash photographer",

          photographerUrl:
            photo.user?.links?.html ||
            "https://unsplash.com",

          unsplashUrl:
            photo.links?.html ||
            "https://unsplash.com",

          downloadLocation:
            photo.links
              ?.download_location ||
            "",
        })
      );
  } catch (error) {
    console.error(
      "Unsplash search failed:",
      error
    );

    return [];
  }
}

/* ============================================================
   UNSPLASH DOWNLOAD TRACKING
============================================================ */

async function trackUnsplashDownload(
  downloadLocation: string
) {
  const accessKey =
    process.env.UNSPLASH_ACCESS_KEY;

  if (
    !accessKey ||
    !downloadLocation
  ) {
    return;
  }

  try {
    const parsed =
      new URL(downloadLocation);

    if (
      parsed.origin !==
      UNSPLASH_API
    ) {
      console.warn(
        "Rejected non-Unsplash download location:",
        downloadLocation
      );

      return;
    }

    parsed.searchParams.set(
      "client_id",
      accessKey
    );

    const response =
      await fetch(
        parsed.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache: "no-store",
        }
      );

    if (!response.ok) {
      console.warn(
        `Unsplash tracking failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.warn(
      "Unsplash tracking error:",
      error
    );
  }
}

/* ============================================================
   HTML IMAGE HELPERS
============================================================ */

function extractImageUrls(
  html: string
): string[] {
  const urls: string[] = [];

  const regex =
    /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;

  let match: RegExpExecArray | null;

  while (
    (match = regex.exec(html)) !== null
  ) {
    urls.push(match[1]);
  }

  return urls;
}

function removeInvalidImageUrls(
  html: string,
  allowedUrls: Set<string>
): string {
  const transparentPixel =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,

    (
      fullMatch,
      prefix,
      url,
      suffix
    ) => {
      if (
        allowedUrls.has(url)
      ) {
        return fullMatch;
      }

      return (
        `${prefix}` +
        `${transparentPixel}` +
        `${suffix}`
      );
    }
  );
}

function addUnsplashUtm(
  url: string
): string {
  try {
    const parsed =
      new URL(url);

    if (
      parsed.hostname !==
        "unsplash.com" &&
      parsed.hostname !==
        "www.unsplash.com"
    ) {
      return url;
    }

    parsed.searchParams.set(
      "utm_source",
      UNSPLASH_SOURCE
    );

    parsed.searchParams.set(
      "utm_medium",
      "referral"
    );

    return parsed.toString();
  } catch {
    return url;
  }
}

function escapeHtml(
  value: string
): string {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function addUnsplashAttribution(
  html: string,
  imageLibrary: UnsplashImage[]
): string {
  if (!imageLibrary.length) {
    return html;
  }

  const byUrl = new Map(
    imageLibrary.map((image) => [image.url, image])
  );

  // Remove attribution blocks previously generated by this function.
  // This prevents duplicate credits when existing HTML already contains them.
  html = html.replace(
    /<p[^>]*data-unsplash-attribution=["']true["'][^>]*>[\s\S]*?<\/p>/gi,
    ""
  );

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (
      fullMatch: string,
      prefix: string,
      url: string,
      suffix: string
    ) => {
      const image = byUrl.get(url);

      if (!image) {
        return fullMatch;
      }

      // IMPORTANT:
      // Use the exact URLs returned by Unsplash.
      // Only add UTM parameters to attribution links, never to image URLs.
      const photographerUrl = addUnsplashUtm(
        image.photographerUrl
      );

      const unsplashUrl = addUnsplashUtm(
        image.unsplashUrl
      );

      const attribution = `
<p data-unsplash-attribution="true" class="mt-1 text-xs text-gray-500">
  Photo by
  <a
    href="${escapeHtml(photographerUrl)}"
    target="_blank"
    rel="noopener noreferrer"
  >${escapeHtml(image.photographer)}</a>
  on
  <a
    href="${escapeHtml(unsplashUrl)}"
    target="_blank"
    rel="noopener noreferrer"
  >Unsplash</a>
</p>`;

      return `${prefix}${url}${suffix}${attribution}`;
    }
  );
}

/* ============================================================
   GENERATE IMAGE QUERY
============================================================ */

async function createImageQuery(
  prompt: string
): Promise<string> {
  try {
    const response =
      await openai.responses.create({
        model: "gpt-4.1-nano",

        stream: false,

        input: `
Create ONE concise Unsplash search query for the website below.

The query should describe the main visual subject.

Examples:
- kids playing games
- modern luxury interior
- fitness training gym
- construction workers building
- professional financial consulting
- tropical beach resort
- modern software technology
- restaurant food dining

Return ONLY the search query.

No explanation.

Website request:
${prompt}
        `.trim(),
      });

    return (
      response.output_text ||
      prompt
    )
      .trim()
      .replace(
        /^["']|["']$/g,
        ""
      )
      .slice(0, 150);
  } catch (error) {
    console.warn(
      "Image query generation failed. Using user prompt.",
      error
    );

    return prompt
      .trim()
      .slice(0, 150);
  }
}

/* ============================================================
   SAVE JOB
============================================================ */

async function updateJob(
  jobId: string,
  data: Record<string, any>
) {
  await jobs.setJSON(
    jobId,
    {
      ...data,
      updatedAt:
        new Date().toISOString(),
    }
  );
}

/* ============================================================
   GENERATION
============================================================ */

async function runGeneration(
  request: Request
): Promise<void> {
  let body: any;

  try {
    body =
      await request.json();
  } catch {
    console.error(
      "Invalid JSON request body."
    );

    return;
  }

  const jobId =
    isValidJobId(body?.jobId)
      ? body.jobId
      : createJobId();

  const currentCode =
    typeof body?.currentCode ===
    "string"
      ? body.currentCode
      : "";

  const prompt =
    typeof body?.prompt ===
    "string"
      ? body.prompt.trim()
      : "";

  console.log(
    "=================================================="
  );

  console.log(
    "AI BACKGROUND GENERATION"
  );

  console.log(
    "Job:",
    jobId
  );

  console.log(
    "Prompt:",
    prompt
  );

  console.log(
    "=================================================="
  );

  await updateJob(
    jobId,
    {
      status: "processing",
      createdAt:
        new Date().toISOString(),
    }
  );

  if (!prompt) {
    await updateJob(
      jobId,
      {
        status: "failed",
        error:
          "Prompt is required",
        failedAt:
          new Date().toISOString(),
      }
    );

    return;
  }

  try {
    /* ========================================================
       STEP 1 — IMAGE QUERY
    ======================================================== */

    await updateJob(
      jobId,
      {
        status: "processing",
        stage: "image_query",
      }
    );

    const imageQuery =
      await createImageQuery(
        prompt
      );

    console.log(
      "Image query:",
      imageQuery
    );

    /* ========================================================
       STEP 2 — UNSPLASH
    ======================================================== */

    await updateJob(
      jobId,
      {
        status: "processing",
        stage: "images",
        imageQuery,
      }
    );

    const imageResults =
      await searchUnsplash(
        imageQuery
      );

    const allowedImageUrls =
      new Set(
        imageResults
          .map(
            (image) =>
              image.url
          )
          .filter(
            (
              url
            ): url is string =>
              typeof url ===
                "string" &&
              url.length > 0
          )
      );

    console.log(
      `Images found: ${imageResults.length}`
    );

    /* ========================================================
       STEP 3 — IMAGE LIBRARY
    ======================================================== */

    const imageLibrary =
      imageResults.length > 0
        ? imageResults
            .map(
              (image) =>
                `
IMAGE ${image.id}
PHOTO ID: ${image.photoId}
URL: ${image.url}
ALT: ${image.alt}
PHOTOGRAPHER: ${image.photographer}
PHOTOGRAPHER URL: ${addUnsplashUtm(
                  image.photographerUrl
                )}
UNSPLASH URL: ${addUnsplashUtm(
                  image.unsplashUrl
                )}
DOWNLOAD LOCATION: ${image.downloadLocation}
                `.trim()
            )
            .join(
              "\n\n"
            )
        : "NO IMAGES WERE AVAILABLE.";

    /* ========================================================
       STEP 4 — GENERATE WEBSITE
    ======================================================== */

    await updateJob(
      jobId,
      {
        status: "processing",
        stage: "generating",
      }
    );

    const systemPrompt = `
You are an expert HTML and Tailwind CSS developer.

Your task is to generate or update a modern, polished,
responsive HTML website.

============================================================
CORE RULES
============================================================

- If current code is provided, UPDATE the existing code.
- Preserve existing functionality unless the user asks to change it.
- Apply the user's requested changes.
- Return the COMPLETE final HTML.
- Never return only changed sections.

============================================================
OUTPUT
============================================================

- First line MUST be:
<!-- generated code -->

- Return ONLY raw HTML.
- Never use Markdown code fences.
- Never include explanations.
- Never include commentary outside the HTML.

============================================================
HTML
============================================================

- Return a complete HTML document.
- Use semantic HTML.
- Make the page fully responsive.
- Make the design polished and visually rich.
- Use Tailwind CSS.

Include:

<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

============================================================
IMAGES
============================================================

Images are automatically required unless the user explicitly requests:

- no images
- without images
- remove images
- text only

The final website should be image-rich.

Use images for:

- hero sections
- cards
- products
- services
- articles
- projects
- destinations
- activities
- galleries
- major visual sections

============================================================
UNSPLASH IMAGE LIBRARY
============================================================

ONLY use URLs from this image library.

${imageLibrary}

============================================================
ABSOLUTE IMAGE URL RULE
============================================================

NEVER:

- invent image URLs
- invent Unsplash photo IDs
- construct Unsplash URLs
- modify Unsplash URLs
- add parameters to image URLs
- remove parameters from image URLs
- use random external image URLs
- use placeholder image services

ONLY use URLs supplied in the image library.

============================================================
ATTRIBUTION
============================================================

Every Unsplash image must have attribution.

Use:

Photo by PHOTOGRAPHER on Unsplash

Use the supplied photographer URL and Unsplash URL.

CRITICAL ATTRIBUTION URL RULES:
- Copy the supplied PHOTOGRAPHER URL exactly.
- Copy the supplied UNSPLASH URL exactly.
- NEVER construct, guess, rewrite, slugify, or invent an Unsplash photo-page URL.
- NEVER derive an Unsplash photo URL from the photo ID, alt text, image description, or filename.
- NEVER replace a supplied UNSPLASH URL with a manually constructed /photos/... URL.
- The image URL and attribution URL are different fields. Keep them separate.
- Put attribution immediately after each corresponding image.
- Do not add a second attribution for an image that already has one.


============================================================
CURRENT CODE
============================================================

${
  currentCode ||
  "(No existing code was provided. Create the website from scratch.)"
}

============================================================
USER REQUEST
============================================================

${prompt}
    `.trim();

    /* ========================================================
       STEP 5 — OPENAI
    ======================================================== */

    const startedAt =
      Date.now();

    const finalResponse =
      await openai.responses.create({
        model:
          "gpt-5.6-luna",

        stream: false,

        input:
          systemPrompt,
      });

    let html =
      finalResponse.output_text ||
      "";

    const durationMs =
      Date.now() -
      startedAt;

    /* ========================================================
       STEP 6 — CLEAN MARKDOWN
    ======================================================== */

    html =
      html
        .replace(
          /^```html\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /\s*```$/i,
          ""
        )
        .trim();

    if (!html) {
      throw new Error(
        "OpenAI returned empty HTML."
      );
    }

    /* ========================================================
       STEP 7 — IMAGE VALIDATION
    ======================================================== */

    const generatedImageUrls =
      extractImageUrls(
        html
      );

    const invalidImageUrls =
      generatedImageUrls.filter(
        (url) =>
          !allowedImageUrls.has(
            url
          )
      );

    if (
      invalidImageUrls.length > 0
    ) {
      console.warn(
        "Invalid image URLs found:",
        invalidImageUrls
      );

      html =
        removeInvalidImageUrls(
          html,
          allowedImageUrls
        );
    }

    /* ========================================================
       STEP 8 — ATTRIBUTION
    ======================================================== */

    html =
      addUnsplashAttribution(
        html,
        imageResults
      );

    /* ========================================================
       STEP 9 — TRACK USED IMAGES
    ======================================================== */

    const finalImageUrls =
      extractImageUrls(
        html
      );

    const usedImages =
      imageResults.filter(
        (image) =>
          finalImageUrls.includes(
            image.url
          ) &&
          image.downloadLocation
      );

    await Promise.allSettled(
      usedImages.map(
        (image) =>
          trackUnsplashDownload(
            image.downloadLocation
          )
      )
    );

    /* ========================================================
       STEP 10 — USAGE
    ======================================================== */

    const usage: any =
      (finalResponse as any)
        ?.usage || {};

    const inputTokens =
      Number(
        usage.input_tokens ??
          usage.inputTokens ??
          0
      );

    const outputTokens =
      Number(
        usage.output_tokens ??
          usage.outputTokens ??
          0
      );

    const totalTokens =
      Number(
        usage.total_tokens ??
          usage.totalTokens ??
          inputTokens +
            outputTokens
      );

    const estimatedCostUsd =
      estimateCost(
        inputTokens,
        outputTokens
      );

    const generationUsage:
      GenerationUsage = {
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd,
      };

    /* ========================================================
       STEP 11 — COMPLETE JOB
    ======================================================== */

    await updateJob(
      jobId,
      {
        status: "completed",

        stage: "completed",

        html,

        usage:
          generationUsage,

        durationMs,

        imageCount:
          usedImages.length,

        completedAt:
          new Date().toISOString(),
      }
    );

    console.log(
      "Generation completed:",
      jobId
    );
  } catch (error: any) {
    console.error(
      "AI generation failed:",
      error
    );

    await updateJob(
      jobId,
      {
        status: "failed",

        error:
          error?.message ||
          "AI generation failed.",

        failedAt:
          new Date().toISOString(),
      }
    );
  }
}

/* ============================================================
   NETLIFY BACKGROUND FUNCTION
============================================================ */

export default async function handler(
  request: Request
) {
  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  await runGeneration(request);

  return new Response(null, {
    status: 202,
  });
}

export const config: Config = {
  path: "/api/ai/generate",

  method: "POST",

  background: true,
};