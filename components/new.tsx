'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { SendIcon, Loader2 } from 'lucide-react'
import { updateWebsiteContent, generateCodeWithAI, generateCodeWithAIBlank, getTemplateById } from "@/lib/website-actions"
import { useRouter } from "next/navigation";
import { toast } from "sonner"

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

  // 🔥 Ref for the AI input field
  const aiInputRef = useRef<HTMLInputElement>(null)

  // 🔥 Auto-focus when the input bar becomes visible (including initial load)
  useEffect(() => {
    if (inputBarVisible) {
      // Small delay to ensure DOM is fully rendered
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
      <nav className="flex-shrink-0  border-b border-slate-200/50 bg-white/80 py-2 px-12 backdrop-blur-lg shadow-lg tracking-[0.08em]" style={{ zoom: '0.57' }}>
        <div className="mx-auto flex max-w-9xl items-center justify-between">
          <div className="hidden items-center space-x-12  text-lg text-black md:flex">
            <a href={`/dashboard/${username}`} className="transition hover:opacity-70">Dashboard</a>
            <a href={`/refunds/${username}`} className="transition hover:opacity-70">Refunds</a>
            <a href={`/templates/${username}`} className="transition hover:opacity-70">Templates</a>
            <a href="#" className="transition hover:opacity-70">Settings</a>
            <a href={`/pricing`} className="transition hover:opacity-70">Premium</a>
          </div>
          <div className="space-x-12">
                        <a href={`/${username}`} target="_blank"
        rel="noopener noreferrer" className="text-xl border-black p-2 text-black transition hover:opacity-70">Live Site</a>

          <button onClick={handlePublish} className="bg-red-600 text-white px-9 py-2.5 rounded-xl text-lg font-medium shadow-md hover:shadow-xl transition-all duration-300">
            {isPublishing ? <Loader2 className="mr-2.5 h-6 w-6 animate-spin text-yellow-400" /> : <>Publish</>}
          </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex gap-3 p-4 min-h-0 overflow-hidden">
        {/* PREVIEW COLUMN */}
        <div className="flex-[0.6] flex flex-col min-w-0 bg-[#030712] border-t border-gray-800 rounded-t-lg">
          <div className="px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/10 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    viewMode === 'mobile' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  📱
                </button>
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    viewMode === 'desktop' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  💻
                </button>
              </div>
              <button onClick={toggleFullscreen} className="text-stone-400 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center bg-black/40 p-2">
            <div
              className={`transition-all duration-300 ${
                viewMode === 'desktop' ? 'w-full max-w-7xl' : 'w-[280px]'
              }`}
              style={{ zoom: 0.6 }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={finalCode}
                onLoad={handleIframeLoad}
                className="w-full h-full rounded-lg border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
                style={{ aspectRatio: viewMode === 'desktop' ? '16/9' : '9/16', background: 'white' }}
              />
            </div>
          </div>
        </div>

        {/* CODE EDITOR COLUMN */}
        <div className="flex-[0.4] flex flex-col min-w-0 bg-[#030712] border-t border-gray-800 rounded-t-lg relative">
          <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              </div>
              <span className="text-xs text-gray-400 font-mono">{devMode ? 'RAW HTML' : 'DATA.JS'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs">Dev mode</span>
              <button onClick={() => setDevMode(!devMode)} className={`relative flex h-5 w-9 items-center rounded-sm transition-colors ${devMode ? 'bg-stone-500' : 'bg-gray-400'}`}>
                <div className={`h-4 w-4 rounded-sm bg-white shadow transition-transform duration-300 ${devMode ? 'translate-x-full' : ''}`}/>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {devMode ? (
              <textarea
                value={draftHtml}
                onChange={(e) => setDraftHtml(e.target.value)}
                className="w-full h-full bg-transparent p-4 text-sm font-mono text-white/80 outline-none resize-none overflow-auto scrollbar-thin"
                spellCheck="false"
              />
            ) : (
              <textarea
                value={draftData}
                onChange={(e) => setDraftData(e.target.value)}
                className="w-full h-full bg-transparent p-4 text-sm font-mono text-white/80 outline-none resize-none overflow-auto scrollbar-thin"
                spellCheck="false"
              />
            )}
          </div>

          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              className="absolute top-12 right-6  px-3 py-1 border-orange-500 backdrop-blur-lg bg-orange-600 rounded-full  hover:bg-white/20 text-white text-xs font-semibold shadow-lg transition-all duration-300 z-30 flex items-center justify-center gap-2 hover:scale-105"
            >
              Save
            </button>
          )}

          {/* AI INPUT BAR */}
          {inputBarVisible && (
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <div className="relative w-full">
                <input
                  ref={aiInputRef}  // 🔥 Attach ref for auto-focus
                  type="text"
                  placeholder="Ask AI to edit the content..."
                  className="w-full rounded-full pr-12 pl-6 py-3 text-white text-sm bg-black/40 border border-white/30 backdrop-blur-md placeholder:text-white/60 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition">
                  <SendIcon className="size-4 text-white" />
                </button>
              </div>
              <button
                onClick={() => setInputBarVisible(false)}
                className="absolute -top-7 right-0 text-xs text-white/70 hover:text-white"
              >
                ✕ Hide
              </button>
            </div>
          )}
          {!inputBarVisible && (
            <button
              onClick={() => setInputBarVisible(true)}
              className="absolute bottom-4 right-4 text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/20"
            >
              + Ask AI
            </button>
          )}
        </div>
      </div>
    </div>
  )
}