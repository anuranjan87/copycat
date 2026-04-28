'use client'

import { useState, useRef, useEffect } from 'react'
import { SendIcon, Loader2 } from 'lucide-react'
import { updateWebsiteContent, generateCodeWithAI, generateCodeWithAIBlank } from "@/lib/website-actions"
import { useRouter } from "next/navigation";
import { toast } from "sonner"

export interface NewMobileProps {
  username: string
  initialContent: {
    html: string
    script: string
    data: string
  }
}

export default function New({ username, initialContent }: NewMobileProps) {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  
  // ✅ Persist bgVisible in localStorage (survives page refresh)
  const [bgVisible, setBgVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bgVisible")
      return stored !== null ? JSON.parse(stored) : true
    }
    return true
  })

  // ✅ Save to localStorage whenever bgVisible changes
  useEffect(() => {
    localStorage.setItem("bgVisible", JSON.stringify(bgVisible))
  }, [bgVisible])

  const extractDataFields = (dataString: string) => {
    return dataString
      .replace(/const\s+data\s*=\s*{/, '') // remove start
      .replace(/};?\s*$/, '')              // remove ending
      .trim()
  }
  const [dataCode, setDataCode] = useState(extractDataFields(initialContent.data))
  const [htmlCode, setHtmlCode] = useState(initialContent.html)

  const finalCode = htmlCode.replace(
    '<script type="text/babel">',
    `<script>
const data = {
${dataCode}
};
</script>
<script type="text/babel">`
  )

  const [devMode, setDevMode] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const result = await updateWebsiteContent(username, htmlCode, dataCode, dataCode)
      if (result.success) {
        toast.success("Successful, ", {
          description: "Click on 🏠 icon",
          position: "top-center",
        })
        console.log("published")
      } else {
        setMessage({ type: "error", text: result.error || "Failed to publish website" })
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <main className="bg-black text-white min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200/50 bg-white/80 py-2 px-35 backdrop-blur-lg shadow-lg tracking-[0.08em]" style={{ zoom: '0.57' }}>
        <div className="mx-auto flex max-w-9xl flex-col items-center justify-between px-6 md:flex-row">
          <div className="hidden items-center space-x-12 text-lg text-black md:flex">
            <div className='px-8'></div>
            <a href={`/dashboard/${username}`} className="transition hover:opacity-70">Dashboard</a>
            <a href={`/refunds/${username}`} className="transition hover:opacity-70">Refunds</a>
            <a href={`/templates/${username}`} className="transition hover:opacity-70">Templates</a>
            <a href="#" className="transition hover:opacity-70">Settings</a>
            <a href={`/pricing`} className="transition hover:opacity-70">Premium</a>
          </div>
          <button onClick={handlePublish} className="bg-red-600 text-white px-9 py-2.5 rounded-xl text-lg font-medium shadow-md hover:shadow-xl transition-all duration-300">
            {isPublishing ? (
              <Loader2 className="mr-2.5 h-6 w-6 animate-spin text-yellow-400" />
            ) : (
              <>Publish</>
            )}
          </button>
        </div>
      </nav>

      {/* View Toggle */}<div className="fixed bottom-5  -left-0 z-50" style={{ zoom: '1' }}>
  {/* Label */}
  <p className="text-[0.6rem] text-white/80 mb-1 ml-1 tracking-wide select-none">
    Device view
  </p>

  {/* Toggle Container */}
  <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.4)] py-1 px-1">
    
    {/* Active Indicator */}
    <div
      className="absolute top-1 left-1 h-8 w-16 bg-white/20 rounded-sm transition-all duration-300"
      style={{
        transform: viewMode === 'mobile'
          ? 'translateX(0px)'
          : 'translateX(64px)',
      }}
    />

    {/* Mobile Button */}
    <button
      onClick={() => setViewMode('mobile')}
      className={`relative z-10 flex items-center justify-center w-16 h-8 text-sm transition ${
        viewMode === 'mobile' ? 'text-white' : 'text-white/60'
      }`}
    >
      ▋
    </button>

    {/* Desktop Button */}
    <button
      onClick={() => setViewMode('desktop')}
      className={`relative z-10 flex items-center justify-center w-16 h-8 text-sm transition ${
        viewMode === 'desktop' ? 'text-white' : 'text-white/60'
      }`}
    >
      💻
    </button>
  </div>
