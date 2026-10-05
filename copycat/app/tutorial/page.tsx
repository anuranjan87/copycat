'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

import {
  Card,
  CardContent,
} from '@/components/ui/card'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { Button } from '@/components/ui/button'

import {
  Check,
  Copy,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
)

export default function LearnHTML() {
  const [editorMounted, setEditorMounted] = useState(false)

  useEffect(() => {
    setEditorMounted(true)
  }, [])

  const [interactiveCode, setInteractiveCode] = useState(`{
  section1: {
    heading: "Hello"
  }
}`)

  const [copied, setCopied] = useState(false)

  const getHeading = (code: string) => {
    const match = code.match(
      /heading\s*:\s*["'`]([\s\S]*?)["'`]/
    )

    return match ? match[1] : ''
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setInteractiveCode(value)
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  const pageHeading = getHeading(interactiveCode)

  const CodeBlock = ({
    code,
    height = '150px',
  }: {
    code: string
    height?: string
  }) => {
    return (
      <div className="relative my-10 overflow-hidden rounded-none border border-neutral-800 bg-[#0a0a0a]">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => copyCode(code)}
          className="absolute right-2 top-2 z-10 h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>

        {editorMounted && (
          <MonacoEditor
            height={height}
            language="javascript"
            theme="vs-dark"
            value={code}
            options={{
              minimap: {
                enabled: false,
              },
              fontSize: 13,
              lineHeight: 24,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: true,
              lineNumbers: 'on',
              folding: false,
              padding: {
                top: 20,
                bottom: 20,
              },
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#111111] selection:bg-neutral-900 selection:text-white">

      {/* HEADER */}

      <main className="mx-auto w-full max-w-[1040px] px-6 sm:px-8">

        {/* PAGE HEADER */}

        <div className="border-b border-neutral-900/10 py-20 md:py-28">

          <div className="mb-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">
            <span>7Wingz</span>
            <span>/</span>
            <span>Docs</span>
            <span>/</span>
            <span className="text-neutral-900">Page Content</span>
          </div>

          <h1 className="font-serif text-[52px] font-normal italic leading-[1.05] tracking-tight text-neutral-950 md:text-[72px]">
            Page Content
          </h1>

          <p className="mt-8 max-w-[800px] text-[20px] font-light leading-[1.6] tracking-wide text-neutral-600 md:text-[22px]">
            Learn how to change the words, images, buttons and other
            content on a 7Wingz website without touching the layout.
          </p>

        </div>


        {/* CONTENT */}

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_220px]">

          <article className="min-w-0 py-20">


            {/* INTRO */}

            <section
              id="what-is-page-content"
              className="mb-28"
            >

              <h2 className="font-serif text-[32px] font-normal leading-[1.15] text-neutral-950 md:text-[40px]">
                What is Page Content?
              </h2>

              <p className="mt-8 text-[18px] font-light leading-[1.8] text-neutral-700">
                A 7Wingz website has two simple parts:{' '}
                <strong className="font-medium tracking-wide uppercase text-[15px] text-neutral-950 underline underline-offset-4">
                  Page Content
                </strong>{' '}
                and{' '}
                <strong className="font-medium tracking-wide uppercase text-[15px] text-neutral-950 underline underline-offset-4">
                  Page Layout
                </strong>.
              </p>

              <div className="my-12 grid gap-6 sm:grid-cols-2">

                <Card className="rounded-none border-neutral-200 bg-white/50 shadow-none transition-all hover:border-neutral-900">
                  <CardContent className="p-8">

                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      01 / Focus
                    </p>

                    <p className="mt-3 font-serif text-[22px] font-normal text-neutral-950">
                      Page Content
                    </p>

                    <p className="mt-2 text-[15px] font-light leading-relaxed text-neutral-600 italic">
                      What your website says.
                    </p>

                  </CardContent>
                </Card>


                <Card className="rounded-none border-neutral-200 bg-white/50 shadow-none transition-all hover:border-neutral-900">
                  <CardContent className="p-8">

                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      02 / Design
                    </p>

                    <p className="mt-3 font-serif text-[22px] font-normal text-neutral-950">
                      Page Layout
                    </p>

                    <p className="mt-2 text-[15px] font-light leading-relaxed text-neutral-600 italic">
                      How your website looks.
                    </p>

                  </CardContent>
                </Card>

              </div>

              <p className="text-[18px] font-light leading-[1.8] text-neutral-700">
                Programmers usually call Page Content{' '}
                <code className="bg-neutral-200/60 px-2 py-0.5 font-mono text-[14px] text-neutral-900">
                  data.js
                </code>
                . It is simply a place to keep the things you want
                to change.
              </p>

            </section>


            {/* TWO FORMATS */}

            <section
              id="two-formats"
              className="mb-28"
            >

              <h2 className="font-serif text-[32px] font-normal leading-[1.15] text-neutral-950 md:text-[40px]">
                Two formats work
              </h2>

              <p className="mt-8 text-[18px] font-light leading-[1.8] text-neutral-700">
                7Wingz accepts Page Content in two formats.
                Both produce the same result.
              </p>


              <h3 className="mt-14 font-serif text-[22px] italic text-neutral-900">
                Option A — Full data statement
              </h3>

              <CodeBlock
                code={`const data = {
  section1: {
    heading: "Hello"
  }
};`}
              />


              <h3 className="mt-14 font-serif text-[22px] italic text-neutral-900">
                Option B — Just the content
              </h3>

              <CodeBlock
                code={`{
  section1: {
    heading: "Hello"
  }
}`}
              />


              <div className="mt-10 border-l border-neutral-900 pl-6 py-2">

                <p className="text-[15px] font-light leading-relaxed tracking-wide text-neutral-800 uppercase">
                  <strong className="font-semibold text-neutral-950">
                    Both work seamlessly.
                  </strong>{' '}
                  Select the structure suited to your workflow.
                </p>

              </div>

            </section>


            {/* CUSTOMIZE */}

            <section
              id="change-content"
              className="mb-28"
            >

              <h2 className="font-serif text-[32px] font-normal leading-[1.15] text-neutral-950 md:text-[40px]">
                Change the content
              </h2>

              <p className="mt-8 text-[18px] font-light leading-[1.8] text-neutral-700">
                Want a different heading?
                Change the value inside{' '}
                <code className="bg-neutral-200/60 px-2 py-0.5 font-mono text-[14px] text-neutral-900">
                  heading
                </code>.
              </p>

              <CodeBlock
                height="180px"
                code={`{
  section1: {
    heading: "You're just gonna scroll by without saying hi to polite cat?"
  }
}`}
              />

              <p className="text-[18px] font-light leading-[1.8] text-neutral-700">
                That's it.{' '}
                <strong className="font-normal italic text-neutral-950">
                  Change the words. Preserve the structure.
                </strong>
              </p>

            </section>


            {/* AI */}

            <section
              id="ask-ai"
              className="mb-28"
            >

              <h2 className="font-serif text-[32px] font-normal leading-[1.15] text-neutral-950 md:text-[40px]">
                Write it yourself or ask AI
              </h2>

              <p className="mt-8 text-[18px] font-light leading-[1.8] text-neutral-700">
                You don't have to write everything yourself.
                You can ask AI to create or update your Page Content.
              </p>


              <div className="my-10 flex gap-6 border-y border-neutral-200 py-8">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <Sparkles className="h-4 w-4 text-neutral-800" />
                </div>

                <div>

                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                    Prompt Example
                  </p>

                  <p className="mt-2 font-serif text-[20px] italic text-neutral-900">
                    "Change the heading to Welcome to 7Wingz."
                  </p>

                </div>

              </div>


              <CodeBlock
                code={`{
  section1: {
    heading: "Welcome to 7Wingz"
  }
}`}
              />


              <p className="text-[18px] font-light leading-[1.8] text-neutral-700">
                Just remember:{' '}
                <strong className="font-normal italic text-neutral-950">
                  change the content, not the architecture.
                </strong>
              </p>

            </section>


            {/* STRUCTURE */}

            <section
              id="structure"
              className="mb-28"
            >

              <h2 className="font-serif text-[32px] font-normal leading-[1.15] text-neutral-950 md:text-[40px]">
                Keep the structure
              </h2>

              <p className="mt-8 text-[18px] font-light leading-[1.8] text-neutral-700">
                Think of the structure as the skeleton.
                The words can change, but the skeleton should stay intact.
              </p>


              <CodeBlock
                code={`{
  section1: {
    heading: "Welcome to 7Wingz"
  }
}`}
              />


              <div className="border border-neutral-900 p-8 text-center bg-white">

                <p className="font-serif text-[24px] italic text-neutral-950">
                  "Change the clothes. Don't break the bones."
                </p>

              </div>

            </section>


            {/* INTERACTIVE */}

            <section
              id="try-it"
              className="mb-28"
            >

              <div className="mb-10">

                <h2 className="font-serif text-[32px] font-normal leading-[1.15] text-neutral-950 md:text-[40px]">
                  Try it yourself
                </h2>

                <p className="mt-8 text-[18px] font-light leading-[1.8] text-neutral-700">
                  Change the Page Content and watch the preview update
                  instantly.
                </p>

              </div>


              <Tabs
                defaultValue="editor"
                className="w-full"
              >

                <TabsList className="mb-6 h-auto rounded-none bg-transparent p-0 border-b border-neutral-200">

                  <TabsTrigger
                    value="editor"
                    className="rounded-none border-b-2 border-transparent px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] data-[state=active]:border-neutral-950 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Edit
                  </TabsTrigger>

                  <TabsTrigger
                    value="preview"
                    className="rounded-none border-b-2 border-transparent px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] data-[state=active]:border-neutral-950 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Preview
                  </TabsTrigger>

                </TabsList>


                <TabsContent value="editor">

                  <div className="overflow-hidden rounded-none border border-neutral-800 bg-[#0a0a0a]">

                    {editorMounted && (
                      <MonacoEditor
                        height="300px"
                        language="javascript"
                        theme="vs-dark"
                        value={interactiveCode}
                        onChange={handleEditorChange}
                        options={{
                          minimap: {
                            enabled: false,
                          },
                          fontSize: 13,
                          lineHeight: 24,
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: {
                            top: 20,
                            bottom: 20,
                          },
                        }}
                      />
                    )}

                  </div>

                </TabsContent>


                <TabsContent value="preview">

                  <div className="flex min-h-[300px] items-center justify-center border border-neutral-200 bg-white p-12">

                    <div className="text-center">

                      <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                        Live Preview
                      </p>

                      <h3 className="max-w-2xl font-serif text-[36px] font-normal leading-[1.1] text-neutral-950 md:text-[48px]">
                        {pageHeading || 'Your heading appears here'}
                      </h3>

                    </div>

                  </div>

                </TabsContent>

              </Tabs>

            </section>


            {/* FINAL */}

            <section className="border-t border-neutral-900/10 pt-20">

              <h2 className="font-serif text-[32px] font-normal leading-[1.15] text-neutral-950 md:text-[40px]">
                That's it
              </h2>

              <p className="mt-8 text-[18px] font-light leading-[1.8] text-neutral-700">
                Page Content is what your website says.
              </p>

              <p className="mt-2 text-[18px] font-light leading-[1.8] text-neutral-700">
                Page Layout is how your website looks.
              </p>

              <div className="mt-12 flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.2em] text-neutral-950">

                <span>
                  Change the content
                </span>

                <ArrowRight className="h-4 w-4" />

                <span>
                  7Wingz handles the rest
                </span>

              </div>

            </section>

          </article>


          {/* RIGHT SIDEBAR */}

          <aside className="hidden lg:block">

            <div className="sticky top-28 border-l border-neutral-200 pl-8 py-2">

              <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-950">
                Contents
              </p>

              <nav className="space-y-4 text-[13px] font-light tracking-wide text-neutral-500">

                <a
                  href="#what-is-page-content"
                  className="block transition-colors hover:text-neutral-950"
                >
                  What is Page Content?
                </a>

                <a
                  href="#two-formats"
                  className="block transition-colors hover:text-neutral-950"
                >
                  Two formats work
                </a>

                <a
                  href="#change-content"
                  className="block transition-colors hover:text-neutral-950"
                >
                  Change the content
                </a>

                <a
                  href="#ask-ai"
                  className="block transition-colors hover:text-neutral-950"
                >
                  Write it yourself or ask AI
                </a>

                <a
                  href="#structure"
                  className="block transition-colors hover:text-neutral-950"
                >
                  Keep the structure
                </a>

                <a
                  href="#try-it"
                  className="block transition-colors hover:text-neutral-950"
                >
                  Try it yourself
                </a>

              </nav>

            </div>

          </aside>

        </div>

      </main>

    </div>
  )
}