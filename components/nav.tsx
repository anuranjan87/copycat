// components/nav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import {
  getEditRedirectPath,
  getUsernames,
} from "@/lib/website-actions";

interface NavProps {
  username: string;
}

interface Username {
  id: number;
  name: string;
}

export default function Nav({ username }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const [usernames, setUsernames] = useState<Username[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [loadingUsernames, setLoadingUsernames] = useState(true);

  /*
   * Load all usernames belonging to the logged-in user
   */
  useEffect(() => {
    if (!isLoaded || !user) return;

    const loadUsernames = async () => {
      try {
        setLoadingUsernames(true);

        const result = await getUsernames(user.id);

        if (result.success) {
          setUsernames(result.usernames as Username[]);
        } else {
          console.error(result.error);
        }
      } catch (error) {
        console.error("Failed to load usernames:", error);
      } finally {
        setLoadingUsernames(false);
      }
    };

    loadUsernames();
  }, [user, isLoaded]);

  /*
   * Switch username while keeping the current section.
   *
   * Example:
   * /dashboard/anuranjan
   * ->
   * /dashboard/chris
   *
   * /templates/anuranjan
   * ->
   * /templates/chris
   */
  const handleUsernameSwitch = (newUsername: string) => {
    setShowSwitcher(false);

    if (!newUsername) return;

    /*
     * Replace the current username in the URL.
     */
    const currentUsernamePath = `/${username}`;

    if (pathname.includes(currentUsernamePath)) {
      const newPath = pathname.replace(
        currentUsernamePath,
        `/${newUsername}`
      );

      router.push(newPath);
      return;
    }

    /*
     * Fallback if current username isn't found in pathname.
     */
    router.push(`/templates/${newUsername}`);
  };

  /*
   * Edit website
   */
  const handleEditClick = async () => {
    try {
      const redirectPath = await getEditRedirectPath(username);
      router.push(redirectPath);
    } catch (error) {
      console.error("Failed to get edit redirect:", error);
    }
  };

  /*
   * Sign out
   */
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 bg-black/75 py-2 px-4 tracking-[0.1em] shadow-lg backdrop-blur-lg"
      style={{ zoom: "0.56" }}
    >
      <div className="mx-auto flex max-w-9xl flex-col items-center justify-between px-6 md:flex-row">

        {/* LEFT SIDE */}
        <div className="hidden items-center space-x-9 px-[5rem] text-lg tracking-[0.1rem] text-white md:flex">

          <Link
            href="/lander"
            className="transition hover:opacity-70"
          >
            Home
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href={`/dashboard/${username}`}
            className="transition hover:opacity-70"
          >
            Dashboard
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href={`/templates/${username}`}
            className="transition hover:opacity-70"
          >
            Templates
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href={`/pricing/${username}`}
            className="transition hover:opacity-70"
          >
            Premium
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href={`/marketing/${username}`}
            className="transition hover:opacity-70"
          >
            Marketing
          </Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center space-x-[2rem]">

          {/* ================================
              USERNAME SWITCHER
          ================================= */}

          <div className="relative">

            <button
              type="button"
              onClick={() => setShowSwitcher((prev) => !prev)}
              className="flex items-center gap-3 rounded-md border border-white/20 bg-white/5 px-5 py-3 text-lg text-white transition hover:bg-white/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                {username.charAt(0).toUpperCase()}
              </div>

              <span>
                {username}
              </span>

              <svg
                className={`h-5 w-5 transition-transform ${
                  showSwitcher ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </button>

            {/* DROPDOWN */}
            {showSwitcher && (
              <div className="absolute right-0 mt-3 w-[280px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">

                {/* Header */}
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="text-sm font-medium tracking-normal text-white">
                    Your websites
                  </p>

                  <p className="mt-1 text-xs tracking-normal text-zinc-500">
                    Switch between your usernames
                  </p>
                </div>

                {/* Username list */}
                <div className="max-h-[300px] overflow-y-auto p-2">

                  {loadingUsernames ? (
                    <div className="px-4 py-5 text-center text-sm tracking-normal text-zinc-500">
                      Loading...
                    </div>
                  ) : usernames.length === 0 ? (
                    <div className="px-4 py-5 text-center text-sm tracking-normal text-zinc-500">
                      No usernames found
                    </div>
                  ) : (
                    usernames.map((item) => {
                      const isCurrent =
                        item.name.toLowerCase() ===
                        username.toLowerCase();

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            handleUsernameSwitch(item.name)
                          }
                          className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left tracking-normal transition ${
                            isCurrent
                              ? "bg-white/10 text-white"
                              : "text-zinc-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-white">
                              {item.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <span className="text-sm">
                              7wings.com/{item.name}
                            </span>

                          </div>

                          {isCurrent && (
                            <svg
                              className="h-4 w-4 text-green-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m5 12 4 4L19 6"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  )}

                </div>

                {/* New username */}
                <div className="border-t border-white/10 p-2">

                  <Link
                    href="/new_username"
                    onClick={() => setShowSwitcher(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm tracking-normal text-zinc-300 transition hover:bg-white/5 hover:text-white"
                  >

                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">
                      +
                    </div>

                    <span>
                      Create new username
                    </span>

                  </Link>

                </div>

              </div>
            )}

          </div>

          {/* ================================
              LIVE SITE
          ================================= */}

          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-white transition hover:opacity-70"
          >
            Live Site
          </a>

          {/* ================================
              EDIT
          ================================= */}

          <button
            onClick={handleEditClick}
            className="cursor-pointer rounded-sm bg-red-800 px-[2.8rem] py-2.5 text-lg font-medium tracking-[0.1rem] text-white shadow-md transition-all duration-300 hover:shadow-xl"
          >
            Edit
          </button>

          {/* ================================
              SIGN OUT
          ================================= */}

          <button
            onClick={handleSignOut}
            className="rounded-sm border border-white/50 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Sign Out
          </button>

        </div>
      </div>
    </nav>
  );
}