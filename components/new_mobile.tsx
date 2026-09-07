'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  SendIcon,
  Loader2,
  XCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Save,
  Pickaxe,
  Drum,
  Globe,
  Download,
  Fullscreen,
  Minimize,
  Settings,
  Menu,
} from 'lucide-react'
import { updateWebsiteContent, generateCodeWithAI, getTemplateById } from '@/lib/website-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Helper to strip markdown code fences
function cleanGeneratedCode(raw: string): string {
  let cleaned = raw
    .replace(/^```(?:javascript|js|typescript|ts)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  // AI sometimes returns an object wrapped in an extra pair of braces.
  // Keep complete `const data = {...};` declarations untouched.
  if (
    cleaned.startsWith('{') &&
    cleaned.endsWith('}') &&
    !/^(?:const|let|var)\s+data\s*=/.test(cleaned)
  ) {
    cleaned = cleaned.slice(1, -1).trim()
  }

  return cleaned
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
  const categoryFromUrl = searchParams.get('category')

  const categoryStorageKey = `workspace-selected-category-${username.toLowerCase()}`

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile')
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

  // Last saved timestamp
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastPublished, setLastPublished] = useState<Date | null>(null)

  // New state for source code toggle
  const [showSource, setShowSource] = useState(false)

  // State for hamburger menu
  const [menuOpen, setMenuOpen] = useState(false)

  // State for fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  // ------------------------------------------------------------
  // DATA.JS HELPERS
  // ------------------------------------------------------------
  const findDataDeclaration = (source: string) => {
    const declarationRegex = /(?:^|[\r\n])\s*(?:const|let|var)\s+data\s*=\s*\{/i
    const match = source.match(declarationRegex)

    if (!match || match.index === undefined) return null

    const declarationText = match[0]
    const braceOffset = declarationText.indexOf('{')
    const openingBrace = match.index + braceOffset

    if (braceOffset === -1 || openingBrace < 0) return null

    return {
      start: match.index,
      openingBrace,
    }
  }

  const findMatchingClosingBrace = (source: string, openingBrace: number) => {
    let depth = 0
    let quote: '"' | "'" | '`' | null = null
    let escaped = false
    let inLineComment = false
    let inBlockComment = false

    for (let i = openingBrace; i < source.length; i++) {
      const char = source[i]
      const next = source[i + 1]

      if (inLineComment) {
        if (char === '\n') inLineComment = false
        continue
      }

      if (inBlockComment) {
        if (char === '*' && next === '/') {
          inBlockComment = false
          i++
        }
        continue
      }

      if (quote) {
        if (escaped) {
          escaped = false
          continue
        }

        if (char === '\\') {
          escaped = true
          continue
        }

        if (char === quote) quote = null
        continue
      }

      if (char === '/' && next === '/') {
        inLineComment = true
        i++
        continue
      }

      if (char === '/' && next === '*') {
        inBlockComment = true
        i++
        continue
      }

      if (char === '"' || char === "'" || char === '`') {
        quote = char
        continue
      }

      if (char === '{') {
        depth++
        continue
      }

      if (char === '}') {
        depth--
        if (depth === 0) return i
      }
    }

    return -1
  }

  const extractDataFields = (dataString: string) => {
    if (!dataString) return ''

    const trimmed = dataString.trim()
    if (!trimmed) return ''

    const declaration = findDataDeclaration(trimmed)

    if (!declaration) {
      return trimmed
    }

    const closingBrace = findMatchingClosingBrace(
      trimmed,
      declaration.openingBrace
    )

    if (closingBrace === -1) return trimmed

    const prefix = trimmed.slice(0, declaration.start).trim()
    const body = trimmed
      .slice(declaration.openingBrace + 1, closingBrace)
      .trim()

    return [prefix, body].filter(Boolean).join('\n\n').trim()
  }

  const buildDataScript = (dataString: string) => {
    const trimmed = dataString.trim()

    if (!trimmed) return 'const data = {};'

    const declaration = findDataDeclaration(trimmed)

    if (declaration) {
      const closingBrace = findMatchingClosingBrace(
        trimmed,
        declaration.openingBrace
      )

      if (closingBrace !== -1) {
        return trimmed.slice(declaration.start).trim()
      }
    }

    return `const data = {\n${trimmed}\n};`
  }

  const injectDataIntoHtml = useCallback(
    (html: string, data: string) => {
      if (!html) {
        return html
      }

      const safeData =
        typeof data === 'string'
          ? data.trim()
          : ''

      let cleanHtml = html
        .replace(
          /<script>\s*(?:var|const|let)\s+data\s*=\s*\{[\s\S]*?\}\s*;?\s*<\/script>\s*/i,
          ''
        )
        .trim()

      const dataBlock = `
<script>
var data={
${safeData}
}
</script>
`

      const babelScriptMatch = cleanHtml.match(
        /<script\b[^>]*type=["']text\/babel["'][^>]*>/i
      )

      if (babelScriptMatch) {
        return cleanHtml.replace(
          babelScriptMatch[0],
          `${dataBlock}
${babelScriptMatch[0]}`
        )
      }

      if (cleanHtml.includes('</body>')) {
        return cleanHtml.replace(
          '</body>',
          `${dataBlock}
</body>`
        )
      }

      return `${dataBlock}
${cleanHtml}`
    },
    []
  )

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

  const finalCode = injectDataIntoHtml(savedHtml, savedData)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  const isRestoringScroll = useRef(false)

  // Open draft preview tab
  const openDraftPreview = () => {
    const currentPreviewCode = injectDataIntoHtml(
      draftHtml,
      draftData
    )

    const key = `draft_preview_${Date.now()}`
    sessionStorage.setItem(key, currentPreviewCode)

    const draftUrl =
      `/draft/${username}?previewKey=${encodeURIComponent(key)}`

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
    const fullHtml = injectDataIntoHtml(
      draftHtml,
      draftData
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
    const message =
      username.toLowerCase() === "demo"
        ? "You need to onboard first. We'll send you to the signup page. Continue?"
        : "Publishing will make your website public. Are you sure?"

    if (!confirm(message)) return

    setIsPublishing(true)
    try {
      const result = await updateWebsiteContent(username, draftHtml, draftData, draftData)
      if (result.success) {
        setLastPublished(new Date())
        toast.success('Published!', {
          description: 'Your website is now live.',
          position: 'top-center',
        })
        const nextParams = new URLSearchParams()

        if (templateId) {
          nextParams.set('templateId', templateId)
        }

        if (categoryFromUrl) {
          nextParams.set('category', categoryFromUrl)
        }

        const query = nextParams.toString()
        router.replace(`/edit_new/${username}${query ? `?${query}` : ''}`)
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
      const currentCode = draftData
      const result = await generateCodeWithAI(currentCode, aiPrompt)

      if (result.success && result.generatedCode) {
        const cleanedCode = cleanGeneratedCode(result.generatedCode)
        setDraftData(cleanedCode)
        setSavedData(cleanedCode)
        setAiPrompt('')
        toast.success('Content updated with AI!', {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const handleCloseEditor = () => {
    let category = categoryFromUrl

    try {
      if (!category) {
        category = localStorage.getItem(categoryStorageKey)
      }

      if (category) {
        localStorage.setItem(categoryStorageKey, category)
      }
    } catch (error) {
      console.error('Failed to restore selected category:', error)
    }

    const templatesUrl = category
      ? `/templates/${username}?category=${encodeURIComponent(category)}`
      : `/templates/${username}`

    router.push(templatesUrl)
  }

  // Fullscreen toggle
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

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-2" />
        <span>Loading template into editor...</span>
      </div>
    )
  }

  // Generate the full HTML for source view
  const sourceCode = injectDataIntoHtml(draftHtml, draftData)

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 overflow-hidden">

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
          border-color: rgba(148, 163, 184, 0.08);
        }
      `}</style>

      {/* Top Navigation with Hamburger */}
      <nav className="flex-shrink-0 border-b border-slate-700/20 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-2 flex items-center justify-between z-30">
        {/* Left side: Publish button */}
        <div className="flex items-center gap-4">
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
        </div>

        {/* Right side: Info + close + hamburger */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <img
                src="https://i.postimg.cc/4NQdKMq5/e54598bb-7c66-4f95-af44-fe2a2d3ba44a-removebg-preview.png"
                alt="Secure"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="h-4 w-px bg-slate-700/20" />
            <div className="flex items-center gap-1">
              {lastPublished ? (
                <span>Last published: {formatTime(lastPublished)}</span>
              ) : (
                <span>Not published yet</span>
              )}
            </div>
            {lastSaved && (
              <>
                <div className="h-4 w-px bg-slate-700/20" />
                <div className="flex items-center gap-1">
                  <Save className="h-3 w-3 text-slate-400" />
                  <span>Saved: {formatTime(lastSaved)}</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleCloseEditor}
            className="text-slate-400 hover:text-white transition-transform hover:scale-110"
          >
            <XCircle className="h-5 w-5" />
          </button>

          {/* Hamburger Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-400 hover:text-white transition-transform hover:scale-110 p-1"
              aria-label="More options"
            >
              <Menu className="h-5 w-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700/30 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    <MenuItem
                      icon={<Pickaxe className="h-4 w-4" />}
                      label="Templates"
                      onClick={() => {
                        router.push(
                          categoryFromUrl
                            ? `/templates/${username}?category=${encodeURIComponent(categoryFromUrl)}`
                            : `/templates/${username}`
                        )
                        setMenuOpen(false)
                      }}
                    />
                    <MenuItem
                      icon={<Drum className="h-4 w-4" />}
                      label="Tutorial"
                      onClick={() => {
                        router.push('/tutorial')
                        setMenuOpen(false)
                      }}
                    />
                    <MenuItem
                      icon={<Globe className="h-4 w-4" />}
                      label="Live site"
                      onClick={() => {
                        window.open(`/${username}`, '_blank')
                        setMenuOpen(false)
                      }}
                    />
                    <MenuItem
                      icon={<Download className="h-4 w-4" />}
                      label="Download HTML"
                      onClick={() => {
                        handleDownload()
                        setMenuOpen(false)
                      }}
                    />
                    <MenuItem
                      icon={isFullscreen ? <Minimize className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
                      label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                      onClick={() => {
                        toggleFullscreen()
                        setMenuOpen(false)
                      }}
                    />
                    {/* View mode toggle */}
                    <div className="border-t border-slate-700/20 my-1" />
                    <div className="px-4 py-2 text-xs text-slate-400">View Mode</div>
                    <div className="flex px-4 pb-2 gap-2">
                      <button
                        onClick={() => {
                          setViewMode('mobile')
                          setMenuOpen(false)
                        }}
                        className={`px-2 py-1 rounded text-xs ${viewMode === 'mobile' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-700/20'}`}
                      >
                        Mobile
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('desktop')
                          setMenuOpen(false)
                        }}
                        className={`px-2 py-1 rounded text-xs ${viewMode === 'desktop' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-700/20'}`}
                      >
                        Desktop
                      </button>
                    </div>
                    <div className="border-t border-slate-700/20 my-1" />
                    <MenuItem
                      icon={<Settings className="h-4 w-4" />}
                      label="Open draft preview in new tab"
                      onClick={() => {
                        openDraftPreview()
                        setMenuOpen(false)
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main area: preview or source code */}
      <div className="flex-1 flex flex-col min-h-0 p-2 sm:p-4">
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50 border border-slate-700/20 rounded-lg relative shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header with toggle button */}
          <div className="px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-700/10 bg-slate-900/30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSource(!showSource)}
                className="text-xs text-slate-400 hover:text-white hover:bg-slate-700/20 px-2 py-1 rounded transition flex items-center gap-1"
                title={showSource ? 'Switch to preview' : 'Switch to source code'}
              >
                {showSource ? (
                  <>
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
                    <span className="hidden sm:inline">Preview</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="hidden sm:inline">Source code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center flex-1 justify-end relative">
              {!inputBarVisible && (
                <button
                  onClick={() => setInputBarVisible(true)}
                  className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1 rounded-full transition hover:scale-105 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Ask AI
                </button>
              )}
            </div>
          </div>

          {/* Content area: iframe preview or source code viewer */}
          {!showSource ? (
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 p-6 relative">
              <div
                className={`transition-all duration-300 ${viewMode === 'desktop' ? 'w-full max-w-6xl' : 'w-[420px]'}`}
                style={{ zoom: 0.65 }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={finalCode}
                  onLoad={handleIframeLoad}
                  className="w-full h-full rounded-lg border border-slate-700/20 shadow-2xl"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{ aspectRatio: viewMode === 'desktop' ? '16/9' : '9/13', background: 'black' }}
                />
              </div>
              <div className="absolute inset-0 pointer-events-none rounded-lg border border-blue-500/5 shadow-[inset_0_0_80px_rgba(59,130,246,0.03)]" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-black/40 p-4">
              <pre className="text-xs text-slate-300 custom-scrollbar whitespace-pre-wrap break-words">
                {sourceCode}
              </pre>
            </div>
          )}

          {/* Save indicator */}
          <div className="absolute bottom-4 right-4 z-30">
            {hasUnsavedChanges ? (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium backdrop-blur-sm hover:bg-orange-500/20 transition-all flex items-center gap-2 shadow-lg hover:scale-105"
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

      {/* Sticky AI Input Bar at Bottom */}
      {inputBarVisible && (
        <div className="flex-shrink-0 border-t border-slate-700/20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-8 py-3 z-20">
          <div className="flex items-center gap-2 w-full max-w-4xl mx-auto">
            <div className="relative flex-1 group">
              <input
                ref={aiInputRef}
                type="text"
                placeholder="Ask AI to tailor your content..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isGenerating}
                className="w-full rounded-full bg-slate-800/50 border border-slate-700/30 text-sm text-slate-200 placeholder-slate-500 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 shadow-lg"
              />

              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/40 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 text-blue-400 animate-spin" />
                ) : (
                  <SendIcon className="size-4 text-blue-400" />
                )}
              </button>
            </div>

            <button
              onClick={() => setInputBarVisible(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition hover:scale-110 p-1.5"
              aria-label="Hide AI input"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// Helper component for menu items
function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/20 hover:text-white transition"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}