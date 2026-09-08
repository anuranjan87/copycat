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
  Save,
  Globe,
  Shield,
  Clock,
} from 'lucide-react'
import { updateWebsiteContent, generateCodeWithAI, getTemplateById } from '@/lib/website-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { CodeEditor } from '@/components/code-editor'
import PremiumRequiredModal from "@/components/ui_components/PremiumRequiredModal"

// Helper to strip markdown code fences
function cleanGeneratedCode(raw: string): string {
  let cleaned = raw
    .replace(/^```(?:javascript|js|typescript|ts)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  if (
    cleaned.startsWith('{') &&
    cleaned.endsWith('}') &&
    !/^(?:const|let|var)\s+data\s*=/.test(cleaned)
  ) {
    cleaned = cleaned.slice(1, -1).trim()
  }

  return cleaned
}

/**
 * Free AI usage is stored server-side in Upstash Redis.
 */
const DAILY_AI_LIMIT = 2

type AIUsageResponse = {
  premium: boolean
  usage: number
  limit: number
}

async function getDailyAIUsage(): Promise<AIUsageResponse> {
  const response = await fetch('/api/ai/usage', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch AI usage')
  }

  const data = await response.json()

  return {
    premium: Boolean(data.premium),
    usage: Number.isFinite(Number(data.usage))
      ? Math.max(0, Math.floor(Number(data.usage)))
      : 0,
    limit: Number.isFinite(Number(data.limit))
      ? Math.max(0, Math.floor(Number(data.limit)))
      : DAILY_AI_LIMIT,
  }
}

async function reserveDailyAIUsage(): Promise<AIUsageResponse> {
  const response = await fetch('/api/ai/usage', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({ action: 'reserve' }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || 'Failed to update AI usage')
    ;(error as Error & { code?: string }).code = data?.code
    throw error
  }

  return {
    premium: Boolean(data.premium),
    usage: Number.isFinite(Number(data.usage))
      ? Math.max(0, Math.floor(Number(data.usage)))
      : 0,
    limit: Number.isFinite(Number(data.limit))
      ? Math.max(0, Math.floor(Number(data.limit)))
      : DAILY_AI_LIMIT,
  }
}

async function releaseDailyAIUsage(): Promise<void> {
  try {
    const response = await fetch('/api/ai/usage', {
      method: 'DELETE',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
    if (!response.ok) {
      console.error('Failed to release AI usage reservation')
    }
  } catch (error) {
    console.error('Failed to release AI usage reservation:', error)
  }
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
  onToggleAdvanced?: () => void // Added this prop
}

// ------------------------------------------------------------
// DataForm component – displays all fields as editable inputs
// ------------------------------------------------------------
function DataForm({
  dataString,
  onUpdate,
}: {
  dataString: string
  onUpdate: (newString: string) => void
}) {
  const [localData, setLocalData] = useState<Record<string, any>>({})
  const [parseError, setParseError] = useState<string | null>(null)

  // Parse the raw data string into an object
  const parseData = useCallback((str: string): Record<string, any> | null => {
    if (!str.trim()) return {}
    try {
      // Wrap with {} and evaluate as JavaScript object literal
      const parsed = new Function(`return ({ ${str} })`)()
      return parsed
    } catch {
      return null
    }
  }, [])

  // Update local state when the raw string changes externally
  useEffect(() => {
    const parsed = parseData(dataString)
    if (parsed !== null) {
      setLocalData(parsed)
      setParseError(null)
    } else {
      setParseError('Invalid data format – please use valid JavaScript object syntax.')
    }
  }, [dataString, parseData])

  // Convert an object back to a string (without outer braces)
  const stringifyData = (obj: Record<string, any>): string => {
    // Use JSON.stringify to get a valid string, then remove outer braces and trim
    const json = JSON.stringify(obj, null, 2)
    // Remove the outer { and } and the trailing newline
    let inner = json.slice(1, -1).trim()
    // If it's empty, return empty string
    if (inner === '') return ''
    // Remove quotes from keys? Not necessary, but we keep them to be safe.
    // The data script can handle quoted keys.
    return inner
  }

  const handleInputChange = (key: string, value: string) => {
    // Try to preserve the type: number, boolean, null, etc.
    let parsedValue: any = value
    if (value === 'true') parsedValue = true
    else if (value === 'false') parsedValue = false
    else if (value === 'null') parsedValue = null
    else if (value === 'undefined') parsedValue = undefined
    else if (!isNaN(Number(value)) && value.trim() !== '') {
      parsedValue = Number(value)
    }
    // else keep as string

    const updated = { ...localData, [key]: parsedValue }
    setLocalData(updated)

    // Convert back to string and call parent updater
    const newString = stringifyData(updated)
    onUpdate(newString)
  }

  if (parseError) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm p-4">
        <AlertCircle className="w-5 h-5 mr-2" />
        {parseError}
      </div>
    )
  }

  const keys = Object.keys(localData)
  if (keys.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm p-4">
        No data fields found. Add keys in the raw editor.
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 custom-scrollbar">
      <div className="space-y-3">
        {keys.map((key) => {
          const value = localData[key]
          const displayValue = value === undefined ? '' : String(value)
          return (
            <div key={key} className="flex items-center gap-3">
              <label
                htmlFor={`field-${key}`}
                className="w-28 text-sm text-slate-300 truncate font-mono"
              >
                {key}
              </label>
              <input
                id={`field-${key}`}
                type="text"
                value={displayValue}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="flex-1 bg-slate-800/60 border border-slate-700/30 rounded px-3 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-400 focus:border-transparent transition"
                placeholder={typeof value === 'number' ? 'number' : 'value'}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EditorContent_new({ username, initialContent, onToggleAdvanced }: NewMobileProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('templateId')
  const categoryFromUrl = searchParams.get('category')

  const categoryStorageKey = `workspace-selected-category-${username.toLowerCase()}`

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
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)

  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastPublished, setLastPublished] = useState<Date | null>(null)

  // New state for form view toggle
  const [useFormView, setUseFormView] = useState(false)
  

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
  // Premium & AI usage state
  // ------------------------------------------------------------
  const [premiumStatus, setPremiumStatus] = useState<{
    premium: boolean
    usage: number
    limit: number
  } | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchPremiumStatus() {
      try {
        setIsLoadingStatus(true)
        const data = await getDailyAIUsage()
        if (!cancelled) {
          setPremiumStatus({
            premium: data.premium,
            usage: data.premium ? 0 : data.usage,
            limit: data.limit || DAILY_AI_LIMIT,
          })
        }
      } catch (error) {
        console.error('Usage fetch error:', error)
        if (!cancelled) {
          setPremiumStatus({
            premium: false,
            usage: DAILY_AI_LIMIT,
            limit: DAILY_AI_LIMIT,
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStatus(false)
        }
      }
    }
    fetchPremiumStatus()
    return () => {
      cancelled = true
    }
  }, [])

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
      if (!html) return html
      const safeData = typeof data === 'string' ? data.trim() : ''
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
            position: 'top-left',
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

  const [devMode, setDevMode] = useState(false)
  const [showEditLayoutMessage, setShowEditLayoutMessage] = useState(false)
  const [isLayoutEditor, setIsLayoutEditor] = useState(false)

  useEffect(() => {
    if (!devMode) {
      setShowEditLayoutMessage(false)
      setInputBarVisible(true)
      return
    }
    setInputBarVisible(false)
    setShowEditLayoutMessage(true)
    const timer = setTimeout(() => {
      setShowEditLayoutMessage(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [devMode])

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  const isRestoringScroll = useRef(false)

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

  // ------------------------------------------------------------
  // AI Generation
  // ------------------------------------------------------------
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI assistance', {
        position: 'top-center',
      })
      return
    }

    let currentStatus: AIUsageResponse
    try {
      currentStatus = await getDailyAIUsage()
    } catch (error) {
      console.error('Failed to check AI usage:', error)
      toast.error('Unable to verify AI usage. Please try again.', {
        position: 'top-center',
      })
      return
    }

    if (!currentStatus.premium && currentStatus.usage >= currentStatus.limit) {
      setPremiumStatus({
        premium: false,
        usage: currentStatus.usage,
        limit: currentStatus.limit,
      })
      setIsPremiumModalOpen(true)
      return
    }

    setPremiumStatus({
      premium: currentStatus.premium,
      usage: currentStatus.premium ? 0 : currentStatus.usage,
      limit: currentStatus.limit || DAILY_AI_LIMIT,
    })

    let usageReserved = false
    if (!currentStatus.premium) {
      try {
        const reservation = await reserveDailyAIUsage()
        usageReserved = true
        setPremiumStatus({
          premium: reservation.premium,
          usage: reservation.usage,
          limit: reservation.limit || DAILY_AI_LIMIT,
        })
      } catch (error) {
        const usageError = error as Error & { code?: string }
        console.error('Failed to reserve AI usage:', usageError)
        if (usageError.code === 'LIMIT_REACHED') {
          setPremiumStatus({
            premium: false,
            usage: DAILY_AI_LIMIT,
            limit: DAILY_AI_LIMIT,
          })
          setIsPremiumModalOpen(true)
          return
        }
        toast.error('Unable to start AI generation. Please try again.', {
          position: 'top-center',
        })
        return
      }
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
        usageReserved = false
        toast.success('Code updated with AI!', {
          description: 'Your changes are ready.',
          position: 'top-center',
        })
        aiInputRef.current?.focus()
      } else {
        if (usageReserved) {
          await releaseDailyAIUsage()
          usageReserved = false
          try {
            const refreshed = await getDailyAIUsage()
            setPremiumStatus({
              premium: refreshed.premium,
              usage: refreshed.premium ? 0 : refreshed.usage,
              limit: refreshed.limit || DAILY_AI_LIMIT,
            })
          } catch (refreshError) {
            console.error('Failed to refresh AI usage:', refreshError)
          }
        }
        toast.error(result.error || 'AI generation failed', {
          position: 'top-center',
        })
      }
    } catch (error) {
      console.error('AI generation error:', error)
      if (usageReserved) {
        await releaseDailyAIUsage()
        usageReserved = false
      }
      toast.error('An unexpected error occurred', {
        position: 'top-center',
      })
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

  // MODIFIED: handleCloseEditor now calls onToggleAdvanced if available
  const handleCloseEditor = () => {
    // If we have the callback, toggle the parent's advanced mode and return early
    if (onToggleAdvanced) {
      onToggleAdvanced()
      return
    }

    // Original fallback logic (if callback not provided)
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

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-2" />
        <span>Loading template into editor...</span>
      </div>
    )
  }

  if (isLayoutEditor) {
    return (
      <div className="flex h-screen bg-[#030712] relative">
        <main className="flex-1">
          <CodeEditor
            username={username}
            initialContent={{
              html: draftHtml,
              script: '',
              data: draftData,
            }}
            disableTemplateLoad={true}
          />
        </main>
      </div>
    )
  }

  const isAILimitReached =
    !!premiumStatus &&
    !premiumStatus.premium &&
    premiumStatus.usage >= DAILY_AI_LIMIT

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
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(-4px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          85% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-4px);
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

      {/* Top Navigation */}
      <nav className="flex-shrink-0 border-b border-slate-700/20 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
             <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-slate-300">
                          Customize your website
                        </span>
                      </div>
            <div className="h-4 w-px bg-slate-700/20" />
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
                <div className="h-4 w-px bg-slate-700/20" />
                <div className="flex items-center gap-1">
                  <Save className="h-3 w-3 text-slate-400" />
                  <span>Saved: {formatTime(lastSaved)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={
              categoryFromUrl
                ? `/templates/${username}?category=${encodeURIComponent(categoryFromUrl)}`
                : `/templates/${username}`
            }
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            <Pickaxe className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </a>
          <a
            href={`/tutorial`}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            <Drum className="h-4 w-4" />
            <span className="hidden sm:inline">Tutorial</span>
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

          <div className="h-6 w-px bg-slate-700/20" />

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
            onClick={handleCloseEditor}
            className="text-slate-400 hover:text-white transition-transform hover:scale-110"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex gap-3 mt-3 py-1 min-h-0 overflow-hidden px-2 sm:px-4">
        {/* Preview Panel */}
        <div className="flex-[0.59] flex flex-col min-w-0 bg-slate-900/50 border border-slate-700/20 rounded-lg relative shadow-2xl shadow-black/20">
          <div className="px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-700/10 bg-slate-900/30 rounded-t-lg">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-700/20 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-slate-800/70 p-0.5">
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    viewMode === 'mobile'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Mobile
                </button>
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    viewMode === 'desktop'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Desktop
                </button>
              </div>

              <button
                onClick={toggleFullscreen}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Fullscreen className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={openDraftPreview}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <Globe className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>

          </div>

            <div className="flex items-center flex-1 justify-end relative">
              {devMode ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsLayoutEditor(true)
                    }}
                    className="relative flex items-center gap-2 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 hover:text-white px-3 py-1.5 text-sm transition-all duration-200"
                    title="Exit Dev Mode and edit the layout with AI"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Edit Layout</span>
                  </button>

                  {showEditLayoutMessage && (
                    <div
                      className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg bg-slate-800 border border-slate-700/60 px-3 py-2.5 text-xs text-slate-200 shadow-xl"
                      style={{
                        animation: 'fadeInOut 3s ease-in-out forwards',
                      }}
                    >
                      Open the layout editor to edit with AI or manually
                    </div>
                  )}
                </div>
              ) : inputBarVisible ? (
                <div className="flex items-center gap-2 w-full max-w-md">
                  <div className="relative flex-1 group">
                    <input
                      ref={aiInputRef}
                      type="text"
                      placeholder="Ask AI to tailor your content..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={handleKeyPress}
                      readOnly={!!isAILimitReached || isGenerating}
                      onClick={() => {
                        if (isAILimitReached) setIsPremiumModalOpen(true)
                      }}
                      className="w-full rounded-full bg-slate-800/30 border border-slate-700/30 text-sm text-slate-200 placeholder-slate-500 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200"
                    />

                    <button
                      onClick={() => {
                        if (isAILimitReached) {
                          setIsPremiumModalOpen(true)
                        } else {
                          handleAIGenerate()
                        }
                      }}
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

                  {!isLoadingStatus && premiumStatus && !premiumStatus.premium && (
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {Math.max(
                        DAILY_AI_LIMIT - premiumStatus.usage,
                        0
                      )} remaining
                    </span>
                  )}

                  <button
                    onClick={() => setInputBarVisible(false)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition hover:scale-110"
                    aria-label="Hide AI input"
                  >
                    ✕
                  </button>
                </div>
              ) : (
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

          {/* Preview iframe area */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 p-6 relative">
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
                className="w-full h-full rounded-lg border border-slate-700/20 shadow-2xl"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
                style={{ aspectRatio: viewMode === 'desktop' ? '16/9' : '9/13', background: 'black' }}
              />
            </div>
            <div className="absolute inset-0 pointer-events-none rounded-lg border border-blue-500/5 shadow-[inset_0_0_80px_rgba(59,130,246,0.03)]" />
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="flex-[0.4] flex flex-col min-w-0 bg-slate-900/50 border border-slate-700/20 rounded-lg relative shadow-2xl shadow-black/20">
          <div className="px-4 py-2 border-b border-slate-700/10 flex items-center justify-between bg-slate-900/30 rounded-t-lg">
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
              {/* New Toggle Button */}
             

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
                className="group flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/20 bg-slate-800/20 text-slate-400 transition-all duration-200 hover:bg-slate-700/30 hover:text-white active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative mt-2">
            {useFormView && !devMode ? (
              // Show the form for data editing (only when not in dev mode)
              <DataForm
                dataString={draftData}
                onUpdate={(newData) => {
                  setDraftData(newData)
                  // Auto-save? We keep unsaved state via hasUnsavedChanges
                }}
              />
            ) : (
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
            )}

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

      {/* Footer trust bar */}
      <div className="flex-shrink-0 border-t border-slate-700/20 bg-slate-900/30 px-6 py-1.5 flex items-center justify-between text-xs text-slate-500 backdrop-blur-sm">
        <div className="flex items-center gap-4">
        
          <span className="hidden sm:inline">•</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/legal/privacy" className="hover:text-slate-300 transition">Privacy</a>
          <a href="/legal/terms" className="hover:text-slate-300 transition">Terms</a>
          <a href="/legal/support" className="hover:text-slate-300 transition flex items-center gap-1">
             Support
          </a>
          <a href="/legal/refund" className="hover:text-slate-300 transition flex items-center gap-1">
             Refunds
          </a>
        </div>
      </div>

      <PremiumRequiredModal
        open={isPremiumModalOpen}
        onOpenChange={setIsPremiumModalOpen}
        feature="Unlimited generation"
        subheading="5 daily AI content generations"
      />
    </div>
  )
}