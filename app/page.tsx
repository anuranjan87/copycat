"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { usernameChecker } from "@/lib/website-actions";


export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();

  const urlUsername = params.username as string;

  useEffect(() => {
    if (!isLoaded) return;

    // ❌ Not logged in → go to demo
    if (!user) {
      router.replace("/templates/demo");
      return;
    }

    const verifyUser = async () => {
      const actualUsername = await usernameChecker(user.id);

      // 🚨 mismatch → block access
      if (actualUsername !== urlUsername) {
        router.replace(`/edit_new/demo`);
      }
    };

    verifyUser();
  }, [user, isLoaded, urlUsername]);

  return <div>Your dashboard</div>;
}