// app/api/razorpay/verify-recharge/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon(process.env.POSTGRES_URL!);

type RechargeType =
  | "ai"
  | "email"
  | "googleAds";

const VALID_RECHARGE_TYPES: RechargeType[] = [
  "ai",
  "email",
  "googleAds",
];

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // AUTH
    // =====================================================

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // REQUEST
    // =====================================================

    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      rechargeType,
    } = body;

    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Missing Razorpay payment information.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof rechargeType !== "string" ||
      !VALID_RECHARGE_TYPES.includes(
        rechargeType as RechargeType
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid recharge type.",
        },
        {
          status: 400,
        }
      );
    }

    const type = rechargeType as RechargeType;

    // =====================================================
    // RAZORPAY CONFIG
    // =====================================================

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error(
        "Razorpay environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "Razorpay is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // VERIFY RAZORPAY SIGNATURE
    // =====================================================

    const generatedSignature =
      crypto
        .createHmac("sha256", keySecret)
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const receivedBuffer =
      Buffer.from(
        razorpay_signature,
        "utf8"
      );

    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    if (
      receivedBuffer.length !==
      generatedBuffer.length
    ) {
      return NextResponse.json(
        {
          error:
            "Payment verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    const signaturesMatch =
      crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      );

    if (!signaturesMatch) {
      console.error(
        "Invalid Razorpay signature."
      );

      return NextResponse.json(
        {
          error:
            "Payment verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // FETCH REAL RAZORPAY ORDER
    // =====================================================

    const razorpayAuth =
      Buffer.from(
        `${keyId}:${keySecret}`
      ).toString("base64");

    const orderResponse =
      await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(
          razorpay_order_id
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Basic ${razorpayAuth}`,
          },

          cache: "no-store",
        }
      );

    const orderData =
      await orderResponse.json();

    if (!orderResponse.ok) {
      console.error(
        "Unable to fetch Razorpay order:",
        orderData
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the Razorpay order.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // VERIFY ORDER BELONGS TO THIS USER
    // =====================================================

    const orderUserId =
      String(
        orderData?.notes?.user_id || ""
      );

    if (
      !orderUserId ||
      orderUserId !== userId
    ) {
      console.error(
        "Razorpay order does not belong to this user.",
        {
          orderUserId,
          userId,
        }
      );

      return NextResponse.json(
        {
          error:
            "This payment does not belong to your account.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // VERIFY RECHARGE TYPE
    // =====================================================

    const orderRechargeType =
      String(
        orderData?.notes?.recharge_type || ""
      );

    if (
      !orderRechargeType ||
      orderRechargeType !== type
    ) {
      console.error(
        "Recharge type mismatch:",
        {
          expected: type,
          received: orderRechargeType,
        }
      );

      return NextResponse.json(
        {
          error:
            "Recharge type does not match the order.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // GET ORIGINAL RECHARGE AMOUNT
    // =====================================================
    //
    // IMPORTANT:
    //
    // The customer pays:
    //
    // Recharge amount + 5% platform fee
    //
    // Example:
    //
    // Recharge = ₹1,000
    // Fee      = ₹50
    // Paid     = ₹1,050
    //
    // We credit ONLY ₹1,000.
    //
    // The original recharge amount was saved
    // in Razorpay order notes by the create-order route.
    //
    // =====================================================

    const rechargeAmount =
      Number(
        orderData?.notes?.recharge_amount
      );

    if (
      !Number.isFinite(rechargeAmount) ||
      rechargeAmount <= 0
    ) {
      console.error(
        "Invalid recharge amount in Razorpay order notes:",
        orderData?.notes?.recharge_amount
      );

      return NextResponse.json(
        {
          error:
            "Unable to determine the recharge amount.",
        },
        {
          status: 400,
        }
      );
    }

    // Keep the same 2-decimal precision used
    // when creating the Razorpay order.

    const roundedRechargeAmount =
      Math.round(
        rechargeAmount * 100
      ) / 100;

    // =====================================================
    // VERIFY RAZORPAY ORDER AMOUNT
    // =====================================================

    const orderAmountPaise =
      Number(orderData?.amount);

    const amountPaidPaise =
      Number(orderData?.amount_paid);

    if (
      !Number.isFinite(orderAmountPaise) ||
      orderAmountPaise <= 0
    ) {
      console.error(
        "Invalid Razorpay order amount:",
        orderData?.amount
      );

      return NextResponse.json(
        {
          error:
            "Invalid recharge amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(amountPaidPaise) ||
      amountPaidPaise < orderAmountPaise
    ) {
      console.error(
        "Payment amount is incomplete:",
        {
          orderAmountPaise,
          amountPaidPaise,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount has not been fully received.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // VERIFY ORDER STATUS
    // =====================================================

    if (
      orderData?.status !== "paid"
    ) {
      console.error(
        "Razorpay order is not paid:",
        orderData?.status
      );

      return NextResponse.json(
        {
          error:
            "Payment has not been completed yet.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // VERIFY RECHARGE AMOUNT AGAINST ORDER NOTES
    // =====================================================
    //
    // The order should contain:
    //
    // recharge_amount
    // platform_fee
    // total_amount
    //
    // Verify that the numbers make sense.
    //
    // =====================================================

    const platformFee =
      Number(
        orderData?.notes?.platform_fee
      );

    const totalAmount =
      Number(
        orderData?.notes?.total_amount
      );

    if (
      !Number.isFinite(platformFee) ||
      platformFee < 0 ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      console.error(
        "Invalid payment details in Razorpay notes:",
        {
          platformFee,
          totalAmount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Invalid recharge payment details.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // VERIFY TOTAL AMOUNT
    // =====================================================

    const expectedTotalAmount =
      Math.round(
        (
          roundedRechargeAmount +
          platformFee
        ) * 100
      ) / 100;

    const expectedTotalPaise =
      Math.round(
        expectedTotalAmount * 100
      );

    if (
      expectedTotalPaise !==
      orderAmountPaise
    ) {
      console.error(
        "Razorpay amount does not match recharge details:",
        {
          rechargeAmount:
            roundedRechargeAmount,
          platformFee,
          expectedTotalPaise,
          orderAmountPaise,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount does not match the recharge.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // CREATE TABLE IF NEEDED
    // =====================================================

    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,

        user_id VARCHAR(255) NOT NULL UNIQUE,

        username VARCHAR(255),

        status VARCHAR(50)
          NOT NULL DEFAULT 'premium',

        razorpay_order_id VARCHAR(255),

        razorpay_payment_id VARCHAR(255),

        started_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP,

        expires_at TIMESTAMP,

        ai_credits INTEGER
          NOT NULL DEFAULT 0,

        email_credits INTEGER
          NOT NULL DEFAULT 0,

        google_ads_credits INTEGER
          NOT NULL DEFAULT 0,

        updated_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // =====================================================
    // CHECK WHETHER THIS PAYMENT WAS ALREADY PROCESSED
    // =====================================================

    const existingPayment =
      await sql`
        SELECT
          id
        FROM subscriptions
        WHERE razorpay_payment_id =
          ${razorpay_payment_id}
        LIMIT 1
      `;

    if (
      existingPayment.length > 0
    ) {
      const current =
        await sql`
          SELECT
            ai_credits,
            email_credits,
            google_ads_credits
          FROM subscriptions
          WHERE user_id =
            ${userId}
          LIMIT 1
        `;

      return NextResponse.json({
        success: true,

        alreadyProcessed: true,

        message:
          "This payment has already been processed.",

        credits: {
          ai: Number(
            current[0]?.ai_credits || 0
          ),

          email: Number(
            current[0]?.email_credits || 0
          ),

          googleAds: Number(
            current[0]
              ?.google_ads_credits || 0
          ),
        },
      });
    }

    // =====================================================
    // ADD RECHARGE TO THE CORRECT CREDIT BALANCE
    // =====================================================
    //
    // AI:
    //     ai_credits += recharge amount
    //
    // Email:
    //     email_credits += recharge amount
    //
    // Google Ads:
    //     google_ads_credits += recharge amount
    //
    // Only ONE of these receives the recharge.
    //
    // =====================================================

    const updated =
      await sql`
        UPDATE subscriptions

        SET
          ai_credits =
            COALESCE(ai_credits, 0)
            +
            CASE
              WHEN ${type} = 'ai'
              THEN ${roundedRechargeAmount}
              ELSE 0
            END,

          email_credits =
            COALESCE(email_credits, 0)
            +
            CASE
              WHEN ${type} = 'email'
              THEN ${roundedRechargeAmount}
              ELSE 0
            END,

          google_ads_credits =
            COALESCE(google_ads_credits, 0)
            +
            CASE
              WHEN ${type} = 'googleAds'
              THEN ${roundedRechargeAmount}
              ELSE 0
            END,

          razorpay_order_id =
            ${razorpay_order_id},

          razorpay_payment_id =
            ${razorpay_payment_id},

          updated_at =
            CURRENT_TIMESTAMP

        WHERE user_id =
          ${userId}

        RETURNING
          ai_credits,
          email_credits,
          google_ads_credits
      `;

    // =====================================================
    // SUBSCRIPTION NOT FOUND
    // =====================================================

    if (updated.length === 0) {
      console.error(
        "Subscription not found for user:",
        userId
      );

      return NextResponse.json(
        {
          error:
            "Premium subscription could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        "Recharge completed successfully.",

      recharge: {
        type,

        amount:
          roundedRechargeAmount,

        amountPaise:
          Math.round(
            roundedRechargeAmount * 100
          ),

        platformFee,

        totalPaid:
          totalAmount,
      },

      credits: {
        ai: Number(
          updated[0].ai_credits || 0
        ),

        email: Number(
          updated[0].email_credits || 0
        ),

        googleAds: Number(
          updated[0]
            .google_ads_credits || 0
        ),
      },
    });
  } catch (error) {
    console.error(
      "Verify recharge error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Recharge verification failed.",
      },
      {
        status: 500,
      }
    );
  }
}