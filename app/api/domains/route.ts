import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import Razorpay from "razorpay";
import crypto from "crypto";

export const runtime = "nodejs";

const sql = neon(process.env.POSTGRES_URL!);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

type Registrant = {
  nameFirst: string;
  nameLast: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type GoDaddyAgreement = {
  agreementKey?: string;
  agreementType?: string;
  title?: string;
  url?: string;
  content?: string;
};

function godaddyBaseUrl() {
  return (
    process.env.GODADDY_API_BASE_URL ||
    (process.env.GODADDY_ENV === "production"
      ? "https://api.godaddy.com"
      : "https://api.ote-godaddy.com")
  ).replace(/\/$/, "");
}

function godaddyHeaders() {
  const pat = process.env.GODADDY_PAT;

  if (!pat) {
    throw new Error("GODADDY_PAT is not configured.");
  }

  return {
    Authorization: `Bearer ${pat}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function godaddyJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${godaddyBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...godaddyHeaders(),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const responseText = await response.text();

  let data: any = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = {
      message: responseText || "GoDaddy returned an invalid response.",
    };
  }

  if (!response.ok) {
    const fieldErrors = Array.isArray(data?.fields)
      ? data.fields
          .map((field: any) => {
            const fieldPath = field?.path || field?.code || "field";
            const message = field?.message || "Invalid value";
            return `${fieldPath}: ${message}`;
          })
          .join("; ")
      : "";

    throw new Error(
      `GoDaddy ${response.status}: ${
        data?.code || "UNKNOWN"
      } — ${
        fieldErrors ||
        data?.message ||
        data?.error ||
        "GoDaddy request failed."
      }`
    );
  }

  return data as T;
}

function cleanDomain(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

function validateDomain(domain: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9-]+)+$/.test(
    domain
  );
}

function normalizeCountry(value: string) {
  return value.trim().toUpperCase();
}

function normalizeGoDaddyPhone(phone: string, country: string) {
  const raw = phone.trim();

  if (!raw) {
    return raw;
  }

  const digits = raw.replace(/\D/g, "");
  const normalizedCountry = normalizeCountry(country);

  if (normalizedCountry === "IN" || normalizedCountry === "IND") {
    if (digits.startsWith("91") && digits.length > 10) {
      return `+91.${digits.slice(-10)}`;
    }

    if (digits.length === 10) {
      return `+91.${digits}`;
    }
  }

  if (raw.startsWith("+")) {
    const withoutPlus = raw.slice(1).replace(/\D/g, "");

    if (withoutPlus.length > 3) {
      return `+${withoutPlus.slice(0, 2)}.${withoutPlus.slice(2)}`;
    }
  }

  return `+${digits.slice(0, 2)}.${digits.slice(2)}`;
}

function buildGoDaddyContact(registrant: Registrant) {
  const country = normalizeCountry(registrant.country);

  return {
    nameFirst: registrant.nameFirst.trim(),
    nameLast: registrant.nameLast.trim(),
    email: registrant.email.trim(),
    phone: normalizeGoDaddyPhone(registrant.phone, country),
    addressMailing: {
      address1: registrant.address1.trim(),
      city: registrant.city.trim(),
      state: registrant.state.trim(),
      postalCode: registrant.postalCode.trim(),
      country,
    },
  };
}

function validateRegistrant(
  registrant: unknown
): registrant is Registrant {
  if (!registrant || typeof registrant !== "object") {
    return false;
  }

  const data = registrant as Record<string, unknown>;

  const requiredFields: Array<keyof Registrant> = [
    "nameFirst",
    "nameLast",
    "email",
    "phone",
    "address1",
    "city",
    "state",
    "postalCode",
    "country",
  ];

  return requiredFields.every(
    (field) =>
      typeof data[field] === "string" &&
      data[field].trim().length > 0
  );
}

function amountForDomain(priceUsd: number) {
  const exchangeRate = Number(
    process.env.DOMAIN_USD_TO_INR || 85
  );

  const feePercent = Number(
    process.env.DOMAIN_PLATFORM_FEE_PERCENT || 10
  );

  const totalInr =
    priceUsd * exchangeRate * (1 + feePercent / 100);

  return Math.max(100, Math.round(totalInr * 100));
}

async function checkGoDaddyAvailability(domain: string) {
  const data = await godaddyJson(
    `/v3/domains/check-availability?domain=${encodeURIComponent(
      domain
    )}`
  );

  return data;
}

async function createGoDaddyRegistrationQuote(
  domain: string
) {
  return godaddyJson("/v3/domains/registration-quotes", {
    method: "POST",
    body: JSON.stringify({
      domain,
      period: 1,
    }),
  });
}

function normalizeAgreements(
  quote: any
): GoDaddyAgreement[] {
  const source =
    quote?.requiredAgreements ||
    quote?.agreements ||
    quote?.consent?.agreements ||
    [];

  if (!Array.isArray(source)) {
    return [];
  }

  const agreements = source
    .map((agreement: any) => ({
      agreementKey:
        agreement?.agreementKey === "API_DPA" ||
        agreement?.agreementType === "API_DPA"
          ? "DNPA"
          : agreement?.agreementKey ||
            agreement?.agreementType ||
            agreement?.key,
      agreementType:
        agreement?.agreementType === "API_DPA"
          ? "DNPA"
          : agreement?.agreementType ||
            agreement?.agreementKey ||
            agreement?.key,
      title:
        agreement?.title ||
        agreement?.name ||
        "GoDaddy registration agreement",
      url: agreement?.url || "",
      content: agreement?.content || "",
    }))
    .filter(
      (agreement: GoDaddyAgreement) =>
        agreement.agreementKey
    );

  if (!agreements.some((agreement) => agreement.agreementKey === "DNRA")) {
    agreements.unshift({
      agreementKey: "DNRA",
      agreementType: "DNRA",
      title: "Domain Registration Agreement",
      url: "https://www.godaddy.com/agreements/showdoc?pageid=reg_sa",
      content: "",
    });
  }

  if (!agreements.some((agreement) => agreement.agreementKey === "DNPA")) {
    agreements.push({
      agreementKey: "DNPA",
      agreementType: "DNPA",
      title: "Domain Name Privacy Agreement",
      url: "https://www.godaddy.com/legal/agreements",
      content: "",
    });
  }

  return agreements;
}

async function ensureDomainsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS domains (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      domain VARCHAR(255) NOT NULL,
      godaddy_order_id VARCHAR(255),
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255) UNIQUE,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, domain)
    )
  `;
}

async function ownedDomain(
  userId: string,
  domain: string
) {
  await ensureDomainsTable();

  const rows = await sql`
    SELECT *
    FROM domains
    WHERE user_id = ${userId}
      AND domain = ${domain}
    LIMIT 1
  `;

  return rows[0] || null;
}

async function refundRazorpayPayment(
  paymentId: string,
  authHeader: string
) {
  await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(
      paymentId
    )}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  ).catch((error) => {
    console.error("Razorpay refund failed:", error);
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const domain = cleanDomain(
      request.nextUrl.searchParams.get("domain")
    );

    if (domain) {
      const record = await ownedDomain(userId, domain);

      if (!record) {
        return NextResponse.json(
          { error: "Domain not found." },
          { status: 404 }
        );
      }

      const records = await godaddyJson(
        `/v1/domains/${encodeURIComponent(domain)}/records`
      );

      return NextResponse.json({
        domain: record,
        records,
      });
    }

    await ensureDomainsTable();

    const domains = await sql`
      SELECT
        id,
        domain,
        status,
        expires_at,
        created_at,
        updated_at
      FROM domains
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ domains });
  } catch (error) {
    console.error("GET /api/domains failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load domains.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const action = body?.action || "create-order";
    const domain = cleanDomain(body?.domain);

    if (!domain || !validateDomain(domain)) {
      return NextResponse.json(
        { error: "Enter a valid domain name." },
        { status: 400 }
      );
    }

    if (action === "create-order") {
      const availability =
        await checkGoDaddyAvailability(domain);

      if (!availability?.available) {
        return NextResponse.json(
          { error: "That domain is already taken." },
          { status: 409 }
        );
      }

      const rawPrice =
        availability?.prices?.[0]?.price?.value ??
        availability?.price ??
        0;

      const priceUsd =
        Number(rawPrice) > 1000
          ? Number(rawPrice) / 100
          : Number(rawPrice);

      if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
        return NextResponse.json(
          {
            error:
              "GoDaddy did not return a valid domain price.",
          },
          { status: 502 }
        );
      }

      const quote =
        await createGoDaddyRegistrationQuote(domain);

      const agreements = normalizeAgreements(quote);

      const amount = amountForDomain(priceUsd);
      const exchangeRate = Number(
        process.env.DOMAIN_USD_TO_INR || 85
      );

      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `dom_${Date.now()
          .toString()
          .slice(-12)}`,
        notes: {
          user_id: userId,
          domain,
          product: "domain-registration",
          price_usd: String(priceUsd),
          quote_token: quote?.quoteToken || "",
        },
      });

      return NextResponse.json({
        key: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount,
        currency: "INR",
        domain,
        priceUsd,
        priceInr: Math.round(priceUsd * exchangeRate),
        displayCurrency: "INR",
        quoteToken: quote?.quoteToken || null,
        agreements,
      });
    }

    if (action === "verify-and-purchase") {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        registrant,
        agreementKeys,
        agreedAt,
        quoteToken,
      } = body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !registrant ||
        !quoteToken
      ) {
        return NextResponse.json(
          {
            error:
              "Missing payment, quote, or registrant information.",
          },
          { status: 400 }
        );
      }

      if (!validateRegistrant(registrant)) {
        return NextResponse.json(
          { error: "Complete all registrant details." },
          { status: 400 }
        );
      }

      const submittedAgreementKeys = Array.isArray(
        agreementKeys
      )
        ? agreementKeys
            .filter(
              (key): key is string =>
                typeof key === "string"
            )
            .map((key) => key.trim())
            .filter(Boolean)
        : [];

      if (!submittedAgreementKeys.length) {
        return NextResponse.json(
          {
            error:
              "You must accept all required GoDaddy agreements.",
          },
          { status: 400 }
        );
      }

      const agreedAtDate = new Date(String(agreedAt));

      if (
        !agreedAt ||
        Number.isNaN(agreedAtDate.getTime()) ||
        agreedAtDate.getTime() > Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "A valid agreement acceptance time is required.",
          },
          { status: 400 }
        );
      }

      const razorpaySecret =
        process.env.RAZORPAY_KEY_SECRET;

      const razorpayKeyId =
        process.env.RAZORPAY_KEY_ID;

      if (!razorpaySecret || !razorpayKeyId) {
        return NextResponse.json(
          { error: "Razorpay is not configured." },
          { status: 500 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

      const receivedSignature = String(
        razorpay_signature
      );

      const signaturesMatch =
        expectedSignature.length ===
          receivedSignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(receivedSignature)
        );

      if (!signaturesMatch) {
        return NextResponse.json(
          { error: "Payment verification failed." },
          { status: 400 }
        );
      }

      const authHeader = Buffer.from(
        `${razorpayKeyId}:${razorpaySecret}`
      ).toString("base64");

      const orderResponse = await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(
          razorpay_order_id
        )}`,
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
          },
          cache: "no-store",
        }
      );

      const order = await orderResponse.json();

      if (
        !orderResponse.ok ||
        order?.notes?.user_id !== userId ||
        order?.notes?.domain !== domain ||
        order?.notes?.product !== "domain-registration"
      ) {
        return NextResponse.json(
          {
            error:
              "This payment does not belong to this domain or account.",
          },
          { status: 403 }
        );
      }

      await ensureDomainsTable();

      const existingPayment = await sql`
        SELECT id, domain
        FROM domains
        WHERE razorpay_payment_id = ${razorpay_payment_id}
        LIMIT 1
      `;

      if (existingPayment.length) {
        return NextResponse.json({
          success: true,
          domain: existingPayment[0].domain,
          alreadyProcessed: true,
        });
      }

      const contact =
        buildGoDaddyContact(registrant);

      let purchase: any;

      try {
        purchase = await godaddyJson(
          "/v1/domains/purchase",
          {
            method: "POST",
            body: JSON.stringify({
              domain,
              period: 1,
              privacy: true,
              renewAuto: false,
              contactRegistrant: contact,
              contactAdmin: contact,
              contactBilling: contact,
              contactTech: contact,
              consent: {
                agreedAt: agreedAtDate.toISOString(),
                agreedBy: registrant.email.trim(),
                agreementKeys: submittedAgreementKeys,
              },
            }),
          }
        );
      } catch (error) {
        await refundRazorpayPayment(
          razorpay_payment_id,
          authHeader
        );

        throw error;
      }

      await sql`
        INSERT INTO domains (
          user_id,
          domain,
          godaddy_order_id,
          razorpay_order_id,
          razorpay_payment_id,
          status,
          expires_at
        )
        VALUES (
          ${userId},
          ${domain},
          ${purchase?.orderId || null},
          ${razorpay_order_id},
          ${razorpay_payment_id},
          'active',
          CURRENT_TIMESTAMP + INTERVAL '1 year'
        )
        ON CONFLICT (user_id, domain)
        DO UPDATE SET
          godaddy_order_id = EXCLUDED.godaddy_order_id,
          razorpay_order_id = EXCLUDED.razorpay_order_id,
          razorpay_payment_id = EXCLUDED.razorpay_payment_id,
          status = 'active',
          expires_at = EXCLUDED.expires_at,
          updated_at = CURRENT_TIMESTAMP
      `;

      return NextResponse.json({
        success: true,
        domain,
        godaddyOrderId: purchase?.orderId || null,
      });
    }

    return NextResponse.json(
      { error: "Invalid domain action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/domains failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Domain purchase failed.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const domain = cleanDomain(body?.domain);

    if (!domain || !validateDomain(domain)) {
      return NextResponse.json(
        { error: "Enter a valid domain name." },
        { status: 400 }
      );
    }

    const record = await ownedDomain(userId, domain);

    if (!record) {
      return NextResponse.json(
        { error: "Domain not found." },
        { status: 404 }
      );
    }

    const type = String(body?.type || "").toUpperCase();
    const name = String(body?.name || "@").trim();
    const data = String(body?.data || "").trim();
    const ttl = Number(body?.ttl || 3600);

    const allowedTypes = /^(A|AAAA|CNAME|TXT|MX|NS)$/;

    if (
      !allowedTypes.test(type) ||
      !name ||
      !data ||
      !Number.isInteger(ttl) ||
      ttl < 60 ||
      ttl > 86400
    ) {
      return NextResponse.json(
        { error: "Invalid DNS record." },
        { status: 400 }
      );
    }

    await godaddyJson(
      `/v1/domains/${encodeURIComponent(
        domain
      )}/records/${encodeURIComponent(
        type
      )}/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        body: JSON.stringify([
          {
            data,
            ttl,
          },
        ]),
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PATCH /api/domains failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "DNS update failed.",
      },
      { status: 500 }
    );
  }
}