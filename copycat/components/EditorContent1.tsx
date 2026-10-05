'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { CodeEditor } from '@/components/code-editor'
import  EditorContent_new  from '@/components/EditorContent'


import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Fullscreen,
  Globe,
  Loader2,
  Minimize,
  Pickaxe,
  Save,
  SendIcon,
  Shield,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  generateCodeWithAI,
  getTemplateById,
  saveWebsiteDraft,
  updateWebsiteContent,
} from '@/lib/website-actions'
import PremiumRequiredModal from '@/components/ui_components/PremiumRequiredModal'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0f172a]">
      <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
    </div>
  ),
})

const DAILY_AI_LIMIT = 2

type AIUsageResponse = {
  premium: boolean
  usage: number
  limit: number
}

type Content = {
  html: string
  script: string
  data: string
}

type DataField = {
  path: string
  key: string
  label: string
  value: string
  type: 'text' | 'textarea' | 'url'
  groupPath?: string
  groupLabel?: string
  itemIndex?: number
}

type ParsedValue = {
  start: number
  end: number
  value: string
  quote: '"' | "'" | '`'
}

function cleanGeneratedCode(raw: string): string {
  let cleaned = (raw || '')
    .replace(/^```(?:javascript|js|typescript|ts|json)?\s*/i, '')
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

async function getDailyAIUsage(): Promise<AIUsageResponse> {
  const response = await fetch('/api/ai/usage', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })

  if (!response.ok) throw new Error('Failed to fetch AI usage')

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
    const error = new Error(data?.error || 'Failed to update AI usage') as Error & {
      code?: string
    }
    error.code = data?.code
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
      headers: { 'Cache-Control': 'no-cache' },
    })

    if (!response.ok) {
      console.error('Failed to release AI usage reservation')
    }
  } catch (error) {
    console.error('Failed to release AI usage reservation:', error)
  }
}

function handleEditorMount(editor: any, monaco: any) {
  monaco.languages?.typescript?.javascriptDefaults?.setDiagnosticsOptions?.({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })

  monaco.languages?.html?.htmlDefaults?.setOptions?.({
    validate: false,
  })

  monaco.editor.defineTheme('trust-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '94a3b8' },
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
  editor.getContainerDomNode().style.overflow = 'hidden'
}

function findDataDeclaration(source: string) {
  const match = source.match(
    /(?:^|[\r\n])\s*(?:const|let|var)\s+data\s*=\s*\{/i,
  )

  if (!match || match.index === undefined) return null

  const declarationText = match[0]
  const braceOffset = declarationText.indexOf('{')
  if (braceOffset === -1) return null

  return {
    start: match.index,
    openingBrace: match.index + braceOffset,
  }
}

function findMatchingClosingBrace(source: string, openingBrace: number) {
  let depth = 0
  let quote: '"' | "'" | '`' | null = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let i = openingBrace; i < source.length; i++) {
    const char = source[i]
    const next = source[i + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
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
      lineComment = true
      i++
      continue
    }

    if (char === '/' && next === '*') {
      blockComment = true
      i++
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (char === '{') {
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0) return i
    }
  }

  return -1
}

function extractDataFields(dataString: string): string {
  const trimmed = (dataString || '').trim()
  if (!trimmed) return ''

  const declaration = findDataDeclaration(trimmed)
  if (!declaration) return trimmed

  const closingBrace = findMatchingClosingBrace(
    trimmed,
    declaration.openingBrace,
  )

  if (closingBrace === -1) return trimmed

  const prefix = trimmed.slice(0, declaration.start).trim()
  const body = trimmed
    .slice(declaration.openingBrace + 1, closingBrace)
    .trim()

  return [prefix, body].filter(Boolean).join('\n\n').trim()
}

