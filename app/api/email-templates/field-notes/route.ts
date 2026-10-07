import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import {
  fieldNotesSubject,
  fieldNotesTemplateHtml,
} from "../../../../lib/field-notes-email-template";
import {
  empireExcellenceHtml,
  empireExcellenceSubject,
} from "../../../../lib/empire-excellence-email-template";
import {
  digitalMarketingHtml,
  digitalMarketingSubject,
} from "../../../../lib/digital-marketing-email-template";
import {
  successfulBusinessHtml,
  successfulBusinessSubject,
} from "../../../../lib/successful-business-email-template";
import {
  exampleHereHtml,
  exampleHereSubject,
} from "../../../../lib/example-here-email-template";
import {
  utWisiHtml,
  utWisiSubject,
} from "../../../../lib/ut-wisi-email-template";
import {
  realEstateHtml,
  realEstateSubject,
} from "../../../../lib/real-estate-email-template";
import {
  familyClebretyHtml,
  familyClebretySubject,
} from "../../../../lib/family-clebrety-email-template";
import {
  newChapterHtml,
  newChapterSubject,
} from "../../../../lib/new-chapter-email-template";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Sign in to load this email template." }, { status: 401 });
    }

    const databaseUrl = process.env.POSTGRES_URL;
    if (!databaseUrl) {
      console.error("POSTGRES_URL is not configured.");
      return Response.json({ error: "The email template database is not configured." }, { status: 500 });
    }
    const sql = neon(databaseUrl);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        subject TEXT,
        html_content TEXT NOT NULL
      )
    `);

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"field-notes"},
        ${"Field Notes"},
        ${"Editorial newsletter template"},
        ${"Editorial"},
        ${fieldNotesSubject},
        ${fieldNotesTemplateHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"new-chapter"},
        ${"Your New Chapter"},
        ${"A centered editorial newsletter with a welcoming serif headline."},
        ${"Editorial"},
        ${newChapterSubject},
        ${newChapterHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"family-clebrety"},
        ${"A Family of Brands"},
        ${"A dark editorial layout for brand strategy and portfolio development."},
        ${"Branding"},
        ${familyClebretySubject},
        ${familyClebretyHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"real-estate-profile"},
        ${"Real Estate"},
        ${"A clean real estate profile layout with expertise and client information."},
        ${"Real Estate"},
        ${realEstateSubject},
        ${realEstateHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"ut-wisi-enim"},
        ${"Ut Wisi Enim"},
        ${"A bold red, stepped-layout editorial email flyer."},
        ${"Editorial"},
        ${utWisiSubject},
        ${utWisiHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"example-here"},
        ${"Example Here"},
        ${"A minimal editorial layout featuring an ocean coastline."},
        ${"Editorial"},
        ${exampleHereSubject},
        ${exampleHereHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"successful-business"},
        ${"Successful Business"},
        ${"A warm gold business flyer with company services and contact details."},
        ${"Business"},
        ${successfulBusinessSubject},
        ${successfulBusinessHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"digital-marketing-agency"},
        ${"Digital Marketing Agency"},
        ${"A bright, modern flyer for digital marketing services."},
        ${"Marketing"},
        ${digitalMarketingSubject},
        ${digitalMarketingHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    await sql`
      INSERT INTO email_templates (id, title, description, category, subject, html_content)
      VALUES (
        ${"empire-excellence"},
        ${"Empire of Excellence"},
        ${"A bold corporate editorial design for Salford & Co."},
        ${"Business"},
        ${empireExcellenceSubject},
        ${empireExcellenceHtml}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subject = EXCLUDED.subject,
        html_content = EXCLUDED.html_content
    `;

    const rows = await sql`
      SELECT id, title, description, category, subject, html_content
      FROM email_templates
      ORDER BY title
    `;
    const templates = rows.map((template) => ({
      id: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      subject: template.subject,
      htmlContent: template.html_content,
    }));

    if (!templates.some((template) => template.id === "field-notes") ||
        !templates.some((template) => template.id === "empire-excellence") ||
        !templates.some((template) => template.id === "digital-marketing-agency") ||
        !templates.some((template) => template.id === "successful-business") ||
        !templates.some((template) => template.id === "example-here") ||
        !templates.some((template) => template.id === "ut-wisi-enim") ||
        !templates.some((template) => template.id === "real-estate-profile") ||
        !templates.some((template) => template.id === "family-clebrety") ||
        !templates.some((template) => template.id === "new-chapter")) {
      console.error("One or more email templates were not found after initialization.");
      return Response.json({ error: "Unable to load the email templates." }, { status: 500 });
    }

    return Response.json(
      { templates },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to initialize or load the email templates:", error);
    return Response.json({ error: "Unable to load the email templates." }, { status: 500 });
  }
}
