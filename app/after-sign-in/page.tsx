import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export default async function AfterSignInPage() {
  const { userId } = await auth();

  // User is not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Find the username associated with this Clerk user
  const result = await sql`
    SELECT name
    FROM alias
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  // No alias found
  if (result.length === 0) {
    redirect("/sign-in?error=username-not-found");
  }

  const username = result[0].name;

  // Redirect to /username
  redirect(`/templates/${encodeURIComponent(username)}`);
}