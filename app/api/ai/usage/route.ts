
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSubscription } from "@/lib/website-actions";

export async function GET() {
  try {
    // Get the currently authenticated Clerk user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Clerk User ID:", userId);

    // Only check subscription status here.
    // Free-user AI usage is handled entirely in the browser
    // using date-based localStorage.
    const subscription = await getSubscription(userId);

    if (subscription.isPremium) {
      return NextResponse.json({
        premium: true,
        limit: null,
      });
    }

    // Free users
    // The actual daily usage counter is handled by the client.
    return NextResponse.json({
      premium: false,
      limit: 2,
    });
  } catch (error) {
    console.error("Failed to fetch subscription status:", error);

    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}

