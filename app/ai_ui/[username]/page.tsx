'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

type ImageResult = {
  id: string | null
  url: string
  thumb: string | null
  width: number | null
  height: number | null
  description: string | null
  photographer: string | null
  photographerUrl: string | null
  unsplashUrl: string | null
}

type Message = { role: 'user' | 'assistant'; content: string; images?: ImageResult[]; query?: string; url?: string; buttonLabel?: string; error?: boolean }

const examples = ['Quiet coastal morning', 'Modern desert architecture', 'Dinner with friends']

export default function Page() {
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    return () => document.documentElement.classList.remove('dark')
  }, [dark])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const value = message.trim()
    if (!value || loading) return
    setMessage('')
    setHistory((current) => [...current, { role: 'user', content: value }])
    setLoading(true)
    try {
      const response = await fetch('/api/unsplash-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: value,
          username: window.location.pathname.split('/').filter(Boolean).at(-1) || '',
          history: history.map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error || 'Something went wrong.')

      const assistantMessage: Message =
        data.type === 'publish'
          ? {
              role: 'assistant',
              content: data.reply || 'Your website has been published.',
              url: data.button?.url || data.editorUrl || data.url || `/edit_new/${window.location.pathname.split('/').filter(Boolean).at(-1) || ''}`,
              buttonLabel: data.button?.label || 'Open in Editor',
            }
          : data.type === 'site'
            ? {
                role: 'assistant',
                content: data.reply || 'Here is your website.',
                url: data.button?.url || data.editorUrl || data.url || `/edit_new/${window.location.pathname.split('/').filter(Boolean).at(-1) || ''}`,
                buttonLabel: data.button?.label || 'Open in Editor',
              }
            : data.type === 'chat'
              ? { role: 'assistant', content: data.reply || 'I’m here to help.' }
              : {
                  role: 'assistant',
                  content: data.query
                    ? `Here are some visual references for “${data.query}”.`
                    : 'Here are some visual references for your request.',
                  images: data.images ?? [],
                  query: data.query,
                }

      setHistory((current) => [...current, assistantMessage])
    } catch (caught) {
      setHistory((current) => [...current, { role: 'assistant', content: caught instanceof Error ? caught.message : 'Search failed.', error: true }])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setHistory([])
    setMessage('')
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-800 antialiased transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="fixed left-5 top-5 z-50 flex items-center gap-2 sm:left-6 sm:top-6">
        <button onClick={reset} title="New chat" aria-label="New chat" className="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <span className="text-xl leading-none">+</span>
        </button>
        <button onClick={() => setDark((value) => !value)} title="Toggle dark mode" aria-label="Toggle dark mode" className="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <span className="text-sm">{dark ? '☼' : '☾'}</span>
        </button>
      </div>

      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-between px-4 pb-36 pt-24 sm:px-6">
        {history.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center">
            <div className="rounded-2xl bg-black px-8 py-4 font-mono text-3xl font-black tracking-wider text-white shadow-lg dark:bg-white dark:text-black sm:text-4xl">frame</div>
            <p className="mt-5 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">Describe an image, mood, or moment and I&apos;ll find visual references from Unsplash.</p>
          </div>
        ) : (
          <div className="w-full space-y-7 text-sm leading-relaxed sm:text-base">
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {item.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-black">{item.content}</div>
                ) : (
                  <div className={`w-full py-2 ${item.error ? 'font-mono text-xs text-red-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
                    <p className="mb-4">{item.content}</p>
                    {item.url && (
                      <div className="mt-3">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                          {item.buttonLabel || 'Open website'}
                        </a>
                      </div>
                    )}
                    {item.images && item.images.length > 0 && <div className="grid gap-4 sm:grid-cols-2">
                      {item.images.map((image) => <figure key={image.id ?? image.url} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><a href={image.unsplashUrl ?? image.url} target="_blank" rel="noreferrer"><div className="aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800"><img src={image.url} alt={image.description ?? `Unsplash image for ${item.query}`} width={image.width ?? 800} height={image.height ?? 600} className="size-full object-cover transition duration-500 group-hover:scale-105" /></div></a><figcaption className="truncate px-4 py-3 text-xs text-zinc-500">Photo by {image.photographer ?? 'Unsplash creator'}</figcaption></figure>)}
                    </div>}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" aria-label="Searching" /></div>}
            <div ref={endRef} />
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center bg-gradient-to-t from-[#fafafa] via-[#fafafa] p-4 to-transparent dark:from-zinc-950 dark:via-zinc-950">
        <form onSubmit={search} className="flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-sm transition-shadow focus-within:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-r border-zinc-100 pr-3 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">Unsplash</div>
          <label htmlFor="image-request" className="sr-only">Describe the image you want</label>
          <input id="image-request" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe an image to find" maxLength={1000} className="min-h-10 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400" />
          <button type="submit" disabled={loading || !message.trim()} aria-label="Search images" className="grid size-10 place-items-center rounded-xl bg-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white dark:text-black">
            <span className="text-lg">↑</span>
          </button>
        </form>
        <div className="mt-3 flex max-w-2xl flex-wrap justify-center gap-2 text-xs text-zinc-500">
          <span className="mr-1 py-1.5">Try an idea:</span>
          {examples.map((example) => <button key={example} type="button" onClick={() => setMessage(example)} className="rounded-full border border-zinc-200 px-3 py-1.5 transition hover:border-zinc-500 dark:border-zinc-800 dark:hover:border-zinc-500">{example}</button>)}
        </div>
      </div>
    </main>
  )
}
