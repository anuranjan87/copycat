"use server";

import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { redirect } from "next/navigation";

const sql = neon(process.env.POSTGRES_URL!);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// ==================================================
// TYPES
// ==================================================

export interface WebsiteContent {
  html: string;
  script: string;
  data: string;
}

export type SubscriptionStatus = "free" | "premium";

export interface SubscriptionData {
  isPremium: boolean;
  status: SubscriptionStatus;
  username: string | null;
  startedAt: Date | string | null;
  expiresAt: Date | string | null;
  aiCredits: number;
  emailCredits: number;
  googleAdsCredits: number;
}

// ==================================================
// AI CODE GENERATION
// ==================================================

export async function generateCodeWithAI(
  currentCode: string,
  prompt: string
) {
  try {
    console.log("im working");

    const response = await client.responses.create({
      model: "gpt-5.4-nano",

      input: `
You are a JavaScript content editing assistant.

Rules:

- Always return complete, valid JavaScript as per user requested changes, even for one word prompts
- Strictly Always update the content, there should always be some delta
- Strictly Always return all propertery names, only change the values as per request
- dont generate new image url, keep the image url as it is
- Do NOT change the object structure or keys.
- Keep all image URLs unchanged.
- Return ONLY JavaScript code.
- Do not wrap the response in markdown.
- Return only the updated content object, with no variable declaration whatsoever (const data =, const updatedContent =, let, var, or any other wrapper), no code fences, and no explanations.

Current code:
${currentCode}

User request:
replace whole site text for ${prompt}
      `,
    });

    const generatedCode = response.output_text.trim();

    if (!generatedCode) {
      throw new Error("No code generated.");
    }

    console.log(generatedCode);

    return {
      success: true,
      generatedCode,
    };
  } catch (error: unknown) {
    console.error("OpenAI error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate code.",
    };
  }
}

// ==================================================
// AI BLANK WEBSITE GENERATION
// ==================================================

export async function generateCodeWithAIBlank(
  currentCode: string,
  prompt: string
) {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-nano",

      input: `
Create a stunning single-page HTML5 website using Tailwind CSS.

Include this in the HTML:

<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

Rules:

- Return ONLY valid HTML.
- No explanations.
- No markdown.
- No code fences.
- No contact section.
- No contact buttons.
- Use different random numbers for multiple placeholder images.
- Produce clean, production-quality HTML.

Current code:
${currentCode}

User request:
${prompt}

If the current code is empty, create a completely new webpage.
Otherwise, modify the existing webpage while preserving its structure whenever possible.

If you create any form, use the following JavaScript submission logic exactly so the parent application receives the submitted data:

<script>
(function () {
  const form = document.getElementById("testForm");

  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    console.log("SENDING DATA:", values);

    try {
      window.parent.postMessage(
        {
          formData: values,
        },
        "*"
      );

      console.log("✅ postMessage sent to parent");
    } catch (err) {
      console.error("❌ Failed to send postMessage:", err);
    }
  });
})();
</script>

Requirements for forms:

- The form must have id="testForm".
- Any field names are acceptable.
- The submit button must be type="submit".
- Do not change the submission logic.
- Return only the finished HTML document.
      `,
    });

    const generatedCode = response.output_text;

    if (!generatedCode) {
      throw new Error("No code generated from OpenAI");
    }

    return {
      success: true,
      generatedCode: generatedCode.trim(),
    };
  } catch (error: any) {
    console.error("OpenAI error:", error);

    return {
      success: false,
      error: error.message || "Failed with OpenAI",
    };
  }
}

// ==================================================
// GET WEBSITE CONTENT
// ==================================================

