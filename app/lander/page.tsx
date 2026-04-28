// app/page.jsx
import Nav from "@/components/nav";

export default function Page() {
  const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>7Winks</title>

  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet">

  <style>
    body { font-family: 'Montserrat', sans-serif; letter-spacing: 0.05em; }
    .rox { font-family: "Roxborough CF Thin", serif; }
  </style>
</head>

<body class="bg-black text-white">


<!-- ================= HERO ================= -->
<section class="max-w-5xl mx-auto px-6 pt-28 pb-20">

  <p class="text-[11px] tracking-[0.2em] text-white/40 mb-4">
    01 / 7WINKS
  </p>

  <h1 class="rox text-4xl md:text-8xl leading-tight mb-6">
    Not a website builder.<br>
    A starting point.
  </h1>

  <p class="text-white/50 max-w-xl mb-10">
    7Winks gives you structured templates designed to convert —  
    so you spend less time arranging pixels, and more time building something that matters.
  </p>

  <!-- CTA -->
  <div class="flex gap-4">
    <a href="#"
       class="px-6 py-3 bg-white text-black rounded-md text-sm hover:opacity-90 transition">
      Explore Templates
    </a>

    <button class="px-6 py-3 border border-white/20 rounded-md text-sm hover:bg-white/10 transition">
      Start Building
    </button>
  </div>

</section>


<section class="py-32 px-6 bg-black border-t border-white/5">
  <div class="max-w-6xl mx-auto">
    
    <h2 class="rox text-[40px] md:text-[52px] text-center text-white mb-24 tracking-tight">
      It's simple to get started.
    </h2>

    <div class="grid md:grid-cols-3 gap-16 md:gap-8">
      
      <div class="flex flex-col items-center text-center group">
        <div class="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-white/10 group-hover:border-white/30 transition-all duration-500">
          <span class="rox text-2xl text-white">1</span>
        </div>
        <h3 class="text-sm font-bold tracking-[0.15em] uppercase text-white mb-4">Check eligibility.</h3>
        <p class="text-white/50 text-[15px] leading-relaxed max-w-[240px] font-light">
          Answer a few questions about your organisation.
        </p>
      </div>

      <div class="flex flex-col items-center text-center group">
        <div class="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-white/10 group-hover:border-white/30 transition-all duration-500">
          <span class="rox text-2xl text-white">2</span>
        </div>
        <h3 class="text-sm font-bold tracking-[0.15em] uppercase text-white mb-4">Get verified.</h3>
        <p class="text-white/50 text-[15px] leading-relaxed max-w-[240px] font-light">
          You'll receive a verification email.
        </p>
      </div>

      <div class="flex flex-col items-center text-center group">
        <div class="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-500">
          <span class="rox text-2xl font-bold">3</span>
        </div>
        <h3 class="text-sm font-bold tracking-[0.15em] uppercase text-white mb-4">Dive in.</h3>
        <p class="text-white/50 text-[15px] leading-relaxed max-w-[240px] font-light">
          Start using your assets to create change.
        </p>
      </div>

    </div>
  </div>
</section>


<section class="py-32 px-6 bg-black border-t border-white/5">
  <div class="max-w-5xl mx-auto text-center">
    
    <h2 class="rox text-[30px] md:text-[40px] text-white mb-12 tracking-tight">
      About 7Winks
    </h2>

    <p class="text-[16px] md:text-[19px] text-white/50 leading-[1.8] font-light tracking-wide">
      As a specialized creative ecosystem, 7WINKS empowers creators to build with 
      precision. By merging high-end design aesthetics with your voice. We don’t just offer tools, we provide the architecture for digital visionaries. Headquartered in Berlin and serving a global network 
      of visionaries, our mission is to ensure that every pixel tells a story of 
      quality and intent.
    </p>

    <div class="mt-16 pt-8 border-t border-white/10 inline-block">
      <span class="text-[10px] tracking-[0.3em] uppercase text-white/30">
        Design System // v4.0.0 // Berlin
      </span>
    </div>

  </div>
</section>


<section class="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
  <div class="grid lg:grid-cols-14 gap-12">
    <div class="lg:col-span-4">
      <h2 class="rox text-[11px] uppercase tracking-[0.4em] text-white/40">The Idea</h2>
    </div>
    <div class="lg:col-span-8">
      <p class="rox text-[32px] md:text-[42px] text-white leading-[1.2] tracking-tight mb-8">
        Structure first, <span class="text-white/40 italic">creativity second.</span>
      </p>
      <p class="text-white/50 text-lg leading-relaxed max-w-xl font-light">
        Most builders give you too much freedom. We believe good design isn't about deciding everything from scratch—it's about moving forward with intent.
      </p>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
  <div class="flex justify-between items-end mb-24">
    <h2 class="rox text-[40px] tracking-tight text-white">How it works</h2>
    <span class="text-white/20 text-[10px] tracking-[0.3em] uppercase hidden md:block">Process // 01—03</span>
  </div>

  <div class="grid md:grid-cols-3 gap-16">
    <div class="group">
      <div class="rox text-5xl text-white/10 mb-8 group-hover:text-white/30 transition-all duration-700">01</div>
      <h3 class="text-xs font-bold tracking-[0.2em] uppercase text-white mb-4">Pick a direction</h3>
      <p class="text-white/40 text-[15px] leading-relaxed font-light">
        Start with a template that understands your goal—whether it’s launching, selling, or telling a story.
      </p>
    </div>

    <div class="group">
      <div class="rox text-5xl text-white/10 mb-8 group-hover:text-white/30 transition-all duration-700">02</div>
      <h3 class="text-xs font-bold tracking-[0.2em] uppercase text-white mb-4">Shape the content</h3>
      <p class="text-white/40 text-[15px] leading-relaxed font-light">
        Use AI or manual editing to adapt the message. The structure stays intact—your voice fills it.
      </p>
    </div>

    <div class="group">
      <div class="rox text-5xl text-white/10 mb-8 group-hover:text-white/30 transition-all duration-700">03</div>
      <h3 class="text-xs font-bold tracking-[0.2em] uppercase text-white mb-4">Publish instantly</h3>
      <p class="text-white/40 text-[15px] leading-relaxed font-light">
        No redesign loops. No layout breaking. What you see is already optimized for the modern web.
      </p>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-40 border-t border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_70%)]">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="rox text-[11px] uppercase tracking-[0.5em] text-white/30 mb-12">Philosophy</h2>
    <p class="rox text-[36px] md:text-[48px] text-white leading-tight mb-10">
      "Good design is not about adding more—it’s about <span class="text-white/40">removing decisions.</span>"
    </p>
    <div class="h-[1px] w-20 bg-white/20 mx-auto"></div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
  <div class="grid md:grid-cols-2 gap-20">
    <div class="p-12 rounded-[32px] bg-white/[0.02] border border-white/5">
      <h3 class="rox text-2xl text-white mb-6">For everyone</h3>
      <p class="text-white/50 text-[16px] leading-relaxed font-light">
        No-code users can move fast without worrying about layout. 
        Everything is already structured to look professional by default.
      </p>
    </div>
    <div class="p-12 rounded-[32px] bg-white/[0.02] border border-white/5">
      <h3 class="rox text-2xl text-white mb-6">For developers</h3>
      <p class="text-white/50 text-[16px] leading-relaxed font-light">
        Full access to code and layout when you need control. 
        Start simple, then go as deep as your project requires.
      </p>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-48 text-center">
  <h2 class="rox text-[44px] md:text-[60px] text-white leading-tight mb-12 tracking-tighter">
    Start with something <br/>that already works.
  </h2>
  <div class="flex flex-col items-center gap-8">
    <p class="text-white/40 tracking-[0.2em] uppercase text-xs">Then make it yours.</p>
    <a href="#" class="px-12 py-4 bg-white text-black rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
      Get Started Now
    </a>
  </div>
</section>

<footer class="py-6 border-t border-white/5 text-center">
  <div class="text-white/20 text-[10px] tracking-[0.5em] uppercase">
    7WINKS // Built for clarity. // 2026
  </div>



</footer>
</body>
</html>`;

  return (
    <>
      <Nav />
      <div className="relative w-full h-screen">
        <iframe
          srcDoc={htmlContent}
          title="7Winks Preview"
          className="absolute top-0 left-0 w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </div>
    </>
  );
}