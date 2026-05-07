"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  SignIn,
  useUser,
} from "@clerk/nextjs";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { usernameChecker } from "@/lib/website-actions";

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

    // modal closed
    if (!open) return;

    // clerk not ready
    if (!isLoaded) return;

    // not signed in yet
    if (!user) return;

    // prevent double runs
    if (hasChecked) return;

    const checkUsername = async () => {

      setIsChecking(true);

      try {

        const username =
          await usernameChecker(user.id);

        // EXISTING USER
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

        // NEW USER
        setShowCharacterForm(true);

      } catch (error) {

        console.error(error);

      } finally {

        setIsChecking(false);

      }
    };

    checkUsername();

  }, [
    user,
    isLoaded,
    open,
    hasChecked,
    router,
    onClose,
  ]);

  // reset modal state
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
      onOpenChange={onClose}
    >

      <DialogContent className="overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-md">

        {/* LOADING */}

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

        {/* CHARACTER FORM */}

        {!isChecking &&
          showCharacterForm && (
            <CharacterForm />
          )}

        {/* SIGN IN */}

        {!isChecking &&
          !showCharacterForm && (

            <SignIn
              routing="virtual"
            />

          )}

      </DialogContent>

    </Dialog>

  );
}