export async function getWebsiteContent(
  username: string
): Promise<WebsiteContent | null> {
  try {
    const tableName = `${username.toLowerCase()}_website`;

    const tableExists = await sql.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      )
      `,
      [tableName]
    );

    if (!tableExists[0]?.exists) {
      return null;
    }

    const result = await sql.query(
      `
      SELECT
        code,
        code_script,
        code_data
      FROM ${tableName}
      ORDER BY created_at DESC
      LIMIT 1
      `
    );

    if (result.length === 0) {
      return null;
    }

    return {
      html: result[0].code || "",
      script: result[0].code_script || "",
      data: result[0].code_data || "",
    };
  } catch (error) {
    console.error("Error fetching website content:", error);
    return null;
  }
}

// ==================================================
// GET ALL WEBSITE TEMPLATES
// ==================================================

export async function getAllWebsiteTemplates() {
  try {
    console.log("[v0] Fetching all templates");

    const templates = await sql`
      SELECT
        id,
        code,
        code_script,
        code_data
      FROM website_template
      ORDER BY id ASC
    `;

    console.log(
      "[v0] All templates fetched:",
      templates.length
    );

    return templates;
  } catch (error) {
    console.error(
      "Failed to fetch all website templates:",
      error
    );

    return [
      {
        id: 1,
        code: `<div>Template 1 Preview</div>`,
        code_script: `console.log('Template 1 script');`,
        code_data: `{"templateId": 1, "name": "Sample Template 1"}`,
      },
      {
        id: 2,
        code: `<div>Template 2 Preview</div>`,
        code_script: `console.log('Template 2 script');`,
        code_data: `{"templateId": 2, "name": "Sample Template 2"}`,
      },
      {
        id: 3,
        code: `<div>Template 3 Preview</div>`,
        code_script: `console.log('Template 3 script');`,
        code_data: `{"templateId": 3, "name": "Sample Template 3"}`,
      },
      {
        id: 4,
        code: `<div>Template 4 Preview</div>`,
        code_script: `console.log('Template 4 script');`,
        code_data: `{"templateId": 4, "name": "Sample Template 4"}`,
      },
      {
        id: 5,
        code: `<div>Template 5 Preview</div>`,
        code_script: `console.log('Template 5 script');`,
        code_data: `{"templateId": 5, "name": "Sample Template 5"}`,
      },
      {
        id: 6,
        code: `<div>Template 6 Preview</div>`,
        code_script: `console.log('Template 6 script');`,
        code_data: `{"templateId": 6, "name": "Sample Template 6"}`,
      },
      {
        id: 7,
        code: `<div>Template 7 Preview</div>`,
        code_script: `console.log('Template 7 script');`,
        code_data: `{"templateId": 7, "name": "Sample Template 7"}`,
      },
    ];
  }
}

// ==================================================
// GET WEBSITE HTML
// ==================================================

export async function getWebsiteHTML(
  username: string
): Promise<string | null> {
  try {
    const content = await getWebsiteContent(username);

    if (!content) {
      return null;
    }

    let combinedHTML = content.html;

    if (content.data) {
      const dataScript = `<script>${content.data}</script>`;

      combinedHTML = combinedHTML.replace(
        "</head>",
        `${dataScript}\n</head>`
      );
    }

    if (content.script) {
      const inlineScript = `<script>${content.script}</script>`;

      combinedHTML = combinedHTML.replace(
        '<script src="script.js"></script>',
        inlineScript
      );
    }

    return combinedHTML;
  } catch (error) {
    console.error(
      "Error getting combined HTML:",
      error
    );

    return null;
  }
}

// ==================================================
// UPDATE WEBSITE CONTENT
// ==================================================

export async function updateWebsiteContent(
  username: string,
  html: string,
  script: string,
  data: string
) {
  if (username.toLowerCase() === "demo") {
    redirect("/lander");
  }

  try {
    const tableName = `${username.toLowerCase()}_website`;

    await sql.query(
      `
      INSERT INTO ${tableName}
        (code, code_script, code_data)
      VALUES
        ($1, $2, $3)
      `,
      [html, script, data]
    );

    return {
      success: true,
      message:
        "Website content updated successfully!",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: "Failed to update website content",
    };
  }
}

// ==================================================
// TRACK VISIT
// ==================================================

export async function trackVisit(
  username: string,
  ipAddress?: string
): Promise<void> {
  try {
    const visitsTableName =
      `${username.toLowerCase()}_visits`;

    console.log(ipAddress);

    await sql.query(
      `
      INSERT INTO ${visitsTableName}
        (entry, visited_at, ip_address)
      VALUES
        ($1, CURRENT_TIMESTAMP, $2)
      `,
      [
        "yes",
        ipAddress || "unknown",
      ]
    );
  } catch (error) {
    console.error(
      "Error tracking visit:",
      error
    );
  }
}

// ==================================================
// GET VISIT COUNT
// ==================================================

export async function getVisitCount(
  username: string
): Promise<number> {
  try {
    const visitsTableName =
      `${username.toLowerCase()}_visits`;

    const tableExists = await sql.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      )
      `,
      [visitsTableName]
    );

    if (!tableExists[0]?.exists) {
      return 0;
    }

    const result = await sql.query(
      `
      SELECT COUNT(*) as count
      FROM ${visitsTableName}
      `
    );

    return Number.parseInt(
      result[0]?.count || "0"
    );
  } catch (error) {
    console.error(
      "Error fetching visit count:",
      error
    );

    return 0;
  }
}

