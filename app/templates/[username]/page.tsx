"use client";
import Link from 'next/link';
import { use } from "react"; // ✅ Required to unwrap params Promise
import { Origami, Globe2Icon, LayoutDashboard, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllWebsiteTemplates } from "@/lib/website-actions";
import mat from "@/asset/mat.gif";
import Nav from "@/components/nav";


interface PageProps {
  params: Promise<{ username: string }>;
}
const templatesMeta = [
  {
    id: "1",
    localImage: "/1.png",
    title: "Light House",
    description: "Warm colors like yellows oranges have long wavelengths, that makes something that pushes in",
    mood: "Landing page",
  },
  {
    id: "2",
    localImage: "/2.png",
    title: "Silent Ink",
    description: "Tons of empty space, minimalist like a quiet library, the silence is what makes you focus. makes user to think before they click.",
    mood: "Sass marketing",
  },
  {
    id: "3",
    localImage: "/4.png",
    title: "Darjeeling",
    description: "Reveal the story step by step so the user doesn't panic. ensuring they stay long enough to fall in love with the product.",
    mood: "Blog",
  },
  {
    id: "4",
    localImage: "/10.png",
    title: "Holo Glow",
    description: "Spoon-feeding the information without making them doing actual work. storytelling like those old school books",
    mood: "futuristic / vibrant",
  },
  {
    id: "5",
    localImage: "/5.png",
    title: "Stokebury",
    description: "Balances asymmetrical layouts with strong alignment rules, makes them hooked without ever making feel lost.",
    mood: "sharp / agencies & creators",
  },
  {
    id: "6",
    localImage: "/3.png",
    title: "SlotMachine",
    description: "A flow state where the interface disappears, and only the information remains.",
    mood: "risky / founder vibe",
  },
  {
    id: "7",
    localImage: "/6.png",
    title: "Peekaboo",
    description: "Leverages whitespace and micro-interactions to create breathing room, improving readability and cognitive ease",
    mood: "subtle / company website",
  },
  {
    id: "8",
    localImage: "/13.jpg",
    title: "Pixel Perfect",
    description: "Embraces grid systems and consistent spacing to create visual rhythm and alignment across components",
    mood: "playful / retro",
  },
  {
    id: "9",
    localImage: "/14.jpg",
    title: "Dark Luxe",
    description: "Uses low-light palettes with high contrast typography to create depth, focus, and a premium visual hierarchy",
    mood: "luxury / premium",
  },
  {
    id: "10",
    localImage: "/7.png",
    title: "Narrative Blocks",
    description: "Structures content using layout rhythm and section flow to guide users through a clear storytelling hierarchy",
    mood: "balanced / intentional",
  },
  {
    id: "11",
    localImage: "/8.png",
    title: "Glitch Story ",
    description: "Breaks visual consistency intentionally to create tension, using contrast and disruption as a design tool",
    mood: "immersive / landing page",
  },
  {
    id: "12",
    localImage: "/9.png",
    title: "Thrift Mode",
    description: "Demonstrates how simple components and repetition can build familiarity and reduce cognitive load",
    mood: "bold / porfolio",
  },
  {
    id: "13",
    localImage: "/11.png",
    title: "Retro VHS",
    description: "Uses texture, noise, and color grading to evoke emotion, showing how aesthetics influence perception",
    mood: "retro / nostalgic",
  },
  {
    id: "14",
    localImage: "/12.png",
    title: "Zen Garden",
    description: "Focuses on balance, spacing, and visual calm to reduce cognitive friction and improve user comfort",
    mood: "calm / nature",
  },
  {
    id: "15",
    localImage: "/15.jpg",
    title: "Cyber Pulse",
    description: "Applies high saturation, contrast, and motion to create energy and visual urgency in the interface",
    mood: "cyberpunk / energetic",
  },
  {
    id: "16",
    localImage: "/16.jpg",
    title: "Minimal Mono",
    description: "Uses strict typography scale and spacing consistency to achieve clarity, readability, and strong visual order",
    mood: "minimal / clean",
  },
];

