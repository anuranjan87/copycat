// app/sign-in/page.tsx

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        forceRedirectUrl="/"
        
      />
    </div>
  );
}