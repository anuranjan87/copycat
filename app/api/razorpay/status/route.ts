import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export async function GET() {
  try {
    // -----------------------------------------
    // GET LOGGED-IN USER
    // -----------------------------------------

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          premium: false,
          credits: {
            ai: 0,
            email: 0,
            googleAds: 0,
          },
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // MAKE SURE TABLE EXISTS
    // -----------------------------------------

    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,

        user_id VARCHAR UNIQUE NOT NULL,
        username VARCHAR,

        status VARCHAR NOT NULL DEFAULT 'premium',

        razorpay_order_id VARCHAR,
        razorpay_payment_id VARCHAR,

        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,

        ai_credits INTEGER NOT NULL DEFAULT 0,
        email_credits INTEGER NOT NULL DEFAULT 0,
        google_ads_credits INTEGER NOT NULL DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // -----------------------------------------
    // GET SUBSCRIPTION
    // -----------------------------------------

    const result = await sql`
      SELECT
        user_id,
        username,
        status,

        started_at,
        expires_at,

        ai_credits,
        email_credits,
        google_ads_credits

      FROM subscriptions

      WHERE user_id = ${userId}

      LIMIT 1
    `;

    // -----------------------------------------
    // USER HAS NEVER PAID
    // -----------------------------------------

    if (result.length === 0) {
      return NextResponse.json({
        premium: false,

        credits: {
          ai: 0,
          email: 0,
          googleAds: 0,
        },
      });
    }

    const subscription = result[0];

    // -----------------------------------------
    // PREMIUM STATUS
    // -----------------------------------------
    //
    // IMPORTANT:
    //
    // Credits never expire.
    //
    // Premium access itself is based on
    // the subscription expiry date.
    //
    // -----------------------------------------

    const now = new Date();

    const expiresAt = subscription.expires_at
      ? new Date(subscription.expires_at)
      : null;

    const premium =
      subscription.status === "premium" &&
      (
        !expiresAt ||
        expiresAt > now
      );

    // -----------------------------------------
    // RETURN STATUS + CREDITS
    // -----------------------------------------

    return NextResponse.json(
      {
        premium,

        username:
          subscription.username,

        status:
          subscription.status,

        startedAt:
          subscription.started_at,

        expiresAt:
          subscription.expires_at,

        credits: {
          ai: Number(
            subscription.ai_credits || 0
          ),

          email: Number(
            subscription.email_credits || 0
          ),

          googleAds: Number(
            subscription.google_ads_credits || 0
          ),
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma: "no-cache",

          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Razorpay status error:",
      error
    );

    return NextResponse.json(
      {
        premium: false,

        credits: {
          ai: 0,
          email: 0,
          googleAds: 0,
        },

        error:
          error instanceof Error
            ? error.message
            : "Unable to check Premium status.",
      },
      {
        status: 500,
      }
    );
  }
}