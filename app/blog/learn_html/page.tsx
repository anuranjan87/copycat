'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Header from "@/components/header2"


const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })



export default function LearnHTML() {
  const [editorMounted, setEditorMounted] = useState(false)

  useEffect(() => {
    setEditorMounted(true)
  }, [])

  const CodeExample = ({ code, height = '150px' }: { code: string, height?: string }) => (
    <div className="mb-6">
      {editorMounted && (
        <MonacoEditor
          height={height}
          language="html"
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
                top: 20, // Adjust the value to push the first line lower
              },
          }}
        />
      )}
    </div>
  )

  const [interactiveCode, setInteractiveCode] = useState('<h1>Hello, HTML!</h1>\n<p>Edit this code and see it update in real-time.</p>')

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setInteractiveCode(value)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8"><Header/><header>
      <h1 className="text-4xl font-bold mt-12 mb-6">Learn HTML in 15 Minutes: A Fun Guide to Building Web Pages</h1>
      
      <p className="mb-4">
        HTML (HyperText Markup Language) might sound like some secret language hackers use, but it's actually the most beginner-friendly way to start creating websites. Think of it as the blueprint for your favorite web pages—without it, the internet would be nothing but a blank, boring void.
      </p></header>

      <Image
        src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
        alt="HTML Code on a computer screen"
        width={1000}
        height={600}
        className="mb-6 rounded-lg"
      />

      <h2 className="text-2xl font-semibold mb-4">What Is HTML?</h2>
      <p className="mb-4">
        HTML is the language used to structure content on the web. It tells your browser, "Hey, this is a heading," or "Here's a cute cat picture." It's not a programming language (so no, you're not writing the next video game here), but it's still super powerful.
      </p>

      <h2 className="text-2xl font-semibold mb-4">HTML's Anatomy: Understanding the Basics</h2>
      <p className="mb-4">Every HTML document has a basic structure. Think of it like a sandwich:</p>

      <CodeExample code={`<!DOCTYPE html>
<html>
  <head>
    <title>My Awesome Page</title>
  </head>
  <body>
    <h1>Welcome to My Website</h1>
    <p>This is where the cool stuff happens!</p>
  </body>
</html>`} height="300px" />

      <h2 className="text-2xl font-semibold mb-4">Essential HTML Tags (with Fun Explanations)</h2>

      <h3 className="text-xl font-semibold mb-2">1. Headings</h3>
      <p className="mb-4">Headings are like chapter titles in a book—they grab attention. HTML has six levels of headings, from &lt;h1&gt; (the biggest) to &lt;h6&gt; (the smallest).</p>

      <CodeExample code={`<h1>This is a Main Heading</h1>
<h2>This is a Subheading</h2>
<h3>This is a Smaller Subheading</h3>`} />

      <h3 className="text-xl font-semibold mb-2">2. Paragraphs</h3>
      <p className="mb-4">Paragraphs are blocks of text that live inside &lt;p&gt; tags. Simple, right?</p>

      <CodeExample code={`<p>This is a paragraph of text. You can write whatever you want here, as long as it's interesting!</p>`} />

      <h3 className="text-xl font-semibold mb-2">3. Links</h3>
      <p className="mb-4">Links are the internet's teleportation devices. Want to send someone to another website? Use the &lt;a&gt; tag (short for "anchor").</p>

      <CodeExample code={`<a href="https://google.com">Click here to Google something!</a>`} />

      <h3 className="text-xl font-semibold mb-2">4. Images</h3>
      <p className="mb-4">Add some visuals to spice things up with the &lt;img&gt; tag.</p>

      <CodeExample code={`<img src="cat.jpg" alt="A cute cat lounging">`} />

      <Image
        src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
        alt="A cute cat lounging"
        width={1000}
        height={600}
        className="mb-6 rounded-lg"
      />

      <h3 className="text-xl font-semibold mb-2">5. Lists</h3>
      <p className="mb-4">HTML offers two kinds of lists:</p>

      <h4 className="text-lg font-semibold mb-2">Ordered Lists (numbered):</h4>
      <CodeExample code={`<ol>
  <li>Step 1: Wake up</li>
  <li>Step 2: Learn HTML</li>
  <li>Step 3: Rule the world</li>
</ol>`} />

      <h4 className="text-lg font-semibold mb-2">Unordered Lists (bullets):</h4>
      <CodeExample code={`<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>`} />

      <h2 className="text-2xl font-semibold mb-4">Attributes: The Extra Sprinkles</h2>
      <p className="mb-4">Attributes are like add-ons for your HTML tags. They provide extra information or functionality.</p>

      <CodeExample code={`<p id="intro" class="highlight" style="color: blue;">This paragraph is blue and highlighted.</p>`} />

      <h2 className="text-2xl font-semibold mb-4">Forms: HTML's Secret Superpower</h2>
      <p className="mb-4">Forms let you interact with users—like collecting their email addresses (for totally not spammy reasons).</p>

      <CodeExample code={`<form action="/submit" method="POST">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email">

  <button type="submit">Submit</button>
</form>`} height="250px" />

      <h2 className="text-2xl font-semibold mb-4">Common Mistakes (and How to Avoid Them)</h2>
      <h3 className="text-xl font-semibold mb-2">Forgetting to Close Tags</h3>
      <CodeExample code={`<p>Oops, I forgot to close this tag`} />

      <h3 className="text-xl font-semibold mb-2">Nesting Tags Incorrectly</h3>
      <CodeExample code={`<b><i>This is bold and italic</b></i>`} />

      <h3 className="text-xl font-semibold mb-2">Not Using ALT for Images</h3>
      <CodeExample code={`<img src="cat.jpg">`} />

      <h2 className="text-2xl font-semibold mb-4">Interactive HTML Editor</h2>
      <p className="mb-4">Now it's your turn! Use this interactive editor to write some HTML and see the results in real-time:</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg overflow-hidden">
          {editorMounted && (
            <MonacoEditor
              height="400px"
              language="html"
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
                    top: 20, // Adjust the value to push the first line lower
                  },
              }}
            />
          )}
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-2">Preview</h3>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: interactiveCode }}
          />
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">What's Next?</h2>
      <p className="mb-4">
        Congrats, you've just learned HTML basics! You're officially cooler than 99% of people who've never tried coding. Here's what you can do next:
      </p>
      <ul className="list-disc list-inside mb-6">
      <li>
  Supercharge Your Skills:  
  <a 
    href="https://tailwindgenie.com/playground" 
    style={{ color: '#FF5722', fontWeight: 'bold', textDecoration: 'none' }}
  >
      Explore the Playground Now!
  </a>
</li>      <li>Learn CSS: Make your web pages pretty.</li>
        <li>Explore JavaScript: Add interactivity and animations.</li>
        <li>Build Your First Web Page: Practice makes perfect.</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Final Words</h2>
      <p className="mb-4">
        HTML isn't rocket science—it's more like learning how to write a secret code for your browser. It's simple, logical, and surprisingly fun. With just a bit of practice, you'll be building cool stuff in no time.
      </p>
      <p className="mb-4">
        So, what are you waiting for? Go create your first web page and show it off to the world. And don't forget: every tech genius started with simple tags like &lt;h1&gt; and &lt;p&gt;.
      </p>
      <p className="font-bold">Happy coding! 🎉</p>
    </div>
  )
}

