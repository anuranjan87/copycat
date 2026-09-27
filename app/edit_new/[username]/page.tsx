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
  const { username } = use(params);

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const siteData = (await getWebsiteContent(username)) ?? {
        html: "",
        script: "",
        data: "",
      };

      let pendingDraft: Record<string, any> | null = null;

      if (typeof window !== "undefined") {
        const possibleKeys = [
          `website-draft-${username}`,
          `website-draft-${username.toLowerCase()}`,
          `website-draft-${username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        ];

        for (const key of possibleKeys) {
          const rawDraft = sessionStorage.getItem(key);
          if (!rawDraft) continue;

          try {
            pendingDraft = JSON.parse(rawDraft);
            sessionStorage.removeItem(key);
            break;
          } catch {
            sessionStorage.removeItem(key);
          }
        }

        if (!pendingDraft) {
          for (let i = 0; i < sessionStorage.length; i += 1) {
            const key = sessionStorage.key(i);
            if (!key || !key.startsWith("website-draft-")) continue;

            try {
              const rawDraft = sessionStorage.getItem(key);
              if (!rawDraft) continue;
              pendingDraft = JSON.parse(rawDraft);
              sessionStorage.removeItem(key);
              break;
            } catch {
              sessionStorage.removeItem(key);
            }
          }
        }
      }

      if (pendingDraft) {
        setContent({
          ...siteData,
          html: pendingDraft.html || siteData?.html || "",
          script: pendingDraft.script || siteData?.script || "",
          data: pendingDraft.data || siteData?.data || "",
        });
        return;
      }

      setContent(siteData);
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