export default function Page({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [allTemplateData, setAllTemplateData] = useState<any[]>([]);
  const [isLoadingAllTemplates, setIsLoadingAllTemplates] = useState(true);

  // Fetch full template data (only needed to validate existence, not used for copying)
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

  // Handle template selection – navigate to editor with templateId, no auto-publish
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

    // Just navigate to the editor with templateId as a query parameter
    setIsNavigating(true);
    setSelectedTemplateId(templateId);

    // Small delay for visual feedback, then redirect
    setTimeout(() => {
      router.push(`/edit_new/${username}?templateId=${templateId}`);
    }, 300);
  };

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">
      {/* Add custom fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap');
          @font-face {
            font-family: 'Roxborough CF Thin';
            src: url('https://db.onlinewebfonts.com/c/68b898f6044bbee439423445076f3168?family=Roxborough+CF+Thin');
            
          }
          .rox {
            font-family: 'Roxborough CF Thin', serif;
          }
          body {
            font-family: 'Montserrat', sans-serif;
          }
        `}
      </style>

      {/* Loading Overlay while navigating */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-black/60 border border-red-500/30 rounded-xl p-6 flex flex-col items-center">
            <Image src={mat} alt="Loading" width={120} height={120} />
            <div className="flex items-center gap-2 mt-3">
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              <span className="text-sm text-white/80">Loading template into editor...</span>
            </div>
          </div>
        </div>
      )}

<Nav username={username} />

        {/* Main Content */}
        <main className="flex-1 px-6 md:px-12 py-12 max-w-6xl mt-12 mx-auto">
          {/* Hero Section */}
          <section className=" flex flex-col items-center justify-center text-center mt-7">
            <div className="mb-4 w-12 h-[2px] bg-red-600 mx-auto" />
            <h1 className="text-5xl md:text-6xl mt-4 font-light tracking-tight">
              Not a website builder.<br />
              A starting point.
            </h1>
            <p className="mt-6 text-white/40 text-sm max-w-lg">
              7Winks gives you structured templates designed to convert—so you spend less time
              arranging pixels, and more time building something that matters.
            </p>
           <Link
  href={`/edit/${username}`}
  className="underline underline-offset-4 mt-16 mb-9 text-[10px] tracking-[0.3em] text-white/30 hover:text-white/50 transition inline-block"
>
  CLICK HERE FOR BLANK EDITOR →
</Link>
          </section>

          {/* Templates Grid – each card navigates to editor with templateId */}
          <section className="pb-32 mt-4">
            <div className="grid gap-11 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {templatesMeta.map((template) => {
                const isLoading = isNavigating && selectedTemplateId === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className="bg-gray-900/70 shadow-[0_8px_20px_rgba(255,255,255,0.2),0_20px_60px_rgba(255,255,255,0.08)] p-4 rounded-3xl cursor-pointer transition-all duration-300 hover:scale-105"
                  >
                    {/* Image area - using standard img to match HTML exactly */}
                    <div className="relative w-full overflow-hidden rounded-xl">
                      <img
                        src={template.localImage}
                        alt={template.title}
                        className="rounded-2xl w-full h-auto object-cover"
                      />
                    </div>

                    {/* Card content */}
                    <div className="mt-4">
                      <h2 className="rox  text-white text-xl mt-[1rem] mb-[0.4rem]">{template.title}</h2>
                      <p className=" text-gray-400    text-sm mb-[1rem] leading-[1.2rem] tracking-[.02rem]">{template.description}</p>
                      <p className="text-gray-100/50 tracking-[.07rem]  font-thin italic text-xs ">{template.mood}</p>

                      {/* Loading indicator inside card */}
                      {isLoading && (
                        <div className="mt-3 flex items-center gap-1 text-red-400 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/10 pt-8 text-center text-[11px] text-white/30 tracking-wider">
            <p>Select any template – it will open in the editor as a draft. Publish when you're ready.</p>
          </footer>
        </main>
      </div>
  );
}