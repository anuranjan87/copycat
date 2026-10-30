import OpenAI from "openai";
import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const jobs = getStore("website-generation-jobs");

const UNSPLASH_API = "https://api.unsplash.com";
const UNSPLASH_SOURCE =
  process.env.UNSPLASH_UTM_SOURCE ||
  process.env.NEXT_PUBLIC_APP_NAME ||
  "7wingz";

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

type Usage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

type TextPatch = {
  oldText: string;
  newText: string;
};

type EditDecision =
  | { mode: "patch"; htmlPatches: TextPatch[] }
  | { mode: "full" };

function estimateCost(inputTokens: number, outputTokens: number): number {
  // UI estimate only; update rates when model pricing changes.
  return Number(
    (
      (inputTokens / 1_000_000) * 0.25 +
      (outputTokens / 1_000_000) * 2.0
    ).toFixed(6)
  );
}

function jsonError(message: string, status = 500): Response {
  return Response.json({ success: false, error: message }, { status });
}

function createJobId(): string {
  return crypto.randomUUID();
}

function isValidJobId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

function cleanJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseEditDecision(raw: string): EditDecision {
  const value = JSON.parse(cleanJson(raw)) as Partial<EditDecision>;

  if (value.mode === "full") return { mode: "full" };

  if (
    value.mode !== "patch" ||
    !Array.isArray(value.htmlPatches) ||
    value.htmlPatches.length === 0 ||
    value.htmlPatches.length > 30
  ) {
    throw new Error("AI returned an invalid edit plan.");
  }

  const allPatches = value.htmlPatches as TextPatch[];
  if (
    allPatches.some(
      (patch) =>
        !patch ||
        typeof patch.oldText !== "string" ||
        patch.oldText.length === 0 ||
        typeof patch.newText !== "string"
    )
  ) {
    throw new Error("AI returned an invalid patch.");
  }

  return { mode: "patch", htmlPatches: value.htmlPatches as TextPatch[] };
}

function applyTextPatches(source: string, patches: TextPatch[]): string {
  if (patches.length === 0) return source;

  const replacements = patches.map((patch) => {
    const first = source.indexOf(patch.oldText);
    if (
      first < 0 ||
      source.indexOf(patch.oldText, first + patch.oldText.length) !== -1
    ) {
      throw new Error(
        "Edit target is missing or ambiguous. No changes were applied."
      );
    }
    return { ...patch, index: first };
  });

  const ascending = [...replacements].sort((a, b) => a.index - b.index);
  for (let i = 1; i < ascending.length; i++) {
    const previous = ascending[i - 1];
    const current = ascending[i];
    if (previous.index + previous.oldText.length > current.index) {
      throw new Error("AI edits overlap. No changes were applied.");
    }
  }

  let result = source;
  for (const patch of [...replacements].sort((a, b) => b.index - a.index)) {
    result =
      result.slice(0, patch.index) +
      patch.newText +
      result.slice(patch.index + patch.oldText.length);
  }

  if (!result.trim()) throw new Error("Edit resulted in empty source.");
  return result;
}

async function updateJob(jobId: string, data: Record<string, unknown>) {
  await jobs.setJSON(jobId, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

async function searchUnsplash(query: string): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY is not configured.");
    return [];
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=20`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.warn(`Unsplash search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.results || [])
      .filter((photo: any) => typeof photo?.urls?.regular === "string")
      .map((photo: any, index: number) => ({
        id: index + 1,
        photoId: photo.id || "",
        url: photo.urls.regular,
        thumb: photo.urls.small || photo.urls.regular,
        alt: photo.alt_description || photo.description || query,
        photographer: photo.user?.name || "Unsplash photographer",
        photographerUrl: photo.user?.links?.html || "https://unsplash.com",
        unsplashUrl: photo.links?.html || "https://unsplash.com",
        downloadLocation: photo.links?.download_location || "",
      }));
  } catch (error) {
    console.warn("Unsplash search failed:", error);
    return [];
  }
}

async function createImageQuery(prompt: string): Promise<string> {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-nano",
      input: `Create one concise Unsplash search query for the website request.
Return only the query, no explanation.

Website request:
${prompt}`,
    });

    return (response.output_text || prompt)
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 150);
  } catch {
    return prompt.trim().slice(0, 150);
  }
}

function addUtm(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["unsplash.com", "www.unsplash.com"].includes(parsed.hostname)) {
      return url;
    }
    parsed.searchParams.set("utm_source", UNSPLASH_SOURCE);
    parsed.searchParams.set("utm_medium", "referral");
    return parsed.toString();
  } catch {
    return url;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractImageUrls(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(
    (match) => match[1]
  );
}

function validateImageUrls(html: string, allowedUrls: Set<string>): string {
  const transparentPixel =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (full, prefix, url, suffix) =>
      allowedUrls.has(url)
        ? full
        : `${prefix}${transparentPixel}${suffix}`
  );
}

