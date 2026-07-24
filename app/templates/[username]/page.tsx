"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Plus, Search, User } from "lucide-react";

import Nav from "@/components/nav";
import mat from "@/asset/mat.gif";

// ─── Types ──────────────────────────────────────────────────────────────
interface TemplateMeta {
  id: string;
  localImage: string;
  title: string;
  description: string;
  mood: string;
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
  },
  {
    id: "2",
    localImage: "/2.png",
    title: "Silent Ink",
    description: "Minimalist and clean, perfect for SaaS marketing.",
    mood: "Sass marketing",
  },
  {
    id: "3",
    localImage: "/4.png",
    title: "Darjeeling",
    description: "Story‑driven layout for blogs and long‑form content.",
    mood: "Blog",
  },
  {
    id: "4",
    localImage: "/10.png",
    title: "Slow",
    description: "Futuristic, vibrant, and immersive for creative brands.",
    mood: "Landing Page",
  },
  {
    id: "5",
    localImage: "/5.png",
    title: "Stokebury",
    description: "Sharp, asymmetric layout for agencies and creators.",
    mood: "Agencies & creators",
  },
  {
    id: "6",
    localImage: "/3.png",
    title: "Copy Cat",
    description: "Bold, founder‑friendly design with a strong narrative.",
    mood: "founder vibe",
  },
  {
    id: "7",
    localImage: "/6.png",
    title: "Peekaboo",
    description: "Subtle, corporate‑ready with clever micro‑interactions.",
    mood: "company website",
  },
  {
    id: "8",
    localImage: "/13.jpg",
    title: "Pixel Perfect",
    description: "Playful, retro grid system for product launches.",
    mood: "Product Launch",
  },
  {
    id: "9",
    localImage: "/14.jpg",
    title: "Dark Luxe",
    description: "Luxurious dark theme for experimental brands.",
    mood: "experimenting",
  },
  {
    id: "10",
    localImage: "/7.png",
    title: "Blocks",
    description: "Clean, block‑based layout for blogs and portfolios.",
    mood: "Blog",
  },
  {
    id: "11",
    localImage: "/8.png",
    title: "Negative Space",
    description: "Bold, disruptive design with a focus on white space.",
    mood: "Landing page",
  },
  {
    id: "12",
    localImage: "/9.png",
    title: "Thrift Mode",
    description: "Warm, nostalgic portfolio style with a vintage touch.",
    mood: "Porfolio",
  },
  {
    id: "13",
    localImage: "/11.png",
    title: "Retro VHS",
    description: "Grainy, nostalgic aesthetic for creative projects.",
    mood: "nostalgic",
  },
  {
    id: "14",
    localImage: "/12.png",
    title: "Zen Garden",
    description: "Calm, balanced landing page with nature‑inspired tones.",
    mood: "Landing page",
  },
];

