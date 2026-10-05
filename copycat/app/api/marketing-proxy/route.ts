import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const MARKETING_API = "https://marketing.7wingz.com";
const sql = neon(process.env.POSTGRES_URL!);

type CampaignRecord = {
  resourceName: string;
  campaignId: string;
  campaignName: string;
};

async function ensureCampaignTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS google_ads_campaigns (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      customer_id VARCHAR(50),
      campaign_id VARCHAR(100) NOT NULL,
      resource_name VARCHAR(255) NOT NULL UNIQUE,
      campaign_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS google_ads_campaigns_user_id_idx
    ON google_ads_campaigns(user_id)
  `;
}

function isCampaignObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function extractCampaignRecords(value: unknown): CampaignRecord[] {
  const records: CampaignRecord[] = [];

  const visit = (candidate: unknown) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }

    if (!isCampaignObject(candidate)) return;

    const resourceName = String(
      candidate.resourceName ||
        candidate.campaignResourceName ||
        candidate.resource_name ||
        "",
    ).trim();

    if (resourceName) {
      const campaignId = String(
        candidate.id || resourceName.split("/").pop() || "",
      );

      records.push({
        resourceName,
        campaignId,
        campaignName: String(
          candidate.name || candidate.campaignName || "Google Ads campaign",
        ),
      });

      return;
    }

    Object.values(candidate).forEach(visit);
  };

  visit(value);

  return records.filter(
    (record, index) =>
      records.findIndex(
        (item) => item.resourceName === record.resourceName,
      ) === index,
  );
}

async function getAuthenticatedUserId() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

  return userId;
}

async function getOwnedResourceNames(userId: string) {
  const rows = await sql`
    SELECT resource_name
    FROM google_ads_campaigns
    WHERE user_id = ${userId}
  `;

  return new Set(rows.map((row) => String(row.resource_name)));
}

async function ownsCampaign(userId: string, resourceName: string) {
  const rows = await sql`
    SELECT id
    FROM google_ads_campaigns
    WHERE user_id = ${userId}
      AND resource_name = ${resourceName}
    LIMIT 1
  `;

  return rows.length > 0;
}

async function saveCampaignOwnership(
  userId: string,
  records: CampaignRecord[],
) {
  for (const record of records) {
    await sql`
      INSERT INTO google_ads_campaigns (
        user_id,
        customer_id,
        campaign_id,
        resource_name,
        campaign_name
      )
      VALUES (
        ${userId},
        ${process.env.GOOGLE_ADS_CUSTOMER_ID || null},
        ${record.campaignId},
        ${record.resourceName},
        ${record.campaignName}
      )
      ON CONFLICT (resource_name)
      DO UPDATE SET
        campaign_name = EXCLUDED.campaign_name,
        updated_at = CURRENT_TIMESTAMP
    `;
  }
}

function getRequestResourceName(body: unknown) {
  if (!isCampaignObject(body)) return "";

  return String(
    body.campaignResourceName || body.resourceName || "",
  ).trim();
}

async function proxyRequest(
  request: NextRequest,
  method: "GET" | "POST"
) {
  try {
    const userId = await getAuthenticatedUserId();

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

    await ensureCampaignTable();

    const targetUrl = `${MARKETING_API}${path}`;

    console.log("========================================");
    console.log("MARKETING API PROXY");
    console.log("Method:", method);
    console.log("Target:", targetUrl);
    console.log("========================================");

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    const bodyText = method === "POST" ? await request.text() : "";

    if (method === "POST") {
      headers["Content-Type"] =
        request.headers.get("content-type") ||
        "application/json";

      console.log("Request body:", bodyText);
    }

    let parsedBody: unknown = null;

    if (bodyText) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        return NextResponse.json(
          { success: false, error: "Request body must be valid JSON." },
          { status: 400 },
        );
      }
    }

    const isCampaignList =
      method === "GET" && path === "/api/google-ads/campaigns";
    const isCampaignCreate =
      method === "POST" && path === "/api/google-ads/create-campaign";
    const isCampaignMutation =
      method === "POST" &&
      (path === "/api/google-ads/campaigns/status" ||
        path === "/api/google-ads/campaigns/delete");

    if (isCampaignMutation) {
      const resourceName = getRequestResourceName(parsedBody);

      if (!resourceName || !(await ownsCampaign(userId, resourceName))) {
        return NextResponse.json(
          { success: false, error: "Campaign does not belong to your account." },
          { status: 404 },
        );
      }
    }

    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body: method === "POST" ? bodyText : undefined,
      cache: "no-store",
      redirect: "follow",
    });

    const responseText = await upstreamResponse.text();

   

    let responseBody: unknown = responseText;

    try {
      responseBody = responseText ? JSON.parse(responseText) : {};
    } catch {
      // Preserve non-JSON upstream errors as text.
    }

    if (isCampaignList && upstreamResponse.ok && isCampaignObject(responseBody)) {
      const ownedResources = await getOwnedResourceNames(userId);
      const campaigns = Array.isArray(responseBody.campaigns)
        ? responseBody.campaigns.filter((campaign) => {
            const records = extractCampaignRecords(campaign);
            return records.some((record) => ownedResources.has(record.resourceName));
          })
        : [];

      responseBody = {
        ...responseBody,
        campaigns,
      };
    }

    if (isCampaignCreate && upstreamResponse.ok) {
      await saveCampaignOwnership(
        userId,
        extractCampaignRecords(responseBody),
      );
    }

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
    return new NextResponse(
      typeof responseBody === "string"
        ? responseBody
        : JSON.stringify(responseBody),
      {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
      },
    );
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