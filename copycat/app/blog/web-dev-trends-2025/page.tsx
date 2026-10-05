"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, Cpu, Rocket, Globe, Server, Code, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Header from "@/components/header2"

const trends = [
  {
    title: "AI-Powered Development",
    icon: <Cpu className="h-6 w-6" />,
    description: "AI isn't just about making your phone smarter; it's transforming web development. From generating boilerplate code to auto-fixing bugs and testing apps, AI tools are the ultimate tech sidekick. Think of ChatGPT but for your IDE—it predicts, suggests, and even writes code faster than you can type 'Hello, World!'",
    whyHot: [
      "Saves developers tons of time.",
      "Improves code quality and reduces human errors.",
      "Makes even the toughest projects manageable for smaller teams."
    ],
    whereGoing: "Imagine fully automated workflows where you focus on creativity, and the AI handles the grind. The future is bright (and slightly robotic).",
    websites: [
      { name: "GitHub Copilot", url: "https://github.com/features/copilot" },
      { name: "Tabnine", url: "https://www.tabnine.com/" },
      { name: "Replit", url: "https://replit.com/" }
    ],
    color: "bg-purple-500"
  },
  {
    title: "WebAssembly (Wasm)",
    icon: <Rocket className="h-6 w-6" />,
    description: "WebAssembly is like giving your browser a superpower. It allows high-performance code (written in languages like C, C++, or Rust) to run directly in your browser. Whether it's advanced gaming, video editing, or 3D modeling, Wasm makes it possible without downloading any software.",
    whyHot: [
      "Eliminates performance bottlenecks.",
      "Opens up new possibilities for web apps traditionally limited to desktop software.",
      "Works seamlessly across different browsers."
    ],
    whereGoing: "Expect more apps that feel like native desktop experiences but live entirely in your browser.",
    websites: [
      { name: "WebAssembly", url: "https://webassembly.org/" },
      { name: "Wasmer", url: "https://wasmer.io/" },
      { name: "Blazor (by Microsoft)", url: "https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor" }
    ],
    color: "bg-blue-500"
  },
  {
    title: "Progressive Web Apps (PWAs)",
    icon: <Globe className="h-6 w-6" />,
    description: "PWAs are like the lovechild of websites and apps. They load instantly, work offline, and can be added to your home screen like a regular app—without hogging your phone's storage. They're fast, reliable, and user-friendly, making them a favorite for businesses and users alike.",
    whyHot: [
      "Faster loading times and offline functionality.",
      "Cost-effective for developers (one app for web and mobile).",
      "Feels like an app without app store hassle."
    ],
    whereGoing: "PWAs will continue dominating as users prefer lightweight, efficient solutions over traditional apps.",
    websites: [
      { name: "Lighthouse (for PWA testing)", url: "https://developers.google.com/web/tools/lighthouse" },
      { name: "PWA Builder", url: "https://www.pwabuilder.com/" },
      { name: "Workbox (by Google)", url: "https://developers.google.com/web/tools/workbox" }
    ],
    color: "bg-green-500"
  },
  {
    title: "Serverless Architecture",
    icon: <Server className="h-6 w-6" />,
    description: "Say goodbye to managing servers and hello to stress-free development. Serverless architecture lets developers run code without worrying about infrastructure. Pay only for the compute time you use—it's like hiring a plumber who only charges you for the exact minutes spent fixing your sink.",
    whyHot: [
      "Reduces server maintenance costs.",
      "Scales automatically to handle traffic spikes.",
      "Developers focus on code, not infrastructure."
    ],
    whereGoing: "More businesses will adopt serverless for scalable, cost-efficient apps without sacrificing performance.",
    websites: [
      { name: "AWS Lambda", url: "https://aws.amazon.com/lambda/" },
      { name: "Google Cloud Functions", url: "https://cloud.google.com/functions" },
      { name: "Netlify Functions", url: "https://www.netlify.com/products/functions/" }
    ],
    color: "bg-yellow-500"
  },
  {
    title: "Web3 and Blockchain Integration",
    icon: <Code className="h-6 w-6" />,
    description: "Web3 is taking the internet and flipping the power dynamics. Forget centralized systems; it's all about decentralization and transparency. From decentralized apps (dApps) to smart contracts, blockchain tech is revolutionizing trust and security in the digital space.",
    whyHot: [
      "Empowers users with more control over data.",
      "Removes middlemen for faster, cheaper transactions.",
      "Perfect for industries like finance, supply chain, and even voting systems."
    ],
    whereGoing: "As blockchain becomes easier to integrate, expect even more creative use cases across industries.",
    websites: [
      { name: "Ethereum", url: "https://ethereum.org/" },
      { name: "Polkadot", url: "https://polkadot.network/" },
      { name: "IPFS", url: "https://ipfs.io/" }
    ],
    color: "bg-red-500"
  },
  {
    title: "Micro Frontends",
    icon: <Layout className="h-6 w-6" />,
    description: "The days of monolithic frontends are numbered. Micro frontends let you break your UI into smaller, independent pieces, each built and deployed separately. Think of it like splitting your chores among roommates—everyone handles their part, and it just works.",
    whyHot: [
      "Makes large projects more manageable.",
      "Enables teams to work independently without stepping on each other's toes.",
      "Allows gradual updates without overhauling the entire app."
    ],
    whereGoing: "With companies focusing on agility, micro frontends are here to stay. They make development scalable, efficient, and a lot less chaotic.",
    websites: [
      { name: "Single SPA", url: "https://single-spa.js.org/" },
      { name: "Module Federation (Webpack)", url: "https://webpack.js.org/concepts/module-federation/" },
      { name: "Mosaic (by Open Web Components)", url: "https://open-wc.org/docs/developing/routing/mosaic/" }
    ],
    color: "bg-indigo-500"
  }
]

export default function WebDevTrends2024() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-8">
        <Header />
      <header className="text-center mt-12 mb-12">
        <h1 className="text-4xl font-bold mb-4 text-purple-800">
          Top Web Development Trends for 2024
        </h1>
        <p className="text-xl text-gray-600">
          You Can't Ignore These Game-Changers!
        </p>
      </header>
      <div className="max-w-4xl mx-auto grid gap-8">
        {trends.map((trend, index) => (
          <Collapsible
            key={index}
            open={openIndex === index}
            onOpenChange={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className={`${trend.color} text-white cursor-pointer`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {trend.icon}
                      <CardTitle className="text-2xl">{trend.title}</CardTitle>
                    </div>
                    <ChevronDown className={`h-6 w-6 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <CardDescription className="text-lg mb-4">
                    {trend.description}
                  </CardDescription>
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">Why it's hot:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {trend.whyHot.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">Where it's going:</h3>
                    <p>{trend.whereGoing}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Supporting websites:</h3>
                    <div className="flex flex-wrap gap-2">
                      {trend.websites.map((site, siteIndex) => (
                        <Button key={siteIndex} variant="outline" size="sm" asChild>
                          <a href={site.url} target="_blank" rel="noopener noreferrer">
                            {site.name}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
      <footer className="text-center mt-12 text-gray-600">
        <p className="mb-4">The Bottom Line: 2024 is all about speed, efficiency, and innovation in web development. Whether you're into AI wizardry, blazing-fast apps, or decentralized systems, these trends are your ticket to staying ahead of the game.</p>
        <p>So, suit up, devs—it's time to code like there's no tomorrow! 🚀</p>
      </footer>
    </div>
  )
}

