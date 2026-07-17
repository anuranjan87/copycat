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
const templatesMeta1 = [
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
    title: "Slow",
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
    mood: "experimenting",
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

const templatesMeta = [
  {
    id: "1",
    localImage: "/1.png",
    title: "Light House",
    description: "Vivid shades like crimson vermilion carry high intensities, this creates something that pulls in",
    mood: "Landing page",
  },
  {
    id: "2",
    localImage: "/2.png",
    title: "Silent Ink",
    description: "Rows of white canvas, purposeful like a stone garden, the emptiness is what keeps you steady. guides soul to pause before they move.",
    mood: "Sass marketing",
  },
  {
    id: "3",
    localImage: "/4.png",
    title: "Darjeeling",
    description: "Unfold the journey bit by bit so the heart relaxes. ensuring they stay long enough to build trust with the concept.",
    mood: "Blog",
  },
  {
    id: "4",
    localImage: "/10.png",
    title: "Slow",
    description: "Slow-rolling the data flow without making them exert effort. storytelling like those old school books",
    mood: "Landing Page",
  },
  {
    id: "5",
    localImage: "/5.png",
    title: "Stokebury",
    description: "Unites unconventional patterns with fixed structural logic, makes them stay without ever feeling lost.",
    mood: "Agencies & creators",
  },
  {
    id: "6",
    localImage: "/3.png",
    title: "Copy Cat",
    description: "A deep state where the terminal dissolves, and only the information remains.",
    mood: "founder vibe",
  },
  {
    id: "7",
    localImage: "/6.png",
    title: "Peekaboo",
    description: "Utilizes negative-space and motion-triggers to build mental air, enhancing focus and mental rest",
    mood: "company website",
  },
  {
    id: "8",
    localImage: "/13.jpg",
    title: "Pixel Perfect",
    description: "Combines block systems and uniform padding to build optic tempo and order across elements",
    mood: "Product Launch",
  },
  {
    id: "9",
    localImage: "/14.jpg",
    title: "Dark Luxe",
    description: "Pairs low-value tones with bold aesthetic fonts to build grit, mood, and a refined optic structure",
    mood: "experimenting",
  },
  {
    id: "10",
    localImage: "/7.png",
    title: "Blocks",
    description: "Organizes visuals using steady pacing and column shifts to lead users toward a tight descriptive logic",
    mood: "Blog",
  },
  {
    id: "11",
    localImage: "/8.png",
    title: "Negative Space",
    description: "Alters optic patterns purposely to build force, using chaos and fracture as a style choice",
    mood: "Landing page",
  },
  {
    id: "12",
    localImage: "/9.png",
    title: "Thrift Mode",
    description: "Illustrates how basic primitives and echoes can foster comfort and ease mental work",
    mood: "Porfolio",
  },
  {
    id: "13",
    localImage: "/11.png",
    title: "Retro VHS",
    description: "Employs grain, haze, and hue shifting to stir memory, showing how vibes control thought",
    mood: "nostalgic",
  },
  {
    id: "14",
    localImage: "/12.png",
    title: "Zen Garden",
    description: "Focuses on parity, padding, and optic peace to lower mental static and foster user repose",
    mood: "Landing page",
  },
 
  
];

export default function Page({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [allTemplateData, setAllTemplateData] = useState<any[]>([]);
  const [isLoadingAllTemplates, setIsLoadingAllTemplates] = useState(true);
  
  // State for delayed rox font animation
  const [applyRoxFont, setApplyRoxFont] = useState(false);

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

  // Delayed rox font effect - adds "rox" class after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplyRoxFont(true);
    }, 3500); // Slipped to 3.5s for a slightly faster premium punch
    
    return () => clearTimeout(timer);
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

    setIsNavigating(true);
    setSelectedTemplateId(templateId);

    // Small delay for visual feedback, then redirect
    setTimeout(() => {
      router.push(`/edit_new/${username}?templateId=${templateId}`);
    }, 300);
  };

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden selection:bg-red-500/30 selection:text-red-200">
      {/* Add custom fonts & subtle interactive global styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap');
          @font-face {
            font-family: 'Roxborough CF Thin';
            src: url('https://db.onlinewebfonts.com/c/68b898f6044bbee439423445076f3168?family=Roxborough+CF+Thin');
          }
          .rox {
            font-family: 'Roxborough CF Thin', serif;
          }
          body {
            font-family: 'Montserrat', sans-serif;
            background-color: #000000;
          }
          /* Custom sleek scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #000;
          }
          ::-webkit-scrollbar-thumb {
            background: #222;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #333;
          }
        `}
      </style>

      {/* Loading Overlay while navigating */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center transition-all duration-500 animate-fade-in">
          <div className="bg-black/40 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] backdrop-blur-md">
            <div className="relative animate-pulse duration-1000">
              <Image src={mat} alt="Loading" width={110} height={110} className="object-contain" />
            </div>
            <div className="flex items-center gap-2 mt-5 bg-stone-900/40 px-4 py-2 rounded-full border border-white/5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
              <span className="text-xs tracking-wider uppercase text-white/70">Loading Canvas...</span>
            </div>
          </div>
        </div>
      )}

      <Nav username={username} />

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 py-12 max-w-6xl mt-12 mx-auto relative">
        
        {/* Soft Radial Backlight behind Hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center mb-4 text-center mt-7 relative z-10">
          
          {/* Breathing Accent Line */}
          <div className="mb-6 w-12 h-[2px] bg-red-600 mx-auto animate-pulse" />
          
          <h1 className={`${applyRoxFont ? "rox tracking-normal text-stone-200" : "tracking-tight text-stone-400"} text-5xl md:text-6.5xl mt-4 font-light leading-tight transition-all duration-1000 ease-in-out`}>
            Not a website builder.<br />
            <span className="text-stone-300">A starting point.</span>
          </h1>

          <div className="mt-8 space-y-3 max-w-xl text-white/50 text-sm leading-relaxed tracking-wide font-light">
            <p className="animate-fade-in delay-100">
              You have an idea. Instead of overthinking design… <br className="hidden md:block" />
              you just start. 
            </p>

            <p className="animate-fade-in delay-200">
              Pick a template. Change a few words. <strong className="text-white/80 font-medium tracking-wide">Go live.</strong>
            </p>

            <p className="animate-fade-in delay-300">
              Now people can find you on Google. They land on your page. <br />
              They get curious. They leave their email.
            </p>

            <p className="animate-fade-in delay-500">
              And just like that—you’re collecting leads. <span className="text-white/60 italic font-normal">For free.</span>
            </p>

            <p className="text-stone-400/80 animate-fade-in delay-700 font-normal">
              You open your dashboard. Real people are visiting. <br />
              <span className="relative inline-flex items-center gap-1.5 font-semibold text-white/90">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Right now.
              </span>
            </p>
          </div>
        </section>

        {/* Blank Editor CTA Button */}
        <div className="text-center mt-14 mb-16">
          <Link
            href={`/edit/${username}`}
            className="group relative inline-flex items-center gap-3 px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white/40 border border-dashed border-white/20 hover:border-white/50 hover:text-white transition-all duration-500 bg-white/[0.01] hover:bg-white/[0.03] backdrop-blur-sm rounded"
          >
            <span className="relative z-10 flex items-center gap-2">
              Click here for blank editor 
              <span className="inline-block transition-transform duration-300 transform group-hover:translate-x-1.5">→</span>
            </span>
          </Link>
        </div>

        {/* Templates Grid */}
        <section className="pb-32 mt-6 relative z-10">
          <div className="grid grid-cols-1 gap-8 px-4 sm:px-8 lg:px-12 sm:grid-cols-2 lg:grid-cols-3">
            {templatesMeta.map((template) => {
              const isLoading = isNavigating && selectedTemplateId === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-[2rem]
                    border border-white/[0.08]
                    bg-[#080808]
                    shadow-[0_4px_30px_rgba(0,0,0,0.8)]
                    transition-all
                    duration-500
                    ease-out
                    hover:-translate-y-2
                    hover:border-red-500/30
                    hover:shadow-[0_12px_40px_-15px_rgba(239,68,68,0.15)]
                    cursor-pointer
                  "
                >
                  {/* Image/Screenshot Container */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={template.localImage}
                      alt={template.title}
                      className="
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-1000
                        ease-out
                        group-hover:scale-[1.04]
                        filter brightness-[0.9] group-hover:brightness-100
                      "
                    />

                    {/* Rich editorial vignette overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent transition-all duration-500" />
                  </div>

                  {/* Card content wrapper */}
                  <div className="space-y-4 p-7">
                    <h3
                      className={`
                        transition-colors duration-300 group-hover:text-red-400
                        ${applyRoxFont ? "rox" : ""} 
                        text-2xl font-light text-white
                      `}
                    >
                      {template.title}
                    </h3>

                    <p className="text-sm leading-6 text-neutral-400/90 font-light min-h-[48px]">
                      {template.description}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1 text-[10px] tracking-wide text-neutral-400 transition-all duration-300 group-hover:border-white/10 group-hover:text-neutral-200">
                        {template.category}
                      </span>

                      <span className="rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1 text-[10px] tracking-wide text-neutral-400 transition-all duration-300 group-hover:border-white/10 group-hover:text-neutral-200">
                        {template.mood}
                      </span>
                    </div>

                    {/* Loading status bar */}
                    {isLoading && (
                      <div className="flex items-center gap-2 pt-2 text-xs text-red-500 animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Initializing Workspace...</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-8 pb-4 text-center text-[10px] text-white/20 tracking-[0.2em] uppercase">
          <p>Your chosen premium template never expires</p>
        </footer>
      </main>
    </div>
  );
}