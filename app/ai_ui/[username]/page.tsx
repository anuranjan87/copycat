
'use client'

import { type FormEvent, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  ArrowLeft,
  ChevronDown,
  Code2,
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
  WandSparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildFieldNotesTemplate,
  fieldNotesDefaults,
  type FieldNotesContent,
} from '../../../lib/field-notes-template'

const defaultSuggestions = [
  'Make this warmer',
  'Give me 3 subject lines',
  'Add a stronger opening',
]

const templates = [
  {
    name: 'The Sunday Edit',
    category: 'Editorial',
    tone: 'bg-[#f6efe3]',
    accent: 'bg-[#d86f4d]',
  },
  {
    name: 'Product Notes',
    category: 'Product update',
    tone: 'bg-[#e9f0ef]',
    accent: 'bg-[#4c7b78]',
  },
  {
    name: 'The Field Guide',
    category: 'Storytelling',
    tone: 'bg-[#eeeaf7]',
    accent: 'bg-[#8b6fc1]',
  },
]

export function NewsletterEditor() {
  const { user, isLoaded } = useUser()
  const params = useParams<{ username: string }>()
  const username = params?.username || ''
  const [activeTab] = useState<'preview' | 'write'>('preview')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState(defaultSuggestions)
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)
  const [testEmailSent, setTestEmailSent] = useState(false)
  const [testEmailError, setTestEmailError] = useState('')
  const [fieldNotes, setFieldNotes] = useState<FieldNotesContent>({ ...fieldNotesDefaults })
  const [editSubject, setEditSubject] = useState(fieldNotesDefaults.subject)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isConnectingGmail, setIsConnectingGmail] = useState(false)
  const [gmailConnectError, setGmailConnectError] = useState('')
  const fieldNotesTemplateHtml = generatedHtml || buildFieldNotesTemplate(fieldNotes)

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
    if (!instruction || isGenerating) return

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

    setIsSendingTestEmail(true)
    setTestEmailError('')
    setTestEmailSent(false)

    try {
      const [result] = await Promise.all([
        fetch('/api/unsplash-agent-four', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send-field-notes-test', to: testEmail.trim(), username, content: fieldNotes, html: generatedHtml }),
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
        <aside className="hidden w-[218px] shrink-0 border-r border-[#deded8] bg-[#f8f8f5] px-4 py-6 lg:flex lg:flex-col">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#999890]">
            Create
          </p>

          <nav className="mt-3 flex flex-col gap-1">
            {[
              {
                label: 'Compose',
                icon: PenLine,
                active: true,
              },
              {
                label: 'Templates',
                icon: LayoutTemplate,
              },
              {
                label: 'Content blocks',
                icon: FileText,
              },
            ].map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition ${
                  item.active
                    ? 'bg-white text-[#292824] shadow-sm ring-1 ring-[#e4e3dd]'
                    : 'text-[#77766f] hover:bg-white/70'
                }`}
              >
                <item.icon data-icon="inline-start" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* TIPS */}
          <div className="mt-9 border-t border-[#e2e2dc] pt-6">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#999890]">
              Tips
            </p>

            <div className="mt-3 rounded-xl bg-[#eeebf8] p-3.5 text-[#62557f]">
              <Sparkles
                data-icon="inline-start"
                className="mb-2"
              />

              <p className="text-[12px] font-semibold">
                Write with your voice
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-[#756a8d]">
                Tell the assistant how you want to sound and it will learn as
                you edit.
              </p>
            </div>
          </div>

          {/* INVITE */}
          <div className="mt-auto pt-12">
            <button className="flex items-center gap-2 px-3 text-[12px] text-[#8a8982] hover:text-[#45443f]">
              <Plus data-icon="inline-start" />
              Invite a teammate
            </button>
          </div>
        </aside>

        {/* CENTER EDITOR */}
        <section className="min-w-0 flex-1">
          {/* EDITOR TOOLBAR */}
          <div className="flex h-[56px] items-center justify-between border-b border-[#deded8] bg-[#fafaf8] px-5 lg:px-8">
            <div className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-[#33312c] shadow-sm ring-1 ring-[#e4e3dd]">
              Preview
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

          {/* PREVIEW */}
          {activeTab === 'write' ? (
            <div className="mx-auto max-w-[820px] px-5 py-8 lg:px-12 lg:py-12">
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9991]">
                    Draft / October 06, 2024
                  </p>

                  <h1 className="font-serif text-3xl tracking-[-0.03em] text-[#292824]">
                    A quieter way to make a living
                  </h1>
                </div>

              </div>

              <div className="overflow-hidden rounded-xl border border-[#dbdad4] bg-white shadow-[0_12px_35px_rgba(60,57,46,0.06)]">
                <div className="flex items-center justify-between border-b border-[#eeeee9] px-6 py-3 text-[11px] text-[#aaa9a1]">
                  <span>Untitled newsletter</span>
                  <span>412 words</span>
                </div>

                <article className="px-7 py-9 sm:px-14 sm:py-12">
                  <div className="mb-9 flex items-center justify-between">
                    <div className="font-serif text-[17px] font-bold tracking-tight">
                      Field Notes
                      <span className="text-[#a48ed7]">.</span>
                    </div>

                    <span className="text-[11px] text-[#9b9a92]">
                      Issue 04 / 24
                    </span>
                  </div>

                  <div className="mb-8 border-y border-[#ebeae4] py-5">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9b9a92]">
                      A note from the desk
                    </p>

                    <h2 className="max-w-[580px] font-serif text-[38px] leading-[1.06] tracking-[-0.045em] text-[#292824]">
                      {fieldNotes.headline}
                    </h2>
                  </div>

                  <div className="mb-8 aspect-[2.2/1] overflow-hidden rounded-lg bg-[#ebe8e0]">
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,#c7d2ca,transparent_34%),linear-gradient(120deg,#d9d2c2,#aaa99b)]">
                      <div className="h-[72%] w-[26%] rotate-6 rounded-[45%_45%_4%_4%] bg-[#6b7567]/70 shadow-2xl" />
                    </div>
                  </div>

                  <div className="max-w-[580px] font-serif text-[17px] leading-[1.65] text-[#4b4942]">
                    <p className="mb-5">
                      {fieldNotes.paragraphs[0]}
                    </p>

                    <p className="mb-5">
                      {fieldNotes.paragraphs[1]}
                    </p>

                  </div>

                  <div className="mt-10 flex items-center justify-between border-t border-[#ebeae4] pt-5 text-[11px] text-[#999890]">
                    <span>{fieldNotes.linkText}</span>
                    <span>{fieldNotes.website}</span>
                  </div>
                </article>

                <div className="flex items-center gap-2 border-t border-[#eeeee9] bg-[#fbfbf9] px-5 py-3 text-[#919089]">
                  {[Type, ImageIcon, Link2, List].map((Icon, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="icon"
                      aria-label="Editing tool"
                    >
                      <Icon data-icon="inline-start" />
                    </Button>
                  ))}

                  <span className="ml-auto text-[11px]">
                    Click anywhere to edit
                  </span>
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
                        Field Notes
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

              <article
                className="mx-auto mb-12 w-[calc(100%-2rem)] max-w-[760px] overflow-hidden rounded-lg bg-white shadow-sm sm:w-[calc(100%-5rem)]"
                dangerouslySetInnerHTML={{ __html: fieldNotesTemplateHtml }}
              />
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
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask anything about your draft..."
                  disabled={isGenerating}
                  className="min-h-[90px] w-full resize-none rounded-xl border border-[#dddcd5] bg-white p-3 pr-10 text-[12px] outline-none placeholder:text-[#aaa9a1] focus:border-[#a48ed7] focus:ring-2 focus:ring-[#eee8fb]"
                />

                <button
                  type="button"
                  onClick={() => void generateDraft()}
                  disabled={isGenerating || !prompt.trim()}
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
                  Preview the Field Notes newsletter in your inbox.
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
    </main>
  )
}

export default NewsletterEditor