function addImageAttribution(
  html: string,
  images: UnsplashImage[]
): string {
  if (!images.length) return html;

  const byUrl = new Map(images.map((image) => [image.url, image]));
  html = html.replace(
    /<p\b[^>]*data-unsplash-attribution=["']true["'][^>]*>[\s\S]*?<\/p>/gi,
    ""
  );

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (full, prefix, url, suffix) => {
      const image = byUrl.get(url);
      if (!image) return full;

      const attribution = `<p data-unsplash-attribution="true" class="mt-1 text-xs text-gray-500">Photo by <a href="${escapeHtml(
        addUtm(image.photographerUrl)
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        image.photographer
      )}</a> on <a href="${escapeHtml(
        addUtm(image.unsplashUrl)
      )}" target="_blank" rel="noopener noreferrer">Unsplash</a></p>`;

      return `${prefix}${url}${suffix}${attribution}`;
    }
  );
}

async function trackUnsplashDownload(downloadLocation: string): Promise<void> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || !downloadLocation) return;

  try {
    const parsed = new URL(downloadLocation);
    if (parsed.origin !== UNSPLASH_API) return;
    parsed.searchParams.set("client_id", accessKey);

    const response = await fetch(parsed.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn(`Unsplash download tracking failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("Unsplash download tracking failed:", error);
  }
}

function buildImageLibrary(images: UnsplashImage[]): string {
  if (!images.length) return "NO IMAGES WERE AVAILABLE.";
  return images
    .map(
      (image) => `
IMAGE ${image.id}
PHOTO ID: ${image.photoId}
URL: ${image.url}
ALT: ${image.alt}
PHOTOGRAPHER: ${image.photographer}
PHOTOGRAPHER URL: ${image.photographerUrl}
UNSPLASH URL: ${image.unsplashUrl}
DOWNLOAD LOCATION: ${image.downloadLocation}`.trim()
    )
    .join("\n\n");
}

async function runGeneration(request: Request): Promise<void> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    console.error("Invalid JSON request body.");
    return;
  }

  const jobId = isValidJobId(body?.jobId) ? body.jobId : createJobId();
  // Single-file architecture: inline data object + React/Babel JSX live in currentCode.
  const currentCode =
    typeof body?.currentCode === "string"
      ? body.currentCode
      : typeof body?.html === "string"
        ? body.html
        : "";
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  await updateJob(jobId, {
    status: "processing",
    stage: "starting",
    createdAt: new Date().toISOString(),
  });

  if (!prompt) {
    await updateJob(jobId, {
      status: "failed",
      error: "Prompt is required.",
      failedAt: new Date().toISOString(),
    });
    return;
  }

  const startedAt = Date.now();
  let planningInputTokens = 0;
  let planningOutputTokens = 0;
  let planningTotalTokens = 0;

  try {
    // Existing websites are edited incrementally first. Copy edits should target the inline data object.
    if (currentCode.trim()) {
      await updateJob(jobId, { status: "processing", stage: "planning_edits" });

      const decisionResponse = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: `
You are a precise source-code editor for 7Wingz. The website is ONE complete HTML document.
It contains a JavaScript data object such as const data = { ... }, plus React JSX in a <script type="text/babel"> block. Content is rendered dynamically through expressions like {data.hero.heading}.

Return exactly one JSON object and nothing else.
For a safe localized edit, return:
{"mode":"patch","htmlPatches":[{"oldText":"exact unique source text","newText":"replacement source text"}]}
For a broad redesign, major structural change, or unsafe patch, return:
{"mode":"full"}

Rules:
- This is a SINGLE FILE. Never create or return a separate data.js file.
- Prefer the smallest safe edit.
- For copy/content changes, patch the relevant value inside the existing const data object whenever possible.
- For layout, responsive behavior, styling, or markup changes, patch JSX/Tailwind markup.
- For a new section, update the inline data object and JSX only as necessary.
- Do not hardcode copy in JSX if it belongs in the data object.
- Preserve the existing data schema, React/Babel/Tailwind scripts, data bindings, event handlers, IDs, classes, forms, image URLs, and unrelated code.
- Never rename or replace data keys unless explicitly requested.
- Every oldText must be copied exactly and occur exactly once in the complete HTML source.
- Use one patch per localized change; if uncertain, choose full mode.
- Do not return explanations or markdown fences.

CURRENT SINGLE-FILE HTML:
${currentCode}

USER REQUEST:
${prompt}
        `.trim(),
      });

      planningInputTokens = decisionResponse.usage?.input_tokens ?? 0;
      planningOutputTokens = decisionResponse.usage?.output_tokens ?? 0;
      planningTotalTokens = decisionResponse.usage?.total_tokens ?? 0;

      const decision = parseEditDecision(decisionResponse.output_text || "");

      if (decision.mode === "patch") {
        const html = applyTextPatches(currentCode, decision.htmlPatches);

        const usage: Usage = {
          inputTokens: planningInputTokens,
          outputTokens: planningOutputTokens,
          totalTokens: planningTotalTokens || planningInputTokens + planningOutputTokens,
          estimatedCostUsd: estimateCost(planningInputTokens, planningOutputTokens),
        };

        await updateJob(jobId, {
          status: "completed",
          stage: "completed",
          mode: "patch",
          html,
          usage,
          durationMs: Date.now() - startedAt,
          imageCount: 0,
          completedAt: new Date().toISOString(),
        });
        return;
      }
    }

    // Full generation is reserved for broad changes or new websites.
    await updateJob(jobId, { status: "processing", stage: "image_query" });
    const imageQuery = await createImageQuery(prompt);
    const imageResults = await searchUnsplash(imageQuery);
    const allowedImageUrls = new Set(imageResults.map((image) => image.url));

    await updateJob(jobId, {
      status: "processing",
      stage: "generating",
      imageQuery,
    });

    const systemPrompt = `
You are an expert HTML, Tailwind CSS, React 18, and browser-Babel developer building websites for 7Wingz.

Return exactly one JSON object: {"html":"complete updated HTML document as a string"}.
No markdown fences or commentary.

SINGLE-FILE ARCHITECTURE:
- Return one complete HTML document. Do not return a separate data.js file.
- The document contains a const data = { ... } object in a regular <script> block and React JSX in a <script type="text/babel"> block.
- Store editable website copy, labels, service descriptions, prices, testimonials, contact details, alt text, and URLs in the existing data object whenever appropriate.
- Render content through data bindings such as {data.hero.heading}; keep data keys and JSX references synchronized.
- Preserve the existing data schema and key names whenever possible.
- For content-only requests, change data values and leave JSX/layout unchanged.
- For design/layout requests, change JSX/Tailwind classes as needed while preserving data bindings and behavior.
- For new sections, add the required data and JSX without unnecessarily rebuilding the page.
- Preserve React, ReactDOM, Babel, Tailwind setup, event handlers, forms, IDs, accessibility, and unrelated code.
- If existing HTML is supplied, update it instead of rebuilding unrelated parts.
- Keep the page responsive and valid as a complete HTML document.

IMAGE RULES:
- Only use image URLs supplied in the image library below for newly introduced images.
- Never invent, construct, or modify image URLs.
- If no image results are available, preserve existing image URLs and do not add fabricated ones.
- Each new Unsplash image must have attribution immediately after it, using supplied photographer and Unsplash page URLs.
- Do not duplicate existing attribution.

UNSPLASH IMAGE LIBRARY:
${buildImageLibrary(imageResults)}

CURRENT SINGLE-FILE HTML:
${currentCode || "(No existing HTML. Create a complete single-file HTML website with an inline data object and React/Babel rendering.)"}

USER REQUEST:
${prompt}
    `.trim();

    const finalResponse = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: systemPrompt,
    });

    let result: { html?: string };
    try {
      result = JSON.parse(cleanJson(finalResponse.output_text || ""));
    } catch {
      throw new Error("AI returned invalid JSON for the full website update.");
    }

    let html = typeof result.html === "string" ? result.html.trim() : "";
    if (!html) {
      throw new Error("AI must return a complete HTML document in the html property.");
    }

    html = html.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!/<html\b/i.test(html) || !/<body\b/i.test(html)) {
      throw new Error("AI response is not a complete HTML document.");
    }

    const invalidImageUrls = extractImageUrls(html).filter(
      (url) => !allowedImageUrls.has(url) && !extractImageUrls(currentCode).includes(url)
    );
    if (invalidImageUrls.length) {
      html = validateImageUrls(html, new Set([
        ...allowedImageUrls,
        ...extractImageUrls(currentCode),
      ]));
    }

    html = addImageAttribution(html, imageResults);

    const finalImageUrls = extractImageUrls(html);
    const usedImages = imageResults.filter(
      (image) => finalImageUrls.includes(image.url) && image.downloadLocation
    );
    await Promise.allSettled(
      usedImages.map((image) => trackUnsplashDownload(image.downloadLocation))
    );

    const finalUsage = finalResponse.usage;
    const inputTokens =
      (finalUsage?.input_tokens ?? 0) + planningInputTokens;
    const outputTokens =
      (finalUsage?.output_tokens ?? 0) + planningOutputTokens;
    const totalTokens =
      (finalUsage?.total_tokens ?? 0) +
      (planningTotalTokens || planningInputTokens + planningOutputTokens);

    const usage: Usage = {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsd: estimateCost(inputTokens, outputTokens),
    };

    await updateJob(jobId, {
      status: "completed",
      stage: "completed",
      mode: "full",
      html,
      usage,
      durationMs: Date.now() - startedAt,
      imageCount: usedImages.length,
      completedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI generation failed:", error);
    await updateJob(jobId, {
      status: "failed",
      error: error?.message || "AI generation failed.",
      failedAt: new Date().toISOString(),
    });
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  // The frontend can use this ID to poll the background job.
  let body: any;
  try {
    body = await request.clone().json();
  } catch {
    return jsonError("Invalid JSON request body.", 400);
  }

  const jobId = isValidJobId(body?.jobId) ? body.jobId : createJobId();
  // Return the ID immediately so the client can poll the job.
  // The existing frontend should pass its own jobId if it already creates one.
  await runGeneration(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ ...body, jobId }),
    })
  );

  return Response.json({ success: true, jobId }, { status: 202 });
}

export const config: Config = {
  path: "/api/ai/generate",
  method: "POST",
  background: true,
};
