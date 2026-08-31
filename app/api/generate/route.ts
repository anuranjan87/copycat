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
    throw new Error("UNSPLASH_ACCESS_KEY is not configured");
  }

  const url =
    `https://api.unsplash.com/search/photos` +
    `?query=${encodeURIComponent(query)}` +
    `&per_page=20`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");

    throw new Error(
      `Unsplash API error: ${res.status} ${res.statusText} ${errorText}`
    );
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

      // Exact URL returned by Unsplash.
      // The model must copy this URL exactly.
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
}

// -----------------------------------------------------------------------------
// Image search tool
// -----------------------------------------------------------------------------

const imageSearchTool = {
  type: "function" as const,

  name: "image_search",

  description:
    "Search Unsplash for a large collection of real stock photos needed to create a visually rich website.",

  parameters: {
    type: "object",

    properties: {
      query: {
        type: "string",

        description:
          "A concise visual search query for the website, such as 'kids playing games', 'children art crafts', 'modern office', or 'travel destination'.",
      },
    },

    required: ["query"],

    additionalProperties: false,
  },

  strict: true,
};

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
// Replace invalid image URLs
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
      // Valid image URL.
      if (allowedUrls.has(url)) {
        return fullMatch;
      }

      // Invalid/hallucinated image URL.
      console.warn(
        "Removing invalid image URL:",
        url
      );

      return `${prefix}${transparentPixel}${suffix}`;
    }
  );
}

// -----------------------------------------------------------------------------
// Find invalid image URLs
// -----------------------------------------------------------------------------

