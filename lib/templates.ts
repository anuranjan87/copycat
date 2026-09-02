import { LayoutTemplate, Rocket, BriefcaseBusiness, UserRound, PenLine, Bot, Palette, ChevronDown, } from "lucide-react"; export interface TemplateMeta { id: string; localImage: string; title: string; description: string; mood: string; category: string; } export const CATEGORIES = [ { name: "Landing Page", icon: LayoutTemplate, }, { name: "Entrepreneurs & Startups", icon: Rocket, }, { name: "Professional Services", icon: BriefcaseBusiness, }, { name: "Individuals", icon: UserRound, }, { name: "Blog & Content", icon: PenLine, }, { name: "AI Agent", icon: Bot, }, { name: "UI Components", icon: Palette, hasSubcategories: true, }, ]; export const UI_COMPONENT_CATEGORIES = [ "Colors", "Gradients", "Buttons", "Cards", "Forms", "Navigation", "Typography", "Animations", ];



export const templatesMeta: TemplateMeta[] = [
  {
    id: "1",
    localImage: "/1.png",
    title: "Light House",
    description:
      "Warm, inviting landing page with a bold hero section.",
    mood: "Landing page",
    category: "Landing Page",
  },

  {
    id: "2",
    localImage: "/2.png",
    title: "Modern SaaS",
    description:
      "Clean SaaS landing page designed for modern digital products.",
    mood: "SaaS",
    category: "Entrepreneurs & Startups",
  },

  {
    id: "3",
    localImage: "/3.png",
    title: "Creative Studio",
    description:
      "Bold creative layout for agencies, studios and digital teams.",
    mood: "Creative",
    category: "Individuals",
  },

  {
    id: "4",
    localImage: "/4.png",
    title: "Personal Portfolio",
    description:
      "Minimal portfolio experience for showcasing your work and skills.",
    mood: "Portfolio",
    category: "Individuals",
  },

  {
    id: "5",
    localImage: "/5.png",
    title: "Digital Journal",
    description:
      "Elegant editorial layout for articles, stories and personal writing.",
    mood: "Editorial",
    category: "Blog & Content",
  },

  {
    id: "6",
    localImage: "/6.png",
    title: "Business Pro",
    description:
      "Professional business website with a clear and trustworthy layout.",
    mood: "Corporate",
    category: "Entrepreneurs & Startups",
  },

  {
    id: "7",
    localImage: "/7.png",
    title: "Product Launch",
    description:
      "High-impact product landing page built for launches and campaigns.",
    mood: "Landing page",
    category: "Entrepreneurs & Startups",
  },

  {
    id: "8",
    localImage: "/8.jpg",
    title: "Startup Flow",
    description:
      "Modern startup website focused on clarity, conversion and growth.",
    mood: "SaaS",
    category: "Entrepreneurs & Startups",
  },

  {
    id: "9",
    localImage: "/9.png",
    title: "Designer Portfolio",
    description:
      "Visual-first portfolio for designers, creators and freelancers.",
    mood: "Portfolio",
    category: "Individuals",
  },

  {
    id: "10",
    localImage: "/10.png",
    title: "Insight",
    description:
      "Content-focused website for publishing ideas, insights and stories.",
    mood: "Editorial",
    category: "Blog & Content",
  },

  {
    id: "11",
    localImage: "/11.png",
    title: "Enterprise",
    description:
      "Structured corporate layout for established companies and teams.",
    mood: "Corporate",
    category: "Entrepreneurs & Startups",
  },

  {
    id: "12",
    localImage: "/12.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Entrepreneurs & Startups",
  },
  {
    id: "15",
    localImage: "/15.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Entrepreneurs & Startups",
  },
   {
    id: "16",
    localImage: "/16.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Entrepreneurs & Startups",
  },
   {
    id: "18",
    localImage: "/18.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Entrepreneurs & Startups",
  },
   {
    id: "19",
    localImage: "/19.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Individuals",
  },
   {
    id: "27",
    localImage: "/27.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "AI Agent",
  },
  {
    id: "28",
    localImage: "/28.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Blog & Content",
  },{
    id: "29",
    localImage: "/29.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Blog & Content",
  },
];