// ─── Page Component ──────────────────────────────────────────────────
export default function Page({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [applyRoxFont, setApplyRoxFont] = useState(false);

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

  return (
    <>
      {/* ─── Scanline & Vignette Overlay ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-50 scanline-overlay" />
      <div className="fixed inset-0 pointer-events-none z-40 vignette-overlay" />

      <div className="game-layout min-h-screen bg-[#0b0e14] -mt-7 text-white selection:bg-cyan-500/30 selection:text-cyan-100">

        {/* ─── Loading Overlay ────────────────────────────────────── */}
        {isNavigating && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
            <div className="bg-[#181818] border border-white/5 rounded-xl p-8 flex flex-col items-center shadow-2xl min-w-[200px]">
              <div className="relative">
                <Image src={mat} alt="Loading" width={50} height={50} className="object-contain opacity-80" />
              </div>
              <div className="flex items-center gap-2 mt-5 text-sm text-white/40">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="tracking-wide">Preparing your workspace…</span>
              </div>
            </div>
          </div>
        )}

        <Nav username={username} />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-10">
          {/* ─── Header ───────────────────────────────────────────── */}
          <header className="flex flex-col mt-12 md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className={`text-3xl md:text-4xl font-light tracking-tight ${applyRoxFont ? "rox" : ""}`}>
                Choose your <span className="text-cyan-400/90">starting point</span>
              </h1>
              <p className="text-white/30 text-sm mt-1 max-w-lg">
                Pick a template and start editing instantly — no design skills required.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Search templates…"
                  className="w-48 bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors"
                />
              </div>
              <Link
                href={`/edit/${username}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-medium rounded-full transition-colors duration-200 shadow-[0_0_12px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              >
                <Plus className="w-4 h-4" />
                Blank Editor
              </Link>
            </div>
          </header>

          {/* ─── Templates Grid ──────────────────────────────────── */}
          <section className="pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templatesMeta.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  applyRoxFont={applyRoxFont}
                  isLoading={isNavigating && selectedTemplateId === template.id}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>
          </section>

          <Footer />
        </main>
      </div>

      <style jsx>{`
        /* ─── Game Layout Styles ────────────────────────────── */
        .game-layout {
          position: relative;
          box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 255, 255, 0.05);
        }

        .scanline-overlay {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          );
          animation: scanlines 0.1s linear infinite;
        }

        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }

        .vignette-overlay {
          background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.3) 100%);
          pointer-events: none;
        }

        /* ─── Pixel‑style border accents ────────────────────── */
        .game-layout :global(.group) {
          border: 1px solid rgba(0, 255, 255, 0.05);
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .game-layout :global(.group:hover) {
          border-color: rgba(0, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.08), inset 0 0 20px rgba(0, 255, 255, 0.02);
        }

        /* subtle corner pixel decorations */
        .game-layout :global(.group::before),
        .game-layout :global(.group::after) {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: rgba(0, 255, 255, 0.15);
          border-style: solid;
          border-width: 0;
          transition: border-color 0.3s;
          pointer-events: none;
          opacity: 0.6;
        }

        .game-layout :global(.group::before) {
          top: 6px;
          left: 6px;
          border-top-width: 1px;
          border-left-width: 1px;
        }

        .game-layout :global(.group::after) {
          bottom: 6px;
          right: 6px;
          border-bottom-width: 1px;
          border-right-width: 1px;
        }

        .game-layout :global(.group:hover::before),
        .game-layout :global(.group:hover::after) {
          border-color: rgba(0, 255, 255, 0.5);
        }

        /* custom scrollbar (optional game feel) */
        .game-layout ::-webkit-scrollbar {
          width: 6px;
          background: #0b0e14;
        }
        .game-layout ::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.2);
          border-radius: 3px;
        }
        .game-layout ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.4);
        }
      `}</style>
    </>
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
        bg-[#14181f] border border-white/5
        transition-all duration-300 ease-out
        hover:border-cyan-400/30 hover:shadow-2xl hover:shadow-cyan-500/10
        cursor-pointer
      "
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0f131a]">
        <img
          src={template.localImage}
          alt={template.title}
          className="
            h-full w-full object-cover
            transition-transform duration-500 ease-out
            group-hover:scale-105
            filter brightness-90 group-hover:brightness-100
          "
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181f] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5 space-y-2">
        <h3
          className={`
            text-lg font-medium text-white/90
            transition-colors duration-200 group-hover:text-cyan-300
            ${applyRoxFont ? "rox" : ""}
          `}
        >
          {template.title}
        </h3>
        <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">
          {template.description}
        </p>
        <div className="pt-2 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/20 border border-white/10 rounded-full px-3 py-1">
            {template.mood}
          </span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 mt-2 text-xs text-cyan-400 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 pt-6 pb-4 text-center text-[10px] text-white/20 tracking-widest uppercase flex justify-center items-center gap-6">
      <span>All templates are fully customizable</span>
      <span className="hidden sm:inline">•</span>
      <span className="hidden sm:inline text-[8px] opacity-40 tracking-[0.2em]">v1.0.3</span>
      <span className="hidden sm:inline text-[8px] opacity-40">FPS 60</span>
    </footer>
  );
}