// ==================================================
// VISIT CHART DATA
// ==================================================

export async function getVisitChartData(
  username: string
): Promise<
  {
    date: string;
    visits: number;
  }[]
> {
  try {
    const visitsTableName =
      `${username.toLowerCase()}_visits`;

    const tableExists = await sql.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      )
      `,
      [visitsTableName]
    );

    if (!tableExists[0]?.exists) {
      return [];
    }

    const result = await sql.query(
      `
      WITH date_series AS (
        SELECT generate_series(
          COALESCE(
            (
              SELECT MIN(
                (
                  visited_at
                  AT TIME ZONE 'UTC'
                  AT TIME ZONE 'Asia/Kolkata'
                )::date
              )
              FROM ${visitsTableName}
            ),
            (
              now()
              AT TIME ZONE 'Asia/Kolkata'
            )::date
          ),
          (
            now()
            AT TIME ZONE 'Asia/Kolkata'
          )::date,
          interval '1 day'
        )::date AS date
      )

      SELECT
        TO_CHAR(
          ds.date,
          'YYYY-MM-DD'
        ) AS date,

        COALESCE(
          COUNT(v.visited_at),
          0
        ) AS visits

      FROM date_series ds

      LEFT JOIN ${visitsTableName} v
        ON ds.date =
          (
            v.visited_at
            AT TIME ZONE 'UTC'
            AT TIME ZONE 'Asia/Kolkata'
          )::date

      GROUP BY ds.date

      ORDER BY ds.date
      `
    );

    return result.map((row: any) => ({
      date: row.date,
      visits: Number(row.visits),
    }));
  } catch (error) {
    console.error(
      "Error fetching visit chart data:",
      error
    );

    return [];
  }
}

// ==================================================
// GET ALL USERNAMES
// ==================================================

export async function getAllUsernames(): Promise<
  string[]
> {
  try {
    const result = await sql.query(`
      SELECT name
      FROM alias
      ORDER BY created_at DESC
    `);

    return result.map(
      (row: any) => row.name
    );
  } catch (error) {
    console.error(
      "Error fetching usernames:",
      error
    );

    return [];
  }
}

// ==================================================
// COPY TEMPLATE TO USER
// ==================================================

export async function copyTemplateToUser(
  templateID: number,
  username: string
) {
  console.log(
    "[v0] Starting copyTemplateToUser with templateID:",
    templateID,
    "username:",
    username
  );

  try {
    const templateRes = await sql.query(
      `
      SELECT
        code,
        code_script,
        code_data
      FROM website_template
      WHERE id = $1
      `,
      [templateID]
    );

    if (
      !templateRes ||
      templateRes.length === 0
    ) {
      return {
        success: false,
        error:
          `Template with ID ${templateID} not found`,
      };
    }

    const {
      code,
      code_script,
      code_data,
    } = templateRes[0];

    const userTable =
      `${username.toLowerCase()}_website`;

    await sql.query(
      `
      INSERT INTO ${userTable}
        (code, code_script, code_data)
      VALUES
        ($1, $2, $3)
      `,
      [
        code,
        code_script,
        code_data,
      ]
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[v0] Error in copyTemplateToUser:",
      error
    );

    return {
      success: false,
      error: String(error),
    };
  }
}

// ==================================================
// SEND ENQUIRY
// ==================================================

export async function sendEnquiry(
  username: string,
  formData: FormData
) {
  const safeUsername =
    username.replace(
      /[^a-zA-Z0-9_]/g,
      ""
    );

  const enquiryTableName =
    `${safeUsername}_enquiry`;

  const entries: Record<
    string,
    string
  > = {};

  formData.forEach(
    (value, key) => {
      if (
        value !== null &&
        value !== undefined
      ) {
        entries[key] =
          String(value);
      }
    }
  );

  const entryString =
    Object.entries(entries)
      .map(
        ([key, value]) =>
          `${key}: ${value}`
      )
      .join(", ");

  const entryJSON =
    JSON.stringify(entries);

  // Keep using the existing
  // readable-string storage.
  const finalEntry = entryString;

  // If your DB column supports JSON
  // you can instead use:
  //
  // const finalEntry = entryJSON;

  await sql.query(
    `
    INSERT INTO ${enquiryTableName}
      (entry)
    VALUES
      ($1)
    `,
    [finalEntry]
  );

  console.log(
    "Enquiry inserted into database:",
    {
      table: enquiryTableName,
      entry: entries,
      timestamp:
        new Date().toISOString(),
    }
  );

  return {
    success: true,
    message:
      "Enquiry submitted successfully",
  };
}

// ==================================================
// GET ENQUIRIES
// ==================================================

export async function getEnquiries(
  username: string
) {
  const safeUsername =
    username.replace(
      /[^a-zA-Z0-9_]/g,
      ""
    );

  const enquiryTableName =
    `${safeUsername}_enquiry`;

  const rows: any[] =
    await sql.query(
      `
      SELECT
        id,
        entry,
        visited_at
      FROM ${enquiryTableName}
      ORDER BY visited_at DESC
      `
    );

  const enquiries =
    rows.map((row) => {
      const parsed: Record<
        string,
        string
      > = {};

      if (
        typeof row.entry ===
        "string"
      ) {
        row.entry
          .split(",")
          .forEach(
            (pair: string) => {
              const [
                key,
                ...rest
              ] = pair.split(":");

              if (!key) {
                return;
              }

              parsed[
                key.trim()
              ] =
                rest
                  .join(":")
                  .trim();
            }
          );
      }

      return {
        id: row.id,
        ...parsed,
        created_at:
          row.visited_at,
      };
    });

  return enquiries;
}

// ==================================================
// USERNAME CHECKER
// ==================================================

export async function usernameChecker(
  userId: string
): Promise<string | null> {
  try {
    const result =
      await sql.query(
        `
        SELECT name
        FROM alias
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [userId]
      );

    if (result.length === 0) {
      return null;
    }

    return result[0].name;
  } catch (error) {
    console.error(
      "Error checking username:",
      error
    );

    return null;
  }
}

