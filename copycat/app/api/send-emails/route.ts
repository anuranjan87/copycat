import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, username } = await request.json();

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: "Recipients list is required and must be an array" },
        { status: 400 }
      );
    }
    if (!subject || !html || !username) {
      return NextResponse.json(
        { error: "Missing required fields: subject, html, username" },
        { status: 400 }
      );
    }

    const from = `${username}@7wingz.com`;

    // Send to each recipient (you could batch with a BCC field, but we'll send individually)
    const results = [];
    for (const recipient of to) {
      const { name, email } = recipient;
      if (!email) continue;
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: [email],
          subject,
          html,
          // Optionally use the recipient's name in the "to" field
          // to: [{ name, email }],
        });
        if (error) {
          results.push({ email, status: "failed", error: error.message });
        } else {
          results.push({ email, status: "sent", id: data?.id });
        }
      } catch (err: any) {
        results.push({ email, status: "failed", error: err.message });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    return NextResponse.json({ sentCount, results });
  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}