import { NextResponse } from "next/server";
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// GET: Fetch received emails directly from Resend's API
export async function GET() {
  try {
    // 1. Fetch the list of received emails metadata from Resend
    const { data: listData, error: listError } = await resend.emails.receiving.list();

    if (listError || !listData) {
      return NextResponse.json({ error: listError?.message || "Failed to list emails" }, { status: 400 });
    }

    // 2. Fetch full email content for each message in parallel
    const emailPromises = listData.data.map(async (item) => {
      try {
        const { data: detail } = await resend.emails.receiving.get(item.id);
        return {
          id: item.id,
          from: item.from,
          to: Array.isArray(item.to) ? item.to.join(", ") : item.to,
          subject: item.subject || "(No Subject)",
          text: detail?.text || detail?.html || "No body content available",
          date: item.created_at,
        };
      } catch {
        return {
          id: item.id,
          from: item.from,
          to: Array.isArray(item.to) ? item.to.join(", ") : item.to,
          subject: item.subject || "(No Subject)",
          text: "Message body could not be retrieved.",
          date: item.created_at,
        };
      }
    });

    const emails = await Promise.all(emailPromises);

    return NextResponse.json({ emails }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Outbound send & Inbound Webhook handler
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Outbound email trigger from UI
    if (payload.action === "send") {
      const { data, error } = await resend.emails.send({
        from: "7wingz <hello@7wingz.com>",
        to: [payload.to],
        subject: payload.subject,
        html: `<p>${payload.text}</p>`,
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    // Webhook event receiver from Resend
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}