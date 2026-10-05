'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from "@/components/header2"

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false
})

export default function LearnHTML() {
  const [editorMounted, setEditorMounted] = useState(false)

  useEffect(() => {
    setEditorMounted(true)
  }, [])

  const CodeExample = ({
    code,
    height = '150px'
  }: {
    code: string
    height?: string
  }) => (
    <div className="mb-6">
      {editorMounted && (
        <MonacoEditor
          height={height}
          language="javascript"
          theme="vs-dark"
          value={code}
          options={{
            minimap: { enabled: false },
            fontSize: 16,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly: true,
            padding: {
              top: 20,
            },
          }}
        />
      )}
    </div>
  )

  const [interactiveCode, setInteractiveCode] = useState(`{
  section1: {
    heading: "Hello"
  }
}`)

  /*
   * Get only the actual content from the Page Content.
   *
   * Example:
   *
   * {
   *   section1: {
   *     heading: "Hello"
   *   }
   * }
   *
   * returns:
   *
   * Hello
   */
  const getHeading = (code: string) => {
    const match = code.match(
      /heading\s*:\s*["'`]([\s\S]*?)["'`]/
    )

    if (match) {
      return match[1]
    }

    return ''
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setInteractiveCode(value)
    }
  }

  const pageHeading = getHeading(interactiveCode)

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />

      <header>
        <h1 className="text-4xl font-bold mt-12 mb-6">
          Learn 7Wingz Page Content in 5 Minutes
        </h1>

        <p className="mb-4">
          A 7Wingz template separates a website into two things:
          <strong> Page Content</strong> and <strong>Page Layout</strong>.
        </p>

        <p className="mb-4">
          Page Content is what your website says. Page Layout is how your
          website looks.
        </p>

        <p className="mb-6">
          Programmers call these <code>data.js</code> and{' '}
          <code>index.html</code> — technical names for a simple idea.
          <strong>
            {' '}
            Change the Page Content, and your website changes without
            disturbing the layout.
          </strong>
        </p>
      </header>

      <h2 className="text-2xl font-semibold mb-4">
        What Is Page Content?
      </h2>

      <p className="mb-4">
        Page Content is simply{' '}
        <strong>the stuff you actually want to change.</strong>
      </p>

      <p className="mb-4">
        Headings, text, buttons, images, prices, and more.
      </p>

      <p className="mb-4">
        Programmers call it <code>data.js</code>.
        We call it <strong>Page Content</strong> — because humans deserve
        human names.
      </p>

      <h2 className="text-2xl font-semibold mb-4">
        Two Formats Work
      </h2>

      <p className="mb-4">
        7Wingz accepts two different formats for Page Content.
        And yes, both work.
      </p>

      <h3 className="text-xl font-semibold mb-2">
        Option A — Full data statement
      </h3>

      <CodeExample
        code={`const data = {
  section1: {
    heading: "Hello"
  }
};`}
      />

      <h3 className="text-xl font-semibold mb-2">
        Option B — Just the content
      </h3>

      <CodeExample
        code={`{
  section1: {
    heading: "Hello"
  }
}`}
      />

      <p className="mb-6">
        <strong>Both work perfectly and give you the same result.</strong>
      </p>

      <h2 className="text-2xl font-semibold mb-4">
        Now Customize It
      </h2>

      <p className="mb-4">
        Want to change the heading?
        Just change the value.
      </p>

      <CodeExample
        code={`{
  section1: {
    heading: "You're just gonna scroll by without saying hi to polite cat?"
  }
}`}
        height="180px"
      />

      <p className="mb-6">
        That's it.
        <strong> You change the words. 7Wingz keeps the layout.</strong>
      </p>

      <h2 className="text-2xl font-semibold mb-4">
        Write It Yourself — or Ask AI
      </h2>

      <p className="mb-4">
        You can edit the Page Content yourself, or ask AI to help you write it.
      </p>

      <CodeExample
        code={`{
  section1: {
    heading: "Welcome to 7Wingz"
  }
}`}
      />

      <p className="mb-4">
        You can change the words however you like.
      </p>

      <p className="mb-6">
        Just remember one thing:
        <strong> change the content, but keep the structure intact.</strong>
      </p>

      <h2 className="text-2xl font-semibold mb-4">
        Structure Matters
      </h2>

      <p className="mb-4">
        Think of the structure as the skeleton.
      </p>

      <CodeExample
        code={`{
  section1: {
    heading: "Welcome to 7Wingz"
  }
}`}
      />

      <p className="mb-4">
        The words can change.
        The structure should stay the same.
      </p>

      <p className="mb-6">
        <strong>
          Change the clothes. Don't break the bones. 😎
        </strong>
      </p>

      <h2 className="text-2xl font-semibold mb-4">
        Try It Yourself
      </h2>

      <p className="mb-4">
        Change the Page Content below and see your content update instantly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* LEFT: EDITOR */}
        <div className="border rounded-lg overflow-hidden">
          {editorMounted && (
            <MonacoEditor
              height="300px"
              language="javascript"
              theme="vs-dark"
              value={interactiveCode}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: {
                  top: 20,
                },
              }}
            />
          )}
        </div>

        {/* RIGHT: ONLY THE ACTUAL CONTENT */}
        <div className="border rounded-lg p-4 flex items-center justify-center min-h-[300px]">
          <div className="text-3xl font-semibold text-center">
            {pageHeading}
          </div>
        </div>

      </div>

      <h2 className="text-2xl font-semibold mb-4">
        Final Words
      </h2>

      <p className="mb-4">
        Page Content is simply <strong>what your website says.</strong>
      </p>

      <p className="mb-4">
        Page Layout is <strong>how your website looks.</strong>
      </p>

      <p className="mb-4">
        Change the content. Keep the structure.
        Let 7Wingz handle the rest.
      </p>

      <p className="font-bold">
        Happy building! 🚀
      </p>
    </div>
  )
}