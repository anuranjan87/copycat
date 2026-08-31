"use client";

import { useState, useRef, useCallback, useDeferredValue, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Upload,
  Download,
  ArrowRight,
  Send,
  Users,
  Code,
  Eye,
  Sparkles,
  Loader2,
  XCircle,
  Fullscreen,
  Minimize,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Predefined Email Templates ──────────────────────────────────
const EMAIL_TEMPLATES = [
  {
    id: "newsletter",
    title: "Newsletter",
    description: "Clean, minimal design perfect for regular updates.",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Newsletter</title></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin:0; padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <tr><td style="padding:30px 20px; background:#1a73e8; color:#fff; text-align:center;">
      <h1 style="margin:0; font-size:24px;">Weekly Newsletter</h1>
    </td></tr>
    <tr><td style="padding:30px 20px; color:#333;">
      <h2 style="margin-top:0;">Hello Reader,</h2>
      <p style="line-height:1.6;">Here’s your weekly dose of updates and insights. We’ve curated the best stories, tools, and tips just for you.</p>
      <p style="line-height:1.6;">Stay tuned for more exciting content next week!</p>
    </td></tr>
    <tr><td style="padding:20px; background:#f8f8f8; text-align:center; color:#888; font-size:12px;">
      © 2025 Newsletter Co. | <a href="#" style="color:#1a73e8;">Unsubscribe</a>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "promotional",
    title: "Promotional",
    description: "Bold, attention‑grabbing layout for offers and launches.",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Promo</title></head>
<body style="font-family: Arial, sans-serif; background: #111; margin:0; padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#ffd700; border-radius:12px; overflow:hidden;">
    <tr><td style="padding:40px 20px; text-align:center; background:#222; color:#fff;">
      <h1 style="margin:0; font-size:32px; letter-spacing:1px;">🔥 BIG SALE</h1>
      <p style="font-size:18px; margin:10px 0 20px;">Up to 50% off – this weekend only!</p>
      <a href="#" style="display:inline-block; background:#ffd700; color:#222; padding:12px 30px; border-radius:30px; text-decoration:none; font-weight:bold;">Shop Now</a>
    </td></tr>
    <tr><td style="padding:30px 20px; background:#fff; color:#333;">
      <p style="line-height:1.6;">Don't miss out on our biggest sale of the year. Grab your favourites before they're gone.</p>
    </td></tr>
    <tr><td style="padding:20px; background:#eee; text-align:center; color:#666; font-size:12px;">
      © 2025 Brand | <a href="#" style="color:#222;">Unsubscribe</a>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "announcement",
    title: "Announcement",
    description: "Professional, trustworthy design for company news.",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Announcement</title></head>
<body style="font-family: Georgia, serif; background: #eaeaea; margin:0; padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#fff; border-radius:6px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
    <tr><td style="padding:30px 20px; border-bottom:3px solid #2c3e50;">
      <h1 style="margin:0; font-size:22px; color:#2c3e50;">Company Announcement</h1>
    </td></tr>
    <tr><td style="padding:30px 20px; color:#333; font-size:15px; line-height:1.7;">
      <p>Dear Team,</p>
      <p>We are pleased to announce the launch of our new product line. This marks a significant milestone in our journey.</p>
      <p>Thank you for your continued support.</p>
    </td></tr>
    <tr><td style="padding:20px; background:#f9f9f9; text-align:center; color:#777; font-size:12px;">
      © 2025 Company Inc. | <a href="#" style="color:#2c3e50;">Manage preferences</a>
    </td></tr>
  </table>
</body>
</html>`,
  },
];

// ─── Helper to parse contacts ────────────────────────────────────
const parseContacts = (text: string): { name: string; email: string }[] => {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [name, email] = line.split(",").map((s) => s.trim());
      return { name: name || "", email: email || "" };
    })
    .filter((c) => c.email.includes("@"));
};

export default function AIPage({ params }: { params: { username: string } }) {
  const { username } = params;
  const router = useRouter();

  // ─── State ──────────────────────────────────────────────────────
  const [code, setCode] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contactsText, setContactsText] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [inputBarVisible, setInputBarVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const deferredCode = useDeferredValue(code);

  // ─── Load contacts from sessionStorage ────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("emailCampaignContacts");
    if (stored) {
      setContactsText(stored);
    }
  }, []);

  // ─── Editor mount ──────────────────────────────────────────────
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Custom theme
    monaco.editor.defineTheme("trust-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "94a3b8" },
        { token: "tag", foreground: "60a5fa" },
        { token: "delimiter.html", foreground: "e2e8f0" },
        { token: "attribute.name", foreground: "f472b6" },
        { token: "attribute.value", foreground: "34d399" },
        { token: "string", foreground: "34d399" },
        { token: "text", foreground: "e2e8f0" },
      ],
      colors: {
        "editor.background": "#0f172a",
        "editor.foreground": "#e2e8f0",
        "editor.lineHighlightBackground": "#1e293b",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#94a3b8",
      },
    });
    monaco.editor.setTheme("trust-dark");
  };

  // ─── Apply edit ────────────────────────────────────────────────
  const applyEdit = useCallback((find: string, replace: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    const fullText = model.getValue();
    const index = fullText.indexOf(find);
    if (index === -1) {
      console.warn(`Could not find substring: "${find}"`);
      return;
    }
    const startPos = model.getPositionAt(index);
    const endPos = model.getPositionAt(index + find.length);
    editor.executeEdits("ai-edit", [
      {
        range: {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        },
        text: replace,
        forceMoveMarkers: true,
      },
    ]);
    setCode(model.getValue());
  }, []);

  // ─── Generate AI ──────────────────────────────────────────────
  const generateWebsite = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setError(null);
    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCode: code, prompt }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const patch = JSON.parse(trimmed);
            if (patch.find !== undefined && patch.replace !== undefined) {
              applyEdit(patch.find, patch.replace);
            }
          } catch (_) {}
        }
      }
      if (buffer.trim()) {
        try {
          const patch = JSON.parse(buffer.trim());
          if (patch.find !== undefined && patch.replace !== undefined) {
            applyEdit(patch.find, patch.replace);
          }
        } catch (_) {}
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message || "Unknown error");
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [code, prompt, applyEdit]);

  // ─── Save draft ────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setLastSaved(new Date());
    toast.success("Draft saved", { position: "top-center" });
  }, []);

  // ─── Send Emails ──────────────────────────────────────────────
  const handleSendEmails = async () => {
    const contacts = parseContacts(contactsText);
    if (contacts.length === 0) {
      alert("No valid contacts found. Please add contacts first.");
      return;
    }
    if (!code.trim()) {
      alert("Email content (HTML) is empty. Please load or write an email template.");
      return;
    }
    if (!subject.trim()) {
      alert("Please enter a subject line.");
      return;
    }

    setIsSending(true);
    setSendStatus(null);
    try {
      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contacts.map((c) => ({ name: c.name, email: c.email })),
          subject,
          html: code,
          username,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send emails");
      setSendStatus(`✅ Sent to ${data.sentCount} recipients`);
      toast.success(`Emails sent to ${data.sentCount} recipients!`, { position: "top-center" });
    } catch (err: any) {
      setSendStatus(`❌ Error: ${err.message}`);
      toast.error(err.message, { position: "top-center" });
    } finally {
      setIsSending(false);
    }
  };

  // ─── Fullscreen ────────────────────────────────────────────────
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // ─── Modal handlers ────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setModalStep(1);
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
    if (file.name.endsWith(".csv")) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadContactsCSV = () => {
    const lines = contactsText.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      alert("No contacts to download.");
      return;
    }
    let csv = "Name,Email\n";
    lines.forEach((line) => {
      const [name, email] = line.split(",").map((s) => s.trim());
      csv += `${name || ""},${email || ""}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNextStep = () => {
    const lines = contactsText.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      alert("Please add at least one contact (name, email).");
      return;
    }
    setModalStep(2);
  };

  const handleSelectEmailTemplate = (id: string) => setSelectedEmailTemplate(id);

  const handleProceedWithTemplate = () => {
    if (!selectedEmailTemplate) {
      alert("Please select a template.");
      return;
    }
    const template = EMAIL_TEMPLATES.find((t) => t.id === selectedEmailTemplate);
    if (template) {
      setCode(template.html);
      sessionStorage.setItem("emailCampaignContacts", contactsText);
    }
    closeModal();
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-campaign.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded", { position: "top-center" });
  };

  const contactCount = parseContacts(contactsText).length;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 overflow-hidden">
      {/* ─── Top Navigation ───────────────────────────────────── */}
      <nav className="flex-shrink-0 border-b border-slate-700/20 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img
              src="https://i.postimg.cc/4NQdKMq5/e54598bb-7c66-4f95-af44-fe2a2d3ba44a-removebg-preview.png"
              alt="7winks"
              className="h-8 w-8 object-contain"
            />
            <span className="text-sm font-medium hidden sm:inline">Email Builder</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {contactCount} contacts
            </div>
            {lastSaved && (
              <>
                <div className="h-4 w-px bg-slate-700/20" />
                <div className="flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Prompt Input - collapsible */}
          {inputBarVisible ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="Ask AI to tailor your email..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      generateWebsite();
                    }
                  }}
                  disabled={isGenerating}
                  className="w-full rounded-full bg-slate-800/30 border border-slate-700/30 text-sm text-slate-200 placeholder-slate-500 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={generateWebsite}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/40 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="size-3.5 text-blue-400 animate-spin" />
                  ) : (
                    <Send className="size-3.5 text-blue-400" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setInputBarVisible(false)}
                className="text-xs text-slate-500 hover:text-slate-300 transition hover:scale-110"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setInputBarVisible(true)}
              className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1 rounded-full transition hover:scale-105 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Ask AI
            </button>
          )}

          <button
            onClick={openModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Campaign</span>
          </button>

          <button
            onClick={handleSendEmails}
            disabled={isSending || !contactsText.trim() || !code.trim() || !subject.trim()}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{isSending ? "Sending..." : "Send"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md bg-slate-800/30 hover:bg-slate-700/30 transition text-slate-400 hover:text-white"
            title="Download HTML"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-slate-800/30 hover:bg-slate-700/30 transition text-slate-400 hover:text-white"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
          </button>

          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-transform hover:scale-110"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* ─── Main Layout ──────────────────────────────────────────── */}
      <div className="flex-1 flex gap-3 mt-3 py-1 min-h-0 overflow-hidden px-2 sm:px-4">
        {/* Left: Preview */}
        <div className="flex-[0.59] flex flex-col min-w-0 bg-slate-900/50 border border-slate-700/20 rounded-lg relative shadow-2xl shadow-black/20">
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-700/10 bg-slate-900/30 rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Preview</span>
              <span className="text-xs text-slate-600">|</span>
              <span className="text-xs text-slate-500">{code.length} chars</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-7 w-48 text-xs bg-slate-800/30 border-slate-700/30 rounded-full px-3 py-1 text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 p-4 relative">
            <div className="w-full max-w-4xl h-full">
              <iframe
                srcDoc={deferredCode}
                title="Preview"
                className="w-full h-full rounded-lg border border-slate-700/20 shadow-2xl"
                sandbox="allow-scripts allow-modals allow-same-origin"
                style={{ background: "white" }}
              />
            </div>
            <div className="absolute inset-0 pointer-events-none rounded-lg border border-blue-500/5 shadow-[inset_0_0_80px_rgba(59,130,246,0.03)]" />
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="flex-[0.4] flex flex-col min-w-0 bg-slate-900/50 border border-slate-700/20 rounded-lg relative shadow-2xl shadow-black/20">
          <div className="px-4 py-2 border-b border-slate-700/10 flex items-center justify-between bg-slate-900/30 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
              </div>
              <span className="text-xs text-slate-400 font-mono">HTML</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorMount}
              theme="trust-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                lineNumbers: "off",
                autoClosingBrackets: "never",
                autoClosingQuotes: "never",
                matchBrackets: "never",
                scrollBeyondLastLine: false,
                renderLineHighlight: "none",
                unicodeHighlight: {
                  ambiguousCharacters: false,
                  invisibleCharacters: false,
                  nonBasicASCII: false,
                },
                automaticLayout: true,
                glyphMargin: false,
                folding: false,
                find: {
                  addExtraSpaceOnTop: false,
                  autoFindInSelection: "never",
                  seedSearchStringFromSelection: "never",
                },
                readOnly: isGenerating,
                padding: { top: 8, bottom: 8 },
              }}
            />

            {isGenerating && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                <div className="flex flex-col items-center gap-3 max-w-[80%] text-center">
                  <img
                    src="https://i.postimg.cc/ydxdntYX/mat.gif"
                    alt="AI working"
                    className="w-40 opacity-90"
                  />
                  <p className="text-slate-300 text-xs font-light tracking-wide animate-pulse">
                    AI is refining your email...
                  </p>
                  <div className="w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 animate-[progress_2s_ease-in-out_infinite]" />
                  </div>
                  <style>{`
                    @keyframes progress {
                      0% { width: 10%; }
                      50% { width: 90%; }
                      100% { width: 10%; }
                    }
                  `}</style>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Footer Trust Bar ────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-700/20 bg-slate-900/30 px-6 py-1.5 flex items-center justify-between text-xs text-slate-500 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-400/70" />
            Secure connection
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Your data is encrypted</span>
          {sendStatus && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className={`${sendStatus.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                {sendStatus}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <a href="/legal/privacy" className="hover:text-slate-300 transition">Privacy</a>
          <a href="/legal/terms" className="hover:text-slate-300 transition">Terms</a>
          <a href="/legal/support" className="hover:text-slate-300 transition flex items-center gap-1">
            Support
          </a>
        </div>
      </div>

      {/* ─── Email Campaign Modal ────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {modalStep === 1 ? "Add Contacts" : "Choose Email Template"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {modalStep === 1
                ? "Add your contacts in the format: name, email (one per line). You can also upload a CSV or Excel file."
                : "Select a template to start your email campaign."}
            </DialogDescription>
          </DialogHeader>

          {modalStep === 1 && (
            <div className="space-y-4 py-2">
              <div>
                <label htmlFor="contacts" className="text-sm font-medium">
                  Contacts
                </label>
              <textarea
  placeholder={"John Doe, john@example.com"}
  value={contactsText}
  onChange={(e) => setContactsText(e.target.value)}
/>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-slate-600 text-slate-200 hover:bg-slate-700"
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
                  onClick={downloadContactsCSV}
                  className="text-slate-400 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Contacts CSV
                </Button>
              </div>

              <div className="text-xs text-slate-400">
                Supported formats: .csv, .xlsx, .xls. The file should contain columns named "Name" and "Email" (case-insensitive).
              </div>
            </div>
          )}

          {modalStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
              {EMAIL_TEMPLATES.map((tpl) => (
                <Card
                  key={tpl.id}
                  className={`cursor-pointer transition-all hover:border-purple-500 ${
                    selectedEmailTemplate === tpl.id
                      ? "border-2 border-purple-500 ring-2 ring-purple-500/30"
                      : "border-slate-700 bg-slate-800"
                  }`}
                  onClick={() => handleSelectEmailTemplate(tpl.id)}
                >
                  <div className="aspect-video bg-slate-700/30 relative overflow-hidden flex items-center justify-center">
                    <Mail className="w-12 h-12 text-slate-500" />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-white">{tpl.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{tpl.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter className="flex justify-between items-center gap-2">
            <Button variant="ghost" onClick={closeModal} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <div className="flex gap-2">
              {modalStep === 1 && (
                <Button onClick={handleNextStep} className="bg-purple-600 hover:bg-purple-700">
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              {modalStep === 2 && (
                <Button
                  onClick={handleProceedWithTemplate}
                  disabled={!selectedEmailTemplate}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
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