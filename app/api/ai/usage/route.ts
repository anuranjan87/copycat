import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getSubscription } from "@/lib/website-actions";

const DAILY_AI_LIMIT = 2;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Redis key for the current user's daily AI usage.
 *
 * The Clerk userId is included in the key so each user
 * has their own daily counter.
 */
function getUsageKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10);

  return `ai-daily-usage:${userId}:${today}`;
}

/**
 * Calculate how many seconds remain until midnight UTC.
 */
function getTTLUntilMidnightUTC() {
  const now = new Date();

  const midnight = new Date(now);

  midnight.setUTCHours(24, 0, 0, 0);

  return Math.max(
    60,
    Math.floor(
      (midnight.getTime() - now.getTime()) / 1000
    )
  );
}

/**
 * Safely convert the Redis EVAL result to a number.
 *
 * @upstash/redis can type EVAL results as `unknown`.
 * Converting explicitly avoids the TypeScript error:
 *
 * Argument of type 'unknown' is not assignable to parameter of type 'number'.
 */
function toNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return numberValue;
}

/* ============================================================
   GET
   ============================================================ */

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * IMPORTANT:
     *
     * Premium status comes from the DATABASE.
     *
     * Redis is NOT used to determine whether the user
     * is Premium.
     */
    const subscription = await getSubscription(userId);

    const premium = Boolean(subscription?.isPremium);

    /**
     * Premium users don't need the free daily counter.
     */
    if (premium) {
      return NextResponse.json({
        premium: true,
        usage: 0,
        limit: DAILY_AI_LIMIT,
      });
    }

    /**
     * Free user:
     * Read today's usage from Redis.
     */
    const key = getUsageKey(userId);

    const redisValue = await redis.get(key);

    const usage = toNumber(redisValue, 0);

    return NextResponse.json({
      premium: false,
      usage,
      limit: DAILY_AI_LIMIT,
    });
  } catch (error) {
    console.error(
      "GET /api/ai/usage failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch AI usage",
        code: "USAGE_CHECK_FAILED",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST
   ============================================================ */

export async function POST(
  request: Request
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    if (body?.action !== "reserve") {
      return NextResponse.json(
        {
          error: "Invalid action",
          code: "INVALID_ACTION",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * IMPORTANT:
     *
     * Check Premium status from Postgres.
     */
    const subscription = await getSubscription(userId);

    const premium = Boolean(subscription?.isPremium);

    /**
     * Premium users bypass the Redis daily limit completely.
     */
    if (premium) {
      return NextResponse.json({
        premium: true,
        usage: 0,
        limit: DAILY_AI_LIMIT,
      });
    }

    /**
     * ---------------------------------------------------------
     * FREE USER
     * ---------------------------------------------------------
     *
     * Redis is used ONLY for the daily AI usage counter.
     */

    const key = getUsageKey(userId);

    const ttl = getTTLUntilMidnightUTC();

    /**
     * Atomic Redis operation.
     *
     * We check the current value and increment it in one
     * operation so two simultaneous requests cannot both
     * bypass the limit.
     */
    const lua = `
      local current = tonumber(
        redis.call("GET", KEYS[1]) or "0"
      )

      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])

      if current >= limit then
        return -1
      end

      local newValue =
        redis.call("INCR", KEYS[1])

      if newValue == 1 then
        redis.call(
          "EXPIRE",
          KEYS[1],
          ttl
        )
      end

      return newValue
    `;

    /**
     * EVAL may be typed as unknown by @upstash/redis.
     *
     * That's why we convert the result below with toNumber().
     */
    const result = await redis.eval(
      lua,
      [key],
      [DAILY_AI_LIMIT, ttl]
    );

    const numericResult = toNumber(result, -1);

    /**
     * -1 means the daily limit has already been reached.
     */
    if (numericResult === -1) {
      return NextResponse.json(
        {
          error: "Daily AI limit reached",
          code: "LIMIT_REACHED",
          premium: false,
          usage: DAILY_AI_LIMIT,
          limit: DAILY_AI_LIMIT,
        },
        {
          status: 429,
        }
      );
    }

    /**
     * Protect against an unexpected Redis result.
     */
    if (
      numericResult < 1 ||
      numericResult > DAILY_AI_LIMIT
    ) {
      console.error(
        "Unexpected Redis usage result:",
        result
      );

      return NextResponse.json(
        {
          error: "Invalid AI usage result",
          code: "INVALID_USAGE_RESULT",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      premium: false,
      usage: numericResult,
      limit: DAILY_AI_LIMIT,
    });
  } catch (error) {
    console.error(
      "POST /api/ai/usage failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update AI usage",
        code: "USAGE_UPDATE_FAILED",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE
   ============================================================ */

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * Again, Premium status comes from Postgres.
     */
    const subscription = await getSubscription(userId);

    const premium = Boolean(subscription?.isPremium);

    /**
     * Premium users don't have a Redis reservation
     * to release.
     */
    if (premium) {
      return NextResponse.json({
        premium: true,
        usage: 0,
        limit: DAILY_AI_LIMIT,
      });
    }

    /**
     * Free user.
     */
    const key = getUsageKey(userId);

    /**
     * Atomically decrease the usage count.
     */
    const lua = `
      local current = tonumber(
        redis.call("GET", KEYS[1]) or "0"
      )

      if current <= 0 then
        return 0
      end

      local newValue =
        redis.call("DECR", KEYS[1])

      if newValue <= 0 then
        redis.call("DEL", KEYS[1])

        return 0
      end

      return newValue
    `;

    const result = await redis.eval(
      lua,
      [key],
      []
    );

    const numericResult = toNumber(result, 0);

    return NextResponse.json({
      premium: false,
      usage: Math.max(
        0,
        numericResult
      ),
      limit: DAILY_AI_LIMIT,
    });
  } catch (error) {
    console.error(
      "DELETE /api/ai/usage failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to release AI usage",
        code: "USAGE_RELEASE_FAILED",
      },
      {
        status: 500,
      }
    );
  }
}