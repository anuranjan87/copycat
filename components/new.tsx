'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Persist input bar visibility in localStorage
  const [inputBarVisible, setInputBarVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("inputBarVisible")
      return stored !== null ? JSON.parse(stored) : true
    }
    return true
  })

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
    return dataString
      .replace(/const\s+data\s*=\s*{/, '')
      .replace(/};?\s*$/, '')
      .trim()
  }

  // --- Draft & Saved State ---
  const [draftData, setDraftData] = useState(extractDataFields(initialContent.data))
  const [draftHtml, setDraftHtml] = useState(initialContent.html)
  const [savedHtml, setSavedHtml] = useState(initialContent.html)
  const [savedData, setSavedData] = useState(extractDataFields(initialContent.data))

  // Load template if templateId is present (overrides initialContent)
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
          toast.info("Template loaded", {
            description: "Edit and click Publish to make it live.",
            position: "top-center",
          })
        } else {
          toast.error("Failed to load template", {
            description: result.error || "Template not found",
          })
        }
      } catch (error) {
        console.error("Template loading error:", error)
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

  // --- Scroll Preservation Logic ---
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  const isRestoringScroll = useRef(false)

  const toggleFullscreen = () => {
    if (!iframeRef.current) return
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(err => {
        console.error(`Fullscreen error: ${err.message}`)
        toast.error("Fullscreen failed", {
          description: "Please check browser permissions",
          position: "top-center",
        })
      })
    } else {
      document.exitFullscreen()
    }
  }

  const captureScrollPosition = () => {
    if (iframeRef.current?.contentWindow && !isRestoringScroll.current) {
      try {
        const { scrollX, scrollY } = iframeRef.current.contentWindow
        setScrollPosition({ x: scrollX, y: scrollY })
      } catch (error) {
        console.log("Could not capture scroll position:", error)
      }
    }
  }

  const restoreScrollPosition = () => {
    if (iframeRef.current?.contentWindow) {
      isRestoringScroll.current = true
      const attemptRestore = (attempt = 1) => {
        try {
          iframeRef.current?.contentWindow?.scrollTo(scrollPosition.x, scrollPosition.y)
          console.log(`Restored scroll (attempt ${attempt})`)
        } catch (error) {
          console.log("Scroll restore error:", error)
        }
        if (attempt < 3) {
          setTimeout(() => attemptRestore(attempt + 1), attempt * 100)
        } else {
          isRestoringScroll.current = false
        }
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
            requestAnimationFrame(() => {
              window.scrollTo(preservedScroll.x, preservedScroll.y);
            });
          };
          const observer = new MutationObserver(() => {
            setTimeout(restoreScroll, 20);
          });
          window.addEventListener('load', () => {
            observer.observe(document.body, { childList: true, subtree: true });
            restoreScroll();
          });
          window.addEventListener('scroll', () => {
            requestAnimationFrame(preserveScroll);
          });
        `
        doc.head.appendChild(script)
      } catch (error) {
        console.log("Scroll script injection failed:", error)
      }
    }
    restoreScrollPosition()
  }

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return

    const handleScroll = () => {
      if (!isRestoringScroll.current) captureScrollPosition()
    }

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
    } catch (error) {
      console.log("Scroll listener error:", error)
    }
  }, [finalCode])

  const handleSave = () => {
    captureScrollPosition()
    setSavedHtml(draftHtml)
    setSavedData(draftData)
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const result = await updateWebsiteContent(username, draftHtml, draftData, draftData)
      if (result.success) {
        toast.success("Published!", {
          description: "Your website is now live.",
          position: "top-center",
        })
        // Clear template mode (if any) by removing query param without reload
        router.replace(`/edit_new/${username}`)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to publish website" })
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" })
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
    <main className="bg-black text-white min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200/50 bg-white/80 py-2 px-35 backdrop-blur-lg shadow-lg tracking-[0.08em]" style={{ zoom: '0.57' }}>
        <div className="mx-auto flex max-w-9xl flex-col items-center justify-between px-6 md:flex-row">
          <div className="hidden items-center space-x-12 text-lg text-black md:flex">
            <div className='px-8'></div>
            <a href={`/dashboard/${username}`} className="transition hover:opacity-70">Dashboard</a>
            <a href={`/refunds/${username}`} className="transition hover:opacity-70">Refunds</a>
            <a href={`/templates/${username}`} className="transition hover:opacity-70">Templates</a>
            <a href="#" className="transition hover:opacity-70">Settings</a>
            <a href={`/pricing`} className="transition hover:opacity-70">Premium</a>
          </div>
          <button onClick={handlePublish} className="bg-red-600 text-white px-9 py-2.5 rounded-xl text-lg font-medium shadow-md hover:shadow-xl transition-all duration-300">
            {isPublishing ? (
              <Loader2 className="mr-2.5 h-6 w-6 animate-spin text-yellow-400" />
            ) : (
              <>Publish</>
            )}
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col gap-3 p-2 bg-white/10 backdrop-blur-md border border-orange-600/40 rounded-sm shadow-lg">
          <a href={`/${username}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/30 rounded transition text-center text-xl">🏠</a>
          <a href={`/assets`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/30 rounded transition text-center text-xl">✜</a>
          <button className="p-2 hover:bg-white/30 rounded transition text-center text-xl">↩️</button>
          <button className="p-2 hover:bg-white/30 rounded transition text-center text-xl">↪️</button>
          <button 
            onClick={toggleFullscreen} 
            className="p-2 hover:bg-white/30 rounded transition text-center text-xl"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {/* Hero Section with static background image */}
      <section
        className="relative min-h-screen px-6 lg:px-16 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://i.postimg.cc/qv63BdKX/Chat-GPT-Image-Apr-11-2026-08-15-57-PM.png')",
          backgroundColor: 'transparent',
        }}
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xs"></div>
        <div className="relative z-10 min-h-screen flex items-center">
          
          {/* Preview Container */}
          <div 
            className={`relative w-[60%] h-[100%] flex justify-center transition-transform duration-500 origin-center`}
            style={{
              transform: viewMode === 'mobile' ? 'scale(1.3)' : 'scale(1)'
            }}
          >
            <button
              onClick={() => setInputBarVisible(!inputBarVisible)}
              className="absolute -top-9 -right-1 z-20 bg-orange-600/50 hover:bg-red-700 text-white py-1 px-4 rounded-md shadow-lg transition-all duration-200 text-xs"
            >
              {inputBarVisible ? 'Hide Input' : 'Ask AI'}
            </button>

            {/* Preview Card */}
            <div
              className={`relative bg-black-700/60 overflow-hidden rounded-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xs shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.4)] p-5 ${
                viewMode === 'desktop' ? 'aspect-video w-full max-w-7xl' : 'w-[280px]'
              }`}
            >
              <div
                className={`overflow-hidden rounded-sm bg-white ${
                  viewMode === 'desktop' ? 'w-full h-full' : 'w-[240px] h-[390px]'
                }`}
              >
                <div
                  className="origin-top-left left-16"
                  style={{
                    transform: viewMode === 'mobile' ? 'scale(0.58)' : 'scale(0.42)',
                  }}
                >
                  <div
                    className="overflow-hidden"
                    style={{
                      width: viewMode === 'mobile' ? '435px' : '1580px',
                      height: viewMode === 'mobile' ? '812px' : '820px',
                    }}
                  >
                    <iframe
                      ref={iframeRef}
                      key={finalCode}
                      srcDoc={finalCode}
                      className="w-full h-full border-0"
                      title="Preview"
                      onLoad={handleIframeLoad}
                      allow="fullscreen"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="absolute -right-16 top-1/2 mt-4 -translate-y-1/2 w-[45.7%] h-[95%] bg-stone-700 shadow-2xl shadow-black/70 border border-black/40 flex flex-col z-20 custom-scrollbar">
            <div className="grid grid-cols-3 items-center px-7 py-5 mt-2 border-b border-dotted border-white-600/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-300"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-300"></div>
                <div className="w-2 h-2 rounded-full bg-green-300"></div>
              </div>

              <div className="justify-self-center">
                <div className="flex items-center gap-1 bg-white/10 rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${
                      viewMode === 'mobile' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    ▋
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
              </div>

              <div className="flex items-center justify-self-end gap-2">
                <span className="text-white/50 text-xs">Dev mode</span>
                <button onClick={() => setDevMode(!devMode)} className={`relative flex h-5 w-9 items-center rounded-sm transition-colors ${devMode ? 'bg-stone-500' : 'bg-gray-400'}`}>
                  <div className={`h-4 w-4 rounded-sm bg-white shadow transition-transform duration-300 ${devMode ? 'translate-x-full' : ''}`}/>
                </button>
              </div>
            </div>
          
            {devMode ? (
              <textarea 
                value={draftHtml} 
                onChange={(e) => setDraftHtml(e.target.value)} 
                className="flex-1 bg-transparent py-3 px-5 text-sm font-mono text-white/80 outline-none resize-none overflow-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent" 
                spellCheck="false"
              />
            ) : (
              <textarea 
                value={draftData} 
                onChange={(e) => setDraftData(e.target.value)} 
                className="flex-1 bg-transparent py-4 px-5 text-sm font-mono text-white/80 outline-none resize-none overflow-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent" 
                spellCheck="false" 
              />
            )}

            {/* SAVE BUTTON - appears only when there are unsaved changes */}
            {hasUnsavedChanges && (
              <button
                onClick={handleSave}
                className="absolute bottom-14 right-6 min-w-[100px] px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/30 hover:bg-white/20 text-white text-sm font-semibold rounded-full shadow-lg transition-all duration-300 z-30 flex items-center justify-center gap-2 hover:scale-105"
              >
                 Save
              </button>
            )}

            {inputBarVisible && (
              <div className="absolute bottom-0 w-[calc(100%-2rem)] px-5 z-30">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Ask AI to edit the content (requires save after generation)..."
                    className="rounded-none pr-12 pl-6 py-3 w-full text-white text-sm bg-black/20 border border-white/60 backdrop-blur-md shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_0_12px_rgba(0,0,0,0.4),0_6px_20px_rgba(0,0,0,0.25)] placeholder:text-white/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                  />
                  <button className="inline-flex items-center justify-center px-3 py-2 text-black text-xs font-medium rounded-md bg-white/80 border border-white/30 backdrop-blur-md shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.3)] hover:bg-white/40 transition-all duration-300 absolute right-2 top-1/2 -translate-y-1/2">
                    <SendIcon className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}