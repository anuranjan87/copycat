import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import Header from "@/components/header2"

export const metadata: Metadata = {
  title: 'Top 10 Tailwind CSS Playground Websites for Developers in 2024',
  description: 'Discover the best Tailwind CSS playgrounds for rapid prototyping, learning, and experimenting with designs. Compare features and find the perfect tool for your development workflow.',
  openGraph: {
    title: 'Top 10 Tailwind CSS Playground Websites for Developers in 2024',
    description: 'Discover the best Tailwind CSS playgrounds for rapid prototyping, learning, and experimenting with designs. Compare features and find the perfect tool for your development workflow.',
    images: [
      {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Top 10 Tailwind CSS Playground Websites',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top 10 Tailwind CSS Playground Websites for Developers in 2024',
    description: 'Discover the best Tailwind CSS playgrounds for rapid prototyping, learning, and experimenting with designs. Compare features and find the perfect tool for your development workflow.',
    images: ['https://example.com/og-image.jpg'],
  },
}

const playgrounds = [
  {
    name: 'TailwindGenie Playground',
    url: 'https://tailwindgenie.com/playground',
    features: ['Real-time preview', 'Code sharing', 'Dark mode'],
    idealFor: 'Rapid prototyping, debugging Tailwind styles, and learning utility-based design.',
  },
  {
    name: 'Tailwind Play (Official)',
    url: 'https://play.tailwindcss.com',
    features: ['Integrated code editor', 'Custom plugins', 'Instant preview'],
    idealFor: 'Exploring new features and testing designs.',
  },
  {
    name: 'CodeSandbox',
    url: 'https://codesandbox.io',
    features: ['Team collaboration', 'GitHub integration', 'Live previews'],
    idealFor: 'Building full-stack Tailwind projects in a collaborative environment.',
  },
  {
    name: 'CodePen',
    url: 'https://codepen.io',
    features: ['Customizable pens', 'Tailwind integration', 'Community sharing'],
    idealFor: 'Sharing Tailwind snippets and discovering inspirations.',
  },
  {
    name: 'StackBlitz',
    url: 'https://stackblitz.com',
    features: ['VS Code-like interface', 'npm support', 'Live previews'],
    idealFor: 'Developers accustomed to a VS Code workflow.',
  },
  {
    name: 'Playcode',
    url: 'https://playcode.io',
    features: ['Quick setup', 'Lightweight editor', 'Instant feedback'],
    idealFor: 'Beginners learning Tailwind or testing small components.',
  },
  {
    name: 'JSFiddle',
    url: 'https://jsfiddle.net',
    features: ['Simple interface', 'Embeddable projects', 'Quick previews'],
    idealFor: 'Small experiments and sharing code snippets.',
  },
  {
    name: 'CodeSandbox Tailwind Starter',
    url: 'https://codesandbox.io/s/tailwind-starter',
    features: ['Preloaded Tailwind configuration', 'Collaborative coding', 'Deployment tools'],
    idealFor: 'Developers who want to jumpstart their projects.',
  },
  {
    name: 'Froala Design Blocks Playground',
    url: 'https://tailwindcomponents.com',
    features: ['Hundreds of prebuilt components', 'Live customization', 'Export options'],
    idealFor: 'Quickly building UIs with prebuilt Tailwind blocks.',
  },
  {
    name: 'Glitch',
    url: 'https://glitch.com',
    features: ['Real-time collaboration', 'Free hosting', 'Git integration'],
    idealFor: 'Tailwind experiments that need immediate sharing.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50"><Header/>
      <header className="bg-white shadow mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 font-mono">
            Top 10 Tailwind CSS Playground Websites for Developers in 2025
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <p className="text-lg text-gray-700 mb-8 font-mono">
            Tailwind CSS has revolutionized the way developers design websites, offering utility-first CSS for rapid development. To make learning and prototyping easier, Tailwind playgrounds provide interactive environments to experiment with designs, customize utilities, and preview code. Here are the top 10 Tailwind CSS playground websites to supercharge your development process.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {playgrounds.map((playground, index) => (
              <div key={playground.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    {index + 1}. {playground.name}
                  </h2>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <Link href={playground.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {playground.url}
                    </Link>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-gray-900">Features:</h3>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-500">
                      {playground.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-gray-900">Ideal For:</h3>
                    <p className="mt-1 text-sm text-gray-500">{playground.idealFor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Final Thoughts</h2>
            <p className="text-lg text-gray-700">
              Tailwind CSS playgrounds simplify the development process by offering interactive tools to test and refine your designs. For a seamless experience with advanced features, TailwindGenie Playground stands out as the best option in 2024. Whether you're a beginner or an experienced developer, these playgrounds are invaluable resources for creating stunning, responsive designs with Tailwind CSS.
            </p>
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