function findInvalidImageUrls(
  html: string,
  allowedUrls: Set<string>
): string[] {
  const urls = extractImageUrls(html);

  return urls.filter(
    (url) => !allowedUrls.has(url)
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
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // -------------------------------------------------------------------------
    // System prompt
    // -------------------------------------------------------------------------

    const systemPrompt = `
You are an expert HTML and Tailwind CSS developer.

Your task is to generate or update a modern, polished, responsive HTML website.

IMPORTANT:
- If Current code is provided, UPDATE the existing code.
- Preserve existing functionality unless the user explicitly asks to change it.
- Apply the user's requested changes.
- Return the COMPLETE final HTML.
- Do not return only changed sections.

OUTPUT:
- First line MUST be:
<!-- generated code -->
- Return ONLY raw HTML.
- Never use Markdown code fences.
- Never include explanations.
- Never include commentary outside the HTML.

HTML:
- Return a complete HTML document.
- Use semantic HTML where appropriate.
- Make the page responsive.
- Make the design visually rich and polished.
- Use Tailwind CSS classes.

TAILWIND:
Use:

<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

===============================================================================
IMAGE REQUIREMENT
===============================================================================

Images are REQUIRED.

Every website should be visually rich and contain PLENTIFUL IMAGES.

Unless the user explicitly says:
- no images
- without images
- remove images
- text only

you MUST call image_search exactly once.

Do NOT create a mostly text-based website when images would improve the design.

===============================================================================
IMAGE DENSITY
===============================================================================

Use many images throughout the website.

Whenever appropriate:

HERO:
- Prefer 1 large hero image.

CARDS:
- Use an image for EACH card when the design contains cards.

FEATURES:
- Use images for feature items when visually appropriate.

PRODUCTS:
- Use an image for EACH product.

SERVICES:
- Use images for service cards when appropriate.

BLOG:
- Use an image for EACH article/card.

GALLERY:
- Prefer 6-12 images.

PORTFOLIO:
- Prefer an image for every project.

DESTINATIONS:
- Use an image for every destination.

ACTIVITIES:
- Use an image for every activity.

TESTIMONIALS:
- Images may be used when visually appropriate.

SECTIONS:
- Use large visual images in major sections when appropriate.

The final website should feel IMAGE-RICH rather than text-heavy.

===============================================================================
IMAGE REUSE
===============================================================================

The image_search tool returns up to 20 images.

You may reuse those images as many times as necessary.

If the page needs 30 images:
- Use the 20 returned images.
- Reuse images for the remaining locations.

If the page needs 50 images:
- Reuse the returned images.

NEVER invent additional image URLs.

It is completely acceptable to reuse the same image with:
- different sizes
- different crops
- different aspect ratios
- different sections
- different layouts

===============================================================================
ABSOLUTE IMAGE URL RULES
===============================================================================

The image_search result is the ONLY source of image URLs.

You may ONLY use exact URLs returned by image_search.

NEVER:

- invent an image URL
- invent an Unsplash photo ID
- construct an Unsplash URL
- modify an Unsplash URL
- add parameters to an Unsplash URL
- remove parameters from an Unsplash URL
- change the domain of an Unsplash URL
- use an Unsplash URL from your own knowledge
- use a URL remembered from previous generations
- use an old image URL from Current code
- use random external image URLs
- use placeholder image services
- use images.unsplash.com URLs unless that exact URL was returned by image_search

If image_search returns:

https://images.unsplash.com/example

you MUST copy that exact URL.

Do not alter it.

===============================================================================
CURRENT CODE IMAGE RULE
===============================================================================

Current code may contain broken, stale, or invalid image URLs.

Treat all existing image URLs as UNTRUSTED.

If image_search is called:

- Replace old image URLs with URLs from image_search.
- Do not preserve old Unsplash URLs unless they exactly match a URL returned by image_search.
- Never copy an old photo ID.
- Never assume an existing image URL is valid.

===============================================================================
NO FAKE IMAGES
===============================================================================

Do not create fake Unsplash URLs.

Do not create fake image IDs.

Do not guess photo IDs.

Do not use random URLs.

Use only URLs supplied by image_search.

===============================================================================

CURRENT CODE:

${currentCode || "(No existing code was provided. Create the page from scratch.)"}

===============================================================================

USER REQUEST:

Update the content for:

${prompt}
`.trim();

    // -------------------------------------------------------------------------
    // Step 1
    // Initial OpenAI request
    // -------------------------------------------------------------------------

    const initialResponse =
      await openai.responses.create({
        model: "gpt-4.1-nano",

        stream: false,

        // Prevent multiple image_search calls.
        parallel_tool_calls: false,

        tools: [imageSearchTool],

        input: systemPrompt,
      });

    // -------------------------------------------------------------------------
    // Find image search calls
    // -------------------------------------------------------------------------

    const toolCalls =
      (initialResponse.output || []).filter(
        (item: any) =>
          item.type === "function_call"
      );

    // -------------------------------------------------------------------------
    // If model somehow doesn't call image_search
    // -------------------------------------------------------------------------

    if (toolCalls.length === 0) {
      let htmlText =
        initialResponse.output_text || "";

      const generatedImages =
        extractImageUrls(htmlText);

      if (generatedImages.length > 0) {
        console.warn(
          "Model generated images without calling image_search:",
          generatedImages
        );

        // Remove all unapproved images.
        htmlText =
          removeInvalidImageUrls(
            htmlText,
            new Set()
          );
      }

      return new Response(htmlText, {
        status: 200,

        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",

          "Cache-Control":
            "no-cache, no-transform",
        },
      });
    }

    // -------------------------------------------------------------------------
    // Only use the first tool call
    // -------------------------------------------------------------------------

    const toolCall =
      toolCalls[0] as any;

    if (
      !toolCall.call_id ||
      toolCall.name !== "image_search"
    ) {
      console.error(
        "Unexpected tool call:",
        toolCall
      );

      return new Response(
        JSON.stringify({
          error:
            "Unexpected tool call returned by OpenAI",
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

    // -------------------------------------------------------------------------
    // Parse tool arguments
    // -------------------------------------------------------------------------

    let args: {
      query: string;
    };

    try {
      const rawArguments =
        toolCall.arguments;

      args =
        typeof rawArguments === "string"
          ? JSON.parse(rawArguments)
          : rawArguments;

      if (
        !args ||
        typeof args.query !== "string" ||
        !args.query.trim()
      ) {
        throw new Error(
          "Invalid image_search query"
        );
      }

      args.query =
        args.query.trim();
    } catch (error) {
      console.error(
        "Failed to parse image_search arguments:",
        error
      );

      return new Response(
        JSON.stringify({
          error:
            "Invalid image search arguments",
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

    // -------------------------------------------------------------------------
    // Step 2
    // Search Unsplash
    // -------------------------------------------------------------------------

    let imageResults: any[] = [];

    try {
      imageResults =
        await searchUnsplash(
          args.query
        );

      console.log(
        `Unsplash search "${args.query}" returned ${imageResults.length} images`
      );
    } catch (error) {
      console.error(
        "Unsplash search failed:",
        error
      );

      imageResults = [];
    }

    // -------------------------------------------------------------------------
    // Allowed image URLs
    // -------------------------------------------------------------------------

    const allowedImageUrls =
      new Set<string>(
        imageResults
          .map(
            (image) => image.url
          )
          .filter(
            (url) =>
              typeof url === "string" &&
              url.length > 0
          )
      );

    console.log(
      "Allowed image count:",
      allowedImageUrls.size
    );

    // -------------------------------------------------------------------------
    // Step 3
    // Send exact Unsplash results back to OpenAI
    // -------------------------------------------------------------------------

    const finalResponse =
      await openai.responses.create({
        model: "gpt-5.5",

        stream: false,

        previous_response_id:
          initialResponse.id,

        input: [
          {
            type: "function_call_output",

            call_id:
              toolCall.call_id,

            output:
              JSON.stringify(
                imageResults
              ),
          },
        ],
      });

    // -------------------------------------------------------------------------
    // Generated HTML
    // -------------------------------------------------------------------------

    let htmlText =
      finalResponse.output_text || "";

    // -------------------------------------------------------------------------
    // Step 4
    // Validate every image URL
    // -------------------------------------------------------------------------

    const generatedImageUrls =
      extractImageUrls(htmlText);

    console.log(
      "Generated image count:",
      generatedImageUrls.length
    );

    const invalidImageUrls =
      findInvalidImageUrls(
        htmlText,
        allowedImageUrls
      );

    if (
      invalidImageUrls.length > 0
    ) {
      console.warn(
        "INVALID IMAGE URLS GENERATED:",
        invalidImageUrls
      );

      htmlText =
        removeInvalidImageUrls(
          htmlText,
          allowedImageUrls
        );
    }

    // -------------------------------------------------------------------------
    // Final logging
    // -------------------------------------------------------------------------

    console.log(
      "Final image count:",
      extractImageUrls(htmlText).length
    );

    // -------------------------------------------------------------------------
    // Step 5
    // Return HTML
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
    // -------------------------------------------------------------------------
    // Global error handler
    // -------------------------------------------------------------------------

    console.error(
      "API Route Error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Failed to generate page",

        message:
          error?.message ||
          "Unknown server error",
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