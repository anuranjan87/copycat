'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  SendIcon,
  Loader2,
  Download,
  Pickaxe,
  XCircle,
  Drum,
  Fullscreen,
  Minimize,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Fingerprint,
  Save,
  Globe,
  Shield,
  Clock,
  HelpCircle,
  User,
  Settings,
} from 'lucide-react'
import { updateWebsiteContent, generateCodeWithAI, getTemplateById } from '@/lib/website-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { SignInModal } from '@/components/SignInModal'
import { CharacterForm } from '@/components/character-form'

// Helper to strip markdown code fences
function cleanGeneratedCode(raw: string): string {
  let cleaned = raw
    .replace(/^```[\w]*\n?/, '')
    .replace(/```$/, '')
    .trim()

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    cleaned = cleaned.slice(1, -1).trim()
  }
  return cleaned
}

// Dynamically import Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0f172a]">
      <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
    </div>
  ),
})

// Custom theme + disable error diagnostics
const handleEditorMount = (editor: any, monaco: any) => {
  if (monaco.languages?.typescript?.javascriptDefaults) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
  }
  if (monaco.languages?.html?.htmlDefaults) {
    monaco.languages.html.htmlDefaults.setOptions({
      validate: false,
    })
  }

  monaco.editor.defineTheme('trust-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '94a3b8', fontStyle: '' },
      { token: 'tag', foreground: '60a5fa' },
      { token: 'delimiter.html', foreground: 'e2e8f0' },
      { token: 'attribute.name', foreground: 'f472b6' },
      { token: 'attribute.value', foreground: '34d399' },
      { token: 'string', foreground: '34d399' },
      { token: 'text', foreground: 'e2e8f0' },
    ],
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1e293b',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#94a3b8',
    },
  })
  monaco.editor.setTheme('trust-dark')

  const container = editor.getContainerDomNode()
  container.style.borderRadius = ''
  container.style.overflow = 'hidden'
  container.style.border = ''
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('templateId')

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId)
  const [inputBarVisible, setInputBarVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('inputBarVisible')
      return stored !== null ? JSON.parse(stored) : true
    }
    return true
  })

  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)

  // Last saved timestamp
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastPublished, setLastPublished] = useState<Date | null>(null)

  const loadingMessages = [
    'The person who asks the questions is the one who is in control of the conversation. — Classic Sales Maxim',
    "You can't just ask customers what they want and then try to give that to them. By the time you get it built, they'll want something new  — Steve Jobs",
    'Give them quality. That is the best kind of advertising — Milton Hershey',
    "Fact: The world's first website is still online at info.cern.ch (created in 1991)",
    "The ultimate revenge isn't a confrontation; it is building a reality so successful that the people who doubted you wouldn't even recognize the person you have become",
    "Write to one person, not a million — 'Classic Copywriting Maxim'",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem",
    'The first hard drive weighed over a ton and stored only 5MB of data',
    'People do not want to buy a quarter inch drill, they want a quarterinch hole — Theodore Levitt',
  ]
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (!isGenerating) return
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        let newIndex
        do {
          newIndex = Math.floor(Math.random() * loadingMessages.length)
        } while (newIndex === prev && loadingMessages.length > 1)
        return newIndex
      })
    }, 6000)
    return () => clearInterval(interval)
  }, [isGenerating, loadingMessages.length])

  useEffect(() => {
    if (isGenerating) {
      setCurrentMessageIndex(0)
    }
  }, [isGenerating])

  const aiInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputBarVisible) {
      const timer = setTimeout(() => {
        aiInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [inputBarVisible])

  useEffect(() => {
    localStorage.setItem('inputBarVisible', JSON.stringify(inputBarVisible))
  }, [inputBarVisible])

  const extractDataFields = (dataString: string) => {
    if (!dataString) return ''
    const match = dataString.match(/const\s+data\s*=\s*\{([\s\S]*)\}\s*;?\s*$/i)
    if (match) return match[1].trim()
    return dataString
  }

  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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
          toast.info('Template loaded', {
            description: 'Ready to customise. Click Publish to make it live.',
            position: 'bottom-left',
          })
        } else {
          toast.error('Failed to load template', {
            description: result.error || 'Template not found',
          })
        }
      } catch (error) {
        console.error(error)
        toast.error('Error loading template')
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

  // Open draft preview tab
  const openDraftPreview = () => {
    const currentPreviewCode = draftHtml.replace(
      '<script type="text/babel">',
      `<script>
const data = {
${draftData}
};
</script>
<script type="text/babel">`
    )
    const key = `draft_preview_${Date.now()}`
    sessionStorage.setItem(key, currentPreviewCode)
    const draftUrl = `/draft/${username}?previewKey=${encodeURIComponent(key)}`
    window.open(draftUrl, '_blank')
  }

  const captureScrollPosition = useCallback(() => {
    if (iframeRef.current?.contentWindow && !isRestoringScroll.current) {
      try {
        const { scrollX, scrollY } = iframeRef.current.contentWindow
        setScrollPosition({ x: scrollX, y: scrollY })
      } catch (error) {
        console.log('Could not capture scroll position:', error)
      }
    }
  }, [])

  const restoreScrollPosition = () => {
    if (iframeRef.current?.contentWindow) {
      isRestoringScroll.current = true
      const attemptRestore = (attempt = 1) => {
        try {
          iframeRef.current?.contentWindow?.scrollTo(scrollPosition.x, scrollPosition.y)
        } catch (error) {
          console.log('Scroll restore error:', error)
        }
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
        const script = doc.createElement('script')
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
      } catch (error) {
        console.log('Scroll script injection failed:', error)
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
      console.log('Scroll listener error:', error)
    }
  }, [finalCode, captureScrollPosition])

  const handleDownload = () => {
    const fullHtml = savedHtml.replace(
      '<script type="text/babel">',
      `<script>
const data = {
${savedData}
};
</script>
<script type="text/babel">`
    )
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${username}-website.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Website exported!', {
      description: 'Your HTML file has been downloaded.',
      position: 'top-center',
    })
  }

  const handleSave = useCallback(() => {
    captureScrollPosition()
    setSavedHtml(draftHtml)
    setSavedData(draftData)
    setLastSaved(new Date())
    toast.success('Changes saved', {
      description: 'Your draft has been updated.',
      position: 'top-center',
      duration: 2000,
    })
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
    if (username === 'demo') {
      setShowSignInModal(true)
      return
    }

    // Confirm publish action to avoid accidental
    if (!confirm('Publishing will make your website public. Are you sure?')) return

    setIsPublishing(true)
    try {
      const result = await updateWebsiteContent(username, draftHtml, draftData, draftData)
      if (result.success) {
        setLastPublished(new Date())
        toast.success('Published!', {
          description: 'Your website is now live.',
          position: 'top-center',
        })
        router.replace(`/edit_new/${username}`)
      } else {
        toast.error(result.error || 'Failed to publish website')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI assistance', { position: 'top-center' })
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

        setAiPrompt('')
        toast.success('Code updated with AI!', {
          description: 'Your changes are ready.',
          position: 'top-center',
        })
        aiInputRef.current?.focus()
      } else {
        toast.error(result.error || 'AI generation failed', { position: 'top-center' })
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error('An unexpected error occurred', { position: 'top-center' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAIGenerate()
    }
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-2" />
        <span>Loading template into editor...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 overflow-hidden">
      <SignInModal open={showSignInModal} onClose={() => setShowSignInModal(false)} />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
        }
        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
          }
        }
        .glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .float {
          animation: float 3s ease-in-out infinite;
        }
        .save-indicator {
          transition: all 0.3s ease;
        }
        .save-indicator.saved {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgb(34, 197, 94);
          color: rgb(34, 197, 94);
        }
        .save-indicator.unsaved {
          background: rgba(251, 146, 60, 0.15);
          border-color: rgb(251, 146, 60);
          color: rgb(251, 146, 60);
        }
        .trust-border {
          border-color: rgba(148, 163, 184, 0.1);
        }
      `}</style>

      {/* Trust-focused Top Navigation */}
      <nav className="flex-shrink-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          {/* Brand / Logo */}
         

          {/* Trust indicators */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                  <img
                    src="https://i.postimg.cc/4NQdKMq5/e54598bb-7c66-4f95-af44-fe2a2d3ba44a-removebg-preview.png"
                    alt="Secure"
                    className="h-8 w-8 object-contain"
                  />
                </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {lastPublished ? (
                <span>Last published: {formatTime(lastPublished)}</span>
              ) : (
                <span>Not published yet</span>
              )}
            </div>
            {lastSaved && (
              <>
                <div className="h-4 w-px bg-slate-700" />
                <div className="flex items-center gap-1">
                  <Save className="h-3 w-3 text-slate-400" />
                  <span>Saved: {formatTime(lastSaved)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick links */}
          <a
            href={`/templates/${username}`}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            <Pickaxe className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </a>
          <a
            href={`/docs`}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            <Drum className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </a>
          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Live</span>
          </a>

          <div className="h-6 w-px bg-slate-700" />

          {/* Publish button */}
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70 flex items-center gap-2"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Publish
              </>
            )}
          </button>

          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-transform hover:scale-110"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex gap-3 mt-3 py-1 min-h-0 overflow-hidden px-2 sm:px-4">
        {/* Preview Panel */}
        <div className="flex-[0.59] flex flex-col min-w-0 bg-slate-900 border border-slate-800 rounded-lg relative shadow-2xl shadow-black/30">
          {/* Header with view controls */}
          <div className="px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-800/50 bg-slate-900/50 rounded-t-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-800/50 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded transition ${
                    viewMode === 'mobile'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
                  aria-label="Mobile view"
                >
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
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded transition ${
                    viewMode === 'desktop'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
                  aria-label="Desktop view"
                >
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

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700/30 transition"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={openDraftPreview}
                className="text-xs text-slate-400 hover:text-white hover:bg-slate-700/30 px-2 py-1 rounded transition flex items-center gap-1"
                title="Open full screen preview in new tab"
              >
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
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>

            <div className="flex items-center flex-1 justify-end">
              {inputBarVisible ? (
                <div className="flex items-center gap-2 w-full max-w-md">
                  <div className="relative flex-1 group">
                    <input
                      ref={aiInputRef}
                      type="text"
                      placeholder="Ask AI to tailor your content..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={isGenerating}
                      className="w-full rounded-full bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      onClick={handleAIGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/40 transition disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <Loader2 className="size-3.5 text-blue-400 animate-spin" />
                      ) : (
                        <SendIcon className="size-3.5 text-blue-400" />
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
            </div>
          </div>

          {/* Preview iframe area */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-black/60 p-6 relative">
            <div
              className={`transition-all duration-300 ${
                viewMode === 'desktop' ? 'w-full max-w-6xl' : 'w-[420px]'
              }`}
              style={{ zoom: 0.65 }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={finalCode}
                onLoad={handleIframeLoad}
                className="w-full h-full rounded-lg border border-slate-800 shadow-2xl"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
                style={{ aspectRatio: viewMode === 'desktop' ? '16/9' : '9/13', background: 'black' }}
              />
            </div>
            {/* Subtle glow */}
            <div className="absolute inset-0 pointer-events-none rounded-lg border border-blue-500/5 shadow-[inset_0_0_80px_rgba(59,130,246,0.05)]" />
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="flex-[0.4] flex flex-col min-w-0 bg-slate-900 border border-slate-800 rounded-lg relative shadow-2xl shadow-black/30">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {devMode ? 'HTML' : 'Data (JS)'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs">Dev mode</span>
              <button
                onClick={() => setDevMode(!devMode)}
                className={`relative flex h-5 w-9 items-center rounded-sm transition-colors ${
                  devMode ? 'bg-blue-500' : 'bg-slate-600'
                }`}
                aria-label="Toggle dev mode"
              >
                <div
                  className={`h-4 w-4 rounded-sm bg-white shadow transition-transform duration-300 ${
                    devMode ? 'translate-x-[18px]' : 'translate-x-1'
                  }`}
                />
              </button>
              <button
                onClick={handleDownload}
                title="Download HTML"
                className="group flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/30 text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-white active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative mt-2">
            <MonacoEditor
              height="100%"
              language={devMode ? 'html' : 'javascript'}
              value={devMode ? draftHtml : draftData}
              onChange={(value) => {
                if (devMode) setDraftHtml(value || '')
                else setDraftData(value || '')
              }}
              theme="trust-dark"
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                lineNumbers: 'off',
                autoClosingBrackets: 'never',
                autoClosingQuotes: 'never',
                matchBrackets: 'never',
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
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
                  autoFindInSelection: 'never',
                  seedSearchStringFromSelection: 'never',
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
                    {loadingMessages[currentMessageIndex]}
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

          {/* Save indicator - enhanced with trust messaging */}
          <div className="absolute bottom-4 right-4 z-30">
            {hasUnsavedChanges ? (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium backdrop-blur-sm hover:bg-orange-500/30 transition-all flex items-center gap-2 shadow-lg hover:scale-105"
              >
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>Save changes</span>
                <span className="text-[10px] opacity-70">⌘S</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer trust bar */}
      <div className="flex-shrink-0 border-t border-slate-800/50 bg-slate-900/50 px-6 py-1.5 flex items-center justify-between text-xs text-slate-500 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-400" />
            Secure connection
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Your data is encrypted</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/legal/privacy" className="hover:text-slate-300 transition">Privacy</a>
          <a href="/legal/terms" className="hover:text-slate-300 transition">Terms</a>
          <a href="/legal/support" className="hover:text-slate-300 transition flex items-center gap-1">
             Support
          </a>
          <a href="/legal/refund" className="hover:text-slate-300 transition flex items-center gap-1">
             Refund
          </a>
        </div>
      </div>
    </div>
  )
}