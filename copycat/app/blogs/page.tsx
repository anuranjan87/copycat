import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, TrendingUp } from 'lucide-react'

const blogPosts = [
  {
    title: "The Evolution of Business",
    url: "/blog/business-evolution-insights",
    description: "Maintaining a sense of constant innovation and disruption is no easy task. The journey from a simple idea...",
    imageUrl: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/New%20Project%20(19)-bCOfnUSdvfzTmMbMYbIwIAAUTYbLPQ.jpg"
  },
  {
    title: "The Art of Simplicity",
    url: "/blog/simplifying-product-development",
    description: "One principle stands out as a beacon of success: simplicity. Over the years, seasoned entrepreneurs...",
    imageUrl: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/New%20Project%20(20)-BdtTph10uUXPCFCo8ERO6EiKY72Jq7.jpg"
  },
  {
    title: "Lessons in App Development and Entrepreneurship",
    url: "/blog/app-development-lessons",
    description: "At the core of successful app development is the ability to identify latent demand. This involves finding situations...",
    imageUrl: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/feet-1868670_640-p6LAeFQkx08GsuoiWYBrWp1AEPWErY.jpg"
  },
  {
    title: "SEO-Led Product Development",
    url: "/blog/seo-led-product-development",
    description: "An emerging approach that integrates Search Engine Optimization (SEO) principles into the entire product development lifecycle...",
    imageUrl: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/apple-3341245_640-7xHyZeX33NBYj5RSP7R2a4i1dmES4O.jpg"
  },
  {
    title: "Test-Driven Development (TDD)",
    url: "/blog/test-driven-development",
    description: "TDD is part of the Agile methodology and emphasizes writing small, automated tests for each piece of functionality before developing...",
    imageUrl: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/New%20Project%20(21)-45v89wXKetFjJ3UkgB0nDzHZspCY4m.jpg"
  },
  {
    title: "Extreme Programming",
    url: "/blog/extreme-programming",
    description: "Extreme Programming is an agile software development framework that aims to produce higher quality software, and higher quality of life for the development team...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Understanding Deliverables in Software Development",
    url: "/blog/deliverables",
    description: "The term deliverable refers to a concrete output or product that is produced as a result of completing a particular task, phase, or objective within a project...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Agile Methodology",
    url: "/blog/agile-management",
    description: "Agile methodology is an iterative approach to software development that emphasizes flexibility, customer collaboration, and rapid delivery of working software...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "The Waterfall Model in Software Development",
    url: "/blog/waterfall-model",
    description: "The Waterfall model is one of the earliest and most well-known methodologies used in software development. It follows a linear and sequential approach, where each phase of the software...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Upload Your Resume for Free",
    url: "/resume-hosting",
    description: "Easily upload your resume, generate shareable links, and integrate seamlessly with your personal portfolio or job applications",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Pair Programming: A Collaborative Approach",
    url: "/blog/pair-programming",
    description: "Pair programming is a software development practice where two developers work together at one workstation, sharing the same codebase, and collaboratively writing and reviewing code in real-time...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Design Thinking in Software Development",
    url: "/blog/design-thinking",
    description: "Design thinking is a human-centered, iterative process used to solve complex problems and develop innovative solutions. It emphasizes understanding the needs, challenges, and experiences of the end user...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "The Main Goal of Generative AI",
    url: "/blog/goal-of-generative-ai",
    description: "Generative Artificial Intelligence (AI) has emerged as one of the most transformative fields within the broader AI landscape. Its main goal is to create new, original content...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Critical Security Update: Protecting Your Apple Devices",
    url: "/blog/ios-security-article",
    description: "A significant security vulnerability has been identified affecting iOS and macOS devices. Users are strongly encouraged to update their systems promptly.",
    imageUrl: "https://pixabay.com/get/gccb07706874c0b2a7dcff8002018b17143f897ed8cf367ad59d7a350492bb505860957abfe91e49103d4b1b9549b47f6c5b0cee45833c721e39c0d71cd7a852da0a61b01e2667042331e35cc554c0ef2_640.jpg"
  },
  {
    title: "AI Customer Support Trends for 2025",
    url: "/blog/ai_customer_support",
    description: "AI chatbots are everywhere. But here's the thing: there's a lot more to these digital assistants than meets the eye. Not all bots are created equal...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Top Web Development Trends for 2025",
    url: "/blog/web-dev-trends-2025",
    description: "Web development in 2025 is hotter than your GPU during a gaming marathon. These trends aren't just buzzwords—they're shaping the future of how we build and experience the web...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Free Image Hosting Websites for Web Developers in 2025",
    url: "/blog/image-hosting",
    description: "These tools offer the features you need without breaking the bank. Here's a curated list of the top free image hosting websites for web developers.",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Top 10 Tailwind CSS Gradient Websites in 2025",
    url: "/blog/tailwind-gradient",
    description: " Gradients are a key design element that adds depth and visual interest to web projects, and with the right tools, creating gradients in Tailwind...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Top 10 Awesome Websites for Tailwind CSS Buttons",
    url: "/blog/websites-for-tailwind-css-buttons",
    description: "If you're diving into the world of Tailwind CSS (and why wouldn't you, it's awesome), one of the first things you'll want to master is how to...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Learn HTML in 15 Minutes: A Fun Guide to Building Web Pages",
    url: "/blog/learn_html",
    description: "HTML (HyperText Markup Language) might sound like some secret language hackers use, but it's actually the most beginner-friendly way to start...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Backlink Strategy for New Websites",
    url: "/blog/backlink-strategy",
    description: "Develop valuable, informative, and shareable content to attract backlinks naturally",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Mastering Margin Management with Tailwind CSS",
    url: "/blog/set-margin",
    description: "ailwind CSS is a utility-first CSS framework that simplifies styling and makes building modern web applications faster and more efficient...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Top 20 Healthy Oils for Software Developers",
    url: "/blog/healthy-oils",
    description: "As a software developer, maintaining a healthy lifestyle is crucial. One way to do this is by incorporating healthy oils into your diet...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Product Review - AgentAuth by Composio",
    url: "/blog/agentauth",
    description: "Have you ever thought about giving an AI bot control of your apps, emails, and other important accounts? AgentAuth by Composio is a tool...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "UX Designer Salary in the USA",
    url: "/blog/ux-designer-usa",
    description: "User Experience Designer Salary in the USA: 2025 Guide",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "UX Designer Salary in the India",
    url: "/blog/ux-designer-india",
    description: "User Experience Designer Salary in the India: 2025 Guide",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "UX Designer Salary in the russia",
    url: "/blog/ux-designer-russia",
    description: "User Experience Designer Salary in the Russia: 2025 Guide",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Difference between UI and UX",
    url: "/blog/ui-ux-artical",
    description: "Difference between UI and UX: Key Differences and Importance in Design",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },
  {
    title: "Preparing for a UI/UX Designer Interview",
    url: "/blog/ui-ux-interview-prep",
    description: "Preparing for a UI/UX designer interview requires an understanding...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  },  

  {
    title: "Usability in User Experience (UX) Design",
    url: "/blog/usability",
    description: "Usability is a crucial aspect of user experience (UX) design, focusing on how easily...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  }, 
  {
    title: "User Personas in UX Design",
    url: "/blog/user-personas",
    description: "User personas are essential tools in user experience (UX) design, serving as detailed...",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  }, 
  
  {
    title: "Design Thinking: A Human-Centered Approach to Innovation",
    url: "/blog/design",
    description: "Design thinking is a human-centered approach to innovation that emphasizes understanding the needs of users while tackling complex problems and creating",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  }, 
  {
    title: "UI/UX Designer Jobs for Freshers",
    url: "/blog/career-guide",
    description: "For freshers stepping into the field, UI/UX design offers a rewarding career with vast opportunities to grow and create impactful designs",
    imageUrl: "https://demo-source.imgix.net/mountains.jpg"
  }, 

]

const featuredPosts = blogPosts.slice(0, 5)
const trendingPosts = blogPosts.slice(5, 10)
const recentPosts = blogPosts.slice(0)

export default function ForbesInspiredLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Web Development Insights & Innovation | Tailwind Genie</title>
        <meta name="description" content="Stay ahead with the latest business trends, technology insights, and entrepreneurial success stories." />
        <link rel="canonical" href="https://tailwindgenie.com" />
        <meta property="og:title" content="Business Insights & Innovation | TechForbes" />
        <meta property="og:description" content="Stay ahead with the latest business trends, technology insights, and entrepreneurial success stories." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://tailwindgenie.com" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>


      <main className="container mt-12 mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Featured Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPosts.map((post, index) => (
              <FeaturedArticle key={index} {...post} />
            ))}
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          <section className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-6">Latest Insights</h2>
            <div className="space-y-8">
              {recentPosts.map((post, index) => (
                <ArticleCard key={index} {...post} />
              ))}
            </div>
          </section>

          <aside className="lg:w-1/3">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <TrendingUp className="mr-2" />
              Trending Now
            </h2>
            <div className="bg-gray-100 p-6 rounded-lg">
              {trendingPosts.map((post, index) => (
                <TrendingArticle key={index} {...post} index={index + 1} />
              ))}
            </div>
          </aside>

          
        </div>
      </main>
    </div>
  )
}

function FeaturedArticle({ title, url, description, imageUrl }: {
  title: string
  url: string
  description: string
  imageUrl: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
        <Link href={url} className="text-blue-600 hover:underline flex items-center">
          Read Full Story <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function ArticleCard({ title, url, description, imageUrl }: {
  title: string
  url: string
  description: string
  imageUrl: string
}) {
  return (
    <div className="flex items-center border-b border-gray-200 pb-4">
      <div className="relative h-24 w-24 flex-shrink-0 mr-4">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="rounded-md"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-2 line-clamp-2">{description}</p>
        <Link href={url} className="text-blue-600 hover:underline text-sm">Read More</Link>
      </div>
    </div>
  )
}

function TrendingArticle({ title, url, index }: {
  title: string
  url: string
  index: number
}) {
  return (
    <div className="flex items-center mb-4 last:mb-0">
      <span className="text-2xl font-bold text-gray-300 mr-4">{index}</span>
      <Link href={url} className="text-gray-800 hover:text-blue-600">{title}</Link>
    </div>
  )
}