// ==================================================
// UPLOAD IMAGE
// ==================================================

export async function uploadImage(
  formData: FormData
) {
  const file =
    formData.get(
      "file"
    ) as File;

  if (
    !file ||
    file.size === 0
  ) {
    throw new Error(
      "No file selected"
    );
  }

  const blob = await put(
    `images/${Date.now()}-${file.name}`,
    file,
    {
      access: "public",
      token:
        process.env
          .BLOB_READ_WRITE_TOKEN,
    }
  );

  return blob.url;
}

// ==================================================
// ACTIVE VISITORS
// ==================================================

export async function getActiveVisitorsCount(
  username: string,
  minutes: number = 60
): Promise<number> {
  try {
    const safeUsername =
      username.replace(
        /[^a-zA-Z0-9_]/g,
        ""
      );

    const visitsTable =
      `${safeUsername}_visits`;

    const tableCheck =
      await sql.query(
        `
        SELECT EXISTS (
          SELECT
          FROM information_schema.tables
          WHERE table_name = $1
        )
        `,
        [visitsTable]
      );

    if (
      !tableCheck[0]?.exists
    ) {
      return 0;
    }

    const result =
      await sql.query(
        `
        SELECT
          COUNT(
            DISTINCT ip_address
          ) as active
        FROM ${visitsTable}
        WHERE visited_at >=
          NOW() -
          INTERVAL '${minutes} minutes'
        `
      );

    return Number(
      result[0]?.active || 0
    );
  } catch (error) {
    console.error(
      "Error fetching active visitors:",
      error
    );

    return 0;
  }
}

