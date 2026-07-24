"use client";

import { useState, useMemo, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Plus, Search, Sparkles, ArrowRight, LayoutGrid } from "lucide-react";

import Nav from "@/components/nav";
import mat from "@/asset/mat.gif";

// ─── Types ──────────────────────────────────────────────────────────────
interface TemplateMeta {
  id: string;
  localImage: string;
  title: string;
  description: string;
  mood: string;
  category: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

// ─── Template Data ────────────────────────────────────────────────────
const templatesMeta: TemplateMeta[] = [
  {
    id: "1",
    localImage: "/1.png",
    title: "Light House",
    description: "Warm, inviting landing page with a bold hero section.",
    mood: "Landing page",
    category: "Landing Page",
  },
  {
    id: "2",
    localImage: "/2.png",
    title: "Silent Ink",
    description: "Minimalist and clean, perfect for SaaS marketing.",
    mood: "SaaS marketing",
    category: "SaaS",
  },
  {
    id: "3",
    localImage: "/4.png",
    title: "Darjeeling",
    description: "Story‑driven layout for blogs and long‑form content.",
    mood: "Blog",
    category: "Blog & Content",
  },
  {
    id: "4",
    localImage: "/10.png",
    title: "Slow",
    description: "Futuristic, vibrant, and immersive for creative brands.",
    mood: "Landing Page",
    category: "Landing Page",
  },
  {
    id: "5",
    localImage: "/5.png",
    title: "Stokebury",
    description: "Sharp, asymmetric layout for agencies and creators.",
    mood: "Agencies & creators",
    category: "Portfolio",
  },
  {
    id: "6",
    localImage: "/3.png",
    title: "Copy Cat",
    description: "Bold, founder‑friendly design with a strong narrative.",
    mood: "Founder vibe",
    category: "SaaS",
  },
  {
    id: "7",
    localImage: "/6.png",
    title: "Peekaboo",
    description: "Subtle, corporate‑ready with clever micro‑interactions.",
    mood: "Company website",
    category: "Corporate",
  },
  {
    id: "8",
    localImage: "/13.jpg",
    title: "Pixel Perfect",
    description: "Playful, retro grid system for product launches.",
    mood: "Product Launch",
    category: "Landing Page",
  },
  {
    id: "9",
    localImage: "/14.jpg",
    title: "Dark Luxe",
    description: "Luxurious dark theme for experimental brands.",
    mood: "Experimenting",
    category: "Portfolio",
  },
  {
    id: "10",
    localImage: "/7.png",
    title: "Blocks",
    description: "Clean, block‑based layout for blogs and portfolios.",
    mood: "Blog",
    category: "Blog & Content",
  },
  {
    id: "11",
    localImage: "/8.png",
    title: "Negative Space",
    description: "Bold, disruptive design with a focus on white space.",
    mood: "Landing page",
    category: "Landing Page",
  },
  {
    id: "12",
    localImage: "/9.png",
    title: "Thrift Mode",
    description: "Warm, nostalgic portfolio style with a vintage touch.",
    mood: "Portfolio",
    category: "Portfolio",
  },
  {
    id: "13",
    localImage: "/11.png",
    title: "Retro VHS",
    description: "Grainy, nostalgic aesthetic for creative projects.",
    mood: "Nostalgic",
    category: "Portfolio",
  },
  {
    id: "14",
    localImage: "/12.png",
    title: "Zen Garden",
    description: "Calm, balanced landing page with nature‑inspired tones.",
    mood: "Landing page",
    category: "Landing Page",
  },
];

const CATEGORIES = ["All", "Landing Page", "SaaS", "Portfolio", "Blog & Content", "Corporate"];

// ─── Page Component ──────────────────────────────────────────────────
export default function Page({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [applyRoxFont, setApplyRoxFont] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setApplyRoxFont(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    const found = templatesMeta.some((t) => t.id === templateId);
    if (!found) {
      alert("Template not found. Please refresh.");
      return;
    }

    setIsNavigating(true);
    setSelectedTemplateId(templateId);

    setTimeout(() => {
      router.push(`/edit_new/${username}?templateId=${templateId}`);
    }, 300);
  };

  const filteredTemplates = useMemo(() => {
    return templatesMeta.filter((template) => {
      const matchesSearch =
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.mood.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All" || template.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ─── Loading Overlay ────────────────────────────────────── */}
      {isNavigating && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-md z-50 flex items-center justify-center transition-all duration-300">
          <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl min-w-[240px] animate-in fade-in zoom-in-95 duration-200">
            <div className="relative mb-4">
              <Image src={mat} alt="Loading" width={48} height={48} className="object-contain opacity-90" />
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-300 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Setting up workspace…</span>
            </div>
          </div>
        </div>
      )}

      <Nav username={username} />

      <main className="max-w-7xl mx-auto mt-12 px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* ─── Header Section ───────────────────────────────────── */}
        <header className="mb-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex mb-2 items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Choose a starting point</span>
          </div>

          <h1 className={`text-3xl sm:text-4xl -mb-2 md:text-5xl font-semibold tracking-tight text-white ${applyRoxFont ? "rox" : ""}`}>
            What would you like to build today?
          </h1>

          <p className="text-slate-400 mb-3  text-base sm:text-lg leading-relaxed">
            Select a pre-built template to customize, or launch a clean slate to build from scratch.
          </p>
        </header>

        {/* ─── Action Bar & Search ────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-[#161b22] text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Blank Editor CTA */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates…"
                className="w-full bg-[#161b22] border border-slate-800 rounded-full py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>

            <Link
              href={`/edit/${username}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap shadow-sm hover:text-white"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Blank Editor</span>
            </Link>
          </div>
        </div>

        {/* ─── Templates Grid ──────────────────────────────────── */}
        <section className="pb-16">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-20 bg-[#161b22]/50 border border-slate-800/80 rounded-2xl max-w-md mx-auto my-8 space-y-3">
              <LayoutGrid className="w-10 h-10 text-slate-500 mx-auto opacity-50" />
              <h3 className="text-base font-medium text-slate-300">No templates found</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Try searching for a different keyword or change your category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="text-xs text-cyan-400 hover:underline pt-2 inline-block font-medium"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  applyRoxFont={applyRoxFont}
                  isLoading={isNavigating && selectedTemplateId === template.id}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────

function TemplateCard({
  template,
  applyRoxFont,
  isLoading,
  onSelect,
}: {
  template: TemplateMeta;
  applyRoxFont: boolean;
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onSelect(template.id)}
      className="
        group relative rounded-2xl overflow-hidden
        bg-[#161b22] border border-slate-800/80
        transition-all duration-300 ease-out
        hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20 hover:-translate-y-1
        cursor-pointer flex flex-col
      "
    >
      {/* Image Preview Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 border-b border-slate-800/50">
        <img
          src={template.localImage}
          alt={template.title}
          className="
            h-full w-full object-cover object-top
            transition-transform duration-500 ease-out
            group-hover:scale-105
          "
        />
        
        {/* Subtle Hover Overlay with Action Button */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-500 text-slate-950 text-xs font-semibold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            Use Template
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3
              className={`
                text-base font-semibold text-slate-100
                transition-colors duration-200 group-hover:text-cyan-400
                ${applyRoxFont ? "rox" : ""}
              `}
            >
              {template.title}
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/50 shrink-0">
              {template.mood}
            </span>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs text-cyan-400 font-medium animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading editor…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-800/60 py-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p>© Workspace Templates. All layouts are fully customizable.</p>
      <div className="flex items-center gap-4 text-slate-600">
        <span>Ready to publish</span>
        <span>•</span>
        <span>Drag & Drop Ready</span>
      </div>
    </footer>
  );
}