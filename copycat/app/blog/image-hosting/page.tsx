import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import Header from "@/components/header2"

export const metadata: Metadata = {
  title: 'Top 10 Free Image Hosting Websites for Web Developers in 2024',
  description: 'Discover the best free image hosting platforms for web developers in 2024. Compare features, storage limits, and ideal use cases for each service.',
  openGraph: {
    title: 'Top 10 Free Image Hosting Websites for Web Developers in 2024',
    description: 'Discover the best free image hosting platforms for web developers in 2024. Compare features, storage limits, and ideal use cases for each service.',
    images: [
      {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Top 10 Free Image Hosting Websites for Web Developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top 10 Free Image Hosting Websites for Web Developers in 2024',
    description: 'Discover the best free image hosting platforms for web developers in 2024. Compare features, storage limits, and ideal use cases for each service.',
    images: ['https://example.com/og-image.jpg'],
  },
}

const hostingSites = [
  {
    name: 'TailwindGenie Image Hosting',
    url: 'https://tailwindgenie.com/image-hosting',
    features: ['Unlimited storage', 'Embeddable links', 'User-friendly management'],
    idealFor: 'Developers who need a reliable and robust solution for hosting images without limitations.',
  },
  {
    name: 'Imgur',
    url: 'https://imgur.com',
    features: ['Unlimited storage', 'Embeddable links', 'Drag-and-drop uploads'],
    idealFor: 'Quick prototyping, sharing assets, or hosting lightweight project images.',
  },
  {
    name: 'Postimages',
    url: 'https://postimages.org',
    features: ['Direct links for embedding', 'Resizing options', 'Image expiration controls'],
    idealFor: 'Hosting project screenshots or temporary assets.',
  },
  {
    name: 'ImageShack',
    url: 'https://imageshack.com',
    features: ['Unlimited uploads', 'Customizable galleries', 'Embeddable links'],
    idealFor: 'Building online portfolios or showcasing designs.',
  },
  {
    name: 'Google Photos',
    url: 'https://photos.google.com',
    features: ['High-resolution uploads', 'Direct sharing', 'Album creation'],
    idealFor: 'Storing and sharing project images securely.',
  },
  {
    name: 'Flickr',
    url: 'https://www.flickr.com',
    features: ['1,000 free photos', 'Tagging', 'Embeddable sharing options'],
    idealFor: 'Hosting creative assets and managing a portfolio.',
  },
  {
    name: 'ImgBB',
    url: 'https://imgbb.com',
    features: ['Fast uploads', 'Direct links', 'BBCode support'],
    idealFor: 'Embedding images in forums or blogs.',
  },
  {
    name: 'FreeImageHosting.net',
    url: 'https://www.freeimagehosting.net',
    features: ['Direct linking', 'No registration', 'Quick uploads'],
    idealFor: 'Projects requiring fast and temporary hosting.',
  },
  {
    name: '500px',
    url: 'https://500px.com',
    features: ['Portfolio creation', 'High-resolution uploads', 'Community features'],
    idealFor: 'Presenting polished project visuals.',
  },
  {
    name: 'Dropbox',
    url: 'https://www.dropbox.com',
    features: ['Shareable links', 'Folder organization', 'Cross-device sync'],
    idealFor: 'Sharing images and assets securely with clients or collaborators.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100"><Header/>
      <header className="shadow mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 font-mono ">
            Top 10 Free Image Hosting Websites for Web Developers in 2025
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p className="text-lg text-gray-700 mb-8 font-mono">
              For web developers, having access to reliable and free image hosting platforms can streamline project workflows. Whether you're showcasing your designs or optimizing images for a website, these tools offer the features you need without breaking the bank. Here's a curated list of the top free image hosting websites for web developers, complete with URLs.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {hostingSites.map((site, index) => (
                <div key={site.name} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {index + 1}. {site.name}
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <Link href={site.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        {site.url}
                      </Link>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900">Features:</h4>
                      <ul className="mt-2 list-disc pl-5 text-sm text-gray-500">
                        {site.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900">Ideal For:</h4>
                      <p className="mt-1 text-sm text-gray-500">{site.idealFor}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 Tailwind Genie. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

