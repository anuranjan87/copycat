"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Upload,
  Download,
  Mail,
} from "lucide-react";
import * as XLSX from "xlsx"; // npm i xlsx

// ─── shadcn/ui imports ─────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import Nav from "@/components/nav";
import mat from "@/asset/mat.gif";

// ─── Types ──────────────────────────────────────────────────────────
interface TemplateMeta {
  id: string;
  localImage: string;
  title: string;
  description: string;
  mood: string;
  category: string;
}

interface EmailTemplate {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

// ─── Template Data ──────────────────────────────────────────────────
const templatesMeta: TemplateMeta[] = [
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
    category: "SaaS",
  },

  {
    id: "3",
    localImage: "/3.png",
    title: "Creative Studio",
    description:
      "Bold creative layout for agencies, studios and digital teams.",
    mood: "Creative",
    category: "Portfolio",
  },

  {
    id: "4",
    localImage: "/4.png",
    title: "Personal Portfolio",
    description:
      "Minimal portfolio experience for showcasing your work and skills.",
    mood: "Portfolio",
    category: "Portfolio",
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
    category: "SaaS",
  },

  {
    id: "7",
    localImage: "/7.png",
    title: "Product Launch",
    description:
      "High-impact product landing page built for launches and campaigns.",
    mood: "Landing page",
    category: "SaaS",
  },

  {
    id: "8",
    localImage: "/8.png",
    title: "Startup Flow",
    description:
      "Modern startup website focused on clarity, conversion and growth.",
    mood: "SaaS",
    category: "SaaS",
  },

  {
    id: "9",
    localImage: "/9.png",
    title: "Designer Portfolio",
    description:
      "Visual-first portfolio for designers, creators and freelancers.",
    mood: "Portfolio",
    category: "Portfolio",
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
    category: "SaaS",
  },

  {
    id: "12",
    localImage: "/12.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "SaaS",
  },
  {
    id: "15",
    localImage: "/15.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "SaaS",
  },
   {
    id: "16",
    localImage: "/16.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "SaaS",
  },
   {
    id: "18",
    localImage: "/18.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "SaaS",
  },
   {
    id: "19",
    localImage: "/19.png",
    title: "Simple Launch",
    description:
      "Simple, focused landing page designed to turn visitors into customers.",
    mood: "Landing page",
    category: "Portfolio",
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
];

const CATEGORIES = [
  
  "Landing Page",
  "SaaS",
  "Portfolio",
  "Blog & Content",
  "AI Agent"
];

// ─── Email templates for campaign ──────────────────────────────────
const emailTemplates: EmailTemplate[] = [
  {
    id: "email1",
    title: "Newsletter",
    description: "Clean, minimal design perfect for regular updates.",
    image: "/email1.png", // replace with actual asset
  },
  {
    id: "email2",
    title: "Promotional",
    description: "Bold, attention-grabbing layout for offers and launches.",
    image: "/email2.png",
  },
  {
    id: "email3",
    title: "Announcement",
    description: "Professional, trustworthy design for company news.",
    image: "/email3.png",
  },
];

// ─── Page Component ──────────────────────────────────────────────────
export default function Page({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [applyRoxFont, setApplyRoxFont] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Landing Page");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [contactsText, setContactsText] = useState("");
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ─── Modal handlers ───────────────────────────────────────────────
  const openModal = () => {
    setIsModalOpen(true);
    setModalStep(1);
    setContactsText("");
    setSelectedEmailTemplate(null);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let data: any[] = [];
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (extension === "csv") {
          const csv = ev.target?.result as string;
          const lines = csv.split("\n").filter((line) => line.trim() !== "");
          const headers = lines[0].split(",").map((h) => h.trim());
          const nameIdx = headers.findIndex((h) => h.toLowerCase().includes("name"));
          const emailIdx = headers.findIndex((h) => h.toLowerCase().includes("email"));
          data = lines.slice(1).map((line) => {
            const cols = line.split(",").map((c) => c.trim());
            return { name: cols[nameIdx] || "", email: cols[emailIdx] || "" };
          });
        } else if (extension === "xlsx" || extension === "xls") {
          const workbook = XLSX.read(ev.target?.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(sheet);
        } else {
          alert("Unsupported file format. Please upload CSV or Excel.");
          return;
        }

        // Build contacts text: "name, email" lines
        const text = data
          .map((row) => `${row.name || row.Name || ""}, ${row.email || row.Email || ""}`)
          .filter((line) => line.trim() !== ",")
          .join("\n");
        setContactsText((prev) => (prev ? prev + "\n" + text : text));
      } catch (err) {
        alert("Failed to parse file. Please check the format.");
        console.error(err);
      }
    };
    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSampleCSV = () => {
    const sample = "Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_contacts.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNextStep = () => {
    if (modalStep === 1) {
      // Validate that there is at least one contact
      const lines = contactsText.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) {
        alert("Please add at least one contact (name, email).");
        return;
      }
      setModalStep(2);
    }
  };

  const handleSelectEmailTemplate = (templateId: string) => {
    setSelectedEmailTemplate(templateId);
  };

const handleProceedWithTemplate = () => {
  if (!selectedEmailTemplate) {
    alert("Please select a template.");
    return;
  }
  // Save contacts to sessionStorage
  sessionStorage.setItem('emailCampaignContacts', contactsText);
  // Navigate to ui_ai page
  router.push(`/ai_ui/${username}?templateId=${selectedEmailTemplate}`);
  closeModal();
};


  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground">
      {/* ─── Loading Overlay ────────────────────────────────────── */}
      {isNavigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
          <Card className="w-72 p-6 flex flex-col items-center shadow-2xl border-muted">
            <div className="relative mb-4">
              <Image
                src={mat}
                alt="Loading"
                width={48}
                height={48}
                className="object-contain opacity-90"
              />
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Setting up workspace…</span>
            </div>
          </Card>
        </div>
      )}