// ==================================================
// GET TEMPLATE BY ID
// ==================================================

export async function getTemplateById(
  templateId: number
) {
  try {
    const result = await sql`
      SELECT
        code,
        code_script,
        code_data
      FROM website_template
      WHERE id = ${templateId}
    `;

    if (
      !result ||
      result.length === 0
    ) {
      return {
        success: false,
        error:
          "Template not found",
      };
    }

    const template =
      result[0];

    return {
      success: true,
      html: template.code,
      script:
        template.code_script,
      data:
        template.code_data,
    };
  } catch (error: any) {
    console.error(
      "Error fetching template by ID:",
      error
    );

    return {
      success: false,
      error:
        error.message,
    };
  }
}

// ==================================================
// GET EDIT REDIRECT PATH
// ==================================================

export async function getEditRedirectPath(
  username: string
): Promise<string> {
  const content =
    await getWebsiteContent(
      username
    );

  const hasData =
    content?.data &&
    content.data.trim() !== "";

  return hasData
    ? `/edit_new/${username}`
    : `/edit/${username}`;
}

// ==================================================
// GET LATEST PUBLISHED SITE
// WITH NULL DATA
// ==================================================

export async function getLatestPublishedSiteWithNullData(
  username: string
): Promise<WebsiteContent | null> {
  try {
    const tableName =
      `${username.toLowerCase()}_website`;

    console.log(
      "Table:",
      tableName
    );

    const tableExists =
      await sql.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = $1
        ) AS exists
        `,
        [tableName]
      );

    if (
      !tableExists[0]?.exists
    ) {
      console.log(
        "Table does not exist."
      );

      return null;
    }

    const result =
      await sql.query(
        `
        SELECT
          code,
          code_script,
          code_data
        FROM ${tableName}
        ORDER BY created_at DESC
        LIMIT 1
        `
      );

    if (
      result.length === 0
    ) {
      console.log(
        "No rows found."
      );

      return null;
    }

    const latest =
      result[0];

    console.log(
      "Latest row:",
      latest
    );

    if (
      latest.code_data !==
        null &&
      String(
        latest.code_data
      ).trim() !== ""
    ) {
      console.log(
        "Latest row has code_data. Returning empty editor."
      );

      return null;
    }

    return {
      html:
        latest.code ?? "",
      script:
        latest.code_script ??
        "",
      data:
        latest.code_data ??
        "",
    };
  } catch (error) {
    console.error(
      "Error fetching latest published site:",
      error
    );

    return null;
  }
}

// ==================================================
// GET USERNAMES
// ==================================================

export async function getUsernames(
  userId: string
) {
  try {
    const rows = await sql`
      SELECT
        id,
        name
      FROM alias
      WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `;

    return {
      success: true,
      usernames: rows,
    };
  } catch (error) {
    console.error(
      "Failed to fetch usernames:",
      error
    );

    return {
      success: false,
      usernames: [],
      error:
        "Failed to load usernames",
    };
  }
}

// ==================================================
// SUBSCRIPTION TABLE
//
// IMPORTANT:
// This function is NOT called by getSubscription().
//
// Keep this available for setup/migration or any
// existing code that explicitly needs it.
// ==================================================



// ==================================================
// GET SUBSCRIPTION
//
// THIS IS THE IMPORTANT CHANGE.
//
// The layout calls this once for the authenticated
// user.
//
// It ONLY performs the SELECT.
//
// It does NOT:
// - CREATE TABLE
// - call Razorpay
// - call another API
// - call /api/razorpay/status
//
// ==================================================




// ============================================================
// SUBSCRIPTION
// ============================================================



/**
 * Creates the subscriptions table.
 *
 * IMPORTANT:
 * This should ideally be run during deployment/migration,
 * not on every normal page request.
 */



/**
 * Get the current subscription for one user.
 *
 * This function only performs ONE SELECT.
 *
 * It does NOT:
 * - call an API
 * - call Clerk
 * - create the table
 * - make multiple database queries
 */






// ==================================================
// SUBSCRIPTION TYPES ARE DECLARED AT THE TOP OF THIS FILE
// ==================================================

// ==================================================
// ENSURE SUBSCRIPTION TABLE
// ==================================================
//
// IMPORTANT:
// This is for database setup/migration only.
//
// DO NOT call this from getSubscription().
// getSubscription() should perform only ONE SELECT.
//
// Ideally run this once during deployment or manually.
// ==================================================

export async function ensureSubscriptionTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,

      user_id VARCHAR(255)
        NOT NULL
        UNIQUE,

      username VARCHAR(100),

      status VARCHAR(30)
        NOT NULL
        DEFAULT 'free',

      razorpay_order_id VARCHAR(255),

      razorpay_payment_id VARCHAR(255),

      started_at TIMESTAMP,

      expires_at TIMESTAMP,

      ai_credits NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

      email_credits NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

      google_ads_credits NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

      created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Make absolutely sure user_id is unique
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS
    subscriptions_user_id_unique
    ON subscriptions(user_id)
  `;
}

