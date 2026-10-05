import crypto from "node:crypto";

import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanDomain(value: string) {
  return value
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/\.com.*$/, ".com");
}

function isComDomain(value: string) {
  return /^[a-z0-9-]+\.com$/.test(value);
}

function vercelHeaders() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function getDomainPrice(domain: string) {
  const response = await fetch(
    `https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=1`,
    {
      headers: vercelHeaders(),
      cache: "no-store",
    },
  );
  const data = await response.json().catch(() => ({}));
  const price = Number(
    data.price ?? data.amount ?? data.purchasePrice,
  );

  return { response, data, price };
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    domains: [],
    message: "Domain registration is available through Vercel Registrar.",
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === "create-checkout") {
      const domain =
        typeof body.domain === "string"
          ? cleanDomain(body.domain)
          : "";

      if (!isComDomain(domain)) {
        return NextResponse.json(
          { error: "Invalid domain." },
          { status: 400 },
        );
      }

      if (!process.env.VERCEL_ACCESS_TOKEN) {
        return NextResponse.json(
          { error: "VERCEL_ACCESS_TOKEN is not configured." },
          { status: 500 },
        );
      }

      if (
        !process.env.RAZORPAY_KEY_ID ||
        !process.env.RAZORPAY_KEY_SECRET
      ) {
        return NextResponse.json(
          { error: "Razorpay is not configured." },
          { status: 500 },
        );
      }

      const { response, price } = await getDomainPrice(domain);

      if (
        !response.ok ||
        !Number.isFinite(price) ||
        price <= 0 ||
        price > 999
      ) {
        return NextResponse.json(
          { error: "Unable to verify the current domain price." },
          { status: 400 },
        );
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const order = await razorpay.orders.create({
        amount: Math.round(price * 100),
        currency: "INR",
        receipt: `domain-${Date.now()}`,
        notes: { domain, userId },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        domain,
        price,
      });
    }

    if (body.action === "verify-payment") {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        domain: rawDomain,
      } = body;
      const domain =
        typeof rawDomain === "string" ? cleanDomain(rawDomain) : "";

      if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature ||
        !isComDomain(domain) ||
        !process.env.RAZORPAY_KEY_SECRET
      ) {
        return NextResponse.json(
          { error: "Payment verification failed." },
          { status: 400 },
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (
        expectedSignature.length !== String(razorpaySignature).length ||
        !crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(String(razorpaySignature)),
        )
      ) {
        return NextResponse.json(
          { error: "Payment verification failed." },
          { status: 400 },
        );
      }

      if (!process.env.VERCEL_ACCESS_TOKEN) {
        return NextResponse.json(
          { error: "VERCEL_ACCESS_TOKEN is not configured." },
          { status: 500 },
        );
      }

      const registrationResponse = await fetch(
        "https://api.vercel.com/v1/registrar/domains/register",
        {
          method: "POST",
          headers: vercelHeaders(),
          body: JSON.stringify({ domain, years: 1 }),
        },
      );
      const registration = await registrationResponse
        .json()
        .catch(() => ({}));

      if (!registrationResponse.ok) {
        return NextResponse.json(
          {
            error:
              registration.error?.message ||
              registration.message ||
              "Payment succeeded, but domain registration failed.",
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        success: true,
        domain,
        registration,
      });
    }

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim().slice(0, 500)
        : "";
    const budget = Math.max(
      1,
      Math.min(Number(body.budget) || 20, 999),
    );

    if (!prompt) {
      return NextResponse.json(
        { error: "Please describe your idea." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    if (!process.env.VERCEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "VERCEL_ACCESS_TOKEN is not configured." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You generate brandable .com domain ideas. Return only a JSON array of 12 short domain strings, without markdown. Domains should be lowercase, use letters only before .com, be easy to pronounce, and reflect the user brief.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message.content || "[]";
    const suggestions = JSON.parse(
      raw.replace(/```json|```/g, "").trim(),
    ) as unknown[];
    const domains = [
      ...new Set(
        suggestions
          .map((value) => cleanDomain(String(value)))
          .filter(
            (value) => isComDomain(value) && value.length <= 63,
          ),
      ),
    ].slice(0, 12);

    if (!domains.length) {
      return NextResponse.json(
        {
          error:
            "No valid domain ideas were generated. Try a more specific prompt.",
        },
        { status: 422 },
      );
    }

    const availabilityResponse = await fetch(
      "https://api.vercel.com/v1/registrar/domains/availability",
      {
        method: "POST",
        headers: vercelHeaders(),
        body: JSON.stringify({ domains }),
      },
    );

    if (!availabilityResponse.ok) {
      throw new Error(
        `Vercel availability request failed (${availabilityResponse.status}).`,
      );
    }

    const availability = await availabilityResponse.json();
    const availabilityItems = Array.isArray(availability)
      ? availability
      : availability.domains || availability.results || [];

    const results = await Promise.all(
      domains.map(async (domain) => {
        const item = availabilityItems.find(
          (candidate: { domain?: string; name?: string }) =>
            (candidate.domain || candidate.name) === domain,
        );
        const available = Boolean(
          item?.available ?? item?.status === "available",
        );

        if (!available) {
          return { domain, available: false };
        }

        const { data: priceData, price } = await getDomainPrice(domain);

        return {
          domain,
          available: Number.isFinite(price) ? price <= budget : true,
          price: Number.isFinite(price) ? price : undefined,
          currency: priceData.currency || "USD",
        };
      }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[domains] request failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search domains.",
      },
      { status: 500 },
    );
  }
}
