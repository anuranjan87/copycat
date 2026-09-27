import OpenAI from "openai";
import { Redis } from "@upstash/redis";
import { neon } from "@neondatabase/serverless";

import { templatesMeta, type TemplateMeta } from "@/lib/categoryList";

const sql = neon(process.env.POSTGRES_URL!);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface TemplateCatalogEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  mood: string;
  tags: string[];
  updatedAt: string;
}

export interface TemplateVectorMatch {
  id: string;
  template: TemplateMeta;
  score: number;
}

const REDIS_TEMPLATE_CATALOG_KEY = "website_templates:catalog";
const REDIS_TEMPLATE_TTL_SECONDS = 60 * 60 * 12;

const categoryKeywords: Record<string, string[]> = {
  "Landing Page": [
    "landing page",
    "hero section",
    "cta",
    "lead generation",
    "product launch",
    "homepage",
    "offer",
    "sales funnel",
    "marketing",
  ],
  "Entrepreneurs & Startups": [
    "startup",
    "founder",
    "saas",
    "product",
    "launch",
    "pitch",
    "growth",
    "innovation",
    "company",
  ],
  "Professional Services": [
    "consulting",
    "agency",
    "business",
    "service",
    "professional",
    "strategy",
    "expert",
    "client acquisition",
  ],
  "Job Search": [
    "resume",
    "cv",
    "portfolio",
    "applicant",
    "job search",
    "career",
    "profile",
    "hire me",
  ],
  "Blog & Content": [
    "blog",
    "content",
    "writing",
    "editorial",
    "storytelling",
    "articles",
    "insights",
    "newsletter",
  ],
  "AI Agent": [
    "ai",
    "agent",
    "automation",
    "assistant",
    "workflow",
    "chatbot",
    "software",
  ],
  "UI Components": [
    "ui",
    "components",
    "design system",
    "widgets",
    "frontend",
    "interface",
    "ux",
  ],
  Ecommerce: [
    "ecommerce",
    "store",
    "shop",
    "products",
    "cart",
    "checkout",
    "retail",
    "catalog",
  ],
};

