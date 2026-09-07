import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// --------------------------------------------------
// SERVER-SIDE PRICES
// Razorpay uses the smallest currency unit.
// INR 666.00 = 66600 paise
// EUR 6.66   = 666 cents
// --------------------------------------------------

const PRICES = {
  INR: 66600,
  EUR: 666,
} as const;

type Currency = keyof typeof PRICES;

// --------------------------------------------------
// EURO COUNTRIES
// --------------------------------------------------

const EURO_COUNTRIES = new Set([
  "AT", // Austria
  "BE", // Belgium
  "CY", // Cyprus
  "DE", // Germany
  "EE", // Estonia
  "ES", // Spain
  "FI", // Finland
  "FR", // France
  "GR", // Greece
  "HR", // Croatia
  "IE", // Ireland
  "IT", // Italy
  "LT", // Lithuania
  "LU", // Luxembourg
  "LV", // Latvia
  "MT", // Malta
  "NL", // Netherlands
  "PT", // Portugal
  "SI", // Slovenia
  "SK", // Slovakia
]);

// --------------------------------------------------
// GET CURRENCY FROM COUNTRY
// --------------------------------------------------

function getCurrencyFromCountry(country: string | null): Currency {
  if (!country) {
    // Safe international default
    return "EUR";
  }

  const normalizedCountry = country.toUpperCase();

  // India
  if (normalizedCountry === "IN") {
    return "INR";
  }

  // Eurozone
  if (EURO_COUNTRIES.has(normalizedCountry)) {
    return "EUR";
  }

  // International default
  return "EUR";
}

// --------------------------------------------------
// POST
// --------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = body?.username;

    // ------------------------------------------------
    // Validate username
    // ------------------------------------------------

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

    // ------------------------------------------------
    // GET COUNTRY FROM NETLIFY
    //
    // Netlify provides the visitor's country through
    // the x-nf-geo-country header.
    // ------------------------------------------------

    const country =
      request.headers.get("x-nf-geo-country") ||
      request.headers.get("x-country");

    // ------------------------------------------------
    // DETERMINE CURRENCY SERVER-SIDE
    // ------------------------------------------------

    const currency = getCurrencyFromCountry(country);

    // ------------------------------------------------
    // GET PRICE SERVER-SIDE
    // ------------------------------------------------

    const amount = PRICES[currency];

    // ------------------------------------------------
    // CREATE RAZORPAY ORDER
    // ------------------------------------------------

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `premium_${username}_${Date.now()}`.slice(0, 40),

      notes: {
        username,
        plan: "premium",
        country: country || "unknown",
        currency,
      },
    });

    // ------------------------------------------------
    // RETURN ORDER INFORMATION
    // ------------------------------------------------

    return NextResponse.json({
      success: true,

      orderId: order.id,

      amount: order.amount,

      currency: order.currency,

      country: country || "unknown",

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