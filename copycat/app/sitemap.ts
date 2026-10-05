// app/sitemap.ts

import type { MetadataRoute } from "next";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

const baseUrl = "https://7wings.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicPages = [
    "/",
    "/blogs",
    "/docs",
    "/home",
    "/lander",
    "/marketing",
    "/pricing",
  ];

  const blogPages = [
    "/blog/healthy-oils",
    "/blog/image-hosting",
    "/blog/ios-security-article",
    "/blog/learn_html",
    "/blog/nextjs-frontend-or-backend",
    "/blog/one-click-deployment",
    "/blog/pair-programming",
    "/blog/seo-led-product-development",
    "/blog/set-margin",
    "/blog/simplifying-product-development",
    "/blog/software-design-pattern",
    "/blog/startup-lessons",
    "/blog/tailwind_css_tools",
    "/blog/tailwind-gradient",
    "/blog/tailwind-playground",
    "/blog/test-driven-development",
    "/blog/top_ai_tools",
    "/blog/ui-ux-artical",
    "/blog/ui-ux-interview-prep",
    "/blog/usability",
    "/blog/user-personas",
    "/blog/ux-designer-india",
    "/blog/ux-designer-russia",
    "/blog/ux-designer-usa",
    "/blog/waterfall-model",
    "/blog/web-dev-trends-2025",
    "/blog/websites-for-tailwind-css-buttons",
  ];

  const aliases = await sql`
    SELECT name, created_at
    FROM alias
    WHERE name IS NOT NULL
    ORDER BY created_at DESC
  `;

  return [
    // Public fixed pages
    ...publicPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
    })),

    // Public blog pages
    ...blogPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // Public username / alias pages
    ...aliases.map((alias) => ({
      url: `${baseUrl}/${alias.name}`,
      lastModified: alias.created_at
        ? new Date(alias.created_at)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}