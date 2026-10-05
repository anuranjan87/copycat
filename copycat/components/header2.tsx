"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { getUsernames } from "@/lib/website-actions";

type Username = {
  id: number;
  name: string;
};

export default function Header() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [usernameMenuOpen, setUsernameMenuOpen] = useState(false);
  const [usernames, setUsernames] = useState<Username[]>([]);
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  // --------------------------------------------------
  // Load usernames belonging to logged-in user
  // --------------------------------------------------
  useEffect(() => {
    if (!isLoaded || !user) {
      setUsernames([]);
      return;
    }

    const loadUsernames = async () => {
      setLoadingUsernames(true);

      try {
        const result = await getUsernames(user.id);

        if (result.success) {
          setUsernames(result.usernames as Username[]);
        } else {
          setUsernames([]);
        }
      } catch (error) {
        console.error("Failed to load usernames:", error);
        setUsernames([]);
      } finally {
        setLoadingUsernames(false);
      }
    };

    loadUsernames();
  }, [user, isLoaded]);

  // --------------------------------------------------
  // Find currently active username from URL
  // --------------------------------------------------
  const currentUsername =
    usernames.find((username) =>
      pathname.includes(`/templates/${username.name}`)
    )?.name || usernames[0]?.name || null;

  // --------------------------------------------------
  // Toggle mobile menu
  // --------------------------------------------------
  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  // --------------------------------------------------
  // Close username menu
  // --------------------------------------------------
  const closeUsernameMenu = () => {
    setUsernameMenuOpen(false);
  };

  return (
    <>
      {/* =====================================================
          DESKTOP HEADER
      ===================================================== */}
      <header className="fixed inset-x-0 top-0 z-50 hidden border border-gray-100 bg-white/90 py-2 shadow backdrop-blur-lg md:block md:rounded-3xl">
        <div className="px-7">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="7Wings"
                  width={28}
                  height={28}
                />
                <span className="sr-only">7Wings</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex items-center justify-end gap-2">

              {/* =================================================
                  USERNAME SWITCHER
              ================================================= */}
              {isLoaded && user && usernames.length > 0 && (
                <div className="relative mr-2">

                  <button
                    type="button"
                    onClick={() =>
                      setUsernameMenuOpen((prev) => !prev)
                    }
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
                  >
                    {/* Avatar */}
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                      {currentUsername
                        ? currentUsername.charAt(0).toUpperCase()
                        : "U"}
                    </span>

                    {/* Current username */}
                    <span className="max-w-[120px] truncate">
                      {loadingUsernames
                        ? "Loading..."
                        : currentUsername || "Username"}
                    </span>

                    {/* Arrow */}
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        usernameMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m6 9 6 6 6-6"
                      />
                    </svg>
                  </button>

                  {/* =================================================
                      DROPDOWN
                  ================================================= */}
                  {usernameMenuOpen && (
                    <>
                      {/* Click outside */}
                      <button
                        type="button"
                        aria-label="Close username menu"
                        className="fixed inset-0 z-40 h-full w-full cursor-default"
                        onClick={closeUsernameMenu}
                      />

                      <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                        {/* Header */}
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            Your usernames
                          </p>
                        </div>

                        {/* Usernames */}
                        <div className="max-h-64 overflow-y-auto p-2">
                          {usernames.map((username) => {
                            const isCurrent =
                              username.name === currentUsername;

                            return (
                              <Link
                                key={username.id}
                                href={`/templates/${username.name}`}
                                onClick={closeUsernameMenu}
                                className={`flex items-center justify-between rounded-xl px-3 py-3 transition ${
                                  isCurrent
                                    ? "bg-gray-100"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-3">

                                  {/* Initial */}
                                  <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                                      isCurrent
                                        ? "bg-black text-white"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {username.name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>

                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {username.name}
                                    </p>

                                    <p className="text-xs text-gray-400">
                                      7wings.com/{username.name}
                                    </p>
                                  </div>
                                </div>

                                {/* Current check */}
                                {isCurrent && (
                                  <svg
                                    className="h-4 w-4 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="m5 12 4 4L19 6"
                                    />
                                  </svg>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Create another */}
                        <div className="border-t border-gray-100 p-2">
                          <Link
                            href="/new_username"
                            onClick={closeUsernameMenu}
                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-300 text-lg">
                              +
                            </span>

                            <span>
                              Create another username
                            </span>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* =================================================
                  EXISTING NAVIGATION
              ================================================= */}

              <Link
                href="/tailwind-css-instagram-login"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                100+ login
              </Link>

              <Link
                href="/deploytocloud"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Deploy To Cloud
              </Link>

              <Link
                href="/templates"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Templates
              </Link>

              <Link
                href="/resources/tailwind-css-gradient-generator"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Pick Gradient
              </Link>

              <Link
                href="/tailwind-css-buttons"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                100+ Buttons
              </Link>

              <Link
                href="/playground"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Playground
              </Link>

              <Link
                href="/image-hosting"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Host Images
              </Link>

              <Link
                href="/sketch"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Sketch
              </Link>

              <Link
                href="/saved"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Saved Items
              </Link>

              <Link
                href="/advanced-image-editor"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Image Editor
              </Link>

              <Link
                href="https://justaiingaround.com/landing-page"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Social AI
              </Link>

              <Link
                href="/blogs"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Blogs
              </Link>

              <Link
                href="/company"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Upgrade
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}
      <header className="fixed inset-x-0 top-0 z-50 block border border-gray-100 bg-white/90 py-2 shadow backdrop-blur-lg md:hidden">
        <div className="px-5">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="7Wings"
                width={28}
                height={28}
              />
            </Link>

            <div className="flex items-center gap-3">

              {/* Mobile username */}
              {isLoaded && user && usernames.length > 0 && (
                <div className="relative">

                  <button
                    type="button"
                    onClick={() =>
                      setUsernameMenuOpen((prev) => !prev)
                    }
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-2 py-1.5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                      {currentUsername
                        ? currentUsername.charAt(0).toUpperCase()
                        : "U"}
                    </span>

                    <svg
                      className={`h-4 w-4 transition-transform ${
                        usernameMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m6 9 6 6 6-6"
                      />
                    </svg>
                  </button>

                  {usernameMenuOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Close username menu"
                        className="fixed inset-0 z-40"
                        onClick={closeUsernameMenu}
                      />

                      <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            Your usernames
                          </p>
                        </div>

                        <div className="p-2">
                          {usernames.map((username) => {
                            const isCurrent =
                              username.name === currentUsername;

                            return (
                              <Link
                                key={username.id}
                                href={`/templates/${username.name}`}
                                onClick={closeUsernameMenu}
                                className={`flex items-center justify-between rounded-xl px-3 py-3 ${
                                  isCurrent
                                    ? "bg-gray-100"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {username.name}
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    7wings.com/{username.name}
                                  </p>
                                </div>

                                {isCurrent && (
                                  <span className="text-green-600">
                                    ✓
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        <div className="border-t border-gray-100 p-2">
                          <Link
                            href="/new_username"
                            onClick={closeUsernameMenu}
                            className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-gray-50"
                          >
                            <span className="text-lg">+</span>
                            Create another username
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Menu button */}
              <button
                onClick={toggleMenu}
                className="text-black focus:outline-none"
                aria-label="Toggle Menu"
                aria-expanded={isOpen}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {isOpen && (
          <nav className="absolute left-0 top-full w-full border-t bg-white shadow-lg">
            <ul className="flex flex-col space-y-2 p-4">

              <li>
                <Link
                  href="/templates"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Templates
                </Link>
              </li>

              <li>
                <Link
                  href="/deploytocloud"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Deploy To Cloud
                </Link>
              </li>

              <li>
                <Link
                  href="/playground"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Playground
                </Link>
              </li>

              <li>
                <Link
                  href="/saved"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Saved Items
                </Link>
              </li>

              <li>
                <Link
                  href="/image-hosting"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Host Images
                </Link>
              </li>

              <li>
                <Link
                  href="/advanced-image-editor"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Image Editor
                </Link>
              </li>

              <li>
                <Link
                  href="/blogs"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Blogs
                </Link>
              </li>

              <li>
                <Link
                  href="/company"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Upgrade
                </Link>
              </li>

            </ul>
          </nav>
        )}
      </header>
    </>
  );
}