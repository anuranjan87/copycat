import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Domain is required." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      domain,
      available: false,
      error:
        "Domain availability checks are disabled because the GoDaddy integration was removed. The env vars remain for future configuration only.",
    },
    { status: 410 },
  );
}
