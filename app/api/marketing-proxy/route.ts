import { NextRequest, NextResponse } from "next/server";

const MARKETING_API = "https://marketing.7wingz.com";

async function proxyRequest(
  request: NextRequest,
  method: "GET" | "POST"
) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path || !path.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid marketing API path",
        },
        { status: 400 }
      );
    }

    const targetUrl = `${MARKETING_API}${path}`;

    console.log("========================================");
    console.log("MARKETING API PROXY");
    console.log("Method:", method);
    console.log("Target:", targetUrl);
    console.log("========================================");

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    let body: string | undefined;

    if (method === "POST") {
      body = await request.text();

      headers["Content-Type"] =
        request.headers.get("content-type") ||
        "application/json";

      console.log("Request body:", body);
    }

    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "follow",
    });

    const responseText = await upstreamResponse.text();

    console.log("========================================");
    console.log("MARKETING API RESPONSE");
    console.log("Status:", upstreamResponse.status);
    console.log("OK:", upstreamResponse.ok);
    console.log("Content-Type:", upstreamResponse.headers.get("content-type"));
    console.log("Response:", responseText);
    console.log("========================================");

    const contentType =
      upstreamResponse.headers.get("content-type") ||
      "application/json; charset=utf-8";

    /*
     * IMPORTANT:
     * Return the upstream status and body unchanged.
     *
     * This allows page.tsx to see the REAL error returned by
     * marketing.7wingz.com.
     */
    return new NextResponse(responseText, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("========================================");
    console.error("MARKETING API PROXY ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect to marketing.7wingz.com",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST");
}