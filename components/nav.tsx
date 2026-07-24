// components/nav.tsx
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { getEditRedirectPath } from "@/lib/website-actions"; // adjust import path

interface NavProps {
  username: string;
}

export default function Nav({ username }: NavProps) {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleEditClick = async () => {
    const redirectPath = await getEditRedirectPath(username);
    router.push(redirectPath);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/"); // or "/sign-in" depending on your flow
  };

  return (
    <nav className="fixed right-0 left-0 z-50 top-0 bg-black/70 backdrop-blur-lg shadow-lg tracking-[0.08em] py-2 px-12" style={{ zoom: '0.58' }}>
      <div className="mx-auto flex max-w-9xl flex-col items-center justify-between px-6 md:flex-row">
        
        <div className="hidden items-center space-x-[4rem] text-lg text-white md:flex tracking-[0.1rem]">
          <div className="px-2"></div>
 <Link href="/lander" className="transition hover:opacity-70">
            Home
          </Link>

          <a href={`/dashboard/${username}`} className="transition hover:opacity-70">
            Dashboard
          </a>


          <Link href={`/templates/${username}`} className="transition hover:opacity-70">
            Templates
          </Link>

         

          <Link href={`/pricing/${username}`} className="transition hover:opacity-70">
            Premium
          </Link>
        
        </div>

        <div className="space-x-[4rem] flex items-center">
          {/* Live Site – external link */}
          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition text-lg hover:opacity-70"
          >
            Live Site
          </a>

          {/* Edit button */}
          <button
            onClick={handleEditClick}
            className="bg-red-800 text-white px-[2.8rem] tracking-[0.1rem] py-2.5 rounded-sm text-lg font-medium shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            Edit
          </button>

          {/* Sign Out button */}
          <button
            onClick={handleSignOut}
            className="border border-white/50 text-white px-4 py-2 rounded-sm text-sm hover:bg-white/10 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}