import { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

const sql = neon(process.env.POSTGRES_URL!);

function isAccountDataRequest(message: string) {
  return /\b(?:my\s+)?account\s+(?:status|data|details|plan|subscription|credits)\b/i.test(message) ||
    /\b(?:what(?:'s| is)\s+)?my\s+(?:subscription|plan|account)\b/i.test(message);
}

async function getAuthenticatedAccountData() {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: 401,
      body: { ok: false, error: "Sign in to view your account details." },
    };
  }

  const aliasRows = await sql.query(
    `SELECT name FROM alias WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  const username = String(aliasRows[0]?.name || "").trim();

  if (!username) {
    return {
      status: 200,
      body: {
        ok: true,
        type: "chat",
        reply: "I couldn't find a website linked to your signed-in account yet. Your account is active, but there isn't a website username attached to it.",
        account: { websiteLinked: false },
      },
    };
  }

  const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const websiteTable = `${safeUsername}_website`;
  const [subscriptionTable, websiteTableCheck] = await Promise.all([
    sql.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') AS exists`,
    ),
    sql.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) AS exists`,
      [websiteTable],
    ),
  ]);

  let subscription: { status?: string; expires_at?: string | Date | null } | null = null;

  if (subscriptionTable[0]?.exists) {
    const rows = await sql.query(
      `SELECT status, expires_at FROM subscriptions WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    subscription = rows[0] || null;
  }

  let published = false;
  if (websiteTableCheck[0]?.exists) {
    const actionColumn = await sql.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'action') AS exists`,
      [websiteTable],
    );

    if (actionColumn[0]?.exists) {
      const publishedRows = await sql.query(
        `SELECT EXISTS (SELECT 1 FROM ${websiteTable} WHERE action = 'published') AS exists`,
      );
      published = Boolean(publishedRows[0]?.exists);
    }
  }

  const expiryDate = subscription?.expires_at
    ? new Date(subscription.expires_at)
    : null;
  const isPremium =
    subscription?.status === "premium" &&
    (!expiryDate || expiryDate.getTime() > Date.now());
  const plan = isPremium ? "Premium" : "Free";
  const expiresAt = expiryDate?.toLocaleDateString() || null;
  const websiteStatus = published ? "Published" : "Not published";
  const reply = `Here's your account snapshot:\n\n- **Plan:** ${plan}${expiresAt ? ` (expires ${expiresAt})` : ""}\n- **Website:** ${username}\n- **Website status:** ${websiteStatus}`;

  return {
    status: 200,
    body: {
      ok: true,
      type: "chat",
      reply,
      account: {
        websiteLinked: true,
        username,
        plan,
        subscriptionStatus: isPremium ? "premium" : "free",
        expiresAt: subscription?.expires_at || null,
        websitePublished: published,
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return Response.json(
        { ok: false, error: "Message is required." },
        { status: 400 },
      );
    }

    if (isAccountDataRequest(message)) {
      const result = await getAuthenticatedAccountData();
      return Response.json(result.body, { status: result.status });
    }

    const upstreamResponse = await fetch(
      new URL("/api/unsplash-agent", request.url),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(request.headers.get("cookie")
            ? { cookie: request.headers.get("cookie") as string }
            : {}),
          ...(request.headers.get("authorization")
            ? { authorization: request.headers.get("authorization") as string }
            : {}),
        },
        body: JSON.stringify(body),
      },
    );
    const responseText = await upstreamResponse.text();

    if (!responseText.trim()) {
      return Response.json(
        { ok: false, error: "The assistant returned an empty response. Please try again." },
        { status: 502 },
      );
    }

    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return Response.json(
        { ok: false, error: "The assistant returned an invalid response. Please try again." },
        { status: 502 },
      );
    }

    return Response.json(responseData, { status: upstreamResponse.status });
  } catch (error) {
    console.error("Assistant request failed:", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process this request.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // -----------------------------
    // GET USERNAME
    // -----------------------------

    const username =
      request.nextUrl.searchParams.get("username")?.trim() || "";

    if (!username) {
      return Response.json(
        {
          ok: false,
          error: "Username is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // SAFE TABLE NAME
    // -----------------------------

    const safeUsername = username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (!safeUsername) {
      return Response.json(
        {
          ok: false,
          error: "Invalid username.",
        },
        { status: 400 }
      );
    }

    const tableName = `${safeUsername}_website`;

    // -----------------------------
    // CHECK TABLE EXISTS
    // -----------------------------

    const tableCheck = await sql.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = $1
      ) AS exists
      `,
      [tableName]
    );

    if (!tableCheck[0]?.exists) {
      return Response.json({
        ok: true,
        username,
        history: [],
        latest: null,
      });
    }

    // -----------------------------
    // GET LAST 10 PUBLISHED RECORDS
    // -----------------------------

    const rows = await sql.query(
      `
      SELECT
        id,
        code,
        code_script,
        code_data,
        created_at
      FROM ${tableName}
      WHERE action = 'published'
      ORDER BY created_at DESC
      LIMIT 10
      `
    );

    // -----------------------------
    // FORMAT HISTORY
    // -----------------------------

    const history = rows.map((row: any) => ({
      id: row.id,
      html: row.code || "",
      script: row.code_script || "",
      data: row.code_data || "",
      createdAt: row.created_at,
    }));

    // -----------------------------
    // LATEST PUBLISHED WEBSITE
    // -----------------------------

    const latest = history.length > 0
      ? history[0]
      : null;

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return Response.json({
      ok: true,

      username,

      // Last 10 published versions
      history,

      // Most recent published version
      latest,

      // Just the latest data.js
      data: latest?.data || "",
    });
  } catch (error) {
    console.error("Published history error:", error);

    return Response.json(
      {
        ok: false,
        error: "Failed to load published website history.",
      },
      { status: 500 }
    );
  }
}