const templateVectorCache = new Map<string, number[]>();

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function inferTemplateEntryFromStaticMeta(template: TemplateMeta): TemplateCatalogEntry {
  const category = template.category || "Landing Page";
  const tags = uniqueStrings([
    template.title,
    template.description,
    template.mood,
    category,
    ...(categoryKeywords[category] ?? []),
  ]);

  return {
    id: String(template.id),
    title: template.title,
    description: template.description,
    category,
    mood: template.mood,
    tags,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchTemplateCatalogFromDatabase(): Promise<TemplateCatalogEntry[]> {
  try {
    const rows = await sql.query(
      `
      SELECT id, code, code_script, code_data
      FROM website_template
      ORDER BY id ASC
      `,
    );

    const rowEntries = rows.map((row: any, index: number) => {
      const fallback =
        templatesMeta.find((template) => String(template.id) === String(row.id)) ||
        templatesMeta[index % templatesMeta.length] ||
        templatesMeta[0];

      const title = fallback?.title ?? `Template ${row.id}`;
      const description = fallback?.description ?? "Website template";
      const category = fallback?.category ?? "Landing Page";
      const mood = fallback?.mood ?? "Landing page";

      return {
        id: String(row.id ?? fallback?.id ?? index + 1),
        title,
        description,
        category,
        mood,
        tags: uniqueStrings([
          title,
          description,
          mood,
          category,
          ...(categoryKeywords[category] ?? []),
        ]),
        updatedAt: new Date().toISOString(),
      };
    });

    if (rowEntries.length > 0) {
      return rowEntries;
    }

    return templatesMeta.map((template) => inferTemplateEntryFromStaticMeta(template));
  } catch (error) {
    console.error("Failed to fetch website_template catalog:", error);
    return templatesMeta.map((template) => inferTemplateEntryFromStaticMeta(template));
  }
}

async function syncTemplateCatalogToRedis(): Promise<TemplateCatalogEntry[]> {
  const catalog = await fetchTemplateCatalogFromDatabase();

  if (catalog.length > 0) {
    await redis.set(REDIS_TEMPLATE_CATALOG_KEY, catalog, {
      ex: REDIS_TEMPLATE_TTL_SECONDS,
    });
  }

  return catalog;
}

async function getTemplateCatalog(): Promise<TemplateCatalogEntry[]> {
  const cached = await redis.get<TemplateCatalogEntry[]>(REDIS_TEMPLATE_CATALOG_KEY);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  return syncTemplateCatalogToRedis();
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (!denominator) {
    return 0;
  }

  return dot / denominator;
}

function fallbackKeywordScore(idea: string, entry: TemplateCatalogEntry): number {
  const normalizedIdea = normalizeText(idea);
  const templateText = normalizeText(
    [
      entry.title,
      entry.description,
      entry.mood,
      entry.category,
      ...(entry.tags ?? []),
    ].join(" "),
  );

  const ideaWords = normalizedIdea.split(" ").filter(Boolean);
  if (!ideaWords.length) {
    return 0;
  }

  let matches = 0;
  for (const word of ideaWords) {
    if (!word || word.length < 2) continue;
    if (templateText.includes(word)) {
      matches += 1;
    }
  }

  return matches / ideaWords.length;
}

async function getEmbeddingVector(text: string): Promise<number[]> {
  const key = normalizeText(text);
  if (templateVectorCache.has(key)) {
    return templateVectorCache.get(key) ?? [];
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const fallbackVector = new Array(1536).fill(0);
    const words = normalizeText(text).split(" ").filter(Boolean);
    for (let i = 0; i < words.length; i += 1) {
      const index = words[i].charCodeAt(0) % 1536;
      fallbackVector[index] += 1;
    }
    templateVectorCache.set(key, fallbackVector);
    return fallbackVector;
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const vector = response.data[0]?.embedding ?? [];
    templateVectorCache.set(key, vector);
    return vector;
  } catch (error) {
    console.error("Template embedding generation failed:", error);
    const fallbackVector = new Array(1536).fill(0);
    const words = normalizeText(text).split(" ").filter(Boolean);
    for (let i = 0; i < words.length; i += 1) {
      const index = words[i].charCodeAt(0) % 1536;
      fallbackVector[index] += 1;
    }
    templateVectorCache.set(key, fallbackVector);
    return fallbackVector;
  }
}

export async function indexTemplateMetadata(): Promise<void> {
  await syncTemplateCatalogToRedis();
}

export async function getRecommendedTemplates(
  idea: string,
  limit = 5,
): Promise<TemplateVectorMatch[]> {
  const safeIdea = idea.trim();

  if (!safeIdea) {
    return templatesMeta.slice(0, limit).map((template) => ({
      id: template.id,
      template,
      score: 1,
    }));
  }

  const catalog = await getTemplateCatalog();
  if (!catalog.length) {
    return [];
  }

  const ideaVector = await getEmbeddingVector(safeIdea);

  const scored = await Promise.all(
    catalog.map(async (entry) => {
      const entryText = [
        entry.title,
        entry.description,
        entry.mood,
        entry.category,
        ...(entry.tags ?? []),
      ].join(" ");

      const templateVector = await getEmbeddingVector(entryText);
      const keywordScore = fallbackKeywordScore(safeIdea, entry);
      const vectorScore = cosineSimilarity(ideaVector, templateVector);

      return {
        id: entry.id,
        template: {
          id: entry.id,
          localImage: templatesMeta.find((template) => String(template.id) === entry.id)?.localImage ?? "/1.png",
          title: entry.title,
          description: entry.description,
          mood: entry.mood,
          category: entry.category,
        },
        score: Math.max(vectorScore, keywordScore),
      } satisfies TemplateVectorMatch;
    }),
  );

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}
