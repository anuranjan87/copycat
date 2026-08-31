  
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -----------------------------------------------------------------------------
// Unsplash image search
// -----------------------------------------------------------------------------

async function searchUnsplash(query: string) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY is not configured");
    return [];
  }

  const url =
    `https://api.unsplash.com/search/photos` +
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
        url: photo.urls.regular,
        thumb:
          photo.urls.small ||
          photo.urls.regular,
        alt:
          photo.alt_description ||
          photo.description ||
          query,
        photographer:
          photo.user?.name || "",
      }));
  } catch (error) {
    console.error("Unsplash search failed:", error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Extract image URLs from HTML
// -----------------------------------------------------------------------------

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];

  const regex =
    /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
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
      if (allowedUrls.has(url)) {
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
// POST
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // Parse request
    // -------------------------------------------------------------------------

    const body = await request.json();

    const currentCode =
      typeof body.currentCode === "string"
        ? body.currentCode
        : "";

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    if (!prompt) {
      return new Response(
        JSON.stringify({
          error: "Prompt is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -------------------------------------------------------------------------
    // STEP 1
    // Automatically determine an image search query.
    //
    // IMPORTANT:
    // The user does NOT need to ask for images.
    // Images are automatically included for every website.
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // STEP 2
    // Get image search query.
    //
    // This is a small fast request.
    // -------------------------------------------------------------------------

    const queryResponse =
      await openai.responses.create({
        model: "gpt-4.1-nano",
        stream: false,
        input: imageQueryPrompt,
      });

    const imageQuery =
      (
        queryResponse.output_text ||
        prompt
      )
        .trim()
        .replace(/^["']|["']$/g, "")
        .slice(0, 150);

    // -------------------------------------------------------------------------
    // STEP 3
    // Search Unsplash BEFORE generating the website.
    //
    // No image tool call is needed inside the main generation request.
    // -------------------------------------------------------------------------

    const imageResults =
      await searchUnsplash(imageQuery);

    const allowedImageUrls =
      new Set<string>(
        imageResults
          .map((image: any) => image.url)
          .filter(
            (url: any) =>
              typeof url === "string" &&
              url.length > 0
          )
      );

    console.log(
      `Image query: "${imageQuery}"`
    );

    console.log(
      `Images found: ${imageResults.length}`
    );

    // -------------------------------------------------------------------------
    // STEP 4
    // Build image library for the model.
    // -------------------------------------------------------------------------

    const imageLibrary =
      imageResults.length > 0
        ? imageResults
            .map(
              (image: any) =>
                `
IMAGE ${image.id}
URL: ${image.url}
ALT: ${image.alt}
PHOTOGRAPHER: ${image.photographer}
`.trim()
            )
            .join("\n\n")
        : "NO IMAGES WERE AVAILABLE.";

    // -------------------------------------------------------------------------
    // STEP 5
    // ONE final HTML generation request.
    // -------------------------------------------------------------------------

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

IMPORTANT:

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
IMAGE LIBRARY
===============================================================================

The following images were retrieved specifically for this website.

ONLY use URLs from this image library.

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

${currentCode || "(No existing code was provided. Create the page from scratch.)"}

===============================================================================
USER REQUEST
===============================================================================

${prompt}
`.trim();

    // -------------------------------------------------------------------------
    // STEP 6
    // SINGLE final OpenAI request.
    //
    // stream:false is intentional for Netlify.
    // -------------------------------------------------------------------------

    const finalResponse =
      await openai.responses.create({
        model: "gpt-5.6-luna",
        stream: false,
        input: systemPrompt,
      });

    // -------------------------------------------------------------------------
    // STEP 7
    // Get generated HTML.
    // -------------------------------------------------------------------------

    let htmlText =
      finalResponse.output_text || "";

    // -------------------------------------------------------------------------
    // STEP 8
    // Remove accidental Markdown fences.
    // -------------------------------------------------------------------------

    htmlText = htmlText
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // -------------------------------------------------------------------------
    // STEP 9
    // Validate generated image URLs.
    // -------------------------------------------------------------------------

    const generatedImageUrls =
      extractImageUrls(htmlText);

    console.log(
      `Generated image count: ${generatedImageUrls.length}`
    );

    const invalidImageUrls =
      generatedImageUrls.filter(
        (url) => !allowedImageUrls.has(url)
      );

    if (invalidImageUrls.length > 0) {
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

    // -------------------------------------------------------------------------
    // STEP 10
    // Final response.
    //
    // IMPORTANT:
    // Do not stream this response.
    // Netlify receives one complete response.
    // -------------------------------------------------------------------------

    return new Response(htmlText, {
      status: 200,
      headers: {
        "Content-Type":
          "text/plain; charset=utf-8",

        "Cache-Control":
          "no-cache, no-transform",
      },
    });
  } catch (error: any) {
    console.error(
      "API Route Error:",
      error
    );

    return new Response(
      JSON.stringify({
        error: "Failed to generate page",
        message:
          error?.message ||
          "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  }
}

