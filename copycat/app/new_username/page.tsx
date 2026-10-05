"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { CharacterForm } from "@/components/character-form";

export default function NewUsernamePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // User is not logged in
    if (!user) {
      return;
    }
  }, [isLoaded, user, router]);

  // Clerk is still loading
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // User is not authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-600">
          Please sign in to create a username.
        </p>

        <SignInButton mode="modal">
          <button className="rounded-lg bg-black px-6 py-3 text-white">
            Sign in
          </button>
        </SignInButton>
      </div>
    );
  }

  // Logged-in user can create another username
  return <CharacterForm />;
}