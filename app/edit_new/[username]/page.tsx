"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getWebsiteContent } from "@/lib/website-actions";

// Dynamic imports
const DesktopComponent = dynamic<ComponentProps>(
  () => import("@/components/new"),
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

  if (isMobile === null || content === null) return null;

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