import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getSubscription } from "@/lib/website-actions";

const DAILY_AI_LIMIT = 2;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function getUsageKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `ai-daily-usage:${userId}:${today}`;
}

function getTTLUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);

  return Math.max(
    60,
    Math.floor((midnight.getTime() - now.getTime()) / 1000)
  );
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const subscription = await getSubscription(userId);
    const premium = Boolean(subscription?.isPremium);

    if (premium) {
      return NextResponse.json({
        premium: true,
        usage: 0,
        limit: DAILY_AI_LIMIT,
      });
    }

    const key = getUsageKey(userId);

    const usage = (await redis.get<number>(key)) ?? 0;

    return NextResponse.json({
      premium: false,
      usage,
      limit: DAILY_AI_LIMIT,
    });
  } catch (error) {
    console.error("GET /api/ai/usage failed:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch AI usage",
        code: "USAGE_CHECK_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (body?.action !== "reserve") {
      return NextResponse.json(
        { error: "Invalid action", code: "INVALID_ACTION" },
        { status: 400 }
      );
    }

    const subscription = await getSubscription(userId);
    const premium = Boolean(subscription?.isPremium);

    if (premium) {
      return NextResponse.json({
        premium: true,
        usage: 0,
        limit: DAILY_AI_LIMIT,
      });
    }

    const key = getUsageKey(userId);
    const ttl = getTTLUntilMidnightUTC();

    // Atomic increment only if the current usage is below the limit.
    const lua = `
      local current = tonumber(redis.call("GET", KEYS[1]) or "0")
      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])

      if current >= limit then
        return -1
      end

      local newValue = redis.call("INCR", KEYS[1])

      if newValue == 1 then
        redis.call("EXPIRE", KEYS[1], ttl)
      end

      return newValue
    `;

    const result = await redis.eval<number>(
      lua,
      [key],
      [DAILY_AI_LIMIT, ttl]
    );

    if (result === -1) {
      return NextResponse.json(
        {
          error: "Daily AI limit reached",
          code: "LIMIT_REACHED",
          premium: false,
          usage: DAILY_AI_LIMIT,
          limit: DAILY_AI_LIMIT,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      premium: false,
      usage: result,
      limit: DAILY_AI_LIMIT,
    });
  } catch (error) {
    console.error("POST /api/ai/usage failed:", error);

    return NextResponse.json(
      {
        error: "Failed to update AI usage",
        code: "USAGE_UPDATE_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const subscription = await getSubscription(userId);
    const premium = Boolean(subscription?.isPremium);

    if (premium) {
      return NextResponse.json({
        premium: true,
        usage: 0,
        limit: DAILY_AI_LIMIT,
      });
    }

    const key = getUsageKey(userId);

    const lua = `
      local current = tonumber(redis.call("GET", KEYS[1]) or "0")

      if current <= 0 then
        return 0
      end

      local newValue = redis.call("DECR", KEYS[1])

      if newValue <= 0 then
        redis.call("DEL", KEYS[1])
        return 0
      end

      return newValue
    `;

    const result = await redis.eval<number>(lua, [key], []);

    return NextResponse.json({
      premium: false,
      usage: Math.max(0, result),
      limit: DAILY_AI_LIMIT,
    });
  } catch (error) {
    console.error("DELETE /api/ai/usage failed:", error);

    return NextResponse.json(
      {
        error: "Failed to release AI usage",
        code: "USAGE_RELEASE_FAILED",
      },
      { status: 500 }
    );
  }
}