      <Nav username={username} />

      <main className="max-w-7xl mx-auto mt-12 px-4 sm:px-6 lg:px-8 py-10 w-full flex-1" style={{ zoom: '0.92' }}>
        {/* ─── Header Section ───────────────────────────────────── */}
        <header className="mb-[3rem] text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/0 border border-primary/20 text-primary text-xs font-medium">
          </div>

          <h1
            className={`text-3xl sm:text-4xl mb-2 md:text-5xl font-semibold tracking-tight ${
              applyRoxFont ? "rox" : ""
            }`}
          >
            What would you like to build today?
          </h1>

          <p className="text-muted-foreground tracking-[0.08rem] mb-3 text-base sm:text-lg leading-relaxed">
            7winks helps you launch fast, learn quickly, and see what actually works.
          </p>
        </header>

        {/* ─── Action Bar & Search ────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Filter Pills */}
          <ScrollArea className="w-full md:w-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2.5">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="rounded-full whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>

          {/* Search & Blank Editor CTA */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tell your idea.."
                className="pl-10 rounded-full bg-muted/10 border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/edit/${username}`}>
                <Plus className="w-4 h-4 mr-1.5 text-primary" />
                Blank Editor
              </Link>
            </Button>

            {/* ─── Create Email Campaign (opens modal) ─────────── */}
            <Button variant="outline" className="rounded-full" onClick={openModal}>
              <Mail className="w-4 h-4 mr-1.5 text-primary" />
              Create Email Campaign
            </Button>
          </div>
        </div>

        {/* ─── Templates Grid ──────────────────────────────────── */}
        <section className="pb-16">
          {filteredTemplates.length === 0 ? (
            <Card className="py-20 border-muted/60 bg-muted/10 max-w-md mx-auto my-8 text-center">
              <CardContent className="space-y-3">
                <LayoutGrid className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-base font-medium text-foreground">
                  No templates found
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Try searching for a different keyword or change your category
                  filter.
                </p>
                <Button
                  variant="link"
                  className="text-primary"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                >
                  Reset filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  applyRoxFont={applyRoxFont}
                  isLoading={
                    isNavigating && selectedTemplateId === template.id
                  }
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>

      {/* ─── Email Campaign Modal ───────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalStep === 1 ? "Add Contacts" : "Choose Email Template"}
            </DialogTitle>
            <DialogDescription>
              {modalStep === 1
                ? "Add your contacts in the format: name, email (one per line). You can also upload a CSV or Excel file."
                : "Select a template to start your email campaign."}
            </DialogDescription>
          </DialogHeader>

          {/* ─── Step 1: Contacts ──────────────────────────────── */}
          {modalStep === 1 && (
            <div className="space-y-4 py-2">
              <div>
                <label htmlFor="contacts" className="text-sm font-medium">
                  Contacts
                </label>
                <textarea
                  id="contacts"
                  rows={8}
                  className="w-full mt-1 p-3 border rounded-md bg-background text-sm resize-none"
                  placeholder="John Doe, john@example.com&#10;Jane Smith, jane@example.com"
                  value={contactsText}
                  onChange={(e) => setContactsText(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload (CSV / Excel)
                </Button>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadSampleCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Supported formats: .csv, .xlsx, .xls. The file should contain columns named "Name" and "Email" (case-insensitive).
              </div>
            </div>
          )}

          {/* ─── Step 2: Template Selection ────────────────────── */}
          {modalStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
              {emailTemplates.map((tpl) => (
                <Card
                  key={tpl.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedEmailTemplate === tpl.id
                      ? "border-2 border-primary ring-2 ring-primary/30"
                      : "border-muted"
                  }`}
                  onClick={() => handleSelectEmailTemplate(tpl.id)}
                >
                  <div className="aspect-video bg-muted/30 relative overflow-hidden">
                    {/* Use placeholder if image not found */}
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Mail className="w-12 h-12 opacity-30" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium">{tpl.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tpl.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter className="flex justify-between items-center gap-2">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {modalStep === 1 && (
                <Button onClick={handleNextStep}>
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              {modalStep === 2 && (
                <Button onClick={handleProceedWithTemplate} disabled={!selectedEmailTemplate}>
                  Start Campaign
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <Card
      className="group overflow-hidden border-muted/60 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer flex flex-col"
      onClick={() => onSelect(template.id)}
    >
      {/* Image Preview Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30 border-b border-muted/40">
        <img
          src={template.localImage}
          alt={template.title}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay with action button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
          <Button
            variant="default"
            size="sm"
            className="rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200"
          >
            Use Template
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3
              className={`text-base font-semibold transition-colors group-hover:text-primary ${
                applyRoxFont ? "rox" : ""
              }`}
            >
              {template.title}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {template.mood}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 pt-2 border-t border-muted/60 text-xs text-primary font-medium animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading editor…</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Footer() {
  return (
    <footer className="border-t border-muted/40 py-8 text-center text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
      <p>© Workspace Templates. All layouts are fully customizable.</p>
      <div className="flex items-center gap-4 text-muted-foreground/70">
        <a href="/blogs">Blogs & tools</a>
      </div>
    </footer>
  );
}