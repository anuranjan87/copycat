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
  "your_app_name";

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

// -----------------------------------------------------------------------------
// Unsplash image search
// -----------------------------------------------------------------------------

async function searchUnsplash(
  query: string
): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY is not configured");
    return [];
  }

  const url =
    `${UNSPLASH_API}/search/photos` +
    `?query=${encodeURIComponent(query)}` +
    `&per_page=20`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        `Unsplash API error: ${res.status} ${res.statusText}`
      );

      return [];
    }

    const data = await res.json();

    return (data.results || [])
      .filter(
        (photo: any) =>
          typeof photo?.urls?.regular === "string" &&
          photo.urls.regular.length > 0
      )
      .map((photo: any, index: number) => ({
        id: index + 1,

        photoId: photo.id || "",

        // IMPORTANT:
        // This is the exact URL returned by Unsplash.
        url: photo.urls.regular,

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

        // IMPORTANT:
        // Used only for download tracking.
        downloadLocation:
          photo.links?.download_location ||
          "",
      }));
  } catch (error) {
    console.error(
      "Unsplash search failed:",
      error
    );

    return [];
  }
}

// -----------------------------------------------------------------------------
// Track Unsplash download / usage event
// -----------------------------------------------------------------------------

async function trackUnsplashDownload(
  downloadLocation: string
) {
  const accessKey =
    process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey || !downloadLocation) {
    return;
  }

  try {
    const parsed =
      new URL(downloadLocation);

    /*
     * Security:
     * Never allow an arbitrary URL to be fetched.
     *
     * We only allow the exact Unsplash API origin.
     */
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

    /*
     * Preserve all query parameters returned by Unsplash
     * and add our access key.
     */
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
        `Unsplash download tracking failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    /*
     * Tracking failure must NEVER
     * break website generation.
     */
    console.warn(
      "Unsplash download tracking error:",
      error
    );
  }
}

// -----------------------------------------------------------------------------
// Extract image URLs from generated HTML
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Remove invalid image URLs
// -----------------------------------------------------------------------------

function removeInvalidImageUrls(
  html: string,
  allowedUrls: Set<string>
): string {
  const transparentPixel =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,

    (
      fullMatch: string,
      prefix: string,
      url: string,
      suffix: string
    ) => {
      if (
        allowedUrls.has(url)
      ) {
        return fullMatch;
      }

      console.warn(
        "Removing invalid image URL:",
        url
      );

      return `${prefix}${transparentPixel}${suffix}`;
    }
  );
}

// -----------------------------------------------------------------------------
// Add required Unsplash UTM parameters
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Escape attribution text
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Automatically add Unsplash attribution
// -----------------------------------------------------------------------------

function addUnsplashAttribution(
  html: string,
  imageLibrary: UnsplashImage[]
): string {
  if (
    !imageLibrary.length
  ) {
    return html;
  }

  const byUrl =
    new Map(
      imageLibrary.map(
        (image) => [
          image.url,
          image,
        ]
      )
    );

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,

    (
      fullMatch: string,
      prefix: string,
      url: string,
      suffix: string
    ) => {
      const image =
        byUrl.get(url);

      if (!image) {
        return fullMatch;
      }

      const photographerUrl =
        addUnsplashUtm(
          image.photographerUrl
        );

      const unsplashUrl =
        addUnsplashUtm(
          image.unsplashUrl ||
            "https://unsplash.com"
        );

      const attribution = `
<p class="mt-1 text-xs text-gray-500">
  Photo by
  <a
    href="${photographerUrl}"
    target="_blank"
    rel="noopener noreferrer"
  >${escapeHtml(
    image.photographer
  )}</a>
  on
  <a
    href="${unsplashUrl}"
    target="_blank"
    rel="noopener noreferrer"
  >Unsplash</a>
</p>`;

      return (
        `${prefix}${url}${suffix}` +
        attribution
      );
    }
  );
}

// -----------------------------------------------------------------------------
// POST
// -----------------------------------------------------------------------------

async function runGeneration(
  request: Request
): Promise<void> {
  const body =
    await request.json();

  const jobId =
    typeof body?.jobId === "string" &&
    /^[A-Za-z0-9_-]{8,128}$/.test(body.jobId)
      ? body.jobId
      : crypto.randomUUID();

  await jobs.setJSON(jobId, {
    status: "processing",
    createdAt: new Date().toISOString(),
  });

  try {

    // =========================================================================
    // PARSE NORMAL GENERATION REQUEST
    // =========================================================================

    const currentCode =
      typeof body.currentCode ===
      "string"
        ? body.currentCode
        : "";

    const prompt =
      typeof body.prompt ===
      "string"
        ? body.prompt.trim()
        : "";

   if (!prompt) {
  await jobs.setJSON(jobId, {
    status: "failed",
    error: "Prompt is required",
    failedAt: new Date().toISOString(),
  });

  return;
}

    // =========================================================================
    // STEP 1
    // Automatically determine image search query.
    // =========================================================================

    const imageQueryPrompt = `
Create ONE concise Unsplash search query for the website below.

The query should describe the main visual subject of the website.

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
`.trim();

    const queryResponse =
      await openai.responses.create(
        {
          model:
            "gpt-4.1-nano",

          stream: false,

          input:
            imageQueryPrompt,
        }
      );

    const imageQuery =
      (
        queryResponse.output_text ||
        prompt
      )
        .trim()
        .replace(
          /^["']|["']$/g,
          ""
        )
        .slice(
          0,
          150
        );

    // =========================================================================
    // STEP 2
    // Search Unsplash BEFORE generating the website.
    // =========================================================================

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
      `Image query: "${imageQuery}"`
    );

    console.log(
      `Images found: ${imageResults.length}`
    );

    // =========================================================================
    // STEP 3
    // Build image library for OpenAI.
    // =========================================================================

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

    // =========================================================================
    // STEP 4
    // Generate website.
    // =========================================================================

    const systemPrompt = `
You are an expert HTML and Tailwind CSS developer.

Your task is to generate or update a modern, polished,
responsive HTML website.

===============================================================================
CORE RULES
===============================================================================

- If Current code is provided, UPDATE the existing code.
- Preserve existing functionality unless the user explicitly asks to change it.
- Apply the user's requested changes.
- Return the COMPLETE final HTML.
- Never return only changed sections.

===============================================================================
OUTPUT
===============================================================================

- First line MUST be:
<!-- generated code -->

- Return ONLY raw HTML.
- Never use Markdown code fences.
- Never include explanations.
- Never include commentary outside the HTML.

===============================================================================
HTML
===============================================================================

- Return a complete HTML document.
- Use semantic HTML where appropriate.
- Make the page fully responsive.
- Make the design visually rich and polished.
- Use Tailwind CSS classes.

Use:

<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

===============================================================================
AUTOMATIC IMAGE REQUIREMENT
===============================================================================

Images are AUTOMATICALLY REQUIRED.

The user does NOT need to mention images.

Unless the user's request explicitly says:

- no images
- without images
- remove images
- text only

you MUST create an image-rich website.

Do NOT create a mostly text-based website.

===============================================================================
IMAGE DENSITY
===============================================================================

Use PLENTIFUL images throughout the website.

Use images whenever they make visual sense.

HERO:
- Prefer a large hero image when appropriate.

CARDS:
- Use an image for EACH card whenever cards represent
  people, products, destinations, activities, services,
  projects, articles, locations, or visual subjects.

FEATURES:
- Use images where visually appropriate.

PRODUCTS:
- Use an image for EACH product.

SERVICES:
- Use images for service cards when appropriate.

BLOG:
- Use an image for EACH article.

GALLERY:
- Prefer 6-12 images.

PORTFOLIO:
- Prefer an image for every project.

DESTINATIONS:
- Use an image for every destination.

ACTIVITIES:
- Use an image for every activity.

MAJOR SECTIONS:
- Add large visual imagery where appropriate.

The final result should feel:

IMAGE-RICH
VISUAL
PREMIUM
MODERN

rather than:

TEXT-HEAVY
EMPTY
PLAIN

===============================================================================
UNSPLASH IMAGE LIBRARY
===============================================================================

The following images were retrieved specifically for this website.

ONLY use image URLs from this image library.

${imageLibrary}

===============================================================================
ABSOLUTE IMAGE URL RULE
===============================================================================

You MUST copy image URLs EXACTLY as provided above.

NEVER:

- invent an image URL
- invent an Unsplash photo ID
- construct an Unsplash URL
- modify an Unsplash URL
- add parameters to an image URL
- remove parameters from an image URL
- change an image URL
- use an image URL from your own knowledge
- use an image URL from the current code
- use random external image URLs
- use placeholder image services

ONLY use image URLs supplied in the IMAGE LIBRARY.

===============================================================================
ATTRIBUTION
===============================================================================

Every Unsplash image must be displayed with attribution.

Use the supplied photographer information.

The required attribution format is:

Photo by PHOTOGRAPHER on Unsplash

The attribution links must point to the supplied:

PHOTOGRAPHER URL

and

UNSPLASH URL

Do not invent attribution URLs.

The server will also enforce attribution after generation.

Do not remove or hide the attribution.

===============================================================================
IMAGE REUSE
===============================================================================

You may reuse images from the image library.

If the website needs more images than are available:

- reuse existing images
- use different crops
- use different sizes
- use different aspect ratios
- use different sections
- use different layouts

NEVER invent additional image URLs.

===============================================================================
CURRENT CODE
===============================================================================

${
  currentCode ||
  "(No existing code was provided. Create the page from scratch.)"
}

===============================================================================
USER REQUEST
===============================================================================

${prompt}
`.trim();

    // =========================================================================
    // STEP 5
    // ONE FINAL OPENAI REQUEST
    //
    // stream:false is intentional for Netlify.
    // =========================================================================

    const finalResponse =
      await openai.responses.create(
        {
          model:
            "gpt-5.6-luna",

          stream: false,

          input:
            systemPrompt,
        }
      );

    let htmlText =
      finalResponse.output_text ||
      "";

    // =========================================================================
    // STEP 6
    // Remove accidental Markdown fences.
    // =========================================================================

    htmlText =
      htmlText
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

    // =========================================================================
    // STEP 7
    // Validate generated image URLs.
    // =========================================================================

    const generatedImageUrls =
      extractImageUrls(
        htmlText
      );

    console.log(
      `Generated image count: ${generatedImageUrls.length}`
    );

    const invalidImageUrls =
      generatedImageUrls.filter(
        (url) =>
          !allowedImageUrls.has(
            url
          )
      );

    if (
      invalidImageUrls.length >
      0
    ) {
      console.warn(
        "Invalid image URLs generated:",
        invalidImageUrls
      );

      htmlText =
        removeInvalidImageUrls(
          htmlText,
          allowedImageUrls
        );
    }

    // =========================================================================
    // STEP 8
    // Enforce Unsplash attribution.
    // =========================================================================

    htmlText =
      addUnsplashAttribution(
        htmlText,
        imageResults
      );

    // =========================================================================
    // STEP 9
    // Track images actually used.
    // =========================================================================

    const finalGeneratedImageUrls =
      extractImageUrls(
        htmlText
      );

    const usedImages =
      imageResults.filter(
        (image) =>
          finalGeneratedImageUrls.includes(
            image.url
          ) &&
          image.downloadLocation
      );

    console.log(
      `Unsplash images used: ${usedImages.length}`
    );

    /*
     * Track only images actually
     * inserted into the generated website.
     *
     * All requests run in parallel.
     *
     * A tracking failure will NEVER
     * break website generation.
     */
    await Promise.allSettled(
      usedImages.map(
        (image) =>
          trackUnsplashDownload(
            image.downloadLocation
          )
      )
    );

    // =========================================================================
    // STEP 10
    // SAVE RESULT FOR THE STATUS ENDPOINT
    // =========================================================================

    const completedAt = new Date().toISOString();

    await jobs.setJSON(jobId, {
      status: "completed",
      html: htmlText,
      completedAt,
    });

    console.log(`Generation completed: ${jobId}`);
  } catch (error: any) {
    console.error(
      "API Route Error:",
      error
    );

    await jobs.setJSON(jobId, {
      status: "failed",
      error:
        error?.message ||
        "Unknown error",
      failedAt: new Date().toISOString(),
    });

    throw error;
  }
}

export default async function handler(request: Request) {
  // Netlify sends HTTP 202 immediately because this function is configured
  // as a Background Function. The generation continues after the client
  // receives the 202 response.
  await runGeneration(request);
}

export const config: Config = {
  path: "/api/generate",
  method: "POST",
  background: true,
};
