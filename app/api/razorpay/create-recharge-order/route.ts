import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const VALID_TYPES = [
  "ai",
  "email",
  "googleAds",
] as const;

type RechargeType =
  (typeof VALID_TYPES)[number];

export async function POST(
  request: NextRequest
) {
  try {
    // ---------------------------------------------
    // AUTH
    // ---------------------------------------------

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

    // ---------------------------------------------
    // REQUEST
    // ---------------------------------------------

    const body = await request.json();

    const rechargeType =
      body?.rechargeType;

    const rawAmount = body?.amount;

    const username =
      body?.username || "";

    // ---------------------------------------------
    // VALIDATE TYPE
    // ---------------------------------------------

    if (
      typeof rechargeType !== "string" ||
      !VALID_TYPES.includes(
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

    // ---------------------------------------------
    // VALIDATE AMOUNT
    // ---------------------------------------------

    const amount = Number(rawAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid recharge amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        {
          error:
            "Minimum recharge amount is ₹1.",
        },
        {
          status: 400,
        }
      );
    }

    // Avoid accidental decimal precision problems.
    const roundedAmount =
      Math.round(amount * 100) / 100;

    // ---------------------------------------------
    // PLATFORM FEE
    // ---------------------------------------------
    //
    // User enters the recharge amount.
    //
    // Example:
    //
    // Recharge = ₹1,000
    // Platform fee = 5%
    // Fee = ₹50
    // Total = ₹1,050
    //
    // The user's credit balance receives
    // the original ₹1,000 worth of credits.
    //
    // ---------------------------------------------

    const PLATFORM_FEE_PERCENT = 5;

    const platformFee =
      Math.round(
        roundedAmount *
          (PLATFORM_FEE_PERCENT / 100) *
          100
      ) / 100;

    const totalAmount =
      Math.round(
        (roundedAmount + platformFee) * 100
      ) / 100;

    // ---------------------------------------------
    // RAZORPAY USES PAISE
    // ---------------------------------------------

    const amountInPaise =
      Math.round(totalAmount * 100);

    // ---------------------------------------------
    // SAFE SHORT RECEIPT
    // ---------------------------------------------
    //
    // Razorpay receipt cannot exceed 40/56-ish
    // characters depending on validation.
    //
    // Keep it extremely short.
    //
    // ---------------------------------------------

    const receipt =
      `rch_${Date.now()
        .toString()
        .slice(-12)}`;

    // ---------------------------------------------
    // CREATE ORDER
    // ---------------------------------------------

    const order =
      await razorpay.orders.create({
        amount: amountInPaise,

        currency: "INR",

        receipt,

        notes: {
          user_id: userId,
          username: String(username).slice(
            0,
            100
          ),
          recharge_type: rechargeType,
          recharge_amount:
            String(roundedAmount),
          platform_fee:
            String(platformFee),
          total_amount:
            String(totalAmount),
        },
      });

    // ---------------------------------------------
    // RESPONSE
    // ---------------------------------------------

    return NextResponse.json({
      success: true,

      key:
        process.env.RAZORPAY_KEY_ID,

      orderId: order.id,

      amount: amountInPaise,

      currency: "INR",

      rechargeType,

      rechargeAmount:
        roundedAmount,

      platformFee,

      platformFeePercent:
        PLATFORM_FEE_PERCENT,

      totalAmount,
    });
  } catch (error: any) {
    console.error(
      "Create recharge order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.error?.description ||
          error?.message ||
          "Unable to create recharge order.",
      },
      {
        status: 500,
      }
    );
  }
}