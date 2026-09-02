"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import * as XLSX from "xlsx";
import {
  templatesMeta,
  CATEGORIES,
  type TemplateMeta,
} from "@/lib/templates";

import { useSubscription } from "@/components/subscription-provider";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  Plus,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import CategoryPills from "@/components/CategoryPills";

import { Badge } from "@/components/ui/badge";

import Buttons from "@/components/ui_components/buttons";
import Colors from "@/components/ui_components/colors";
import Gradients from "@/components/ui_components/gradients";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Nav from "@/components/nav";
import mat from "@/asset/mat.gif";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

interface EmailTemplate {
  id: string;
  title: string;
  description: string;
  image: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: "email1",
    title: "Newsletter",
    description:
      "Clean, minimal design perfect for regular updates.",
    image: "/email1.png",
  },
  {
    id: "email2",
    title: "Promotional",
    description:
      "Bold, attention-grabbing layout for offers and launches.",
    image: "/email2.png",
  },
  {
    id: "email3",
    title: "Announcement",
    description:
      "Professional, trustworthy design for company news.",
    image: "/email3.png",
  },
];

export default function Page({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();
  const { isPremium } = useSubscription();

  
  // ------------------------------------------------------------
  // General state
  // ------------------------------------------------------------

  const [isNavigating, setIsNavigating] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string | null>(null);

  const [applyRoxFont, setApplyRoxFont] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [activeCategory, setActiveCategory] =
    useState("Landing Page");

  const [activeUIComponent, setActiveUIComponent] =
    useState("Colors");

  // ------------------------------------------------------------
  // Blank Editor animation
  // ------------------------------------------------------------

  const [isOpeningBlankEditor, setIsOpeningBlankEditor] =
    useState(false);

  // ------------------------------------------------------------
  // Category navigation
  // BOTH arrows are intentionally ALWAYS visible.
  // ------------------------------------------------------------

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------
  // Email campaign modal
  // ------------------------------------------------------------

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalStep, setModalStep] = useState<1 | 2>(1);

  const [contactsText, setContactsText] = useState("");

  const [selectedEmailTemplate, setSelectedEmailTemplate] =
    useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------
  // Rox font
  // ------------------------------------------------------------

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApplyRoxFont(true);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // ------------------------------------------------------------
  // Category scrolling
  // ------------------------------------------------------------

  const scrollCategories = (
    direction: "left" | "right"
  ) => {
    const element = categoryScrollRef.current;

    if (!element) {
      return;
    }

    const amount = Math.max(
      element.clientWidth * 0.65,
      250
    );

    element.scrollBy({
      left:
        direction === "right"
          ? amount
          : -amount,
      behavior: "smooth",
    });
  };

  // ------------------------------------------------------------
  // Blank Editor
  // ------------------------------------------------------------

  const handleBlankEditor = () => {
  if (isOpeningBlankEditor) {
    return;
  }

  setIsOpeningBlankEditor(true);

  window.setTimeout(() => {
    router.push(`/edit/${username}`);
  }, 1000);
};

  // ------------------------------------------------------------
  // Template selection
  // ------------------------------------------------------------

  const handleSelectTemplate = (
    templateId: string
  ) => {
    const exists = templatesMeta.some(
      (template) =>
        template.id === templateId
    );

    if (!exists) {
      alert(
        "Template not found. Please refresh."
      );
      return;
    }

    setSelectedTemplateId(templateId);
    setIsNavigating(true);

    window.setTimeout(() => {
      router.push(
        `/edit_new/${username}?templateId=${templateId}`
      );
    }, 300);
  };

  // ------------------------------------------------------------
  // Filter templates
  // ------------------------------------------------------------

  const filteredTemplates = useMemo(() => {
    const query = searchQuery
      .toLowerCase()
      .trim();

    return templatesMeta.filter(
      (template) => {
        const matchesSearch =
          !query ||
          template.title
            .toLowerCase()
            .includes(query) ||
          template.description
            .toLowerCase()
            .includes(query) ||
          template.mood
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          activeCategory === "All" ||
          template.category === activeCategory;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );
  }, [
    searchQuery,
    activeCategory,
  ]);

  // ------------------------------------------------------------
  // Email modal
  // ------------------------------------------------------------

  const openModal = () => {
    setIsModalOpen(true);
    setModalStep(1);
    setContactsText("");
    setSelectedEmailTemplate(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // ------------------------------------------------------------
  // File upload
  // ------------------------------------------------------------

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const extension = file.name
          .split(".")
          .pop()
          ?.toLowerCase();

        let rows: any[] = [];

        // --------------------------------------------------------
        // CSV
        // --------------------------------------------------------

        if (extension === "csv") {
          const csv =
            loadEvent.target?.result as string;

          const lines = csv
            .split(/\r?\n/)
            .filter(
              (line) =>
                line.trim() !== ""
            );

          if (lines.length === 0) {
            alert(
              "The CSV file is empty."
            );
            return;
          }

          const headers = lines[0]
            .split(",")
            .map((header) =>
              header
                .trim()
                .toLowerCase()
            );

          const nameIndex =
            headers.findIndex(
              (header) =>
                header.includes("name")
            );

          const emailIndex =
            headers.findIndex(
              (header) =>
                header.includes("email")
            );

          rows = lines
            .slice(1)
            .map((line) => {
              const columns = line
                .split(",")
                .map((column) =>
                  column.trim()
                );

              return {
                name:
                  nameIndex >= 0
                    ? columns[
                        nameIndex
                      ] || ""
                    : "",
                email:
                  emailIndex >= 0
                    ? columns[
                        emailIndex
                      ] || ""
                    : "",
              };
            });
        }

        // --------------------------------------------------------
        // Excel
        // --------------------------------------------------------

        else if (
          extension === "xlsx" ||
          extension === "xls"
        ) {
          const workbook = XLSX.read(
            loadEvent.target?.result,
            {
              type: "array",
            }
          );

          const firstSheet =
            workbook.Sheets[
              workbook.SheetNames[0]
            ];

          rows =
            XLSX.utils.sheet_to_json(
              firstSheet
            );
        }

        // --------------------------------------------------------
        // Unsupported
        // --------------------------------------------------------

        else {
          alert(
            "Unsupported file format. Please upload CSV or Excel."
          );
          return;
        }

        // --------------------------------------------------------
        // Convert rows to contacts
        // --------------------------------------------------------

        const contacts = rows
          .map((row) => {
            const name =
              row.name ??
              row.Name ??
              "";

            const email =
              row.email ??
              row.Email ??
              "";

            return `${String(
              name
            ).trim()}, ${String(
              email
            ).trim()}`;
          })
          .filter(
            (line) =>
              line.trim() !== ","
        )
          .join("\n");

        setContactsText(
          (previous) => {
            if (!previous.trim()) {
              return contacts;
            }

            if (!contacts.trim()) {
              return previous;
            }

            return `${previous}\n${contacts}`;
          }
        );
      } catch (error) {
        console.error(
          "Contact file parsing error:",
          error
        );

        alert(
          "Failed to parse file. Please check the format."
        );
      }
    };

    if (
      file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ------------------------------------------------------------
  // Download sample CSV
  // ------------------------------------------------------------

  const downloadSampleCSV = () => {
    const csv =
      "Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "sample_contacts.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ------------------------------------------------------------
  // Modal step 1 → step 2
  // ------------------------------------------------------------

  const handleNextStep = () => {
    if (modalStep !== 1) {
      return;
    }

    const contacts =
      contactsText
        .split(/\r?\n/)
        .map((line) =>
          line.trim()
        )
        .filter(Boolean);

    if (contacts.length === 0) {
      alert(
        "Please add at least one contact (name, email)."
      );
      return;
    }

    setModalStep(2);
  };

  // ------------------------------------------------------------
  // Select email template
  // ------------------------------------------------------------

  const handleSelectEmailTemplate = (
    templateId: string
  ) => {
    setSelectedEmailTemplate(
      templateId
    );
  };

  // ------------------------------------------------------------
  // Start campaign
  // ------------------------------------------------------------

  const handleProceedWithTemplate =
    () => {
      if (!selectedEmailTemplate) {
        alert(
          "Please select a template."
        );
        return;
      }

      sessionStorage.setItem(
        "emailCampaignContacts",
        contactsText
      );

      closeModal();

      router.push(
        `/ai_ui/${username}?templateId=${selectedEmailTemplate}`
      );
    };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground font-sans">

      {/* ========================================================
          Blank Editor transition
          ======================================================== */}

      {isOpeningBlankEditor && (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">

          {/* Soft backdrop */}

          <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-blank-backdrop" />

          {/* Portal */}

          <div className="absolute left-1/2 top-1/2">

            <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background animate-blank-portal" />

            {/* Ring 1 */}

            <div className="absolute left-0 top-0 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40 animate-blank-ring" />

            {/* Ring 2 */}

            <div className="absolute left-0 top-0 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 animate-blank-ring-two" />

            {/* Core */}

            <div className="absolute left-0 top-0 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-[0_0_80px_rgba(255,255,255,0.5)] animate-blank-core" />

            {/* Spark */}

            <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 animate-blank-spark">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          Template loading overlay
          ======================================================== */}

      {isNavigating && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm">

          <Card className="w-72 p-6 shadow-2xl">

            <div className="flex flex-col items-center">

              <Image
                src={mat}
                alt="Loading"
                width={48}
                height={48}
                className="mb-4 object-contain"
              />

              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">

                <Loader2 className="h-4 w-4 animate-spin text-primary" />

                <span>
                  Setting up workspace…
                </span>

              </div>

            </div>

          </Card>

        </div>
      )}

      {/* ========================================================
          Navigation
          ======================================================== */}

      <Nav username={username} />

      {/* ========================================================
          Main
          ======================================================== */}

      <main
        className="mx-auto mt-12 w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
        style={{
          zoom: "0.92",
        }}
      >

        {/* ======================================================
            Header
            ====================================================== */}

         <header className="mb-[3rem] text-center max-w-3xl mx-auto space-y-4">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/0 border border-primary/10 text-primary text-xs font-medium">
          </div>

          <h1
            className={`text-3xl sm:text-4xl mb-2 md:text-5xl font-semibold tracking-tight ${
              applyRoxFont
                ? "rox"
                : ""
            }`}
          >
            What would you like to build today?
          </h1>

          <p className="text-muted-foreground tracking-[0.08rem] mb-3 text-base sm:text-lg leading-relaxed">
            7winks helps you launch fast, learn quickly, and see what actually works.
          </p>

        </header>

        {/* ======================================================
            Action bar
            ====================================================== */}

        <div className="mb-10 flex flex-col items-center justify-between gap-5 md:flex-row">

          {/* ====================================================
              Categories
              ==================================================== */}

          <div className="relative min-w-0 flex-1 w-full md:w-auto">

            {/* --------------------------------------------------
                BOTH ARROWS ARE ALWAYS VISIBLE
                -------------------------------------------------- */}

            <div className="absolute -top-11 left-0 z-30 flex items-center gap-1">

              {/* LEFT */}

              <button
                type="button"
                aria-label="Previous categories"
                onClick={() =>
                  scrollCategories(
                    "left"
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:bg-muted hover:text-foreground active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* RIGHT */}

              <button
                type="button"
                aria-label="More categories"
                onClick={() =>
                  scrollCategories(
                    "right"
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:bg-muted hover:text-foreground active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

            {/* --------------------------------------------------
                Category pills
                -------------------------------------------------- */}

            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2.5 overflow-x-auto scroll-smooth py-1 pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >

              {CATEGORIES.map(
                (category) => {
                  const Icon =
                    category.icon;

                  const isActive =
                    activeCategory ===
                    category.name;

                  return (
                    <Button
                      key={
                        category.name
                      }
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveCategory(
                          category.name
                        )
                      }
                      className={
                        isActive
                          ? "h-9 shrink-0 gap-2 whitespace-nowrap rounded-full border border-foreground bg-foreground px-4 text-sm font-medium text-background transition-all hover:bg-foreground/90 hover:text-background"
                          : "h-9 shrink-0 gap-2 whitespace-nowrap rounded-full border border-transparent bg-muted/50 px-4 text-sm font-medium text-foreground transition-all hover:bg-muted"
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />

                      {category.name}
                    </Button>
                  );
                }
              )}

            </div>
          </div>

          {/* ====================================================
              Search + actions
              ==================================================== */}

          <div className="flex w-full items-center gap-3 md:w-auto">

            {/* Search */}

            <div className="relative flex-1 md:w-64">

              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Tell your idea.."
                className="rounded-full border-muted-foreground/20 bg-muted/10 pl-10 focus-visible:ring-primary"
              />

            </div>

            {/* ==================================================
                BLANK EDITOR
                ================================================== */}

          <Button
  type="button"
  variant="outline"
  disabled={isOpeningBlankEditor}
  onClick={handleBlankEditor}
  className={
    isOpeningBlankEditor
      ? "relative overflow-hidden rounded-full scale-95"
      : "group relative overflow-hidden rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 active:scale-95"
  }
>
  {!isOpeningBlankEditor && (
    <>
      <Plus className="mr-1.5 h-4 w-4 text-primary transition-transform duration-300 group-hover:rotate-90" />
      <span>Blank Editor</span>
    </>
  )}

  {isOpeningBlankEditor && (
    <>
      <span className="absolute inset-0 animate-blank-button rounded-full bg-primary/10" />

      <Sparkles className="relative z-10 h-4 w-4 animate-blank-icon text-primary" />
    </>
  )}
</Button>

            {/* ==================================================
                EMAIL CAMPAIGN
                ================================================== */}

            <Button
              type="button"
              variant="outline"
              onClick={openModal}
              className="rounded-full"
            >
              <Mail className="mr-1.5 h-4 w-4 text-primary" />

              Create Email Campaign
            </Button>

          </div>

        </div>

        {/* ======================================================
            Templates
            ====================================================== */}

      
<section className="pb-16">
  {activeCategory === "UI Components" ? (
    <div className="w-full">
      {/* UI Component Subcategory Pills */}
      <CategoryPills
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeUIComponent={activeUIComponent}
        onUIComponentChange={setActiveUIComponent}
      />

      {/* Selected UI Component */}
      <div className="mt-6 w-full">
        {activeUIComponent === "Colors" && <Colors />}
        {activeUIComponent === "Buttons" && <Buttons />}
        {activeUIComponent === "Gradients" && <Gradients />}
      </div>
    </div>
  ) : filteredTemplates.length === 0 ? (
    <Card className="mx-auto my-8 max-w-md border-muted/60 bg-muted/10 py-20 text-center">
      <CardContent className="space-y-3">
        <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />

        <h3 className="text-base font-medium">
          No templates found
        </h3>

        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          Try searching for a different keyword or change your category filter.
        </p>

        <Button
          type="button"
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          applyRoxFont={applyRoxFont}
          isLoading={
            isNavigating &&
            selectedTemplateId === template.id
          }
            isPremium={isPremium}

          onSelect={handleSelectTemplate}
        />
      ))}
    </div>
  )}
</section>


        <Footer />

      </main>

      {/* ========================================================
          Email Campaign Dialog
          ======================================================== */}

      <Dialog
        open={isModalOpen}
        onOpenChange={
          setIsModalOpen
        }
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

          <DialogHeader>

            <DialogTitle>
              {modalStep === 1
                ? "Add Contacts"
                : "Choose Email Template"}
            </DialogTitle>

            <DialogDescription>
              {modalStep === 1
                ? "Add your contacts in the format: name, email (one per line). You can also upload a CSV or Excel file."
                : "Select a template to start your email campaign."}
            </DialogDescription>

          </DialogHeader>

          {/* ====================================================
              Step 1
              ==================================================== */}

          {modalStep === 1 && (
            <div className="space-y-4 py-2">

              <div>

                <label
                  htmlFor="contacts"
                  className="text-sm font-medium"
                >
                  Contacts
                </label>

                <textarea
                  id="contacts"
                  rows={8}
                  value={contactsText}
                  onChange={(event) =>
                    setContactsText(
                      event.target.value
                    )
                  }
                  placeholder="John Doe, john@example.com"
                  className="mt-1 w-full resize-none rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

              </div>

              <div className="flex flex-wrap items-center gap-3">

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />

                  Bulk Upload (CSV / Excel)
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={
                    handleFileUpload
                  }
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={
                    downloadSampleCSV
                  }
                >
                  <Download className="mr-2 h-4 w-4" />

                  Download Sample CSV
                </Button>

              </div>

              <p className="text-xs text-muted-foreground">
                Supported formats: .csv, .xlsx, .xls. The file should contain columns named "Name" and "Email".
              </p>

            </div>
          )}

          {/* ====================================================
              Step 2
              ==================================================== */}

          {modalStep === 2 && (
            <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-3">

              {emailTemplates.map(
                (template) => {
                  const selected =
                    selectedEmailTemplate ===
                    template.id;

                  return (
                    <Card
                      key={
                        template.id
                      }
                      onClick={() =>
                        handleSelectEmailTemplate(
                          template.id
                        )
                      }
                      className={
                        selected
                          ? "cursor-pointer overflow-hidden border-2 border-primary ring-2 ring-primary/20"
                          : "cursor-pointer overflow-hidden border border-muted transition-colors hover:border-primary"
                      }
                    >

                      <div className="relative aspect-video overflow-hidden bg-muted/30">

                        <Image
                          src={
                            template.image
                          }
                          alt={
                            template.title
                          }
                          fill
                          className="object-cover"
                        />

                      </div>

                      <CardContent className="p-4">

                        <h4 className="font-medium">
                          {
                            template.title
                          }
                        </h4>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            template.description
                          }
                        </p>

                      </CardContent>

                    </Card>
                  );
                }
              )}

            </div>
          )}

          {/* ====================================================
              Footer
              ==================================================== */}

          <DialogFooter className="flex items-center justify-between gap-2">

            <Button
              type="button"
              variant="ghost"
              onClick={
                closeModal
              }
            >
              Cancel
            </Button>

            <div className="flex gap-2">

              {modalStep === 1 && (
                <Button
                  type="button"
                  onClick={
                    handleNextStep
                  }
                >
                  Next

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {modalStep === 2 && (
                <Button
                  type="button"
                  disabled={
                    !selectedEmailTemplate
                  }
                  onClick={
                    handleProceedWithTemplate
                  }
                >
                  Start Campaign
                </Button>
              )}

            </div>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* ========================================================
          Animation CSS
          ======================================================== */}

      <style jsx global>{`
        @keyframes blank-backdrop {
          0% {
            opacity: 0;
          }

          25% {
            opacity: 1;
          }

          100% {
            opacity: 1;
          }
        }

        @keyframes blank-portal {
          0% {
            width: 20px;
            height: 20px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }

          20% {
            opacity: 1;
          }

          50% {
            width: 180px;
            height: 180px;
            transform: translate(-50%, -50%) scale(1);
          }

          100% {
            width: 1800px;
            height: 1800px;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes blank-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.2)
              rotate(0deg);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          100% {
            transform: translate(-50%, -50%) scale(3)
              rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes blank-ring-two {
          0% {
            transform: translate(-50%, -50%) scale(0.1)
              rotate(0deg);
            opacity: 0;
          }

          25% {
            opacity: 0.6;
          }

          100% {
            transform: translate(-50%, -50%) scale(3.5)
              rotate(-180deg);
            opacity: 0;
          }
        }

        @keyframes blank-core {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }

          30% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }

          65% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }

          100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
        }

        @keyframes blank-spark {
          0% {
            transform: translate(-50%, -50%) scale(0)
              rotate(-90deg);
            opacity: 0;
          }

          25% {
            transform: translate(-50%, -50%) scale(1.3)
              rotate(0deg);
            opacity: 1;
          }

          65% {
            transform: translate(-50%, -50%) scale(1)
              rotate(90deg);
            opacity: 1;
          }

          100% {
            transform: translate(-50%, -50%) scale(0)
              rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes blank-button {
          0% {
            transform: scale(1);
          }

          20% {
            transform: scale(0.88);
          }

          40% {
            transform: scale(1.04);
          }

          100% {
            transform: scale(0.9);
          }
        }

        @keyframes blank-icon {
          0% {
            transform: scale(0) rotate(-90deg);
            opacity: 0;
          }

          30% {
            transform: scale(1.3) rotate(0deg);
            opacity: 1;
          }

          70% {
            transform: scale(1) rotate(90deg);
            opacity: 1;
          }

          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        .animate-blank-backdrop {
          animation: blank-backdrop 1000ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .animate-blank-portal {
          animation: blank-portal 1000ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .animate-blank-ring {
          animation: blank-ring 850ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .animate-blank-ring-two {
          animation: blank-ring-two 1000ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .animate-blank-core {
          animation: blank-core 800ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .animate-blank-spark {
          animation: blank-spark 750ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .animate-blank-button {
          animation: blank-button 1000ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .animate-blank-icon {
          animation: blank-icon 750ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-blank-backdrop,
          .animate-blank-portal,
          .animate-blank-ring,
          .animate-blank-ring-two,
          .animate-blank-core,
          .animate-blank-spark,
          .animate-blank-button,
          .animate-blank-icon {
            animation-duration: 1ms !important;
          }
        }
      `}</style>
    </div>
  );
}

// ================================================================
// Template Card
// ================================================================

function TemplateCard({
  template,
  applyRoxFont,
  isLoading,
  isPremium,
  onSelect,
}: {
  template: TemplateMeta;
  applyRoxFont: boolean;
    isPremium: boolean;
  isLoading: boolean;
  onSelect: (
    id: string
  ) => void;
}) {
  return (
    <Card
      onClick={() =>
        onSelect(template.id)
      }
      className="group flex cursor-pointer flex-col overflow-hidden border-muted/60 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >

      {/* Image */}

      <div className="relative aspect-[16/10] overflow-hidden border-b border-muted/40 bg-muted/30">

        <img
          src={template.localImage}
          alt={template.title}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay */}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">

          <Button
            type="button"
            size="sm"
            className="translate-y-2 transform rounded-full shadow-lg transition-transform duration-200 group-hover:translate-y-0"
          >
            Use Template

            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>

        </div>

      </div>

      {/* Content */}

      <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-5">

        <div>

          <div className="mb-1.5 flex items-center justify-between gap-2">

            <h3
              className={
                applyRoxFont
                  ? "rox text-base font-semibold transition-colors group-hover:text-primary"
                  : "text-base font-semibold transition-colors group-hover:text-primary"
              }
            >
              {
                template.title
              }
            </h3>

            <Badge
              variant="secondary"
              className="shrink-0 text-[10px]"
            >
              {
                template.mood
              }
            </Badge>

          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {
              template.description
            }
          </p>

        </div>

        {isLoading && (
          <div className="flex items-center gap-2 border-t border-muted/60 pt-2 text-xs font-medium text-primary">

            <Loader2 className="h-3.5 w-3.5 animate-spin" />

            <span>
              Loading editor…
            </span>

          </div>
        )}

      </CardContent>

    </Card>
  );
}

// ================================================================
// Footer
// ================================================================

function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-muted/40 py-8 text-center text-xs text-muted-foreground sm:flex-row">

      <p>
        © Workspace Templates. All layouts are fully customizable.
      </p>

      <a
        href="/blogs"
        className="text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        Blogs & tools
      </a>

    </footer>
  );
}