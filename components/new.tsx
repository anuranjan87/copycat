'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { SendIcon, Loader2 } from 'lucide-react'
import { updateWebsiteContent, generateCodeWithAI, getTemplateById } from "@/lib/website-actions"
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import dynamic from 'next/dynamic'

// Helper to strip markdown code fences
function cleanGeneratedCode(raw: string): string {
  let cleaned = raw
    .replace(/^```[\w]*\n?/, '')
    .replace(/```$/, '')
    .trim();

  // Remove wrapping object { ... }
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

// Dynamically import Monaco Editor (no SSR)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <Loader2 className="h-6 w-6 animate-spin text-white" />
    </div>
  ),
})

// Custom theme + disable error diagnostics
const handleEditorMount = (editor: any, monaco: any) => {
  // Disable semantic & syntax validation (red squiggles)
  if (monaco.languages?.typescript?.javascriptDefaults) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  }
  if (monaco.languages?.html?.htmlDefaults) {
    monaco.languages.html.htmlDefaults.setOptions({
      validate: false,
    });
  }

  // Define custom dark theme
  monaco.editor.defineTheme("custom-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "FF79C6", fontStyle: "" },
      { token: "tag", foreground: "FF79C6" },
      { token: "delimiter.html", foreground: "f2ecec" },
      { token: "attribute.name", foreground: "f2ecec" },
      { token: "attribute.value", foreground: "6fcaf2" },
      { token: "string", foreground: "f2ecec" },
      { token: "text", foreground: "6fcaf2" },
    ],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#F8F8F2",
      "editor.lineHighlightBackground": "#44475A",
      "editorLineNumber.foreground": "#6272A4",
      "editorLineNumber.activeForeground": "#F8F8F2",
    },
  });
  monaco.editor.setTheme("custom-dark");

  // Style container (no border, no radius)
  const container = editor.getContainerDomNode();
  container.style.borderRadius = "";
  container.style.overflow = "hidden";
  container.style.border = "";
}

export interface NewMobileProps {
  username: string
  initialContent: {
    html: string
    script: string
    data: string
  }
}

