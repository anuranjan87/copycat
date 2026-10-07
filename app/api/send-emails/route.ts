import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { usernameChecker } from "@/lib/website-actions";

type CampaignRecipient = {
  name?: string
  email: string
}

function isCampaignRecipient(value: unknown): value is CampaignRecipient {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string" &&
    value.email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) &&
    (!("name" in value) || typeof value.name === "string")
  )
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before sending a campaign." }, { status: 401 });
    }

    const linkedUsername = await usernameChecker(userId);
    const username = linkedUsername
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (!username) {
      return NextResponse.json(
        { error: "No valid website username is linked to your account." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const { to, subject, html } = body ?? {};

    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: "Add at least one campaign recipient." },
        { status: 400 }
      );
    }
    if (to.length > 500) {
      return NextResponse.json({ error: "Send campaigns to 500 recipients or fewer at a time." }, { status: 400 });
    }
    if (
      typeof subject !== "string" ||
      !subject.trim() ||
      subject.trim().length > 200 ||
      typeof html !== "string" ||
      !html.trim() ||
      html.length > 50000
    ) {
      return NextResponse.json({ error: "A valid subject and email preview are required." }, { status: 400 });
    }

    if (!to.every(isCampaignRecipient)) {
      return NextResponse.json({ error: "One or more recipient addresses are invalid." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured.");
      return NextResponse.json({ error: "Email sending is not configured." }, { status: 500 });
    }
    const resend = new Resend(resendApiKey);

    const from = `${username}@7wingz.com`;

    const results: Array<{ email: string; status: "sent" | "failed"; id?: string; error?: string }> = [];
    for (const recipient of to) {
      const { email } = recipient;
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: [email],
          subject: subject.trim(),
          html,
        });
        if (error) {
          results.push({ email, status: "failed", error: error.message });
        } else {
          results.push({ email, status: "sent", id: data?.id });
        }
      } catch (error) {
        console.error(`Campaign email failed for ${email}:`, error);
        results.push({
          email,
          status: "failed",
          error: error instanceof Error ? error.message : "Email delivery failed.",
        });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.length - sentCount;
    const status = sentCount === 0 ? 502 : failedCount > 0 ? 207 : 200;
    return NextResponse.json(
      {
        sentCount,
        results,
        ...(failedCount > 0 ? { error: sentCount === 0 ? "No campaign emails were sent." : "Some campaign emails could not be sent." } : {}),
      },
      { status },
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}