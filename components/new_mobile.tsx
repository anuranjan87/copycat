'use client'

import { useState, useRef, useEffect } from 'react'
import { SendIcon } from 'lucide-react'

const DEFAULT_CODE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AI Section</title>

  <!-- Tailwind -->
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"><\/script>

  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet"/>

  <!-- React + Babel -->
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>

  <style>
    body {
      font-family: 'Montserrat', sans-serif;
      letter-spacing: 0.08em;
    }
    .rox {
      font-family: "Roxborough CF Thin", serif;
    }
  </style>
</head>

<body class="bg-[#9b4922]">

  <div id="root"><\/div>

  <script type="text/babel">

  const data = {
    brand: "FluxPlay",
    heading1: "Static games are over",
    subtext: "create living systems where rules shift, difficulty adapts, and stories emerge—not scripted",
    image: "https://i.postimg.cc/MKrHJ019/Untitled-2.png",
    scale: 1.2,
    translateX: 40,
    translateY: 22
  };

  function App() {
    return (
      <div>
        {/* NAV */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 py-2 backdrop-blur-sm origin-top">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between px-6 md:flex-row">
            <div className="mb-4 flex items-center md:mb-0">
              <div className="mr-3 h-8 w-1 bg-red-600"><\/div>
              <span className="text-sm font-extrabold tracking-widest uppercase text-black">
                {data.brand}
              <\/span>
            <\/div>

            <div className="rox hidden items-center space-x-12 text-lg text-[#9b4a24] md:flex">
              <a href="#">About<\/a>
              <a href="#">Services<\/a>
              <a href="#">Features<\/a>
            <\/div>

            <button className="bg-[#9b4a24] text-white px-6 py-2.5 rounded-lg text-sm">
              Explore Features
            <\/button>
          <\/div>
        <\/nav>

        {/* SECTION */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-10 py-20 lg:grid-cols-2 lg:px-1">
          <div className="relative">
            <img 
              src={data.image} 
              className="mt-5 w-full transition-all duration-500"
              style={{
                transform: \`
                  translateX(\${data.translateX}px) 
                  translateY(\${data.translateY}px) 
                  scale(\${data.scale})
                \`
              }}
            />
          <\/div>

          <div className="space-y-7 pl-4 lg:pl-10">
            <h1 className="rox mt-6 text-3xl text-white md:text-5xl">
              {data.heading1} 
            <\/h1>

            <p className="text-white md:text-lg">
              {data.subtext}
            <\/p>
          <\/div>
        <\/section>
      <\/div>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);

<\/script>

<\/body>
<\/html>`

export default function Home() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [devMode, setDevMode] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    updatePreview()
  }, [code])

  const updatePreview = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(code)
        doc.close()
      }
    }
  }

  return (
    <main className="bg-black text-white min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-40 border-b border-slate-200 bg-white/60 py-2 px-4 backdrop-blur-lg shadow-lg">
        <div className="mx-auto flex max-w-9xl flex-col items-center justify-between gap-3 md:flex-row md:gap-0">
          <div className="hidden items-center space-x-6 text-sm text-black md:flex">
            <a href="#" className="transition hover:opacity-70">Dashboard</a>
            <a href="#" className="transition hover:opacity-70">Refunds</a>
            <a href="#" className="transition hover:opacity-70">Templates</a>
            <a href="#" className="transition hover:opacity-70">Settings</a>
            <a href="#" className="transition hover:opacity-70">Premium</a>
          </div>
          <button className="bg-[#9b4a24] text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            Publish
          </button>
        </div>
      </nav>

      {/* View Toggle */}
      <div className="fixed top-16 left-4 right-4 z-40 md:top-4 md:left-4 md:right-auto">
        <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xs shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.4)] py-1 px-2 w-fit mx-auto md:mx-0">
          <div
            className="absolute top-1 h-8 w-16 bg-white/20 rounded-xs transition-all duration-300"
            style={{
              transform: viewMode === 'mobile' ? 'translateX(0px)' : 'translateX(64px)',
            }}
          />
          <button
            onClick={() => setViewMode('mobile')}
            className={`relative z-10 flex items-center justify-center gap-2 px-3 h-8 w-16 text-xs transition ${
              viewMode === 'mobile' ? 'text-white' : 'text-white/60'
            }`}
          >
            📱
          </button>
          <button
            onClick={() => setViewMode('desktop')}
            className={`relative z-10 flex items-center justify-center gap-2 px-3 h-8 w-16 text-xs transition ${
              viewMode === 'desktop' ? 'text-white' : 'text-white/60'
            }`}
          >
            🖥️
          </button>
        </div>
      </div>

      {/* Sidebar - Hidden on Mobile */}
      <div className="hidden md:flex fixed left-2 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col items-center gap-2 w-[70px] p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.4)]">
          <button className="w-full p-2 rounded-lg bg-white/10 hover:bg-white/30 transition-all flex justify-center text-base">🏠</button>
          <button className="w-full p-2 rounded-lg bg-white/5 hover:bg-white/30 transition-all flex justify-center text-base">✜</button>
          <button className="w-full p-2 rounded-lg bg-white/5 hover:bg-white/30 transition-all flex justify-center text-base">↩️</button>
          <button className="w-full p-2 rounded-lg bg-white/5 hover:bg-white/30 transition-all flex justify-center text-base">↪️</button>
          <button className="w-full p-2 rounded-lg bg-white/5 hover:bg-white/30 transition-all flex justify-center text-base">🕘</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-24 md:pt-20 px-4 md:px-6 pb-4 md:pb-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-full md:ml-24">
          
          {/* Preview Section */}
          <div className="w-full md:w-3/5 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div
                className="transition-transform duration-500 origin-center w-full"
                style={{
                  transform: viewMode === 'mobile' ? 'scale(1)' : 'scale(1)',
                }}
              >
                <div
                  className={`relative bg-black/40 overflow-hidden shadow-2xl shadow-black/90 border border-white/30 rounded-lg flex items-center justify-center mx-auto ${
                    viewMode === 'desktop'
                      ? 'aspect-video w-full max-w-2xl'
                      : 'w-full max-w-xs h-96'
                  }`}
                >
                  <div
                    className={`overflow-hidden bg-white ${
                      viewMode === 'desktop' ? 'w-full h-full' : 'w-full h-full'
                    }`}
                  >
                    <div
                      className="origin-top-left"
                      style={{
                        transform: viewMode === 'mobile' ? 'scale(0.75)' : 'scale(0.5)',
                      }}
                    >
                      <div
                        className="overflow-hidden"
                        style={{
                          width: viewMode === 'mobile' ? '375px' : '1560px',
                          height: viewMode === 'mobile' ? '812px' : '890px',
                        }}
                      >
                        <iframe
                          ref={iframeRef}
                          className="w-full h-full border-0"
                          title="Preview"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Editor Button on Mobile */}
            <div className="md:hidden flex justify-center mt-4">
              <button
                onClick={() => setShowEditor(!showEditor)}
                className="bg-[#9b4a24] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#7a3a1a] transition-colors"
              >
                {showEditor ? 'Hide Code' : 'Show Code'}
              </button>
            </div>
          </div>

          {/* Code Editor Section */}
          <div
            className={`w-full md:w-2/5 bg-stone-700 shadow-xl shadow-black/70 border border-black/40 flex flex-col rounded-lg overflow-hidden transition-all duration-300 ${
              showEditor ? 'block' : 'hidden md:flex'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500"></div>
                <div className="w-2 h-2 bg-yellow-400"></div>
                <div className="w-2 h-2 bg-green-500"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">Dev mode</span>
                <button
                  onClick={() => setDevMode(!devMode)}
                  className={`relative flex h-5 w-9 items-center rounded-sm transition-colors ${
                    devMode ? 'bg-stone-500' : 'bg-gray-400'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-sm bg-white shadow transition-transform duration-300 ${
                      devMode ? 'translate-x-full' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-4 text-xs md:text-sm font-mono text-white/80 outline-none resize-none overflow-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent"
              spellCheck="false"
            />

            {/* AI Input */}
            <div className="px-4 py-4 border-t border-white/10">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Ask AI to edit..."
                  className="rounded-lg pr-10 pl-4 py-2.5 w-full text-white text-xs bg-black/20 border border-white/60 backdrop-blur-md shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_0_12px_rgba(0,0,0,0.4)] placeholder:text-white/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                />
                <button className="inline-flex items-center justify-center p-1.5 text-black text-xs font-medium rounded-md bg-white/80 border border-white/30 backdrop-blur-md shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.3)] hover:bg-white/40 transition-all duration-300 absolute right-2 top-1/2 -translate-y-1/2">
                  <SendIcon className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
