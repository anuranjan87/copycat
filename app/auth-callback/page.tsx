"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SSOCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // preserve templateId if present
    const templateId = params.get("templateId");

    const target = templateId
      ? `/edit_new/demo?templateId=${templateId}`
      : `/edit_new/demo`;

    router.replace(target);
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      Finishing sign in...
    </div>
  );
}