import type { Metadata } from "next";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";

const montserrat = Montserrat({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "7WINK",
  description: "Create with 7WINK",
  generator: "7WINK",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
        <meta name="google-site-verification" content="eKZJHeOuWmsFOraC7yxPTuFhnroqlyJGxO0bLX4MUaE" />
        </head>
        <body className={montserrat.className}>
          <main>{children}</main>
          <Toaster />
          <GoogleAnalytics gaId="G-ZH37SY7SDF" />

        </body>      
      </html>
    </ClerkProvider>
  );
}