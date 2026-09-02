
"use client";

import { Lock, RocketIcon, Sparkles } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface PremiumRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export default function PremiumRequiredModal({
  open,
  onOpenChange,
  feature = "This feature",
}: PremiumRequiredModalProps) {
  const router = useRouter();

  const params = useParams<{ username: string }>();
  const username = params?.username;

  const handleUpgrade = () => {
    if (!username) {
      console.error("Username is missing from the current route");
      return;
    }

    onOpenChange(false);

    router.push(`/pricing/${username}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[calc(100%-32px)]
          max-w-[420px]
          overflow-hidden
          rounded-2xl
          border-0
          bg-white
          p-0
          text-gray-900
          shadow-2xl
        "
      >
        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400" />

        <div className="px-7 pb-7 pt-8">
          <DialogHeader className="space-y-0">
            {/* Icon */}
            <div className="mb-5 flex justify-center">
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-pink-50
                  text-pink-500
                "
              >
                <Lock className="h-5 w-5" />
              </div>
            </div>

            {/* Title */}
            <DialogTitle className="text-center text-[21px] font-bold tracking-tight text-gray-900">
              {feature} is Premium
            </DialogTitle>

            {/* Description */}
            <DialogDescription className="mx-auto mt-2 max-w-[310px] text-center text-[13px] leading-5 text-gray-500">
              This feature is available exclusively for Premium members.
              Upgrade to unlock it.
            </DialogDescription>
          </DialogHeader>

          {/* Benefits */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                <RocketIcon className="h-4 w-4 text-pink-500" />
              </div>

              <div>
                <p className="text-[13px] font-semibold text-gray-800">
                  Unlock Premium features
                </p>

                <p className="text-[11px] text-gray-400">
                  Get access to all premium tools
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                <Lock className="h-4 w-4 text-pink-500" />
              </div>

              <div>
                <p className="text-[13px] font-semibold text-gray-800">
                  No more locked content
                </p>

                <p className="text-[11px] text-gray-400">
                  Use everything without restrictions
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-center">
            <p className="text-[11px] leading-4 text-gray-500">
              You're one upgrade away from unlocking this.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleUpgrade}
            disabled={!username}
            className="
              mt-5
              h-11
              w-full
              rounded-lg
              bg-pink-500
              text-sm
              font-semibold
              text-white
              shadow-md
              shadow-pink-500/20
              transition-all
              hover:bg-pink-600
              hover:shadow-lg
              hover:shadow-pink-500/25
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>

          <p className="mt-3 text-center text-[10px] text-gray-400">
            Unlock everything and get the full experience.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

