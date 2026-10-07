'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import * as XLSX from 'xlsx'
import {
  ArrowLeft,
  ChevronDown,
  Code2,
  Download,
  Eye,
  FileText,
  ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  Link2,
  List,
  Mail,
  MoreHorizontal,
  MousePointer2,
  PenLine,
  Plus,
  Redo2,
  Send,
  Sparkles,
  Type,
  Undo2,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fieldNotesDefaults,
  type FieldNotesContent,
} from '../../../lib/field-notes-email-template'

const defaultSuggestions = [
  'Make this warmer',
  'Give me 3 subject lines',
  'Add a stronger opening',
]

type EmailTemplate = {
  id: string
  title: string
  description: string | null
  category: string | null
  subject: string | null
  htmlContent: string
}

type CampaignRecipient = {
  name: string
  email: string
}

type CampaignResult = {
  sentCount: number
  failedEmails: Array<{ email: string; error: string }>
}

function parseCampaignRecipients(value: string): CampaignRecipient[] {
  const recipients = new Map<string, CampaignRecipient>()
  for (const line of value.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    if (/^name\s*,\s*email$/i.test(trimmedLine)) continue

    const separator = trimmedLine.lastIndexOf(',')
    const name = separator >= 0 ? trimmedLine.slice(0, separator).trim() : ''
    const email = (separator >= 0 ? trimmedLine.slice(separator + 1) : trimmedLine).trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Invalid email address: ${email || trimmedLine}`)
    }
    recipients.set(email.toLowerCase(), { name, email })
  }

  if (recipients.size === 0) throw new Error('Add at least one recipient email address.')
  return [...recipients.values()]
}

function isEmailTemplate(value: unknown): value is EmailTemplate {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'title' in value && typeof value.title === 'string' &&
    'htmlContent' in value && typeof value.htmlContent === 'string' &&
    value.htmlContent.length > 0 &&
    'subject' in value && (typeof value.subject === 'string' || value.subject === null) &&
    'description' in value && (typeof value.description === 'string' || value.description === null) &&
    'category' in value && (typeof value.category === 'string' || value.category === null)
  )
}

export function NewsletterEditor() {
  const { user, isLoaded } = useUser()
  const params = useParams<{ username: string }>()
  const username = params?.username || ''
  const [editorView, setEditorView] = useState<'preview' | 'templates'>('preview')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState(defaultSuggestions)
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false)
  const [isCampaignOpen, setIsCampaignOpen] = useState(false)
  const [campaignContacts, setCampaignContacts] = useState('')
  const [campaignError, setCampaignError] = useState('')
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null)
  const [isSendingCampaign, setIsSendingCampaign] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)
  const [testEmailSent, setTestEmailSent] = useState(false)
  const [testEmailError, setTestEmailError] = useState('')
  const [fieldNotes, setFieldNotes] = useState<FieldNotesContent>({ ...fieldNotesDefaults })
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isTemplateLoading, setIsTemplateLoading] = useState(true)
  const [templateError, setTemplateError] = useState('')
  const [editSubject, setEditSubject] = useState(fieldNotesDefaults.subject)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isConnectingGmail, setIsConnectingGmail] = useState(false)
  const [gmailConnectError, setGmailConnectError] = useState('')
  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const campaignFileInputRef = useRef<HTMLInputElement>(null)
  const hasAutoFocusedPrompt = useRef(false)
  const storedTemplateHtml = selectedTemplate?.htmlContent || ''
  const fieldNotesTemplateHtml = generatedHtml || storedTemplateHtml

  useEffect(() => {
    try {
      const existingContacts = sessionStorage.getItem('emailCampaignContacts')
      if (existingContacts) {
        setCampaignContacts(existingContacts)
        sessionStorage.removeItem('emailCampaignContacts')
      }
    } catch (error) {
      console.error('Could not restore campaign contacts:', error)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !user?.id) return

    const controller = new AbortController()
    const cacheKey = `email-templates:v1:${user.id}`
    let hasCachedTemplates = false

    function applyTemplates(templates: EmailTemplate[]) {
      const initialTemplate = templates.find((template) => template.id === 'field-notes')
      if (!initialTemplate || !templates.some((template) => template.id === 'empire-excellence')) {
        throw new Error('The email template list is incomplete. Please try again.')
      }

      setEmailTemplates(templates)
      setSelectedTemplate(initialTemplate)
      setFieldNotes((current) => ({
        ...current,
        subject: initialTemplate.subject || current.subject,
      }))
      setEditSubject(initialTemplate.subject || fieldNotesDefaults.subject)
    }

    try {
      const cachedTemplates = localStorage.getItem(cacheKey)
      if (cachedTemplates) {
        const parsedTemplates: unknown = JSON.parse(cachedTemplates)
        if (
          Array.isArray(parsedTemplates) &&
          parsedTemplates.every(isEmailTemplate) &&
          parsedTemplates.some((template) => template.id === 'field-notes') &&
          parsedTemplates.some((template) => template.id === 'empire-excellence')
        ) {
          applyTemplates(parsedTemplates)
          hasCachedTemplates = true
          setIsTemplateLoading(false)
        }
      }
    } catch (error) {
      console.error('Could not read cached email templates:', error)
    }

    async function loadTemplate() {
      try {
        const response = await fetch('/api/email-templates/field-notes', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const data = await response.json()
        const templates = data?.templates
        if (!response.ok || !Array.isArray(templates)) {
          throw new Error(data?.error || 'Email templates could not be loaded.')
        }

        const validTemplates = templates.filter(isEmailTemplate)
        applyTemplates(validTemplates)
        try {
          localStorage.setItem(cacheKey, JSON.stringify(validTemplates))
        } catch (error) {
          console.error('Could not cache email templates locally:', error)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          if (hasCachedTemplates) {
            console.error('Could not refresh cached email templates:', error)
          } else {
            setTemplateError(error instanceof Error ? error.message : 'Email templates could not be loaded.')
          }
        }
      } finally {
        if (!controller.signal.aborted) setIsTemplateLoading(false)
      }
    }

    void loadTemplate()
    return () => controller.abort()
  }, [isLoaded, user?.id])

  useEffect(() => {
    if (
      isTemplateLoading ||
      templateError ||
      editorView !== 'preview' ||
      hasAutoFocusedPrompt.current ||
      !window.matchMedia('(min-width: 1280px)').matches
    ) {
      return
    }

    promptInputRef.current?.focus()
    hasAutoFocusedPrompt.current = true
  }, [editorView, isTemplateLoading, templateError])

  async function connectGmail() {
    if (!isLoaded || !user || isConnectingGmail) return

    setGmailConnectError('')
    setIsConnectingGmail(true)
    const googleAccount = user.externalAccounts.find((account) => account.provider === 'google')
    if (!googleAccount) {
      setGmailConnectError('Link a Google account to your profile before connecting Gmail.')
      setIsConnectingGmail(false)
      return
    }

    try {
      const reauth = await googleAccount.reauthorize({
        redirectUrl: window.location.href,
        additionalScopes: ['https://www.googleapis.com/auth/gmail.send'],
      })
      const redirectUrl = reauth?.verification?.externalVerificationRedirectURL?.href
      if (!redirectUrl) {
        throw new Error('Clerk did not return a Google authorization link. Please try again.')
      }
      window.location.href = redirectUrl
    } catch (error) {
      setGmailConnectError(error instanceof Error ? error.message : 'Unable to connect Gmail.')
      setIsConnectingGmail(false)
    }
  }

  async function generateDraft() {
    const instruction = prompt.trim()
    if (!instruction || isGenerating || !storedTemplateHtml) return

    setIsGenerating(true)
    setGenerationError('')
    try {
      const response = await fetch('/api/unsplash-agent-four', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit-field-notes',
          instruction,
          subject: fieldNotes.subject,
          html: fieldNotesTemplateHtml,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to update the newsletter.')
      }

      if (
        typeof data.subject !== 'string' ||
        typeof data.code !== 'string' ||
        !Array.isArray(data.suggestions) ||
        data.suggestions.length !== 3 ||
        !data.suggestions.every((suggestion: unknown) => typeof suggestion === 'string')
      ) {
        throw new Error('The assistant returned an incomplete email update.')
      }

      setFieldNotes((current) => ({ ...current, subject: data.subject }))
      setGeneratedHtml(data.code)
      setSuggestions(data.suggestions)
      setPrompt('')
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Unable to update the newsletter.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function sendTestEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSendingTestEmail) return
    if (!fieldNotesTemplateHtml) {
      setTestEmailError(templateError || 'The Field Notes email template has not loaded yet.')
      return
    }

    setIsSendingTestEmail(true)
    setTestEmailError('')
    setTestEmailSent(false)

    try {
      const [result] = await Promise.all([
        fetch('/api/unsplash-agent-four', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send-field-notes-test', to: testEmail.trim(), username, content: fieldNotes, html: fieldNotesTemplateHtml }),
        })
          .then(async (response) => ({ ok: response.ok, data: await response.json() }))
          .catch(() => ({ ok: false, data: { error: 'Unable to send the test email. Please try again.' } })),
        new Promise((resolve) => window.setTimeout(resolve, 2000)),
      ])

      if (!result.ok || !result.data.ok) {
        throw new Error(result.data.error || 'Unable to send the test email.')
      }

      setTestEmailSent(true)
    } catch (error) {
      setTestEmailError(error instanceof Error ? error.message : 'Unable to send the test email.')
    } finally {
      setIsSendingTestEmail(false)
    }
  }

  async function sendCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSendingCampaign) return

    setCampaignError('')
    setCampaignResult(null)

    let recipients: CampaignRecipient[]
    try {
      recipients = parseCampaignRecipients(campaignContacts)
    } catch (error) {
      setCampaignError(error instanceof Error ? error.message : 'Check the recipient list and try again.')
      return
    }

    if (recipients.length > 500) {
      setCampaignError('Send campaigns to 500 recipients or fewer at a time.')
      return
    }
    if (!fieldNotesTemplateHtml || !fieldNotes.subject.trim()) {
      setCampaignError('The email preview is not ready to send.')
      return
    }

    setIsSendingCampaign(true)
    try {
      const response = await fetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject: fieldNotes.subject.trim(),
          html: fieldNotesTemplateHtml,
        }),
      })
      const data = await response.json()
      if (!Array.isArray(data.results)) {
        throw new Error(data.error || 'The campaign could not be sent.')
      }

      const failedEmails = data.results
        .filter((result: { status?: unknown }) => result.status !== 'sent')
        .map((result: { email?: unknown; error?: unknown }) => ({
          email: typeof result.email === 'string' ? result.email : 'Unknown recipient',
          error: typeof result.error === 'string' ? result.error : 'Email delivery failed.',
        }))
      setCampaignResult({
        sentCount: typeof data.sentCount === 'number' ? data.sentCount : 0,
        failedEmails,
      })
      if (failedEmails.length === 0) {
        setCampaignContacts('')
      } else {
        setCampaignError(data.error || 'Some messages could not be sent. Review the failed addresses below.')
      }
    } catch (error) {
      setCampaignError(error instanceof Error ? error.message : 'The campaign could not be sent.')
    } finally {
      setIsSendingCampaign(false)
    }
  }

  async function importCampaignContacts(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!firstSheet) throw new Error('The selected file has no worksheet.')

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })
      const contacts = rows.map((row) => {
        const nameKey = Object.keys(row).find((key) => key.trim().toLowerCase() === 'name')
        const emailKey = Object.keys(row).find((key) => key.trim().toLowerCase() === 'email')
        if (!emailKey) throw new Error('The file must contain a column named "Email".')
        const name = nameKey ? String(row[nameKey]).trim() : ''
        const email = String(row[emailKey]).trim()
        return name ? `${name}, ${email}` : email
      }).filter(Boolean)

      if (contacts.length === 0) throw new Error('The selected file contains no contacts.')
      setCampaignContacts((current) => [current.trim(), ...contacts].filter(Boolean).join('\n'))
      setCampaignError('')
      setCampaignResult(null)
    } catch (error) {
      setCampaignError(error instanceof Error ? error.message : 'Could not read the contacts file.')
    } finally {
      event.target.value = ''
    }
  }

  function downloadCampaignSample() {
    const blob = new Blob(
      ['Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com'],
      { type: 'text/csv;charset=utf-8;' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample_contacts.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-[#f4f4f1] text-[#242321]">
      {/* TOP HEADER */}
      <header className="flex h-[68px] items-center justify-between border-b border-[#deded8] bg-[#fafaf8] px-5 lg:px-8">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to newsletters"
            className="rounded-full text-[#73736d] hover:bg-[#eeeeea]"
          >
            <ArrowLeft data-icon="inline-start" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#272622] text-white">
              <Mail data-icon="inline-start" />
            </div>

            <div>
              <p className="text-[13px] font-semibold leading-none">
                New newsletter
              </p>
              <p className="mt-1 text-[11px] text-[#85847d]">
                Saved just now
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-[#686761] sm:flex"
            disabled={isTemplateLoading || !storedTemplateHtml}
            onClick={() => {
              setTestEmailError('')
              setTestEmailSent(false)
              setIsTestEmailOpen(true)
            }}
          >
            <Eye data-icon="inline-start" />
            Test email
          </Button>

          <Button
            size="sm"
            className="rounded-lg bg-[#292824] px-4 text-white hover:bg-[#3d3b36]"
            disabled={isTemplateLoading || !storedTemplateHtml || isSendingCampaign}
            onClick={() => {
              setCampaignError('')
              setCampaignResult(null)
              setIsCampaignOpen(true)
            }}
          >
            <Send data-icon="inline-start" />
            Schedule send
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="More options"
              aria-expanded={isOptionsOpen}
              aria-haspopup="menu"
              className="text-[#77766f]"
              onClick={() => {
                setGmailConnectError('')
                setIsOptionsOpen((open) => !open)
              }}
            >
              <MoreHorizontal data-icon="inline-start" />
            </Button>
            {isOptionsOpen && (
              <div
                role="menu"
                aria-label="Newsletter options"
                className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-[#e4e3dd] bg-white p-1.5 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={!isLoaded || !user || isConnectingGmail}
                  onClick={() => void connectGmail()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[13px] font-medium text-[#45443f] hover:bg-[#f4f4f1] disabled:cursor-wait disabled:opacity-60"
                >
                  {isConnectingGmail ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {isConnectingGmail ? 'Connecting Gmail…' : 'Connect Gmail'}
                </button>
                {gmailConnectError && (
                  <p role="alert" className="px-3 pb-2 pt-1 text-[11px] leading-4 text-red-700">
                    {gmailConnectError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex min-h-[calc(100vh-68px)]">

        {/* LEFT NAVIGATION */}

        {/* CENTER EDITOR */}
        <section className="min-w-0 flex-1">
          {/* EDITOR TOOLBAR */}
          <div className="flex h-[56px] items-center justify-between border-b border-[#deded8] bg-[#fafaf8] px-5 lg:px-8">
            <div
              role="group"
              aria-label="Editor view"
              className="inline-flex rounded-xl border border-[#d8d7d0] bg-white p-1 shadow-[0_4px_12px_rgba(41,40,36,0.14)] ring-1 ring-black/[0.04]"
            >
              <button
                type="button"
                aria-pressed={editorView === 'preview'}
                onClick={() => setEditorView('preview')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
                  editorView === 'preview'
                    ? 'bg-[#f3f3ef] text-[#33312c] shadow-sm'
                    : 'text-[#77766f] hover:bg-[#f8f8f5]'
                }`}
              >
                <Eye size={16} />
                Preview
              </button>
              <span className="mx-1 my-1 w-px bg-[#deded8]" aria-hidden="true" />
              <button
                type="button"
                aria-pressed={editorView === 'templates'}
                disabled={isTemplateLoading || !storedTemplateHtml}
                onClick={() => setEditorView('templates')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition disabled:cursor-wait disabled:opacity-50 ${
                  editorView === 'templates'
                    ? 'bg-[#f3f3ef] text-[#33312c] shadow-sm'
                    : 'text-[#77766f] hover:bg-[#f8f8f5]'
                }`}
              >
                <LayoutTemplate size={16} />
                Templates
              </button>
            </div>

            <div className="flex items-center gap-1 text-[#a09f97]">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Undo"
              >
                <Undo2 data-icon="inline-start" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Redo"
              >
                <Redo2 data-icon="inline-start" />
              </Button>

              <span className="mx-2 h-5 w-px bg-[#dfdfd9]" />

             
            </div>
          </div>

          {editorView === 'templates' ? (
            <div className="min-h-[calc(100vh-124px)] bg-[#f8f8f5] p-5 sm:p-8">
              <div className="mx-auto max-w-5xl">
                <h1 className="text-xl font-semibold text-[#292824]">Email templates</h1>
                <p className="mt-1 text-sm text-[#77766f]">Choose a template to use in your newsletter.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {emailTemplates.map((template) => (
                    <article
                      key={template.id}
                      className="overflow-hidden rounded-xl border border-[#deded8] bg-white shadow-sm"
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-[#f1f1ed]">
                        <iframe
                          title={`${template.title} template preview`}
                          srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0">${template.htmlContent}</body></html>`}
                          sandbox=""
                          scrolling="no"
                          tabIndex={-1}
                          className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-white"
                        />
                      </div>
                      <div className="flex min-h-[172px] flex-col p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="font-semibold text-[#292824]">{template.title}</h2>
                          {template.category && (
                            <span className="rounded-full bg-[#f1ecfb] px-2.5 py-1 text-[11px] font-medium text-[#62557f]">
                              {template.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 min-h-10 text-sm text-[#77766f]">
                          {template.description || 'Email newsletter template'}
                        </p>
                        <button
                          type="button"
                          aria-pressed={selectedTemplate?.id === template.id}
                          onClick={() => {
                            setSelectedTemplate(template)
                            setFieldNotes((current) => ({
                              ...current,
                              subject: template.subject || current.subject,
                            }))
                            setEditSubject(template.subject || fieldNotes.subject)
                            setGeneratedHtml(null)
                            setEditorView('preview')
                          }}
                          className="mt-auto w-full rounded-lg bg-[#292824] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3d3b36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a48ed7] focus-visible:ring-offset-2"
                        >
                          {selectedTemplate?.id === template.id ? 'Selected template' : 'Use template'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="min-h-[calc(100vh-124px)] bg-white text-[#202124]"
              style={{ fontFamily: 'Roboto, RobotoDraft, Helvetica, Arial, sans-serif' }}
            >
              <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-5 sm:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="truncate text-[22px] font-normal leading-7 tracking-normal sm:text-[24px]">
                    {fieldNotes.subject}
                  </h1>

                  <span className="hidden shrink-0 rounded bg-[#eef0f1] px-2 py-1 text-[11px] leading-4 text-[#5f6368] sm:inline-flex">
                    Inbox ×
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-4 text-[#5f6368]">
                  <button
                    type="button"
                    aria-label="Edit newsletter"
                    title="Edit newsletter"
                    onClick={() => {
                      setEditSubject(fieldNotes.subject)
                      setIsEditModalOpen(true)
                    }}
                    className="grid size-9 place-items-center rounded-md text-[#5f6368] transition hover:bg-[#f1f3f4]"
                  >
                    <PenLine size={18} />
                  </button>

                 
                </div>
              </div>

              <div className="flex items-start justify-between px-5 py-6 sm:px-8 sm:py-7">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#a58e83] text-base font-medium text-white">
                    F
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="text-[14px] font-semibold leading-5">
                        {selectedTemplate?.title || 'Field Notes'}
                      </p>

                      <p className="text-[12px] leading-4 text-[#5f6368]">
                        &lt;{username}@7wingz.com&gt;
                      </p>
                    </div>

                    <p className="mt-0.5 text-[12px] leading-4 text-[#5f6368]">
                      to me
                      <ChevronDown
                        className="ml-1 inline-block"
                        data-icon="inline-start"
                      />
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[#5f6368]">
                  <span className="hidden text-[12px] leading-4 sm:inline">
                    10:42 AM (just now)
                  </span>

                  <button
                    aria-label="Star email"
                    className="text-2xl"
                  >
                    ☆
                  </button>

                  <button
                    aria-label="More email actions"
                    className="text-xl"
                  >
                    ⋮
                  </button>
                </div>
              </div>

              {isTemplateLoading ? (
                <p role="status" className="p-8 text-sm text-[#77766f]">
                  Loading newsletter template…
                </p>
              ) : templateError ? (
                <p role="alert" className="p-8 text-sm text-red-700">
                  {templateError}
                </p>
              ) : (
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: fieldNotesTemplateHtml }}
                />
              )}
            </div>
          )}
        </section>

        {/* AI PANEL */}
          <aside className="hidden w-[300px] shrink-0 border-l border-[#deded8] bg-[#fafaf8] xl:block">
            <div className="flex h-[56px] items-center justify-between border-b border-[#deded8] px-5">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <div className="flex size-6 items-center justify-center rounded-md bg-[#eee8fb] text-[#8064b4]">
                  <WandSparkles data-icon="inline-start" />
                </div>

                Writing partner
              </div>

            </div>

            <div className="flex flex-col gap-5 p-5">
              <div className="rounded-xl bg-[#f1ecfb] p-4">
                <p className="text-[12px] font-semibold text-[#5f517b]">
                  Make this newsletter yours
                </p>

                <p className="mt-1.5 text-[11px] leading-relaxed text-[#766b8b]">
                  I can help you find the right words, sharpen your ideas,
                  or change the tone.
                </p>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa8a0]">
                  Try asking
                </p>

                <div className="flex flex-col gap-2">
                  {suggestions.map((text) => (
                    <button
                      key={text}
                      onClick={() => setPrompt(text)}
                      className="rounded-lg border border-[#e5e4de] bg-white px-3 py-2.5 text-left text-[12px] text-[#6f6e67] transition hover:border-[#cfc4e7] hover:bg-[#fbf9ff]"
                    >
                      {text}

                      <ChevronDown
                        className="float-right rotate-[-90deg] text-[#b0aea5]"
                        data-icon="inline-start"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mt-auto">
                <textarea
                  ref={promptInputRef}
                  tabIndex={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask anything about your draft..."
                  disabled={isGenerating || isTemplateLoading || !storedTemplateHtml}
                  className="min-h-[90px] w-full resize-none rounded-xl border border-[#dddcd5] bg-white p-3 pr-10 text-[12px] outline-none placeholder:text-[#aaa9a1] focus:border-[#a48ed7] focus:ring-2 focus:ring-[#eee8fb]"
                />

                <button
                  type="button"
                  onClick={() => void generateDraft()}
                  disabled={isGenerating || isTemplateLoading || !storedTemplateHtml || !prompt.trim()}
                  aria-label="Generate"
                  className="absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-lg bg-[#292824] text-white transition hover:bg-[#4a4740] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <MousePointer2 className="rotate-[-45deg]" data-icon="inline-start" />
                  )}
                </button>
              </div>

              {generationError && (
                <p role="alert" className="text-[11px] text-red-700">
                  {generationError}
                </p>
              )}

              <p className="text-center text-[10px] text-[#aaa9a1]">
                AI suggestions are a starting point. You stay in control.
              </p>
            </div>
          </aside>
      </div>

      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsEditModalOpen(false)
          }}
        >
          <section
            aria-labelledby="edit-newsletter-title"
            aria-modal="true"
            role="dialog"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#deded8] bg-[#fafaf8] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-newsletter-title" className="text-lg font-semibold text-[#292824]">
                  Edit email subject
                </h2>
                <p className="mt-1 text-sm text-[#77766f]">
                  The newsletter content stays unchanged.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close editor"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-md p-1 text-[#77766f] hover:bg-[#eeeeea]"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                setFieldNotes((current) => ({ ...current, subject: editSubject.trim() }))
                setIsEditModalOpen(false)
              }}
              className="space-y-4"
            >
              <label htmlFor="newsletter-subject" className="block text-sm font-medium text-[#45443f]">
                Email subject
              </label>
              <input
                id="newsletter-subject"
                required
                maxLength={200}
                value={editSubject}
                onChange={(event) => setEditSubject(event.target.value)}
                className="-mt-2 h-10 w-full rounded-lg border border-[#d8d7d0] bg-white px-3 text-sm font-normal outline-none focus:border-[#77766f] focus:ring-2 focus:ring-[#e4e3dd]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isTestEmailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSendingTestEmail) {
              setIsTestEmailOpen(false)
            }
          }}
        >
          <section
            aria-labelledby="test-email-title"
            aria-modal="true"
            role="dialog"
            className="w-full max-w-md rounded-xl border border-[#deded8] bg-[#fafaf8] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="test-email-title" className="text-lg font-semibold text-[#292824]">
                  Send a test email
                </h2>
                <p className="mt-1 text-sm text-[#77766f]">
                  Preview {selectedTemplate?.title || 'Field Notes'} in your inbox.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                disabled={isSendingTestEmail}
                onClick={() => setIsTestEmailOpen(false)}
                className="rounded-md p-1 text-[#77766f] hover:bg-[#eeeeea] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {testEmailSent ? (
              <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Test email sent to {testEmail.trim()}. Please check your inbox and spam folder.
                <div className="mt-4 flex justify-end">
                  <Button type="button" onClick={() => setIsTestEmailOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={sendTestEmail}>
                <label htmlFor="test-email-address" className="mb-2 block text-sm font-medium text-[#45443f]">
                  Test email address
                </label>
                <input
                  id="test-email-address"
                  type="email"
                  required
                  autoFocus
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={isSendingTestEmail}
                  className="h-11 w-full rounded-lg border border-[#d8d7d0] bg-white px-3 text-sm outline-none transition focus:border-[#77766f] focus:ring-2 focus:ring-[#e4e3dd] disabled:opacity-60"
                />
                {testEmailError && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {testEmailError}
                  </p>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSendingTestEmail}
                    onClick={() => setIsTestEmailOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSendingTestEmail}>
                    {isSendingTestEmail ? (
                      <>
                        <LoaderCircle className="animate-spin" data-icon="inline-start" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send data-icon="inline-start" />
                        Send test
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {isCampaignOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSendingCampaign) {
              setIsCampaignOpen(false)
            }
          }}
        >
          <section
            aria-labelledby="campaign-title"
            aria-modal="true"
            role="dialog"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#deded8] bg-[#fafaf8] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="campaign-title" className="text-lg font-semibold text-[#292824]">
                  Send email campaign
                </h2>
                <p className="mt-1 text-sm text-[#77766f]">
                  Send “{fieldNotes.subject}” using the {selectedTemplate?.title || 'selected'} template preview.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close campaign dialog"
                disabled={isSendingCampaign}
                onClick={() => setIsCampaignOpen(false)}
                className="rounded-md p-1 text-[#77766f] hover:bg-[#eeeeea] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {campaignResult && (
              <div
                role={campaignResult.failedEmails.length ? 'alert' : 'status'}
                className={`mb-4 rounded-lg border p-4 text-sm ${
                  campaignResult.failedEmails.length
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                Sent to {campaignResult.sentCount} recipient{campaignResult.sentCount === 1 ? '' : 's'}.
                {campaignResult.failedEmails.length > 0 && (
                  <div className="mt-2">
                    Failed:
                    <ul className="mt-1 list-inside list-disc">
                      {campaignResult.failedEmails.map(({ email, error }) => (
                        <li key={email}>{email}: {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={sendCampaign} className="space-y-4">
              <div>
                <label htmlFor="campaign-recipients" className="mb-2 block text-sm font-medium text-[#45443f]">
                  Recipients
                </label>
                <textarea
                  id="campaign-recipients"
                  rows={9}
                  required
                  value={campaignContacts}
                  onChange={(event) => {
                    setCampaignContacts(event.target.value)
                    setCampaignResult(null)
                    setCampaignError('')
                  }}
                  placeholder={'Name, email (one per line)\nJohn Doe, john@example.com\njane@example.com'}
                  disabled={isSendingCampaign}
                  className="w-full resize-y rounded-lg border border-[#d8d7d0] bg-white p-3 text-sm outline-none transition focus:border-[#77766f] focus:ring-2 focus:ring-[#e4e3dd] disabled:opacity-60"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSendingCampaign}
                  onClick={() => campaignFileInputRef.current?.click()}
                >
                  <Upload data-icon="inline-start" />
                  Upload CSV / Excel
                </Button>
                <input
                  ref={campaignFileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(event) => void importCampaignContacts(event)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={downloadCampaignSample}
                >
                  <Download data-icon="inline-start" />
                  Sample CSV
                </Button>
                <p className="text-xs text-[#77766f]">
                  Up to 500 recipients. Upload a file with an Email column.
                </p>
              </div>

              {campaignError && (
                <p role="alert" className="text-sm text-red-700">
                  {campaignError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSendingCampaign}
                  onClick={() => setIsCampaignOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingCampaign || isTemplateLoading || !storedTemplateHtml}
                  className="bg-[#292824] text-white hover:bg-[#3d3b36]"
                >
                  {isSendingCampaign ? (
                    <>
                      <LoaderCircle className="animate-spin" data-icon="inline-start" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send data-icon="inline-start" />
                      Send campaign
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default NewsletterEditor
