// components/nav.tsx
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEditRedirectPath } from "@/lib/website-actions"; // adjust import path to your actions file

interface NavProps {
  username: string;
}

export default function Nav({ username }: NavProps) {
  const router = useRouter();

  const handleEditClick = async () => {
    const redirectPath = await getEditRedirectPath(username);
    router.push(redirectPath);
  };

  return (
    <nav className="fixed right-0 left-0 z-50 top-1 bg-black/70 backdrop-blur-lg shadow-lg tracking-[0.08em] py-2 px-12" style={{ zoom: '0.54' }}>
      <div className="mx-auto flex max-w-9xl flex-col items-center justify-between px-6 md:flex-row">
        
        <div className="hidden items-center space-x-[4rem] text-lg text-white md:flex tracking-[0.1rem]">
          <div className="px-2"></div>

          <Link href={`/dashboard/${username}`} className="transition hover:opacity-70">
            Dashboard
          </Link>

          <a href="#" className="transition hover:opacity-70">Refunds</a>

          <Link href={`/templates/${username}`} className="transition hover:opacity-70">
            Templates
          </Link>

          <Link href="/lander" className="transition hover:opacity-70">
            Home
          </Link>

          <Link href={`/pricing/${username}`} className="transition hover:opacity-70">
            Premium
          </Link>
        </div>

        <div className="space-x-[4rem]">
          {/* Live Site – external link */}
          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition text-lg hover:opacity-70"
          >
            Live Site
          </a>

          {/* Edit button – conditional redirect */}
          <button
            onClick={handleEditClick}
            className="bg-red-600 text-white px-[2.8rem] tracking-[0.1rem] py-2.5 rounded-sm text-lg font-medium shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>
    </nav>
  );
}