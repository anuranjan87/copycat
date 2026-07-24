import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://7wingz.com"),

  title: {
    default: "7Wingz | AI Website Builder & Website Operating Platform",
    template: "%s | 7Wingz",
  },

  description:
    "7Wingz is an AI-powered website operating platform that helps creators and businesses create, publish, connect and grow with built-in SEO, analytics, CRM and premium responsive templates.",

  applicationName: "7Wingz",

  creator: "7Wingz",

  publisher: "7Wingz",

  generator: "7Wingz",

  keywords: [
    "AI website builder",
    "website operating platform",
    "website builder",
    "website builder with SEO",
    "website builder with analytics",
    "website builder with CRM",
    "creator website builder",
    "business website builder",
  ],

  alternates: {
    canonical: "https://7wingz.com",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    url: "https://7wingz.com",
    siteName: "7Wingz",
    title: "7Wingz | AI Website Builder",
    description:
      "Create, publish and grow websites with built-in SEO, analytics and CRM.",
  },

  twitter: {
    card: "summary_large_image",
    title: "7Wingz | AI Website Builder",
    description:
      "Create, publish and grow websites with AI.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "7Wingz",
    applicationCategory: "Website Builder",
    applicationSubCategory: "AI Website Builder",
    operatingSystem: "Web",
    url: "https://7wingz.com",
    description:
      "An AI-powered website operating platform for creators and businesses.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta
            name="google-site-verification"
            content="eKZJHeOuWmsFOraC7yxPTuFhnroqlyJGxO0bLX4MUaE"
          />

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData),
            }}
          />
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