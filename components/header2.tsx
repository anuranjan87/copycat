"use client"
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';


export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle the mobile menu
  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block fixed inset-x-0 top-0 z-30 mx-auto border border-gray-100 bg-white/80 py-2 shadow backdrop-blur-lg md:rounded-3xl">
        <div className="px-7">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex shrink-0 gap-4">
              <Link href="/" className="flex items-center">
                <Image src="/logo.png" alt="Website Logo" width={28} height={28} />
                <span className="sr-only">Website Title</span>
              </Link>
            </div>

            {/* Navigation Links */}
           
            <nav className="flex items-center justify-end gap-3">
            <Link
                href="/tailwind-css-instagram-login"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                100+ login
              </Link>
              <Link
                href="/deploytocloud"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Deploy To Cloud
              </Link>
              <Link
                href="/templates"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Templates
              </Link>
              <Link
                href="/resources/tailwind-css-gradient-generator"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Pick Gradient
              </Link>
              <Link
                href="/tailwind-css-buttons"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                100+ Buttons
              </Link>
              <Link
                href="/playground"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Playground
              </Link>
              <Link
                href="/image-hosting"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Host Images
              </Link>
              <Link
                href="/sketch"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Sketch
              </Link>
              <Link 
                     className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                    href="/saved">Saved Items</Link>
              
              <Link aria-current="page"
                     className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                    href="/advanced-image-editor">Image Editor</Link>
              <Link
                href="https://justaiingaround.com/landing-page"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Social AI
              </Link>
              <Link
                href="/blogs"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Blogs
              </Link>

              <Link
                href="/company"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Upgrade
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden block fixed inset-x-0 top-0 z-30 mx-auto border border-gray-100 bg-white/80 py-2 shadow backdrop-blur-lg md:rounded-3xl">
        <div className="px-7">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex shrink-0">
              <Link href="/" className="flex items-center">
                <Image src="/logo.png" alt="Website Logo" width={28} height={28} />
                <span className="sr-only">Website Title</span>
              </Link>
            </div>

            {/* Navigation Links for Mobile */}
            <nav className="flex items-center justify-end gap-3">
            <Link
                href="/tailwind-css-instagram-login"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                100+ login
              </Link>
              <Link
                href="/deploytocloud"
                className="hidden sm:inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
Deploy To Cloud              </Link>
              <Link
                href="/templates"
                className="hidden sm:inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Templates
              </Link>
              <Link
                href="/resources/tailwind-css-gradient-generator"
                className="hidden sm:inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Pick Gradient
              </Link>
              <Link
                href="/playground"
                className="hidden sm:inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Playground
              </Link>

              {/* Menu Button */}
              <button
                onClick={toggleMenu}
                className="text-black focus:outline-none"
                aria-label="Toggle Menu"
                aria-expanded={isOpen}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <nav className="absolute top-full left-0 w-full bg-white shadow-lg">
            <ul className="flex flex-col p-4 space-y-3">
                <li>
                <Link 
                     className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                    href="/saved">Saved Items</Link>
                </li>
                <li>
                <Link
                href="/tailwind-css-instagram-login"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                100+ login
              </Link>
                </li>
              <li>
                <Link
                  href="/image-hosting"
                  className="block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
                >
                  Host Images
                </Link>
              </li>
              <li>
                <Link
                  href="/tailwind-css-buttons"
                  className="block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
                >
                  100+ Buttons
                </Link>
              </li>
              <li>
              <Link aria-current="page"
                     className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                    href="/sketch">Sketch</Link>
              </li>
              <li>
              <Link aria-current="page"
                     className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                    href="/advanced-image-editor">Image Editor</Link>
              </li>
              <li>
                <Link
                  href="/company"
                  className="block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
                >
                  Upgrade
                </Link>
              </li>
              <li>
                <Link
                  href="https://justaiingaround.com/"
                  className="block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
                >
                  Social AI
                </Link>
                <Link
                href="/blogs"
                className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100"
              >
                Blogs
              </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}