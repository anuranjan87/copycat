
import { NextRequest, NextResponse } from "next/server";

type GoDaddyAgreement = {
  agreementKey?: string;
  title?: string;
  url?: string;
  content?: string;
};

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Domain is required" },
      { status: 400 }
    );
  }

  const pat = process.env.GODADDY_PAT;

  if (!pat) {
    return NextResponse.json(
      { error: "GoDaddy PAT is not configured" },
      { status: 500 }
    );
  }

  try {
    const baseUrl = "https://api.godaddy.com";

    const response = await fetch(
      `${baseUrl}/v3/domains/check-availability?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const responseText = await response.text();
    let data: any = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            `GoDaddy API error (${response.status})`,
          code: data.code,
        },
        { status: response.status }
      );
    }

    const firstPrice = data.prices?.[0];
    const rawPrice = firstPrice?.price?.value ?? data.price;
    const price =
      typeof rawPrice === "number"
        ? rawPrice > 1000
          ? rawPrice / 100
          : rawPrice
        : null;
    const exchangeRate = Number(
      process.env.DOMAIN_USD_TO_INR || 85
    );

    let agreements: GoDaddyAgreement[] = [];

    if (data.available) {
      const tld = domain.split(".").slice(1).join(".");
      const agreementsResponse = await fetch(
        `${baseUrl}/v1/domains/agreements?tlds=${encodeURIComponent(
          tld
        )}&v1-privacy=true`,
        {
          headers: {
            Authorization: `Bearer ${pat}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const agreementsText = await agreementsResponse.text();
      let agreementsData: any = {};

      try {
        agreementsData = agreementsText
          ? JSON.parse(agreementsText)
          : [];
      } catch {
        agreementsData = [];
      }

      if (agreementsResponse.ok) {
        agreements = Array.isArray(agreementsData)
          ? agreementsData
          : Array.isArray(agreementsData?.agreements)
            ? agreementsData.agreements
            : [];
      }
    }

    if (!agreements.some((agreement) => agreement.agreementKey === "DNRA")) {
      agreements.unshift({
        agreementKey: "DNRA",
        title: "Domain Registration Agreement",
        url: "https://www.godaddy.com/agreements/showdoc?pageid=reg_sa",
      });
    }

    if (!agreements.some((agreement) => agreement.agreementKey === "DNPA")) {
      agreements.push({
        agreementKey: "DNPA",
        title: "Domain Name Privacy Agreement",
        url: "https://www.godaddy.com/legal/agreements",
      });
    }

    return NextResponse.json({
      domain: data.domain,
      available: data.available,
      price,
      priceInr:
        typeof price === "number"
          ? Math.round(price * exchangeRate)
          : null,
      currency:
        firstPrice?.price?.currencyCode || data.currency || null,
      prices: data.prices || [],
      agreements: agreements
        .filter((agreement) => agreement.agreementKey)
        .map((agreement) => ({
          agreementKey: agreement.agreementKey,
          title: agreement.title || "GoDaddy registration agreement",
          url: agreement.url || "",
          content: agreement.content || "",
        })),
    });
  } catch (error) {
    console.error("GoDaddy availability check failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to GoDaddy",
      },
      { status: 500 }
    );
  }
}