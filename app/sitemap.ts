// app/sitemap.ts

import { MetadataRoute } from "next";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://7wings.com";

  const aliases = await sql`
    SELECT name, created_at
    FROM alias
    ORDER BY created_at DESC
  `;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },

    ...aliases.map((alias: any) => ({
      url: `${baseUrl}/${alias.name}`,
      lastModified: alias.created_at ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}