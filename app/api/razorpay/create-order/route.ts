import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Your server-side prices.
// Never trust the frontend to send the actual price.
const PRICES = {
  INR: 66600, // ₹666.00
  EUR: 666,   // €6.66
} as const;

type Currency = keyof typeof PRICES;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = body?.username;
    const requestedCurrency = body?.currency;

    // -----------------------------------------
    // Validate username
    // -----------------------------------------

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        {
          error: "Username is required.",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // Default to INR
    // -----------------------------------------

    const currency: Currency =
      requestedCurrency === "EUR" ? "EUR" : "INR";

    // -----------------------------------------
    // Get price ONLY from our server
    // -----------------------------------------

    const amount = PRICES[currency];

    // -----------------------------------------
    // Create Razorpay order
    // -----------------------------------------

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `premium_${username}_${Date.now()}`.slice(0, 40),
      notes: {
        username,
        plan: "premium",
        currency,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    return NextResponse.json(
      {
        error: "Unable to create Razorpay order.",
      },
      {
        status: 500,
      }
    );
  }
}