export default function New({ username, initialContent }: NewMobileProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [inputBarVisible, setInputBarVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("inputBarVisible")
      return stored !== null ? JSON.parse(stored) : true
    }
    return true
  })

  // AI state
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Fun jokes and interesting facts to show during AI loading
  const loadingMessages = [
    "The person who asks the questions is the one who is in control of the conversation. — Classic Sales Maxim",
    "You can't just ask customers what they want and then try to give that to them. By the time you get it built, they'll want something new  — Steve Jobs",
    "Give them quality. That is the best kind of advertising — Milton Hershey",
    "Fact: Professors use the red pen to mark our mistakes. Life uses the mistakes to mark our path",
    "Fact: The world's first website is still online at info.cern.ch (created in 1991)",
    "The ultimate revenge isn't a confrontation; it is building a reality so successful that the people who doubted you wouldn't even recognize the person you have become",
    "Write to one person, not a million — 'Classic Copywriting Maxim'",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem",
    "The first hard drive weighed over a ton and stored only 5MB of data",
    "People do not want to buy a quarter inch drill, they want a quarterinch hole — Theodore Levitt"
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Rotate message every 3 seconds while generating
  useEffect(() => {
    if (!isGenerating) return;
   const interval = setInterval(() => {
  setCurrentMessageIndex((prev) => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * loadingMessages.length);
    } while (newIndex === prev && loadingMessages.length > 1);
    return newIndex;
  });
}, 6000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Reset message index when generation starts
  useEffect(() => {
    if (isGenerating) {
      setCurrentMessageIndex(0);
    }
  }, [isGenerating]);

  const aiInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when input bar becomes visible
  useEffect(() => {
    if (inputBarVisible) {
      const timer = setTimeout(() => {
        aiInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [inputBarVisible])

  useEffect(() => {
    localStorage.setItem("inputBarVisible", JSON.stringify(inputBarVisible))
  }, [inputBarVisible])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const extractDataFields = (dataString: string) => {
    if (!dataString) return ''
    const match = dataString.match(/const\s+data\s*=\s*\{([\s\S]*)\}\s*;?\s*$/i)
    if (match) return match[1].trim()
    return dataString
  }

  const [draftData, setDraftData] = useState(extractDataFields(initialContent.data))
  const [draftHtml, setDraftHtml] = useState(initialContent.html)
  const [savedHtml, setSavedHtml] = useState(initialContent.html)
  const [savedData, setSavedData] = useState(extractDataFields(initialContent.data))

  useEffect(() => {
    if (!templateId) return
    async function loadTemplate() {
      try {
        const result = await getTemplateById(Number(templateId))
        if (result.success && result.html && result.data) {
          const extracted = extractDataFields(result.data)
          setDraftHtml(result.html)
          setDraftData(extracted)
          setSavedHtml(result.html)
          setSavedData(extracted)
          toast.info("Template loaded", { description: "Edit and click Publish to make it live.", position: "top-center" })
        } else {
          toast.error("Failed to load template", { description: result.error || "Template not found" })
        }
      } catch (error) {
        console.error(error)
        toast.error("Error loading template")
      } finally {
        setIsLoadingTemplate(false)
      }
    }
    loadTemplate()
  }, [templateId])

  const hasUnsavedChanges = draftHtml !== savedHtml || draftData !== savedData

  const finalCode = savedHtml.replace(
    '<script type="text/babel">',
    `<script>
const data = {
${savedData}
};
</script>
<script type="text/babel">`
  )

  const [devMode, setDevMode] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  const isRestoringScroll = useRef(false)

  const toggleFullscreen = () => {
    if (!iframeRef.current) return
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(err => {
        console.error(`Fullscreen error: ${err.message}`)
        toast.error("Fullscreen failed", { description: "Please check browser permissions", position: "top-center" })
      })
    } else {
      document.exitFullscreen()
    }
  }

  const captureScrollPosition = useCallback(() => {
    if (iframeRef.current?.contentWindow && !isRestoringScroll.current) {
      try {
        const { scrollX, scrollY } = iframeRef.current.contentWindow
        setScrollPosition({ x: scrollX, y: scrollY })
      } catch (error) { console.log("Could not capture scroll position:", error) }
    }
  }, [])

  const restoreScrollPosition = () => {
    if (iframeRef.current?.contentWindow) {
      isRestoringScroll.current = true
      const attemptRestore = (attempt = 1) => {
        try {
          iframeRef.current?.contentWindow?.scrollTo(scrollPosition.x, scrollPosition.y)
        } catch (error) { console.log("Scroll restore error:", error) }
        if (attempt < 3) setTimeout(() => attemptRestore(attempt + 1), attempt * 100)
        else isRestoringScroll.current = false
      }
      setTimeout(attemptRestore, 50)
    }
  }

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        const doc = iframeRef.current.contentWindow.document
        const script = doc.createElement("script")
        script.textContent = `
          let preservedScroll = { x: ${scrollPosition.x}, y: ${scrollPosition.y} };
          const preserveScroll = () => {
            preservedScroll = { x: window.scrollX, y: window.scrollY };
            window.parent.postMessage({ type: 'scrollUpdate', position: preservedScroll }, '*');
          };
          const restoreScroll = () => {
            requestAnimationFrame(() => { window.scrollTo(preservedScroll.x, preservedScroll.y); });
          };
          const observer = new MutationObserver(() => { setTimeout(restoreScroll, 20); });
          window.addEventListener('load', () => {
            observer.observe(document.body, { childList: true, subtree: true });
            restoreScroll();
          });
          window.addEventListener('scroll', () => { requestAnimationFrame(preserveScroll); });
        `
        doc.head.appendChild(script)
      } catch (error) { console.log("Scroll script injection failed:", error) }
    }
    restoreScrollPosition()
  }

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const handleScroll = () => { if (!isRestoringScroll.current) captureScrollPosition() }
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'scrollUpdate') setScrollPosition(event.data.position)
    }
    try {
      iframe.contentWindow.addEventListener('scroll', handleScroll)
      window.addEventListener('message', handleMessage)
      return () => {
        iframe.contentWindow?.removeEventListener('scroll', handleScroll)
        window.removeEventListener('message', handleMessage)
      }
    } catch (error) { console.log("Scroll listener error:", error) }
  }, [finalCode, captureScrollPosition])

  const handleSave = useCallback(() => {
    captureScrollPosition()
    setSavedHtml(draftHtml)
    setSavedData(draftData)
    toast.success("Changes saved", { description: "Your draft has been updated.", position: "top-center", duration: 2000 })
  }, [draftHtml, draftData, captureScrollPosition])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const result = await updateWebsiteContent(username, draftHtml, draftData, draftData)
      if (result.success) {
        toast.success("Published!", { description: "Your website is now live.", position: "top-center" })
        router.replace(`/edit_new/${username}`)
      } else {
        toast.error(result.error || "Failed to publish website")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsPublishing(false)
    }
  }

  // AI Generation Handler
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for AI assistance", { position: "top-center" })
      return
    }

    setIsGenerating(true)

    try {
      const currentCode = devMode ? draftHtml : draftData
      const result = await generateCodeWithAI(currentCode, aiPrompt)

      if (result.success && result.generatedCode) {
        const cleanedCode = cleanGeneratedCode(result.generatedCode)

        if (devMode) {
          setDraftHtml(cleanedCode)
          setSavedHtml(cleanedCode)
        } else {
          setDraftData(cleanedCode)
          setSavedData(cleanedCode)
        }

        setAiPrompt("")
        toast.success("Code updated with AI!", { description: "Your changes are ready.", position: "top-center" })
        aiInputRef.current?.focus()
      } else {
        toast.error(result.error || "AI generation failed", { position: "top-center" })
      }
    } catch (error) {
      console.error("AI generation error:", error)
      toast.error("An unexpected error occurred", { position: "top-center" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAIGenerate()
    }
  }

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mr-2" />
        <span>Loading template into editor...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.3) transparent;
        }
      `}</style>
      <nav className="flex-shrink-0 border-b border-slate-200/50 bg-white/80 py-1 px-[8rem] backdrop-blur-lg shadow-lg tracking-[0.08em]" style={{ zoom: '0.58' }}>
        <div className="mx-auto flex max-w-9xl items-center justify-between">
          <div className="hidden items-center space-x-12 text-lg text-black md:flex">
            <a href={`/dashboard/${username}`} className="transition hover:opacity-70">Dashboard</a>
            <a href={`/refunds/${username}`} className="transition hover:opacity-70">Refunds</a>
            <a href={`/templates/${username}`} className="transition hover:opacity-70">Templates</a>
            <a href="#" className="transition hover:opacity-70">Settings</a>
            <a href={`/pricing`} className="transition hover:opacity-70">Premium</a>
          </div>
          <div className="space-x-12">
            <a href={`/${username}`} target="_blank" rel="noopener noreferrer" className="text-xl border-black p-2 text-black transition hover:opacity-70">Live Site</a>
            <button onClick={handlePublish} className="bg-red-600 text-white px-7 py-2.5 rounded-md text-lg font-medium shadow-md hover:shadow-xl transition-all duration-300">
              {isPublishing ? <Loader2 className=" h-6 w-6 mr-4 animate-spin text-yellow-400" /> : <>Publish</>}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex gap-3 mt-3 py-1 min-h-0 overflow-hidden">
        {/* Preview Panel */}
        <div className="flex-[0.59] flex flex-col min-w-0 bg-[#030712] border-t border-gray-800 rounded-t-lg">
          <div className="px-4 py-2 flex items-center justify-between gap-3">

            {/* LEFT SIDE: toggle + fullscreen */}
            <div className="flex items-center gap-5">

              {/* DEVICE TOGGLE GROUP */}
              <div className="flex items-center bg-white/10 rounded-md p-0.5">

                {/* MOBILE */}
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 rounded transition ${
                    viewMode === 'mobile'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {/* Phone Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-4 h-4"
                  >
                    <rect x="7" y="2" width="10" height="20" rx="2" />
                    <circle cx="12" cy="18" r="1" />
                  </svg>
                </button>

                {/* DESKTOP */}
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 rounded transition ${
                    viewMode === 'desktop'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {/* Monitor Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-4 h-4"
                  >
                    <rect x="3" y="4" width="18" height="12" rx="2" />
                    <path d="M8 20h8M12 16v4" />
                  </svg>
                </button>
              </div>

              {/* FULLSCREEN BUTTON */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                {/* Fullscreen Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                </svg>
              </button>

            </div>

            {/* RIGHT SIDE: AI BAR (flex-grow 🔥) */}
            <div className="flex items-center  flex-1 justify-end">
              {inputBarVisible ? (
                <div className="flex items-center gap-2 w-full max-w-md">
                  
                  {/* EXPANDING INPUT */}
                  <div className="relative flex-1">
                    <input
                      ref={aiInputRef}
                      type="text"
                      placeholder="Ask AI to tailor the content..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={isGenerating}
                      className="w-full rounded-full pr-10 pl-4 py-2 text-white text-sm bg-black/40 border border-white/30 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                    />

                    <button
                      onClick={handleAIGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition"
                    >
                      {isGenerating ? (
                        <Loader2 className="size-3.5 text-white animate-spin" />
                      ) : (
                        <SendIcon className="size-3.5 text-white" />
                      )}
                    </button>
                  </div>

                  {/* INLINE HIDE */}
                  <button
                    onClick={() => setInputBarVisible(false)}
                    className="text-xs text-white/70 hover:text-white whitespace-nowrap"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setInputBarVisible(true)}
                  className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition"
                >
                  + Ask AI
                </button>
              )}
            </div>
          </div>

          {/* IFrame preview */}
          <div className="flex-1  overflow-auto  flex items-center justify-center bg-black/40 p-7">
            <div
              className={`transition-all duration-300 ${
                viewMode === 'desktop' ? 'w-full max-w-7xl' : 'w-[480px]'
              }`}
              style={{ zoom: 0.6 }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={finalCode}
                onLoad={handleIframeLoad}
                className="w-full h-full rounded-lg border-0 "
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
                style={{ aspectRatio: viewMode === 'desktop' ? '16/9' : '9/13', background: 'white' }}
              />
            </div>
          </div>
        </div>

        {/* Code Editor Panel with Monaco - with AI loading overlay */}
        <div className="flex-[0.4] flex flex-col min-w-0 bg-[#030712] border-t border-gray-800 rounded-t-lg relative">
          <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              </div>
              <span className="text-xs ml-1 text-gray-400 font-mono">{devMode ? 'RAW HTML' : 'DATA.JS'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/50 text-xs">Dev mode</span>
              <button onClick={() => setDevMode(!devMode)} className={`relative flex h-5 w-9 items-center rounded-sm transition-colors ${devMode ? 'bg-stone-500' : 'bg-gray-400'}`}>
                <div className={`h-4 w-4 rounded-sm bg-white shadow transition-transform duration-300 ${devMode ? 'translate-x-full' : ''}`}/>
              </button>
            </div>
          </div>

          {/* Relative container for overlay */}
          <div className="flex-1 min-h-0 relative">
            <MonacoEditor
              height="100%"
              language={devMode ? "html" : "javascript"}
              value={devMode ? draftHtml : draftData}
              onChange={(value) => {
                if (devMode) setDraftHtml(value || "");
                else setDraftData(value || "");
              }}
              theme="custom-dark"
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                lineNumbers: "off",
                autoClosingBrackets: "never",
                autoClosingQuotes: "never",
                matchBrackets: "never",
                renderIndentGuides: false,
                scrollBeyondLastLine: false,
                renderLineHighlight: "none",
                unicodeHighlight: {
                  ambiguousCharacters: false,
                  invisibleCharacters: false,
                  nonBasicASCII: false
                },
                automaticLayout: true,
                glyphMargin: false,
                folding: false,
                find: {
                  addExtraSpaceOnTop: false,
                  autoFindInSelection: 'never',
                  seedSearchStringFromSelection: 'never',
                },
                readOnly: isGenerating,
              } as any}
            />

            {/* AI Loading Overlay with Jokes/Facts */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                <div className="flex flex-col items-center gap-3 max-w-[80%] text-center">
                  <p className="text-white text-xs font-extralight tracking-[0.09rem] transition-opacity duration-300">
                    {loadingMessages[currentMessageIndex]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              className="absolute top-12 right-6 px-3 py-1 border-orange-500 backdrop-blur-lg bg-orange-600 rounded-full hover:bg-white/20 text-white text-xs font-semibold shadow-lg transition-all duration-300 z-30 flex items-center justify-center gap-2 hover:scale-105"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  )
}