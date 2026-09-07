
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

  /*
   * Optional callback for opening the email campaign modal.
   * Pass your existing openModal function from the parent.
   */
  onCreateEmailCampaign?: () => void;
}

interface Username {
  id: number;
  name: string;
}

export default function Nav({
  username,
  onCreateEmailCampaign,
}: NavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const [usernames, setUsernames] = useState<Username[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [loadingUsernames, setLoadingUsernames] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
   */
  const handleUsernameSwitch = (newUsername: string) => {
    setShowSwitcher(false);
    setIsMobileMenuOpen(false);

    if (!newUsername) return;

    const currentUsernamePath = `/${username}`;

    if (pathname.includes(currentUsernamePath)) {
      const newPath = pathname.replace(
        currentUsernamePath,
        `/${newUsername}`
      );

      router.push(newPath);
      return;
    }

    router.push(`/templates/${newUsername}`);
  };

  /*
   * Edit website
   */
  const handleEditClick = async () => {
    try {
      const redirectPath =
        await getEditRedirectPath(username);

      router.push(redirectPath);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error(
        "Failed to get edit redirect:",
        error
      );
    }
  };

  /*
   * Sign out
   */
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  /*
   * Close mobile menu
   */
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setShowSwitcher(false);
  };

  /*
   * Create email campaign
   */
  const handleCreateEmailCampaign = () => {
    setIsMobileMenuOpen(false);

    if (onCreateEmailCampaign) {
      onCreateEmailCampaign();
    }
  };

  return (
    <>
      {/* ============================================================
          MAIN NAVBAR
      ============================================================ */}
      <nav
        className="
          fixed
          left-0
          right-0
          top-0
          z-50
          bg-black/75
          px-4
          py-3.5
          tracking-[0.1em]
          shadow-lg
          backdrop-blur-lg
          md:py-2
        "
        style={{ zoom: "0.56" }}
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-9xl
            items-center
            justify-between
            px-0
            md:px-6
          "
        >

          {/* ========================================================
              LEFT SIDE - DESKTOP ONLY
          ======================================================== */}
          <div
            className="
              hidden
              items-center
              space-x-9
              px-[5rem]
              text-lg
              tracking-[0.1rem]
              text-white
              md:flex
            "
          >
            <Link
              href="/lander"
              className="transition hover:opacity-70"
            >
              Home
            </Link>

            <span className="text-white/30">
              |
            </span>

            <Link
              href={`/dashboard/${username}`}
              className="transition hover:opacity-70"
            >
              Dashboard
            </Link>

            <span className="text-white/30">
              |
            </span>

            <Link
              href={`/templates/${username}`}
              className="transition hover:opacity-70"
            >
              Templates
            </Link>

            <span className="text-white/30">
              |
            </span>

            <Link
              href={`/pricing/${username}`}
              className="transition hover:opacity-70"
            >
              Premium
            </Link>

            <span className="text-white/30">
              |
            </span>

            <Link
              href={`/marketing/${username}`}
              className="transition hover:opacity-70"
            >
              Marketing
            </Link>
          </div>

          {/* ========================================================
              RIGHT SIDE - DESKTOP ONLY
          ======================================================== */}
          <div
            className="
              hidden
              items-center
              space-x-[2rem]
              md:flex
            "
          >

            {/* ======================================================
                USERNAME SWITCHER
            ====================================================== */}
            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setShowSwitcher((prev) => !prev)
                }
                className="
                  flex
                  items-center
                  gap-3
                  rounded-md
                  border
                  border-white/20
                  bg-white/5
                  px-5
                  py-3
                  text-lg
                  text-white
                  transition
                  hover:bg-white/10
                "
              >
                <div
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    text-sm
                    font-semibold
                    text-black
                  "
                >
                  {username.charAt(0).toUpperCase()}
                </div>

                <span>
                  {username}
                </span>

                <svg
                  className={`
                    h-5
                    w-5
                    transition-transform
                    ${
                      showSwitcher
                        ? "rotate-180"
                        : ""
                    }
                  `}
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

              {/* ====================================================
                  DESKTOP USERNAME DROPDOWN
              ==================================================== */}
              {showSwitcher && (
                <div
                  className="
                    absolute
                    right-0
                    mt-3
                    w-[280px]
                    overflow-hidden
                    rounded-xl
                    border
                    border-white/10
                    bg-zinc-950
                    shadow-2xl
                  "
                >

                  <div
                    className="
                      border-b
                      border-white/10
                      px-5
                      py-4
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-medium
                        tracking-normal
                        text-white
                      "
                    >
                      Your websites
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        tracking-normal
                        text-zinc-500
                      "
                    >
                      Switch between your usernames
                    </p>
                  </div>

                  <div
                    className="
                      max-h-[300px]
                      overflow-y-auto
                      p-2
                    "
                  >
                    {loadingUsernames ? (
                      <div
                        className="
                          px-4
                          py-5
                          text-center
                          text-sm
                          tracking-normal
                          text-zinc-500
                        "
                      >
                        Loading...
                      </div>
                    ) : usernames.length === 0 ? (
                      <div
                        className="
                          px-4
                          py-5
                          text-center
                          text-sm
                          tracking-normal
                          text-zinc-500
                        "
                      >
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
                              handleUsernameSwitch(
                                item.name
                              )
                            }
                            className={`
                              flex
                              w-full
                              items-center
                              justify-between
                              rounded-lg
                              px-4
                              py-3
                              text-left
                              tracking-normal
                              transition
                              ${
                                isCurrent
                                  ? "bg-white/10 text-white"
                                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
                              }
                            `}
                          >
                            <div
                              className="
                                flex
                                items-center
                                gap-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-zinc-800
                                  text-xs
                                  font-medium
                                  text-white
                                "
                              >
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
                                className="
                                  h-4
                                  w-4
                                  text-green-400
                                "
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

                  <div
                    className="
                      border-t
                      border-white/10
                      p-2
                    "
                  >
                    <Link
                      href="/new_username"
                      onClick={() =>
                        setShowSwitcher(false)
                      }
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-lg
                        px-4
                        py-3
                        text-sm
                        tracking-normal
                        text-zinc-300
                        transition
                        hover:bg-white/5
                        hover:text-white
                      "
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-white/20
                        "
                      >
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

            {/* ======================================================
                LIVE SITE
            ====================================================== */}
            <a
              href={`/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="
                text-lg
                text-white
                transition
                hover:opacity-70
              "
            >
              Live Site
            </a>

            {/* ======================================================
                EDIT
            ====================================================== */}
            <button
              type="button"
              onClick={handleEditClick}
              className="
                cursor-pointer
                rounded-sm
                bg-red-800
                px-[2.8rem]
                py-2.5
                text-lg
                font-medium
                tracking-[0.1rem]
                text-white
                shadow-md
                transition-all
                duration-300
                hover:shadow-xl
              "
            >
              Edit
            </button>

            {/* ======================================================
                SIGN OUT
            ====================================================== */}
            <button
              type="button"
              onClick={handleSignOut}
              className="
                rounded-sm
                border
                border-white/50
                px-4
                py-2
                text-sm
                text-white
                transition
                hover:bg-white/10
              "
            >
              Sign Out
            </button>
          </div>

          {/* ========================================================
              MOBILE HEADER
          ======================================================== */}
         {/* ========================================================
    MOBILE HEADER
======================================================== */}
<div className="flex w-full items-center justify-between md:hidden">

  {/* USERNAME */}
  <button
    type="button"
    onClick={() => {
      setShowSwitcher((prev) => !prev);
      setIsMobileMenuOpen(false);
    }}
    className="flex min-w-0 items-center gap-2.5 text-left text-white"
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
      {username.charAt(0).toUpperCase()}
    </div>

    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        Website
      </p>

      <p className="max-w-[100px] truncate text-sm font-medium tracking-wide text-white">
        {username}
      </p>
    </div>
  </button>

  {/* ======================================================
      MOBILE ACTIONS
  ====================================================== */}
  <div className="ml-auto flex shrink-0 items-center gap-2">

    {/* LIVE SITE */}
    <a
      href={`/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="
        rounded-lg
        border
        border-white/15
        bg-white/5
        px-3
        py-2
        text-xs
        font-medium
        tracking-normal
        text-white
        transition
        hover:bg-white/10
        active:scale-95
      "
    >
      Live
    </a>

    {/* EDIT */}
    <button
      type="button"
      onClick={handleEditClick}
      className="
        rounded-lg
        bg-red-800
        px-3
        py-2
        text-xs
        font-medium
        tracking-normal
        text-white
        shadow-sm
        transition
        hover:bg-red-700
        active:scale-95
      "
    >
      Edit
    </button>

    {/* HAMBURGER */}
    <button
      type="button"
      onClick={() => {
        setIsMobileMenuOpen(true);
        setShowSwitcher(false);
      }}
      className="
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-xl
        border
        border-white/15
        bg-white/5
        text-white
        transition-all
        duration-200
        active:scale-95
      "
      aria-label="Open menu"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 7h16M4 12h16M4 17h16"
        />
      </svg>
    </button>

  </div>
</div>
        </div>
      </nav>

      {/* ============================================================
          MOBILE USERNAME DROPDOWN
      ============================================================ */}
      {showSwitcher && (
        <div
          className="
            fixed
            left-3
            right-3
            top-[72px]
            z-[55]
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-zinc-950
            shadow-2xl
            md:hidden
          "
        >
          <div
            className="
              border-b
              border-white/10
              px-5
              py-4
            "
          >
            <p
              className="
                text-sm
                font-medium
                tracking-tight
                text-white
              "
            >
              Your websites
            </p>

            <p
              className="
                mt-1
                text-xs
                tracking-normal
                text-zinc-500
              "
            >
              Switch between your usernames
            </p>
          </div>

          <div
            className="
              max-h-[280px]
              overflow-y-auto
              p-2
            "
          >
            {loadingUsernames ? (
              <div
                className="
                  px-4
                  py-5
                  text-center
                  text-sm
                  text-zinc-500
                "
              >
                Loading...
              </div>
            ) : usernames.length === 0 ? (
              <div
                className="
                  px-4
                  py-5
                  text-center
                  text-sm
                  text-zinc-500
                "
              >
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
                      handleUsernameSwitch(
                        item.name
                      )
                    }
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-xl
                      px-4
                      py-3.5
                      text-left
                      transition
                      ${
                        isCurrent
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-zinc-800
                          text-xs
                          font-medium
                          text-white
                        "
                      >
                        {item.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span
                        className="
                          truncate
                          text-sm
                        "
                      >
                        7wings.com/{item.name}
                      </span>
                    </div>

                    {isCurrent && (
                      <span
                        className="
                          ml-3
                          text-sm
                          text-green-400
                        "
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div
            className="
              border-t
              border-white/10
              p-2
            "
          >
            <Link
              href="/new_username"
              onClick={() =>
                setShowSwitcher(false)
              }
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-4
                py-3.5
                text-sm
                font-medium
                text-zinc-300
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/15
                "
              >
                +
              </div>

              Create new username
            </Link>
          </div>
        </div>
      )}

      {/* ============================================================
          MOBILE MENU
      ============================================================ */}
      {isMobileMenuOpen && (
        <div
          className="
            fixed
            inset-0
            z-[60]
            bg-black/95
            backdrop-blur-xl
            md:hidden
          "
        >
          <div
            className="
              flex
              min-h-full
              flex-col
              px-6
              pb-8
              pt-6
            "
          >

            {/* ======================================================
                MOBILE MENU HEADER
            ====================================================== */}
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    text-sm
                    font-semibold
                    text-black
                  "
                >
                  {username.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                      text-zinc-500
                    "
                  >
                    Website
                  </p>

                  <p
                    className="
                      mt-0.5
                      max-w-[180px]
                      truncate
                      text-sm
                      font-medium
                      tracking-wide
                      text-white
                    "
                  >
                    {username}
                  </p>
                </div>
              </div>

              {/* CLOSE */}
              <button
                type="button"
                onClick={closeMenu}
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/15
                  bg-white/5
                  text-white
                  transition-all
                  duration-200
                  active:scale-95
                "
                aria-label="Close menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </div>

            {/* ======================================================
                NAVIGATION
            ====================================================== */}
            <div className="mt-10">

              <p
                className="
                  mb-4
                  px-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-zinc-500
                "
              >
                Navigation
              </p>

              <div className="space-y-1">

                <Link
                  href="/lander"
                  onClick={closeMenu}
                  className="
                    block
                    rounded-xl
                    px-3
                    py-3.5
                    text-[17px]
                    font-medium
                    tracking-tight
                    text-white
                    transition
                    hover:bg-white/5
                  "
                >
                  Home
                </Link>

                <Link
                  href={`/dashboard/${username}`}
                  onClick={closeMenu}
                  className="
                    block
                    rounded-xl
                    px-3
                    py-3.5
                    text-[17px]
                    font-medium
                    tracking-tight
                    text-white
                    transition
                    hover:bg-white/5
                  "
                >
                  Dashboard
                </Link>

                <Link
                  href={`/templates/${username}`}
                  onClick={closeMenu}
                  className="
                    block
                    rounded-xl
                    px-3
                    py-3.5
                    text-[17px]
                    font-medium
                    tracking-tight
                    text-white
                    transition
                    hover:bg-white/5
                  "
                >
                  Templates
                </Link>

                <Link
                  href={`/pricing/${username}`}
                  onClick={closeMenu}
                  className="
                    block
                    rounded-xl
                    px-3
                    py-3.5
                    text-[17px]
                    font-medium
                    tracking-tight
                    text-white
                    transition
                    hover:bg-white/5
                  "
                >
                  Premium
                </Link>

                <Link
                  href={`/marketing/${username}`}
                  onClick={closeMenu}
                  className="
                    block
                    rounded-xl
                    px-3
                    py-3.5
                    text-[17px]
                    font-medium
                    tracking-tight
                    text-white
                    transition
                    hover:bg-white/5
                  "
                >
                  Marketing
                </Link>
              </div>
            </div>

            {/* ======================================================
                CREATE SECTION
            ====================================================== */}
            <div className="mt-8">

              <p
                className="
                  mb-4
                  px-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-zinc-500
                "
              >
                Create
              </p>

              <button
                type="button"
                onClick={
                  handleCreateEmailCampaign
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-4
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-4
                  py-4
                  text-left
                  transition-all
                  duration-200
                  active:scale-[0.98]
                  hover:bg-white/[0.07]
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-white/10
                  "
                >
                  <svg
                    className="
                      h-5
                      w-5
                      text-white
                    "
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-[15px]
                      font-medium
                      tracking-tight
                      text-white
                    "
                  >
                    Create Email Campaign
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      leading-relaxed
                      tracking-normal
                      text-zinc-500
                    "
                  >
                    Reach your audience with an email
                  </p>
                </div>

                <svg
                  className="
                    ml-auto
                    h-4
                    w-4
                    shrink-0
                    text-zinc-500
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 18 6-6-6-6"
                  />
                </svg>
              </button>
            </div>

            {/* ======================================================
                ACCOUNT SECTION
            ====================================================== */}
            <div className="mt-8">

              <p
                className="
                  mb-4
                  px-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-zinc-500
                "
              >
                Account
              </p>

              {/* SWITCH WEBSITE */}
              <button
                type="button"
                onClick={() =>
                  setShowSwitcher(
                    (prev) => !prev
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3.5
                  text-left
                  transition
                  hover:bg-white/5
                "
              >
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-zinc-800
                    text-xs
                    font-medium
                    text-white
                  "
                >
                  {username.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      text-[15px]
                      font-medium
                      tracking-tight
                      text-white
                    "
                  >
                    Switch website
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      text-xs
                      tracking-normal
                      text-zinc-500
                    "
                  >
                    {username}
                  </p>
                </div>

                <svg
                  className={`
                    h-4
                    w-4
                    text-zinc-500
                    transition-transform
                    ${
                      showSwitcher
                        ? "rotate-180"
                        : ""
                    }
                  `}
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

              {/* MOBILE SWITCHER */}
              {showSwitcher && (
                <div
                  className="
                    ml-3
                    mt-1
                    border-l
                    border-white/10
                    pl-4
                  "
                >
                  {loadingUsernames ? (
                    <div
                      className="
                        px-3
                        py-3
                        text-sm
                        text-zinc-500
                      "
                    >
                      Loading...
                    </div>
                  ) : usernames.length === 0 ? (
                    <div
                      className="
                        px-3
                        py-3
                        text-sm
                        text-zinc-500
                      "
                    >
                      No usernames found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {usernames.map((item) => {
                        const isCurrent =
                          item.name.toLowerCase() ===
                          username.toLowerCase();

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              handleUsernameSwitch(
                                item.name
                              )
                            }
                            className={`
                              flex
                              w-full
                              items-center
                              justify-between
                              rounded-lg
                              px-3
                              py-3
                              text-left
                              text-sm
                              transition
                              ${
                                isCurrent
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
                              }
                            `}
                          >
                            <span className="truncate">
                              7wings.com/{item.name}
                            </span>

                            {isCurrent && (
                              <span
                                className="
                                  ml-2
                                  text-xs
                                  text-green-400
                                "
                              >
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <Link
                    href="/new_username"
                    onClick={() => {
                      setShowSwitcher(false);
                      closeMenu();
                    }}
                    className="
                      mt-1
                      block
                      rounded-lg
                      px-3
                      py-3
                      text-sm
                      text-zinc-400
                      transition
                      hover:bg-white/5
                      hover:text-white
                    "
                  >
                    + Create new username
                  </Link>
                </div>
              )}
            </div>

            {/* ======================================================
                BOTTOM ACTIONS
            ====================================================== */}
            <div
              className="
                mt-auto
                border-t
                border-white/10
                pt-5
              "
            >

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <a
                  href={`/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="
                    flex
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/15
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-white/5
                  "
                >
                  Live Site
                </a>

                <button
                  type="button"
                  onClick={handleEditClick}
                  className="
                    rounded-xl
                    bg-red-800
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-red-700
                    active:scale-[0.98]
                  "
                >
                  Edit
                </button>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="
                  mt-3
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  px-4
                  py-3
                  text-sm
                  text-zinc-400
                  transition
                  hover:bg-white/5
                  hover:text-white
                "
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
