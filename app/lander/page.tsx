'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  const navigateHome = () => router.push('/')

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-black/40 py-4 px-6 md:px-16 backdrop-blur-xl tracking-[0.08em]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 h-6 w-[2px] bg-red-600"></div>
            <span className="text-xs font-extrabold tracking-[0.2em] uppercase">7WINKS</span>
          </div>

          <div className="hidden items-center space-x-12 text-[11px] uppercase tracking-widest font-medium md:flex">
            <Link href="/legal/privacy" className="transition hover:text-white text-white/50">Privacy</Link>
            <Link href="/legal/terms" className="transition hover:text-white text-white/50">Terms</Link>
            <Link href="/legal/support" className="transition hover:text-white text-white/50">Support</Link>
            <Link href="/legal/refund" className="transition hover:text-white text-white/50">Refund</Link>
          </div>

          <button
            onClick={navigateHome}
            className="bg-white text-black px-8 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
          >
            Publish
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat pt-52 scale-93"
        style={{ backgroundImage: "url('https://i.postimg.cc/PXvcpV7J/Chat-GPT-Image-May-8-2026-04-28-14-PM.png')" }}
      >
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:px-16">
          <div className="max-w-2xl">
            <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-white/40">01 / 7WINKS</p>
            <h1 className="rox text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              The future of <br />
              AI powered solutions
            </h1>
            <p className="mt-8 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
              Transform your business with cutting edge AI technology designed for seamless automation.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={navigateHome}
                className="rounded-full bg-[#f5a623] px-7 py-3 text-sm font-medium text-black shadow-lg shadow-orange-500/20 transition duration-300 hover:scale-105"
              >
                Explore Features
              </button>
              <button
                onClick={navigateHome}
                className="rounded-full border border-white/15 px-7 py-3 text-sm text-white transition hover:bg-white/10"
              >
                Start Building
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Second Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <p className="text-[11px] tracking-[0.2em] text-white/40 mb-4">01 / 7WINKS</p>
        <h1 className="rox text-4xl md:text-8xl leading-tight mb-6">
          Not a website builder.<br />
          A starting point.
        </h1>
        <p className="text-white/50 max-w-xl mb-10">
          7Winks gives you structured templates designed to convert — so you spend less time arranging pixels,
          and more time building something that matters.
        </p>
        <div className="flex gap-4">
          <Link href="/" className="px-6 py-3 bg-white text-black rounded-md text-sm hover:opacity-90 transition">
            Explore Templates
          </Link>
          <button
            onClick={navigateHome}
            className="px-6 py-3 border border-white/20 rounded-md text-sm hover:bg-white/10 transition"
          >
            Start Building
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 bg-black border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="rox text-[40px] md:text-[52px] text-center text-white mb-24 tracking-tight">
            It's simple to get started.
          </h2>
          <div className="grid md:grid-cols-3 gap-16 md:gap-8">
            {[
              { number: '1', title: 'Check eligibility.', desc: 'Answer a few questions about your organisation.' },
              { number: '2', title: 'Get verified.', desc: "You'll receive a verification email." },
              { number: '3', title: 'Dive in.', desc: 'Start using your assets to create change.' },
            ].map((item) => (
              <div key={item.number} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-white/10 group-hover:border-white/30 transition-all duration-500">
                  <span className="rox text-2xl text-white">{item.number}</span>
                </div>
                <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-white mb-4">{item.title}</h3>
                <p className="text-white/50 text-[15px] leading-relaxed max-w-[240px] font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-32 px-6 bg-black border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="rox text-[30px] md:text-[40px] text-white mb-12 tracking-tight">About 7Winks</h2>
          <p className="text-[16px] md:text-[19px] text-white/50 leading-[1.8] font-light tracking-wide">
            As a specialized creative ecosystem, 7WINKS empowers creators to build with precision. By merging
            high-end design aesthetics with your voice. We don’t just offer tools, we provide the architecture
            for digital visionaries. Headquartered in Berlin and serving a global network of visionaries, our
            mission is to ensure that every pixel tells a story of quality and intent.
          </p>
          <div className="mt-16 pt-8 border-t border-white/10 inline-block">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">
              Design System // v4.0.0 // Berlin
            </span>
          </div>
        </div>
      </section>

      {/* The Idea */}
      <section className="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="grid lg:grid-cols-14 gap-12">
          <div className="lg:col-span-4">
            <h2 className="rox text-[11px] uppercase tracking-[0.4em] text-white/40">The Idea</h2>
          </div>
          <div className="lg:col-span-8">
            <p className="rox text-[32px] md:text-[42px] text-white leading-[1.2] tracking-tight mb-8">
              Structure first, <span className="text-white/40 italic">creativity second.</span>
            </p>
            <p className="text-white/50 text-lg leading-relaxed max-w-xl font-light">
              Most builders give you too much freedom. We believe good design isn't about deciding everything
              from scratch—it's about moving forward with intent.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="flex justify-between items-end mb-24">
          <h2 className="rox text-[40px] tracking-tight text-white">How it works</h2>
          <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase hidden md:block">
            Process // 01—03
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-16">
          {[
            { num: '01', title: 'Pick a direction', desc: 'Start with a template that understands your goal—whether it’s launching, selling, or telling a story.' },
            { num: '02', title: 'Shape the content', desc: 'Use AI or manual editing to adapt the message. The structure stays intact—your voice fills it.' },
            { num: '03', title: 'Publish instantly', desc: 'No redesign loops. No layout breaking. What you see is already optimized for the modern web.' },
          ].map((item) => (
            <div key={item.num} className="group">
              <div className="rox text-5xl text-white/10 mb-8 group-hover:text-white/30 transition-all duration-700">
                {item.num}
              </div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white mb-4">{item.title}</h3>
              <p className="text-white/40 text-[15px] leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="max-w-6xl mx-auto px-6 py-40 border-t border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_70%)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="rox text-[11px] uppercase tracking-[0.5em] text-white/30 mb-12">Philosophy</h2>
          <p className="rox text-[36px] md:text-[48px] text-white leading-tight mb-10">
            "Good design is not about adding more—it’s about <span className="text-white/40">removing decisions.</span>"
          </p>
          <div className="h-[1px] w-20 bg-white/20 mx-auto"></div>
        </div>
      </section>

      {/* For everyone / For developers */}
      <section className="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="grid md:grid-cols-2 gap-20">
          <div className="p-12 rounded-[32px] bg-white/[0.02] border border-white/5">
            <h3 className="rox text-2xl text-white mb-6">For everyone</h3>
            <p className="text-white/50 text-[16px] leading-relaxed font-light">
              No-code users can move fast without worrying about layout. Everything is already structured to
              look professional by default.
            </p>
          </div>
          <div className="p-12 rounded-[32px] bg-white/[0.02] border border-white/5">
            <h3 className="rox text-2xl text-white mb-6">For developers</h3>
            <p className="text-white/50 text-[16px] leading-relaxed font-light">
              Full access to code and layout when you need control. Start simple, then go as deep as your
              project requires.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-48 text-center">
        <h2 className="rox text-[44px] md:text-[60px] text-white leading-tight mb-12 tracking-tighter">
          Start with something <br />that already works.
        </h2>
        <div className="flex flex-col items-center gap-8">
          <p className="text-white/40 tracking-[0.2em] uppercase text-xs">Then make it yours.</p>
          <button
            onClick={navigateHome}
            className="px-12 py-4 bg-white text-black rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center">
        <div className="text-white/20 text-[10px] tracking-[0.5em] uppercase">
          7WINKS // Built for clarity. // 2026
        </div>
      </footer>
    </div>
  )
}