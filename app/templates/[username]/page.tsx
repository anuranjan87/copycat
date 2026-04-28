"use client";

import { use } from "react"; // ✅ Required to unwrap params Promise
import { Origami, Globe2Icon, LayoutDashboard, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { copyTemplateToUser, getAllWebsiteTemplates } from "@/lib/website-actions";
import mat from "@/asset/mat.gif";

interface PageProps {
  params: Promise<{   // ✅ params is a Promise
    username: string;
  }>;
}

// Template metadata (same as before)
const templatesMeta = [
  {
    id: "1",
    imageSrc:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MDczMjE0NTNhYWVkN2Q0ODAyZWUxY2Q4YjQxMzY4MjI.jpg-RtJL8JHAO7YC1XcO6N0JhCHjpTWhNC.jpeg",
    title: "Blank Canvas",
    description: "Your HTML5 sandbox – tinker with code or generate a full website with our AI",
    mood: "experimental / free",
  },
  {
    id: "2",
    imageSrc:
      "https://i.postimg.cc/RVJmVNHh/MDcz-Mj-E0-NTNh-YWVk-N2-Q0-ODAy-ZWUx-Y2-Q4-Yj-Qx-Mz-Y4-Mj-I.jpg",
    title: "Silent Ink",
    description: "Calligraphic, minimal, white background, like an elegant business card",
    mood: "quiet / refined",
  },
  {
    id: "3",
    imageSrc: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/11234",
    title: "Peekaboo",
    description: "Ultra-low content, stylish link-in-bio. Open, explore… or don’t",
    mood: "mysterious / subtle",
  },
  {
    id: "4",
    imageSrc: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/heloaos",
    title: "Kenny?",
    description: "Full of personality, multi-section with 2D animations for B2C brands",
    mood: "playful / bold",
  },
  {
    id: "5",
    imageSrc:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Artboard%201-uSx6JzCKD5Kmmg9IDbAnNl7OHnAk8b.png",
    title: "Stokebury",
    description: "Ultra-professional layout, image-driven sections. For agencies and solo creators",
    mood: "corporate / sharp",
  },
  {
    id: "6",
    imageSrc:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Artboard%201-79YVrd7eG22eykmzjTZyAq7YKcuug3.png",
    title: "Slot-Machine",
    description: "3D scrolling animation that shouts out for business—one word at a time",
    mood: "risky / electric",
  },
  {
    id: "7",
    imageSrc: "https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/heloaos",
    title: "Kenny?",
    description: "Full of personality, multi-section with 2D animations for B2C brands",
    mood: "playful / bold",
  },
  {
    id: "8",
    imageSrc:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Artboard%201-uSx6JzCKD5Kmmg9IDbAnNl7OHnAk8b.png",
    title: "Stokebury",
    description: "Ultra-professional layout, image-driven sections. For agencies and solo creators",
    mood: "corporate / sharp",
  },
  {
    id: "9",
    imageSrc:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Artboard%201-79YVrd7eG22eykmzjTZyAq7YKcuug3.png",
    title: "Slot-Machine",
    description: "3D scrolling animation that shouts out for business—one word at a time",
    mood: "risky / electric",
  },
{
  id: "10",
  imageSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Artboard%201-79YVrd7eG22eykmzjTZyAq7YKcuug3.png",
  title: "Narrative Blocks",
  description: "Two-column alternating sections that create a storytelling ",
  mood: "balanced / intentional",
}
];

export default function Page({ params }: PageProps) {
  // ✅ Unwrap the params Promise using React.use()
  const { username } = use(params);
  const router = useRouter();

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [allTemplateData, setAllTemplateData] = useState<any[]>([]);
  const [isLoadingAllTemplates, setIsLoadingAllTemplates] = useState(true);

  // Fetch full template data (code, etc.) on mount
  useEffect(() => {
    const fetchAllTemplates = async () => {
      try {
        const data = await getAllWebsiteTemplates();
        setAllTemplateData(data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setIsLoadingAllTemplates(false);
      }
    };
    fetchAllTemplates();
  }, []);

  // Copy template & navigate to editor
  const handleSelectTemplate = async (templateId: string) => {
    if (isLoadingAllTemplates || !allTemplateData.length) {
      alert("Templates are still loading. Please wait.");
      return;
    }

    const foundTemplate = allTemplateData.find((t) => t.id === Number(templateId));
    if (!foundTemplate) {
      alert("Template not found. Refresh the page.");
      return;
    }

    setIsNavigating(true);
    setSelectedTemplateId(templateId);

    try {
      const result = await copyTemplateToUser(Number(templateId), username);
      if (result?.success) {
        router.push(`/edit_new/${username}`);
      } else {
        alert(`Failed: ${result?.error || "Unknown error"}`);
        setIsNavigating(false);
        setSelectedTemplateId(null);
      }
    } catch (error) {
      alert("Copy failed. Try again.");
      setIsNavigating(false);
      setSelectedTemplateId(null);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-black/60 border border-red-500/30 rounded-xl p-6 flex flex-col items-center">
            <Image src={mat} alt="Loading" width={120} height={120} />
            <div className="flex items-center gap-2 mt-3">
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              <span className="text-sm text-white/80">Setting up your editor...</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Left Sidebar – fixed icons */}
        <aside className="w-14 p-3 flex flex-col items-center gap-8 mt-9 sticky top-0 h-screen">
          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-red-500 transition"
          >
            <Globe2Icon size={20} />
          </a>
          <a
            href={`/dashboard/${username}`}
            className="text-neutral-500 hover:text-red-500 transition"
          >
            <LayoutDashboard size={20} />
          </a>
          <a href={`/templates`} className="text-neutral-500 hover:text-red-500 transition">
            <Origami size={20} />
          </a>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 md:px-12 py-12 max-w-6xl mx-auto">
          {/* Hero Section – inspired by the lightweight HTML */}
          <section className="h-[70vh] flex flex-col items-center justify-center text-center">
            <div className="mb-4 w-12 h-[2px] bg-red-600 mx-auto" />
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              Not a website builder.<br />
              A starting point.
            </h1>
            <p className="mt-6 text-white/40 text-sm max-w-lg">
              7Winks gives you structured templates designed to convert—so you spend less time
              arranging pixels, and more time building something that matters.
            </p>
            <div className="mt-12 text-[10px] tracking-[0.3em] text-white/30">
              SELECT YOUR FOUNDATION ↓
            </div>
          </section>

          {/* Templates Grid – pure CSS transitions, no framer-motion */}
          <section className="pb-32">
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {templatesMeta.map((template) => {
                const isLoading = isNavigating && selectedTemplateId === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className="group relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/5"
                  >
                    {/* Image area (lightweight) */}
                    <div className="relative h-50 w-full overflow-hidden bg-neutral-900">
                      <Image
                        src={template.imageSrc}
                        alt={template.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Card content */}
                    <div className="p-5">
                      <div className="text-[10px] tracking-[0.3em] text-white/30 mb-2">
                        {template.id.padStart(2, "0")}
                      </div>
                      <div className="text-xl font-medium mb-1">{template.title}</div>
                      <div className="text-[11px] text-white/40 mb-3">{template.mood}</div>
                      <p className="text-xs text-white/50 line-clamp-2">{template.description}</p>

                      {/* Loading indicator inside card */}
                      {isLoading && (
                        <div className="mt-3 flex items-center gap-1 text-red-400 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Copying...
                        </div>
                      )}
                    </div>

                    {/* Subtle red line on hover */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/10 pt-8 text-center text-[11px] text-white/30 tracking-wider">
            <p>All templates are fully customizable. Start with a design that fits your voice.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}