import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Montserrat } from "next/font/google";

import { Toaster } from "sonner" // Import sonner's Toaster
import { ClerkProvider } from '@clerk/nextjs'


const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "7WINK",
  description: "Create with 7WINK",
  generator: "7WINK",
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={montserrat.className}>
          <main>{children}</main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
