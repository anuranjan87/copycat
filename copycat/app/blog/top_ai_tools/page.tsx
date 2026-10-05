"use client"

import Header from "@/components/header2"
import { ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const tools = [
  {
    name: "Tailwind Genie",
    bestFor: "Tailwind CSS Developers",
    description: "Tailwind Genie is the ultimate resource for developers working with Tailwind CSS. It offers AI-powered suggestions, prebuilt components, and responsive designs, making it easier to create stunning UIs effortlessly.",
    features: [
      "AI-driven component generation optimized for Tailwind CSS",
      "Live previews and customizable layouts",
      "Accessibility and responsive design principles",
      "Integration with frameworks like React, Vue.js, and Svelte"
    ],
    url: "https://tailwindgenie.com"
  },
  {
    name: "V0.dev",
    bestFor: "Code-Driven UI Design",
    description: "V0.dev transforms text prompts into production-ready Tailwind CSS components, making it easy for developers to bring their vision to life.",
    features: [
      "Natural language to Tailwind CSS code",
      "Responsive layouts for various devices",
      "Dark mode and accessibility standards support"
    ],
    url: "https://v0.dev"
  },
  {
    name: "Figma + AI Plugins",
    bestFor: "Collaborative Design Teams",
    description: "Enhance your Figma workflow with AI-powered plugins that automate repetitive tasks and generate design variations.",
    features: [
      "AI-assisted layout suggestions",
      "Automated design system generation",
      "Smart component organization",
      "Design-to-code conversion"
    ],
    url: "https://www.figma.com/community/plugins"
  },
  {
    name: "Uizard",
    bestFor: "Rapid Prototyping",
    description: "Uizard uses AI to transform sketches and wireframes into high-fidelity prototypes, streamlining the design process.",
    features: [
      "Sketch-to-design conversion",
      "AI-powered design suggestions",
      "Collaborative prototyping",
      "Design system management"
    ],
    url: "https://uizard.io"
  },
  {
    name: "Galileo AI",
    bestFor: "AI-Driven UI Generation",
    description: "Galileo AI generates complete UI designs from text descriptions, offering a revolutionary approach to interface creation.",
    features: [
      "Text-to-UI generation",
      "Customizable design outputs",
      "Integration with popular design tools",
      "Rapid iteration capabilities"
    ],
    url: "https://www.usegalileo.ai"
  }
]

export default function AITools() {
  return (
    <>
      <Header />
      <main className="bg-gradient-to-b mt-12 from-gray-50 to-white min-h-screen py-12">
        <div className="container mx-auto px-4"><header>
          <h1 className="text-5xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Top AI Tools for UI Design and Prototyping in 2024
          </h1></header>
          <p className="text-xl text-gray-700 text-center mb-12 max-w-3xl mx-auto">
            Discover the latest AI-powered tools that are transforming the way we design and prototype user interfaces.
            These tools are designed to enhance creativity, speed up workflows, and ensure seamless user experiences.
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => (
              <Card key={index} className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    {tool.name}
                    <Sparkles className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-4">
                    Best For: {tool.bestFor}
                  </Badge>
                  <p className="text-gray-700 mb-4">
                    {tool.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {tool.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <ArrowRight className="h-5 w-5 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <a href={tool.url} target="_blank" rel="noopener noreferrer">
                      Visit {tool.name}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

