// app/pricing/[username]/page.tsx

import * as React from "react";
import Nav from "@/components/nav";

export default function Page({ params }: { params: { username: string } }) {
  const { username } = params;

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

  <!-- Fonts -->
  <link href="https://db.onlinewebfonts.com/c/68b898f6044bbee439423445076f3168?family=Roxborough+CF+Thin" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Montserrat', sans-serif;
      background-color: black;
      margin: 0;
      padding: 0;
    }
    .rox {
      font-family: "Roxborough CF Thin", serif;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 10px;
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.3) transparent;
    }
  </style>
</head>
<body>

<!-- ================= PRICING SECTION ================= -->
<section class="relative w-full px-6 lg:px-16 py-32 bg-black overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_50%)]"></div>
  <div class="relative z-10 max-w-6xl mx-auto">
    <div class="max-w-3xl mx-auto text-center mb-24">
      <h1 class="rox text-[48px] md:text-[64px] text-white leading-[1.1] tracking-tight mb-8">
        Pricing, without bias.
      </h1>
      <p class="text-[18px] md:text-[20px] text-white/60 leading-relaxed font-light">
        Gain the same toolkit used by high-end agencies. Everything in our library is now your competitive advantage
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8 items-stretch">
      <!-- Foundation Card -->
      <div class="group flex flex-col h-full p-12 rounded-[32px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-700">
        <div class="mb-12">
          <h3 class="rox text-3xl text-white mb-3">Foundation</h3>
          <p class="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-8">Base Tier</p>
          <div class="text-5xl text-white font-light tracking-tighter rox">Free</div>
        </div>
        <ul class="space-y-5 text-white/50 text-sm mb-12 flex-grow">
          <li class="flex items-center gap-3"><span class="w-1 h-1 bg-white/20 rounded-full"></span> Core Templates</li>
          <li class="flex items-center gap-3"><span class="w-1 h-1 bg-white/20 rounded-full"></span> Basic Customization</li>
          <li class="flex items-center gap-3"><span class="w-1 h-1 bg-white/20 rounded-full"></span> Community Support</li>
        </ul>
        <button class="w-full py-4 rounded-2xl bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300 tracking-wide font-medium">
          Get Started
        </button>
      </div>

      <!-- Premium Card -->
      <div class="group relative flex flex-col h-full p-12 rounded-[32px] bg-white/[0.07] backdrop-blur-3xl border border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-white/40 transition-all duration-700">
        <div class="absolute top-0 right-0 p-6">
          <span class="text-[9px] bg-white text-black px-3 py-1 rounded-full font-bold tracking-widest uppercase">Elite</span>
        </div>
        <div class="mb-12">
          <div class="flex items-baseline gap-2 mt-6 mb-2">
            <span class="text-5xl text-white font-light tracking-tighter rox">₹666</span>
            <span class="text-white/40 text-sm">/ month</span>
          </div>
          <p class="text-white/50 text-sm italic">Unlock what you need, when you need it.</p>
        </div>
        <ul class="space-y-5 text-white/80 text-[15px] mb-12 flex-grow">
          <li class="flex items-center gap-3"><span class="w-1.5 h-1.5 bg-white rounded-full"></span> <strong>All Foundation features</strong></li>
          <li class="flex items-center gap-3"><span class="w-1.5 h-1.5 bg-white rounded-full"></span> Unlock one premium template every month</li>
          <li class="flex items-center gap-3"><span class="w-1.5 h-1.5 bg-white rounded-full"></span> Save and revisit your designs</li>
          <li class="flex items-center gap-3"><span class="w-1.5 h-1.5 bg-white rounded-full"></span> Full layout + code access</li>
        </ul>
        <button class="w-full py-4 rounded-2xl bg-white text-black hover:bg-neutral-200 transition-all duration-300 shadow-xl font-bold tracking-tight">
          Continue to Sovereign
        </button>
      </div>
    </div>

    <div class="text-center mt-32 text-white/20 text-xs tracking-[0.2em] uppercase">
      From Berlin with love
    </div>
  </div>
</section>

</body>
</html>`;

  return (
    <>
      {/* ✅ Pass params object as expected by Nav component */}
<Nav username={username} />
      <div className="relative w-full h-screen pt-16">
        <iframe
          srcDoc={htmlContent}
          title="7Winks Pricing Preview"
          className="absolute top-0 left-0 w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </div>
    </>
  );
}