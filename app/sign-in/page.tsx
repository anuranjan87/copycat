// app/sign-in/page.tsx

import { SignIn, SignUp } from "@clerk/nextjs";

interface PageProps {
  searchParams: Promise<{
    mode?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center">
      {params.mode === "signup" ? (
        <SignUp forceRedirectUrl="/" signInUrl="/sign-up" />
      ) : (
        <SignIn forceRedirectUrl="/"  />
      )}
    </div>
  );
}