function buildDataScript(dataString: string) {
  const trimmed = (dataString || '').trim()

  // Always expose the data object on window so the generated HTML
  // works with `const data = {...}`, `let data = {...}`, or
  // `var data = {...}`.
  //
  // `const data` / `let data` are NOT properties of window, so
  // code that reads `window.data` cannot see them directly.
  // Normalizing the generated declaration to `window.data = {...}`
  // makes all three input forms behave consistently in the iframe.
  if (!trimmed) return 'window.data = {};'

  const declaration = findDataDeclaration(trimmed)

  if (declaration) {
    const closingBrace = findMatchingClosingBrace(
      trimmed,
      declaration.openingBrace,
    )

    if (closingBrace !== -1) {
      const objectText = trimmed.slice(
        declaration.openingBrace,
        closingBrace + 1,
      )

      return `window.data = ${objectText};`
    }
  }

  return `window.data = {\n${trimmed}\n};`
}

function injectDataIntoHtml(html: string, data: string) {
  if (!html) return html

  const cleanHtml = html
    .replace(
      /<script>\s*(?:var|const|let)\s+data\s*=\s*\{[\s\S]*?\}\s*;?\s*<\/script>\s*/i,
      '',
    )
    .trim()

  const dataBlock = `
<script>
${buildDataScript(data)}
</script>
`

  const babelScript = cleanHtml.match(
    /<script\b[^>]*type=["']text\/babel["'][^>]*>/i,
  )

  if (babelScript) {
    return cleanHtml.replace(babelScript[0], `${dataBlock}\n${babelScript[0]}`)
  }

  if (cleanHtml.includes('</body>')) {
    return cleanHtml.replace('</body>', `${dataBlock}\n</body>`)
  }

  return `${dataBlock}\n${cleanHtml}`
}

function skipWhitespaceAndComments(source: string, start: number) {
  let i = start

  while (i < source.length) {
    while (/\s/.test(source[i] || '')) i++

    if (source[i] === '/' && source[i + 1] === '/') {
      i += 2
      while (i < source.length && source[i] !== '\n') i++
      continue
    }

    if (source[i] === '/' && source[i + 1] === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++
      i += 2
      continue
    }

    break
  }

  return i
}

function readStringLiteral(source: string, start: number): ParsedValue | null {
  const quote = source[start] as '"' | "'" | '`'
  if (quote !== '"' && quote !== "'" && quote !== '`') return null

  let i = start + 1
  let escaped = false
  let raw = ''

  while (i < source.length) {
    const char = source[i]

    if (escaped) {
      raw += char
      escaped = false
      i++
      continue
    }

    if (char === '\\') {
      raw += char
      escaped = true
      i++
      continue
    }

    if (char === quote) {
      return {
        start,
        end: i + 1,
        value: decodeJsString(raw, quote),
        quote,
      }
    }

    raw += char
    i++
  }

  return null
}

function decodeJsString(raw: string, quote: '"' | "'" | '`') {
  if (quote === '`') return raw

  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\(["'\\])/g, '$1')
}

function readIdentifier(source: string, start: number) {
  const match = source.slice(start).match(/^[A-Za-z_$][\w$]*/)
  if (!match) return null
  return { value: match[0], end: start + match[0].length }
}

function readObjectKey(source: string, start: number) {
  const i = skipWhitespaceAndComments(source, start)

  if (source[i] === '"' || source[i] === "'") {
    const parsed = readStringLiteral(source, i)
    if (!parsed) return null
    return { value: parsed.value, end: parsed.end }
  }

  return readIdentifier(source, i)
}

function skipBalancedValue(source: string, start: number, open: string, close: string) {
  let depth = 0
  let quote: '"' | "'" | '`' | null = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let i = start; i < source.length; i++) {
    const char = source[i]
    const next = source[i + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
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
      lineComment = true
      i++
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      i++
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }
    if (char === open) depth++
    if (char === close) {
      depth--
      if (depth === 0) return i + 1
    }
  }

  return source.length
}

function parseStringFieldsFromSource(source: string) {
  const fields: Array<DataField & { valueStart: number; valueEnd: number; quote: '"' | "'" | '`' }> = []

  const addField = (
    path: string,
    key: string,
    value: ParsedValue,
    groupPath?: string,
    groupLabel?: string,
    itemIndex?: number,
  ) => {
    const label = key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

    const type =
      /image|logo|url|link|href|src|photo/i.test(key) ||
      /^https?:\/\//i.test(value.value)
        ? 'url'
        : value.value.length > 90
          ? 'textarea'
          : 'text'

    fields.push({
      path,
      key,
      label,
      value: value.value,
      type,
      groupPath,
      groupLabel,
      itemIndex,
      valueStart: value.start,
      valueEnd: value.end,
      quote: value.quote,
    })
  }

  const parseValue = (
    index: number,
    path: string,
    key: string,
    groupPath?: string,
    groupLabel?: string,
    itemIndex?: number,
  ): number => {
    const i = skipWhitespaceAndComments(source, index)
    const char = source[i]

    if (char === '"' || char === "'" || char === '`') {
      const value = readStringLiteral(source, i)
      if (value) {
        addField(path, key, value, groupPath, groupLabel, itemIndex)
        return value.end
      }
      return source.length
    }

    if (char === '{') {
      return parseObject(i, path, groupPath, groupLabel, itemIndex)
    }

    if (char === '[') {
      return parseArray(i, path, groupPath, groupLabel, itemIndex)
    }

    let cursor = i
    let quote: '"' | "'" | '`' | null = null
    let escaped = false
    let paren = 0
    let bracket = 0
    let brace = 0

    while (cursor < source.length) {
      const current = source[cursor]
      const next = source[cursor + 1]

      if (quote) {
        if (escaped) escaped = false
        else if (current === '\\') escaped = true
        else if (current === quote) quote = null
        cursor++
        continue
      }

      if (current === '"' || current === "'" || current === '`') {
        quote = current
        cursor++
        continue
      }
      if (current === '/' && next === '/') {
        while (cursor < source.length && source[cursor] !== '\n') cursor++
        continue
      }
      if (current === '/' && next === '*') {
        cursor += 2
        while (cursor < source.length && !(source[cursor] === '*' && source[cursor + 1] === '/')) cursor++
        cursor += 2
        continue
      }

      if (current === '(') paren++
      if (current === ')') paren--
      if (current === '[') bracket++
      if (current === ']') bracket--
      if (current === '{') brace++
      if (current === '}') brace--

      if (paren === 0 && bracket === 0 && brace === 0 && (current === ',' || current === '}')) {
        return cursor
      }
      cursor++
    }

    return cursor
  }

  const parseObject = (
    opening: number,
    objectPath: string,
    parentGroupPath?: string,
    parentGroupLabel?: string,
    parentItemIndex?: number,
  ): number => {
    let cursor = opening + 1

    while (cursor < source.length) {
      cursor = skipWhitespaceAndComments(source, cursor)
      if (source[cursor] === '}') return cursor + 1
      if (source[cursor] === ',') {
        cursor++
        continue
      }

      const keyResult = readObjectKey(source, cursor)
      if (!keyResult) {
        cursor++
        continue
      }

      const key = keyResult.value
      cursor = skipWhitespaceAndComments(source, keyResult.end)

      if (source[cursor] !== ':') {
        cursor++
        continue
      }

      cursor = parseValue(
        cursor + 1,
        objectPath ? `${objectPath}.${key}` : key,
        key,
        parentGroupPath,
        parentGroupLabel,
        parentItemIndex,
      )

      cursor = skipWhitespaceAndComments(source, cursor)
      if (source[cursor] === ',') cursor++
    }

    return source.length
  }

  const parseArray = (
    opening: number,
    arrayPath: string,
    parentGroupPath?: string,
    parentGroupLabel?: string,
    parentItemIndex?: number,
  ): number => {
    let cursor = opening + 1
    let index = 0

    while (cursor < source.length) {
      cursor = skipWhitespaceAndComments(source, cursor)
      if (source[cursor] === ']') return cursor + 1
      if (source[cursor] === ',') {
        cursor++
        index++
        continue
      }

      const itemPath = `${arrayPath}[${index}]`
      const itemGroupPath = arrayPath
      const itemGroupLabel = formatFieldLabel(arrayPath.split('.').pop() || arrayPath)

      cursor = parseValue(
        cursor,
        itemPath,
        String(index + 1),
        itemGroupPath,
        itemGroupLabel,
        index,
      )

      cursor = skipWhitespaceAndComments(source, cursor)
      if (source[cursor] === ',') {
        cursor++
        index++
      } else if (source[cursor] !== ']') {
        cursor++
      }
    }

    return source.length
  }

  const trimmedStart = skipWhitespaceAndComments(source, 0)
  if (source[trimmedStart] === '{') {
    parseObject(trimmedStart, '')
  } else {
    parseObject(-1, '')
  }

  return fields
}

function formatFieldLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseTopLevelFields(data: string): DataField[] {
  const source = extractDataFields(data)
  if (!source.trim()) return []

  return parseStringFieldsFromSource(source)
}

function encodeJsString(value: string, quote: '"' | "'" | '`') {
  if (quote === '`') {
    return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
  }

  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(new RegExp(`\\${quote}`, 'g'), `\\${quote}`)
}

function updateSimpleField(data: string, path: string, value: string) {
  const source = extractDataFields(data)
  const fields = parseStringFieldsFromSource(source)
  const target = fields.find((field) => field.path === path)

  if (!target) return data

  const replacement = `${target.quote}${encodeJsString(value, target.quote)}${target.quote}`
  return source.slice(0, target.valueStart) + replacement + source.slice(target.valueEnd)
}

export interface NewMobileProps {
  username: string
  initialContent: Content
}

export default function EditorContent({
  username,
  initialContent,
}: NewMobileProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('templateId')
  const categoryFromUrl = searchParams.get('category')
  const categoryStorageKey = `workspace-selected-category-${username.toLowerCase()}`

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'data'>('html')
  const [aiPrompt, setAiPrompt] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastPublished, setLastPublished] = useState<Date | null>(null)

  const [draftHtml, setDraftHtml] = useState(initialContent.html)
  const [draftData, setDraftData] = useState(
    extractDataFields(initialContent.data),
  )
  const [savedHtml, setSavedHtml] = useState(initialContent.html)
  const [savedData, setSavedData] = useState(
    extractDataFields(initialContent.data),
  )

  const [premiumStatus, setPremiumStatus] =
    useState<AIUsageResponse | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const aiInputRef = useRef<HTMLInputElement>(null)
  const scrollPosition = useRef({ x: 0, y: 0 })

  const fields = useMemo(() => parseTopLevelFields(draftData), [draftData])

  const finalCode = useMemo(
    () => injectDataIntoHtml(draftHtml, draftData),
    [draftHtml, draftData],
  )

  const hasUnsavedChanges =
    draftHtml !== savedHtml || draftData !== savedData

  const isAILimitReached =
    !!premiumStatus &&
    !premiumStatus.premium &&
    premiumStatus.usage >= premiumStatus.limit

  useEffect(() => {
    let cancelled = false

    getDailyAIUsage()
      .then((status) => {
        if (!cancelled) setPremiumStatus(status)
      })
      .catch((error) => {
        console.error('Usage fetch error:', error)
        if (!cancelled) {
          setPremiumStatus({
            premium: false,
            usage: DAILY_AI_LIMIT,
            limit: DAILY_AI_LIMIT,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!templateId) return

    async function loadTemplate() {
      try {
        const result = await getTemplateById(Number(templateId))

        if (result.success && result.html && result.data) {
          const html = result.html
          const data = extractDataFields(result.data)

          setDraftHtml(html)
          setDraftData(data)
          setSavedHtml(html)
          setSavedData(data)

          toast.success('Template ready', {
            description: 'Fill in your details or ask AI to personalize it.',
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

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      try {
        iframe.contentWindow?.scrollTo(
          scrollPosition.current.x,
          scrollPosition.current.y,
        )

        iframe.contentWindow?.addEventListener('scroll', () => {
          if (iframe.contentWindow) {
            scrollPosition.current = {
              x: iframe.contentWindow.scrollX,
              y: iframe.contentWindow.scrollY,
            }
          }
        })
      } catch {
        // Cross-document access can fail in some preview environments.
      }
    }

    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [finalCode])

  const handleFieldChange = useCallback((path: string, value: string) => {
    setDraftData((current) => updateSimpleField(current, path, value))
  }, [])

  const handleSave = useCallback(async () => {
    const result = await saveWebsiteDraft(username, draftHtml, draftData, draftData)

    if (!result.success) {
      toast.error(result.error || 'Failed to save website draft.')
      return
    }

    setSavedHtml(draftHtml)
    setSavedData(draftData)
    setLastSaved(new Date())

    toast.success('Changes saved', {
      description: 'Your draft is available in Saved Items.',
      position: 'top-center',
      duration: 2000,
    })
  }, [username, draftHtml, draftData])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  const handleAIGenerate = async () => {
    const prompt = aiPrompt.trim()

    if (!prompt) {
      toast.error('Tell AI what you want to change.')
      aiInputRef.current?.focus()
      return
    }

    let currentStatus: AIUsageResponse

    try {
      currentStatus = await getDailyAIUsage()
    } catch {
      toast.error('Unable to verify AI usage. Please try again.')
      return
    }

    if (!currentStatus.premium && currentStatus.usage >= currentStatus.limit) {
      setPremiumStatus(currentStatus)
      setIsPremiumModalOpen(true)
      return
    }

    let usageReserved = false

    if (!currentStatus.premium) {
      try {
        const reservation = await reserveDailyAIUsage()
        usageReserved = true
        setPremiumStatus(reservation)
      } catch (error) {
        const usageError = error as Error & { code?: string }

        if (usageError.code === 'LIMIT_REACHED') {
          setPremiumStatus({
            premium: false,
            usage: DAILY_AI_LIMIT,
            limit: DAILY_AI_LIMIT,
          })
          setIsPremiumModalOpen(true)
          return
        }

        toast.error('Unable to start AI generation.')
        return
      }
    }

    setIsGenerating(true)

    try {
      // In advanced mode, AI edits the currently active tab content.
      const source = isAdvancedMode
        ? activeTab === 'html'
          ? draftHtml
          : draftData
        : draftData // simple mode always edits data

      const result = await generateCodeWithAI(source, prompt)

      if (!result.success || !result.generatedCode) {
        if (usageReserved) await releaseDailyAIUsage()
        toast.error(result.error || 'AI generation failed.')
        return
      }

      const generated = cleanGeneratedCode(result.generatedCode)

      if (isAdvancedMode) {
        if (activeTab === 'html') {
          setDraftHtml(generated)
          setSavedHtml(generated)
        } else {
          setDraftData(generated)
          setSavedData(generated)
        }
      } else {
        setDraftData(generated)
        setSavedData(generated)
      }

      usageReserved = false
      setAiPrompt('')

      toast.success('Updated with AI', {
        description: isAdvancedMode
          ? `AI updated the ${activeTab === 'html' ? 'HTML' : 'data'} code.`
          : 'AI updated your website content.',
        position: 'top-center',
      })
    } catch (error) {
      console.error('AI generation error:', error)
      if (usageReserved) await releaseDailyAIUsage()
      toast.error('Something went wrong while using AI.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async () => {
    const message =
      username.toLowerCase() === 'demo'
        ? "You need to onboard first. We'll send you to the signup page. Continue?"
        : 'Publishing will make your website public. Are you sure?'

    if (!confirm(message)) return

    setIsPublishing(true)

    try {
      const result = await updateWebsiteContent(
        username,
        draftHtml,
        draftData,
        draftData,
      )

      if (!result.success) {
        toast.error(result.error || 'Failed to publish website')
        return
      }

      setLastPublished(new Date())

      toast.success('Published!', {
        description: 'Your website is now live.',
        position: 'top-center',
      })

      const nextParams = new URLSearchParams()
      if (templateId) nextParams.set('templateId', templateId)
      if (categoryFromUrl) nextParams.set('category', categoryFromUrl)

      const query = nextParams.toString()
      router.replace(`/edit_new/${username}${query ? `?${query}` : ''}`)
    } catch (error) {
      console.error(error)
      toast.error('An unexpected error occurred.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([injectDataIntoHtml(draftHtml, draftData)], {
      type: 'text/html',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `${username}-website.html`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)

    toast.success('Website exported!')
  }

  const openDraftPreview = () => {
    const key = `draft_preview_${Date.now()}`
    sessionStorage.setItem(key, finalCode)
    window.open(
      `/draft/${username}?previewKey=${encodeURIComponent(key)}`,
      '_blank',
    )
  }

  const handleCloseEditor = () => {
    let category = categoryFromUrl

    try {
      if (!category) category = localStorage.getItem(categoryStorageKey)
      if (category) localStorage.setItem(categoryStorageKey, category)
    } catch (error) {
      console.error('Failed to restore category:', error)
    }

    router.push(
      category
        ? `/templates/${username}?category=${encodeURIComponent(category)}`
        : `/templates/${username}`,
    )
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
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  if (isLoadingTemplate) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <Loader2 className="mr-2 h-7 w-7 animate-spin text-blue-400" />
        Loading your template...
      </div>
    )
  }

  // 🟢 ADVANCED MODE – full‑screen “hello world”
  if (isAdvancedMode) {
   return (
         <div className="flex h-screen bg-[#030712] relative">
           <main className="flex-1">
             <EditorContent_new
               username={username}
               initialContent={{
                 html: draftHtml,
                 script: '',
                 data: draftData,
               }}
                 onToggleAdvanced={() => setIsAdvancedMode(false)} // Add this line

             />
           </main>
         </div>
       )
  }
  console.log("FIELDS:", fields)
console.log("FIELDS LENGTH:", fields.length)

  // 🟢 NORMAL MODE – full editor
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-200">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
          border-radius: 10px;
        }
      `}</style>

      {/* ----------------------------------------------------------
          TOP BAR
          ---------------------------------------------------------- */}
      <nav className="z-20 flex shrink-0 items-center justify-between border-b border-slate-700/30 bg-slate-950/85 px-4 py-2.5 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="font-medium text-slate-300">
              Customize your website
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-700/50 md:block" />

          <div className="hidden items-center gap-1.5 text-[11px] text-slate-500 lg:flex">
            <Clock className="h-3 w-3" />
            {lastPublished
              ? `Published ${lastPublished.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Not published yet'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={
              categoryFromUrl
                ? `/templates/${username}?category=${encodeURIComponent(categoryFromUrl)}`
                : `/templates/${username}`
            }
            className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
          >
            <Pickaxe className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </a>

          <a
            href="/tutorial"
            className="hidden text-xs text-slate-400 transition hover:text-white sm:block"
          >
            Tutorial
          </a>

          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Live</span>
          </a>

          <div className="h-6 w-px bg-slate-700/40" />

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:opacity-60"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Publish
          </button>

          <button
            onClick={handleCloseEditor}
            className="text-slate-500 transition hover:text-white"
            aria-label="Close editor"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* ----------------------------------------------------------
          WORKSPACE
          LEFT = LIVE WEBSITE
          RIGHT = SIMPLE CONTENT FORM
          ---------------------------------------------------------- */}
      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden p-3">
        {/* LIVE PREVIEW */}
        <section className="relative flex min-w-0 flex-[1.25] flex-col overflow-hidden rounded-xl border border-slate-700/30 bg-slate-900/60 shadow-2xl">
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

            <div className="text-[11px] text-slate-600">Live preview</div>
          </div>

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
                className="w-full h-full rounded-lg border border-slate-700/20 shadow-2xl"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
                style={{ aspectRatio: viewMode === 'desktop' ? '16/9' : '9/13', background: 'black' }}
              />
            </div>
            <div className="absolute inset-0 pointer-events-none rounded-lg border border-blue-500/5 shadow-[inset_0_0_80px_rgba(59,130,246,0.03)]" />
          </div>
        </section>

        {/* --------------------------------------------------------
            RIGHT PANEL – SIMPLE MODE ONLY
            -------------------------------------------------------- */}
        <section className="flex min-w-[360px] max-w-[510px] flex-[0.75] flex-col overflow-hidden rounded-xl border border-slate-700/30 bg-slate-900/80 shadow-2xl">
          <div className="shrink-0 border-b border-slate-700/30 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Make it yours
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Fill in your details. Your template stays exactly the same.
                </p>
              </div>

              <button
                onClick={() => setIsAdvancedMode(true)}
                className="shrink-0 rounded-lg border border-slate-700/50 bg-slate-800/50 px-2.5 py-1.5 text-[11px] text-slate-500 transition hover:border-blue-400/30 hover:bg-blue-500/15 hover:text-blue-300"
                title="Switch to blank page with hello world"
              >
                Advanced
              </button>
            </div>

            {/* AI input */}
            <div className="mt-4 rounded-xl border border-blue-500/15 bg-blue-500/[0.06] p-2">
              <div className="flex items-center gap-2 px-2 pb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[11px] font-medium text-blue-300">
                  Ask AI
                </span>
                <span className="ml-auto text-[10px] text-slate-600">
                  {premiumStatus?.premium
                    ? 'Unlimited'
                    : premiumStatus
                      ? `${Math.max(
                          premiumStatus.limit - premiumStatus.usage,
                          0,
                        )} left today`
                      : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={aiInputRef}
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      handleAIGenerate()
                    }
                  }}
                  onClick={() => {
                    if (isAILimitReached) setIsPremiumModalOpen(true)
                  }}
                  readOnly={isGenerating || isAILimitReached}
                  placeholder="Change my headline, make the copy warmer..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-700/40 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10"
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
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 transition hover:bg-blue-500/30 disabled:opacity-30"
                  aria-label="Ask AI"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SendIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <p className="px-2 pt-1.5 text-[10px] text-slate-600">
                Try: “Make the headline more confident” or “Use this image URL…”
              </p>
            </div>
          </div>
     
          {/* Simple form fields */}
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {fields.length > 0 ? (
              <div className="space-y-5">
                {fields.map((field) => {
                  const showGroupHeader =
                    field.groupPath &&
                    (fields.findIndex((item) => item.groupPath === field.groupPath) ===
                      fields.indexOf(field))

                  return (
                    <div key={field.path}>
                      {showGroupHeader && (
                        <div className="mb-3 rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2">
                          <div className="text-xs font-semibold text-slate-300">
                            {field.groupLabel}
                            {typeof field.itemIndex === 'number' && (
                              <span className="ml-1 text-slate-600">
                                {field.itemIndex + 1}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-600">
                            Edit this item without changing the template layout.
                          </div>
                        </div>
                      )}

                      <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-slate-300">
                          {field.label}
                        </span>

                        {field.type === 'textarea' ? (
                          <textarea
                            value={field.value}
                            onChange={(event) =>
                              handleFieldChange(field.path, event.target.value)
                            }
                            rows={4}
                            className="w-full resize-y rounded-lg border border-slate-700/50 bg-slate-950/50 px-3 py-2.5 text-sm leading-relaxed text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10"
                          />
                        ) : (
                          <input
                            type={field.type === 'url' ? 'url' : 'text'}
                            value={field.value}
                            onChange={(event) =>
                              handleFieldChange(field.path, event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10"
                          />
                        )}
                      </label>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700/50 p-6 text-center">
                <Sparkles className="mx-auto mb-3 h-6 w-6 text-blue-400" />
                <p className="text-sm text-slate-300">
                  Let AI personalize this template for you.
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  You can still use Advanced mode if you need full code
                  control.
                </p>
              </div>
            )}

            <div className="mt-8 rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
              <p className="text-[11px] leading-relaxed text-slate-600">
                <span className="text-slate-400">Tip:</span> You don't need
                to understand code. Edit the fields above or tell AI exactly
                what you want changed.
              </p>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-700/30 px-5 py-3">
            <div className="flex items-center gap-2 text-[10px]">
              {hasUnsavedChanges ? (
                <span className="flex items-center gap-1.5 text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  Unsaved changes
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-green-400/80">
                  <CheckCircle2 className="h-3 w-3" />
                  All saved
                </span>
              )}

              {lastSaved && (
                <span className="text-slate-700">
                  ·{' '}
                  {lastSaved.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                title="Download HTML"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Trust footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-800/40 bg-slate-950/70 px-5 py-1.5 text-[10px] text-slate-600">
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-blue-400/60" />
          Secure connection
        </div>
        <div className="hidden gap-4 sm:flex">
          <a href="/legal/privacy" className="hover:text-slate-400">
            Privacy
          </a>
          <a href="/legal/terms" className="hover:text-slate-400">
            Terms
          </a>
          <a href="/legal/support" className="hover:text-slate-400">
            Support
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