</div>

      {/* Sidebar */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 " style={{ zoom: '1.1' }}>
        <div className="flex flex-col items-center gap-4 w-[110%] p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.4)] relative" >
          <a  href={`/${username}`} target="_blank" rel="noopener noreferrer" className="w-full p-2 rounded-4xl bg-white/10 hover:bg-white/30 rounded-sm transition-all flex justify-center">🏠</a>
          <a href={`/assets`} target="_blank" rel="noopener noreferrer" className="w-full p-2 rounded-4xl bg-white/10 hover:bg-white/30 rounded-sm transition-all flex justify-center">✜</a>
          <button className="w-full p-2 rounded-4xl bg-white/10 hover:bg-white/30 rounded-sm transition-all flex justify-center">↩️</button>
          <button className="w-full p-2 rounded-4xl bg-white/10 hover:bg-white/30 rounded-sm transition-all flex justify-center">↪️</button>
          <button className="w-full p-2 rounded-4xl bg-white/10 hover:bg-white/30 rounded-sm transition-all flex justify-center">🕘</button>
        </div>
      </div>

      {/* Hero Section with dynamic background image */}
      <section
        className="relative min-h-screen px-6 lg:px-16 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: bgVisible ? "url('https://i.postimg.cc/qv63BdKX/Chat-GPT-Image-Apr-11-2026-08-15-57-PM.png')" : 'none',
          backgroundColor: bgVisible ? 'transparent' : 'black', // fallback when image is off
        }}
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xs"></div>
        <div className="relative z-10 min-h-screen flex items-center">
          
          {/* Preview Container with relative positioning for toggle button */}
          <div 
            className={`relative w-[60%] h-[100%] flex justify-center transition-transform duration-500 origin-center`}
            style={{
              transform: viewMode === 'mobile' ? 'scale(1.3)' : 'scale(1)'
            }}
          >
            {/* RED TOGGLE BUTTON at top of preview screen */}
            <button
              onClick={() => setBgVisible(!bgVisible)}
              className="absolute -top-9 -right-1 z-20 bg-red-600 hover:bg-red-700 text-white  py-1 px-4 rounded-md shadow-lg transition-all duration-200 text-xs"
            >
              {bgVisible ? 'Hide BG' : 'Show BG'}
            </button>

            {/* Preview Card */}
            <div
              className={`relative bg-black-700/60 overflow-hidden rounded-sm  bg-white/10 backdrop-blur-md border border-white/20 rounded-xs shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.4)] p-5 ${
                viewMode === 'desktop' ? 'aspect-video w-full max-w-7xl' : 'w-[280px]'
              }`}
            >
              <div
                className={`overflow-hidden  rounded-sm bg-white ${
                  viewMode === 'desktop' ? 'w-full h-full' : 'w-[240px] h-[390px]'
                }`}
              >
                <div
                  className="origin-top-left  left-16"
                  style={{
                    transform: viewMode === 'mobile' ? 'scale(0.58)' : 'scale(0.42)',
                  }}
                >
                  <div
                    className="overflow-hidden "
                    style={{
                      width: viewMode === 'mobile' ? '435px' : '1580px',
                      height: viewMode === 'mobile' ? '812px' : '860px',
                    }}
                  >
                    <iframe
                      key={finalCode}
                      srcDoc={finalCode}
                      className="w-full h-full border-0 "
                      title="Preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="absolute -right-16 top-1/2 mt-4 -translate-y-1/2 w-[45.7%] h-[95%] bg-stone-700 shadow-2xl shadow-black/70 border border-black/40 flex flex-col z-20 custom-scrollbar">
            <div className="flex items-center justify-between px-7 py-4 mt-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500"></div>
                <div className="w-2 h-2 bg-yellow-400"></div>
                <div className="w-2 h-2 bg-green-500"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">Dev mode</span>
                <button onClick={() => setDevMode(!devMode)} className={`relative flex h-5 w-9 items-center rounded-sm transition-colors ${devMode ? 'bg-stone-500' : 'bg-gray-400'}`}>
                  <div className={`h-4 w-4 rounded-sm bg-white shadow transition-transform duration-300 ${devMode ? 'translate-x-full' : ''}`}/>
                </button>
              </div>
            </div>
          
            {devMode ? (
              <textarea value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} className="flex-1 bg-transparent py-3 px-5 text-sm font-mono text-white/80 outline-none resize-none overflow-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent" spellCheck="false"/>
            ) : (
              <textarea value={dataCode} onChange={(e) => setDataCode(e.target.value)} className="flex-1 bg-transparent py-4 px-5 text-sm font-mono text-white/80 outline-none resize-none overflow-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent" spellCheck="false" />
            )}
<div className="absolute bottom-4 left-4 w-[calc(100%-2rem)] max-w-md z-30">
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Ask AI to edit the content..."
        className="rounded-xl pr-12 pl-6 py-3 w-full text-white text-sm bg-black/20 border border-white/60 backdrop-blur-md shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_0_12px_rgba(0,0,0,0.4),0_6px_20px_rgba(0,0,0,0.25)] placeholder:text-white/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
      />
      <button className="inline-flex items-center justify-center px-4 py-2 text-black text-xs font-medium rounded-md bg-white/80 border border-white/30 backdrop-blur-md shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.3)] hover:bg-white/40 transition-all duration-300 absolute right-2 top-1/2 -translate-y-1/2">
        <SendIcon className="size-4" />
      </button>
    </div>
  </div>
          </div>
        </div>
      </section>
    </main>
  )
}