import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = body?.username;

    if (!username) {
      return NextResponse.json(
        {
          error: "Username is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * Razorpay expects amount in the smallest
     * currency unit.
     *
     * This example uses INR.
     *
     * Replace this amount with the INR equivalent
     * you want to charge for €6.66.
     */

    const amount = 66600;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `premium_${username}_${Date.now()}`,
      notes: {
        username,
        plan: "premium",
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