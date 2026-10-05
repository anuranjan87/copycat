"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignIn, useUser } from "@clerk/nextjs";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import {
  usernameChecker,
  ensureUserSubscription,
} from "@/lib/website-actions";

import { CharacterForm } from "@/components/character-form";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignInModal({
  open,
  onClose,
}: SignInModalProps) {
  const router = useRouter();

  const {
    user,
    isLoaded,
  } = useUser();

  const [isChecking, setIsChecking] =
    useState(false);

  const [showCharacterForm, setShowCharacterForm] =
    useState(false);

  const [hasChecked, setHasChecked] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    if (!isLoaded) return;

    if (!user) return;

    if (hasChecked) return;

    let cancelled = false;

    const initializeUser = async () => {
      setIsChecking(true);

      try {
        /*
         * Creates a free subscription row if the user
         * does not already have one.
         *
         * Existing premium subscriptions remain unchanged.
         */
        await ensureUserSubscription(user.id);

        if (cancelled) return;

        /*
         * Check whether the user already has a username.
         */
        const username = await usernameChecker(
          user.id
        );

        if (cancelled) return;

        /*
         * EXISTING USER
         */
        if (
          username &&
          username !== "demo"
        ) {
          setShowCharacterForm(false);
          setHasChecked(true);

          onClose();

          router.replace(
            `/edit_new/${username}`
          );

          return;
        }

        /*
         * NEW USER
         */
        setShowCharacterForm(true);
        setHasChecked(true);
      } catch (error) {
        console.error(
          "Failed to initialize user:",
          error
        );
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    initializeUser();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    isLoaded,
    user,
    hasChecked,
    router,
    onClose,
  ]);

  useEffect(() => {
    if (!open) {
      setIsChecking(false);
      setShowCharacterForm(false);
      setHasChecked(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-md">
        {isChecking && (
          <div className="flex h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-black text-white backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />

              <p className="text-sm tracking-wide text-white/70">
                Setting up your account...
              </p>
            </div>
          </div>
        )}

        {!isChecking && showCharacterForm && (
          <CharacterForm />
        )}

        {!isChecking && !showCharacterForm && (
          <SignIn routing="virtual" />
        )}
      </DialogContent>
    </Dialog>
  );
}