// ==================================================
// GET SUBSCRIPTION
// ==================================================
//
// THIS IS THE FUNCTION YOUR LAYOUT SHOULD CALL.
//
// It performs:
//     ONE database SELECT
//
// It does NOT:
//     - create the table
//     - call Razorpay
//     - call /api/razorpay/status
//     - call Clerk
//     - make another database request
//
// The result can then be passed from the layout
// to your client-side SubscriptionProvider.
//
// ==================================================

export async function getSubscription(
  userId: string
): Promise<SubscriptionData> {
  try {
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

    // ------------------------------------------------
    // USER DOES NOT HAVE A SUBSCRIPTION ROW
    // ------------------------------------------------

    if (result.length === 0) {
      return {
        isPremium: false,

        status: "free",

        username: null,

        startedAt: null,

        expiresAt: null,

        aiCredits: 0,

        emailCredits: 0,

        googleAdsCredits: 0,
      };
    }

    const subscription = result[0];

    // ------------------------------------------------
    // NORMALIZE STATUS
    // ------------------------------------------------

    const status: SubscriptionStatus =
      subscription.status === "premium"
        ? "premium"
        : "free";

    // ------------------------------------------------
    // CHECK PREMIUM EXPIRATION
    // ------------------------------------------------

    const expiresAt = subscription.expires_at
      ? new Date(subscription.expires_at)
      : null;

    const isPremium =
      status === "premium" &&
      (
        expiresAt === null ||
        expiresAt.getTime() > Date.now()
      );

    // ------------------------------------------------
    // RETURN NORMALIZED DATA
    // ------------------------------------------------

    return {
      isPremium,

      status,

      username:
        subscription.username ?? null,

      startedAt:
        subscription.started_at ?? null,

      expiresAt:
        subscription.expires_at ?? null,

      aiCredits:
        Number(subscription.ai_credits ?? 0),

      emailCredits:
        Number(subscription.email_credits ?? 0),

      googleAdsCredits:
        Number(
          subscription.google_ads_credits ?? 0
        ),
    };
  } catch (error) {
    console.error(
      "Error fetching subscription:",
      error
    );

    // ------------------------------------------------
    // FAIL CLOSED
    //
    // If the database fails, NEVER accidentally
    // grant premium access.
    // ------------------------------------------------

    return {
      isPremium: false,

      status: "free",

      username: null,

      startedAt: null,

      expiresAt: null,

      aiCredits: 0,

      emailCredits: 0,

      googleAdsCredits: 0,
    };
  }
}