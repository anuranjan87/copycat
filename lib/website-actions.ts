"use server"

import { neon } from "@neondatabase/serverless"
import { put } from '@vercel/blob'
import OpenAI from "openai"
const sql = neon(process.env.POSTGRES_URL!)

export interface WebsiteContent {
  html: string
  script: string
  data: string
}


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})


export async function generateCodeWithAI(currentCode: string, prompt: string) {
   
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      stream: true,
      messages: [
        {
          role: "system",
          
          content: `You are a helpful JavaScript content editing assistant. You will be given a JavaScript data object definition and a user request to modify it.
Always return complete, valid JavaScript code.

Do NOT change the variable name, object keys, or structure.

Only modify the content values (strings, arrays, numbers, booleans) as requested by the user.

Preserve the overall skeleton and hierarchy exactly as it is.

Ensure all JavaScript syntax is valid (proper commas, brackets, and quotes).

Do not add or remove properties unless explicitly asked.

Do not include explanations or markdown formatting — return only the updated JavaScript code.

The content represents website copy, so ensure the tone and style are appropriate for web presentation. You never chage image urls based on user prompt, keep them unchanged-strictly`,
        },
        {
          role: "user",
          content: `Current JavaScript data object code:\n${currentCode}\n\nUser request: ${prompt}\n\nPlease modify the JavaScript data object according to the user's request and return the complete JavaScript data object, also maintaig the word countsame as in current code. `,
        },
      ],
      max_tokens: 4000,
      temperature: 1,
    })

let generatedCode = '';

for await (const chunk of completion) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    generatedCode += content;
  }
}
    if (!generatedCode) {
      throw new Error("No code generated from OpenAI")
    }

    return {
      success: true,
      generatedCode: generatedCode.trim(),
    }
  } catch (error) {
    console.error("Error generating code with AI:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code with AI",
    }
  }
}

export async function generateCodeWithAIBlank(currentCode: string, prompt: string) {

  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          
          content: `create code in html 5, generate stunning website in a single page, and always use tailwind css.Do not include explanations or markdown formatting — return only the updated, do not have any action button or contact section, use this url for image urls - https://picsum.photos/720/720?random=12, where random=12 has 12 number as random generated number, if thres are three pictures in the out put please have three different random numbers in the url and 720/720 is the dimention of the image in the url,`,
        },
        {
          role: "user",
          content: `Current code:\n${currentCode}\n\nUser request: ${prompt}\n\n, if ${currentCode} is empty, generate new code, otherwise Please modify it the user's request and return the complete code `,
        },
      ],
      max_tokens: 4000,
      temperature: 1,
    })

let generatedCode = '';

for await (const chunk of completion) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    generatedCode += content;
  }
}
    if (!generatedCode) {
      throw new Error("No code generated from OpenAI")
    }

    return {
      success: true,
      generatedCode: generatedCode.trim(),
    }
  } catch (error) {
    console.error("Error generating code with AI:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate code with AI",
    }
  }
}


