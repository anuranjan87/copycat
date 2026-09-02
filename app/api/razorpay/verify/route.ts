// app/api/razorpay/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

// --------------------------------------------------
// CREDIT AMOUNTS INCLUDED WITH EACH PREMIUM PURCHASE
// --------------------------------------------------

const AI_CREDITS_PER_PURCHASE = 2;
const EMAIL_CREDITS_PER_PURCHASE = 2;
const GOOGLE_ADS_CREDITS_PER_PURCHASE = 2;

// --------------------------------------------------
// ENSURE TABLE EXISTS
// --------------------------------------------------

async function ensureSubscriptionTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,

      user_id VARCHAR(255) NOT NULL UNIQUE,
      username VARCHAR(255) NOT NULL,

      status VARCHAR(50) NOT NULL DEFAULT 'free',

      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255) UNIQUE,

      started_at TIMESTAMP,
      expires_at TIMESTAMP,

      ai_credits INTEGER NOT NULL DEFAULT 0,
      email_credits INTEGER NOT NULL DEFAULT 0,
      google_ads_credits INTEGER NOT NULL DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // ------------------------------------------------
  // In case your existing table was created without
  // the unique user_id constraint.
  // ------------------------------------------------

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS
    subscriptions_user_id_unique
    ON subscriptions(user_id)
  `;
}

// --------------------------------------------------
// POST
// --------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------
    // 1. AUTHENTICATED CLERK USER
    // ------------------------------------------------

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ------------------------------------------------
    // 2. REQUEST BODY
    // ------------------------------------------------

    const body = await request.json();

    const {
      username,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !username ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing payment information.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 3. RAZORPAY SECRET
    // ------------------------------------------------

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is missing.");

      return NextResponse.json(
        {
          success: false,
          error: "Razorpay is not configured correctly.",
        },
        { status: 500 }
      );
    }

    // ------------------------------------------------
    // 4. VERIFY RAZORPAY SIGNATURE
    // ------------------------------------------------

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const generatedBuffer = Buffer.from(
      generatedSignature,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      razorpay_signature,
      "utf8"
    );

    if (
      generatedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )
    ) {
      console.error("Invalid Razorpay signature.");

      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 5. CREATE TABLE
    // ------------------------------------------------

    await ensureSubscriptionTable();

    // ------------------------------------------------
    // 6. PREVENT DOUBLE PAYMENT PROCESSING
    // ------------------------------------------------

    const existingPayment = await sql`
      SELECT
        id,
        user_id,
        username,
        status,
        ai_credits,
        email_credits,
        google_ads_credits
      FROM subscriptions
      WHERE razorpay_payment_id = ${razorpay_payment_id}
      LIMIT 1
    `;

    if (existingPayment.length > 0) {
      const existing = existingPayment[0];

      return NextResponse.json({
        success: true,
        premium: existing.status === "premium",
        alreadyProcessed: true,

        credits: {
          ai: existing.ai_credits,
          email: existing.email_credits,
          googleAds: existing.google_ads_credits,
        },
      });
    }

    // ------------------------------------------------
    // 7. CHECK THAT ORDER BELONGS TO THIS USER
    // ------------------------------------------------

    const existingOrder = await sql`
      SELECT
        id,
        user_id,
        username
      FROM subscriptions
      WHERE razorpay_order_id = ${razorpay_order_id}
      LIMIT 1
    `;

    if (
      existingOrder.length > 0 &&
      existingOrder[0].user_id !== userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This payment order does not belong to you.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------
    // 8. ADD PREMIUM + CREDITS
    // ------------------------------------------------
    //
    // Premium lasts 30 days.
    //
    // Credits are DIFFERENT:
    //
    // - They accumulate
    // - They carry forward
    // - They do not expire
    // - They remain even when Premium expires
    //
    // ------------------------------------------------

    const result = await sql`
      INSERT INTO subscriptions (
        user_id,
        username,
        status,

        razorpay_order_id,
        razorpay_payment_id,

        started_at,
        expires_at,

        ai_credits,
        email_credits,
        google_ads_credits,

        created_at,
        updated_at
      )

      VALUES (
        ${userId},
        ${username},
        'premium',

        ${razorpay_order_id},
        ${razorpay_payment_id},

        CURRENT_TIMESTAMP,

        CURRENT_TIMESTAMP + INTERVAL '30 days',

        ${AI_CREDITS_PER_PURCHASE},
        ${EMAIL_CREDITS_PER_PURCHASE},
        ${GOOGLE_ADS_CREDITS_PER_PURCHASE},

        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )

      ON CONFLICT (user_id)

      DO UPDATE SET

        username =
          EXCLUDED.username,

        status =
          'premium',

        razorpay_order_id =
          EXCLUDED.razorpay_order_id,

        razorpay_payment_id =
          EXCLUDED.razorpay_payment_id,

        started_at =
          COALESCE(
            subscriptions.started_at,
            CURRENT_TIMESTAMP
          ),

        expires_at =
          CASE
            WHEN subscriptions.expires_at IS NOT NULL
              AND subscriptions.expires_at > CURRENT_TIMESTAMP

            THEN
              subscriptions.expires_at
              + INTERVAL '30 days'

            ELSE
              CURRENT_TIMESTAMP
              + INTERVAL '30 days'
          END,

        ai_credits =
          subscriptions.ai_credits
          + EXCLUDED.ai_credits,

        email_credits =
          subscriptions.email_credits
          + EXCLUDED.email_credits,

        google_ads_credits =
          subscriptions.google_ads_credits
          + EXCLUDED.google_ads_credits,

        updated_at =
          CURRENT_TIMESTAMP

      RETURNING
        id,
        user_id,
        username,
        status,
        expires_at,
        ai_credits,
        email_credits,
        google_ads_credits
    `;

    const subscription = result[0];

    // ------------------------------------------------
    // 9. SUCCESS
    // ------------------------------------------------

    return NextResponse.json({
      success: true,
      premium: true,

      subscription: {
        status: subscription.status,
        expiresAt: subscription.expires_at,
      },

      credits: {
        ai: subscription.ai_credits,
        email: subscription.email_credits,
        googleAds: subscription.google_ads_credits,
      },

      purchased: {
        ai: AI_CREDITS_PER_PURCHASE,
        email: EMAIL_CREDITS_PER_PURCHASE,
        googleAds: GOOGLE_ADS_CREDITS_PER_PURCHASE,
      },
    });
  } catch (error) {
    console.error(
      "Razorpay verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}