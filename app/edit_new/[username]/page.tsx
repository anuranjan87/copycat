"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getWebsiteContent } from "@/lib/website-actions";

// Dynamic imports
const DesktopComponent = dynamic<ComponentProps>(
  () => import("@/components/EditorContent1"),
  { ssr: true }
);

const MobileComponent = dynamic<ComponentProps>(
  () => import("@/components/new_mobile"),
  { ssr: false }
);

type ComponentProps = {
  username: string;
  initialContent: any;
};

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function Home({ params }: PageProps) {
  const { username } = use(params); // ✅ FIXED

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getWebsiteContent(username);
      setContent(data);
    };

    fetchData();
  }, [username]);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  if (isMobile === null || content === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-zinc-500">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-900" />
          </div>
          <p className="mt-4 text-sm">Loading your editor...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {isMobile ? (
        <MobileComponent username={username} initialContent={content} />
      ) : (
        <DesktopComponent username={username} initialContent={content} />
      )}
    </main>
  );
}