export async function getWebsiteContent(username: string): Promise<WebsiteContent | null> {
  try {
    const tableName = `${username.toLowerCase()}_website`;

    // Check if the table exists
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

    // Get latest content
    const result = await sql.query(
      `SELECT code, code_script, code_data FROM ${tableName} ORDER BY created_at DESC LIMIT 1`
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


export async function getAllWebsiteTemplates() {
  try {
    console.log("[v0] Fetching all templates")
    const templates = await sql`
      SELECT id, code, code_script, code_data 
      FROM website_template 
      ORDER BY id ASC
    `
    console.log("[v0] All templates fetched:", templates.length)
    return templates
  } catch (error) {
    console.error("Failed to fetch all website templates:", error)
    // Return mock data for development
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
    ]
  }
}




export async function getWebsiteHTML(username: string): Promise<string | null> {
  try {
    const content = await getWebsiteContent(username)
    if (!content) return null

    // Combine HTML with inline script and data
    let combinedHTML = content.html

    // Inject data script before other scripts
    if (content.data) {
      const dataScript = `<script>${content.data}</script>`
      combinedHTML = combinedHTML.replace("</head>", `${dataScript}\n</head>`)
    }

    // Replace script.js reference with inline script
    if (content.script) {
      const inlineScript = `<script>${content.script}</script>`
      combinedHTML = combinedHTML.replace('<script src="script.js"></script>', inlineScript)
    }

    return combinedHTML
  } catch (error) {
    console.error("Error getting combined HTML:", error)
    return null
  }
}


export async function updateWebsiteContent(username: string, html: string, script: string, data: string) {
  try {
    const tableName = `${username.toLowerCase()}_website`

    // Insert new content (creates a new version)
    await sql.query(
      `
      INSERT INTO ${tableName} (code, code_script, code_data) 
      VALUES ($1, $2, $3)
    `,
      [html, script, data],
    )

    return {
      success: true,
      message: "Website content updated successfully!",
    }
  } catch (error) {
    console.error("Error updating website content:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update website content",
    }
  }
}


export async function trackVisit(username: string, ipAddress?: string): Promise<void> {
  try {
    const visitsTableName = `${username.toLowerCase()}_visits`
console.log(ipAddress)
    // Insert a visit record with IP address
    await sql.query(
      `INSERT INTO ${visitsTableName} (entry, visited_at, ip_address) 
      VALUES ($1, CURRENT_TIMESTAMP, $2)`,
      ["yes", ipAddress || "unknown"],
    )
  } catch (error) {
    console.error("Error tracking visit:", error)
  }
}


export async function getVisitCount(username: string): Promise<number> {
  try {
    const visitsTableName = `${username.toLowerCase()}_visits`

    // Check if the visits table exists
    const tableExists = await sql.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `,
      [visitsTableName],
    )

    if (!tableExists[0]?.exists) {
      return 0
    }

    // Get the count of visits
    const result = await sql.query(`
      SELECT COUNT(*) as count FROM ${visitsTableName}
    `)

    return Number.parseInt(result[0]?.count || "0")
  } catch (error) {
    console.error("Error fetching visit count:", error)
    return 0
  }
}


export async function getVisitChartData(username: string): Promise<
  { date: string; visits: number }[]
> {
  try {
    const visitsTableName = `${username.toLowerCase()}_visits`;

    const tableExists = await sql.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
      [visitsTableName]
    );
    if (!tableExists[0]?.exists) return [];

    // ✅ Include today’s date (IST) even if no visits yet
    const result = await sql.query(
      `
      WITH date_series AS (
        SELECT generate_series(
          COALESCE(
            (SELECT MIN((visited_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date) FROM ${visitsTableName}),
            (now() AT TIME ZONE 'Asia/Kolkata')::date
          ),
          (now() AT TIME ZONE 'Asia/Kolkata')::date,
          interval '1 day'
        )::date AS date
      )
      SELECT 
        TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,
        COALESCE(COUNT(v.visited_at), 0) AS visits
      FROM date_series ds
      LEFT JOIN ${visitsTableName} v
        ON ds.date = (v.visited_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
      GROUP BY ds.date
      ORDER BY ds.date
      `
    );

    return result.map((row: any) => ({
      date: row.date,
      visits: Number(row.visits),
    }));
  } catch (error) {
    console.error("Error fetching visit chart data:", error);
    return [];
  }
}



export async function getAllUsernames(): Promise<string[]> {
  try {
    const result = await sql.query(`
      SELECT name FROM alias ORDER BY created_at DESC
    `)

    return result.map((row: any) => row.name)
  } catch (error) {
    console.error("Error fetching usernames:", error)
    return []
  }
}





export async function copyTemplateToUser(templateID: number, username: string) {
  console.log("[v0] Starting copyTemplateToUser with templateID:", templateID, "username:", username)

  try {
    const templateRes = await sql.query(
      `SELECT code, code_script, code_data 
       FROM website_template 
       WHERE id = $1`,
      [templateID],
    )

    if (!templateRes || templateRes.length === 0) {
      return { success: false, error: `Template with ID ${templateID} not found` }
    }

    const { code, code_script, code_data } = templateRes[0]

    const userTable = `${username.toLowerCase()}_website`
    await sql.query(
      `INSERT INTO ${userTable} (code, code_script, code_data) 
       VALUES ($1, $2, $3)`,
      [code, code_script, code_data],
    )

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in copyTemplateToUser:", error)
    return { success: false, error: String(error) }
  }
}


export async function sendEnquiry(username: string, formData: FormData) {
  // ⚠️ Basic sanitization to avoid SQL injection via table name
  const safeUsername = username.replace(/[^a-zA-Z0-9_]/g, "")
  const enquiryTableName = `${safeUsername}_enquiry`

  // ✅ Convert FormData → object dynamically
  const entries: Record<string, string> = {}

  formData.forEach((value, key) => {
    if (value !== null && value !== undefined) {
      entries[key] = String(value)
    }
  })

  // ✅ Option 1: store as readable string
  const entryString = Object.entries(entries)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")

  // ✅ Option 2 (recommended): store JSON
  const entryJSON = JSON.stringify(entries)

  // 👉 choose ONE of these depending on your DB column
  const finalEntry = entryString
  // const finalEntry = entryJSON

  await sql.query(
    `
    INSERT INTO ${enquiryTableName} (entry)
    VALUES ($1)
    `,
    [finalEntry]
  )

  console.log("Enquiry inserted into database:", {
    table: enquiryTableName,
    entry: entries,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: "Enquiry submitted successfully",
  }
}


export async function getEnquiries(username: string) {
  const enquiryTableName = `${username}_enquiry`;

  const rows: any[] = await sql.query(
    `SELECT id, entry, visited_at FROM ${enquiryTableName} ORDER BY visited_at DESC`
  );

  const enquiries = rows.map((row) => {
    const parsed: Record<string, string> = {};

    if (typeof row.entry === "string") {
      row.entry.split(",").forEach((pair: string) => {
        const [key, ...rest] = pair.split(":");

        if (!key) return;

        parsed[key.trim()] = rest.join(":").trim();
      });
    }

    return {
      id: row.id,
      ...parsed, // ✅ dynamic fields from string
      created_at: row.visited_at,
    };
  });

  return enquiries;
}

export async function usernameChecker(userId: string): Promise<string | null> {
  try {
    const result = await sql.query(
      `SELECT name FROM alias WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (result.length === 0) {
      return null;
    }

    return result[0].name;
  } catch (error) {
    console.error("Error checking username:", error);
    return null;
  }
}



export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File

  if (!file || file.size === 0) {
    throw new Error('No file selected')
  }

  const blob = await put(
    `images/${Date.now()}-${file.name}`,
    file,
    {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }
  )

  return blob.url
}

// Add to your existing server actions file (e.g., website-actions.ts)

export async function getActiveVisitorsCount(username: string, minutes: number = 60): Promise<number> {
  try {
    const safeUsername = username.replace(/[^a-zA-Z0-9_]/g, "")
    const visitsTable = `${safeUsername}_visits`

    // Check if table exists
    const tableCheck = await sql.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
      [visitsTable]
    )
    if (!tableCheck[0]?.exists) return 0

    const result = await sql.query(
      `SELECT COUNT(DISTINCT ip_address) as active 
       FROM ${visitsTable}
       WHERE visited_at >= NOW() - INTERVAL '${minutes} minutes'`
    )

    return Number(result[0]?.active || 0)
  } catch (error) {
    console.error("Error fetching active visitors:", error)
    return 0
  }
}


export async function getTemplateById(templateId: number) {
  try {
    const result = await sql`
      SELECT code, code_script, code_data 
      FROM website_template 
      WHERE id = ${templateId}
    `;
    
    if (!result || result.length === 0) {
      return { success: false, error: "Template not found" };
    }
    
    const template = result[0];
    return {
      success: true,
      html: template.code,
      script: template.code_script,
      data: template.code_data,
    };
  } catch (error: any) {
    console.error("Error fetching template by ID:", error);
    return { success: false, error: error.message };
  }
}