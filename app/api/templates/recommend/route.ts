import { NextRequest, NextResponse } from "next/server";

import { getRecommendedTemplates } from "@/lib/template-vector";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idea = typeof body?.idea === "string" ? body.idea : "";
    const limit = Number(body?.limit ?? 5);

    if (!idea.trim()) {
      return NextResponse.json(
        { error: "Idea is required." },
        { status: 400 },
      );
    }

    const matches = await getRecommendedTemplates(idea, Number.isFinite(limit) ? Math.max(1, Math.min(limit, 10)) : 5);

    return NextResponse.json({
      matches: matches.map(({ id, template, score }) => ({
        id,
        template,
        score,
      })),
    });
  } catch (error) {
    console.error("Template recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to find template recommendations." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const idea = searchParams.get("idea") ?? "";
  const limit = Number(searchParams.get("limit") ?? 5);

  if (!idea.trim()) {
    return NextResponse.json(
      { error: "Idea is required." },
      { status: 400 },
    );
  }

  const matches = await getRecommendedTemplates(idea, Number.isFinite(limit) ? Math.max(1, Math.min(limit, 10)) : 5);

  return NextResponse.json({
    matches: matches.map(({ id, template, score }) => ({
      id,
      template,
      score,
    })),
  });
}
