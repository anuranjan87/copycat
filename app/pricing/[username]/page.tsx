// app/pricing/[username]/page.tsx

import * as React from "react";
import Nav from "@/components/nav";

export default function Page({ params }: { params: { username: string } }) {
  const { username } = params;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

  <!-- Fonts -->
  <link href="https://db.onlinewebfonts.com/c/68b898f6044bbee439423445076f3168?family=Roxborough+CF+Thin" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

  <style>
    body{
      margin:0;
      background:black;
      font-family:'Inter',sans-serif;
      color:white;
    }

    .rox{
      font-family:"Roxborough CF Thin",serif;
      letter-spacing:-0.03em;
    }
  </style>
</head>

<body>

<section class="relative overflow-hidden bg-black px-6 lg:px-12 py-32">

  <!-- subtle atmosphere -->
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]"></div>

  <div class="relative z-10 max-w-6xl mx-auto">

    <!-- heading -->
    <div class="max-w-3xl mb-28">

      <p class="text-[10px] uppercase tracking-[0.28em] text-white/20 mb-8">
        Pricing
      </p>

      <h1 class="rox text-[58px] md:text-[82px] leading-[0.95] tracking-tight text-white mb-8">
        Not loud. <br>
        Just well made.
      </h1>

      <p class="max-w-xl text-white/40 text-[15px] leading-[1.9] font-light">
        Some people want attention.
        Some people just want their work to look right.
        7Wings is built for the second kind.
      </p>

    </div>

    <!-- pricing cards -->
    <div class="grid lg:grid-cols-2 gap-6">

      <!-- free -->
      <div class="rounded-[32px] border border-white/10 bg-white/[0.025] p-10">

        <div class="mb-14">

          <p class="text-[10px] uppercase tracking-[0.24em] text-white/20 mb-6">
            Foundation
          </p>

          <div class="flex items-end gap-3">

            <h2 class="rox text-[56px] leading-none text-white">
              Free
            </h2>

          </div>

        </div>

        <div class="space-y-7 mb-16">

          <div>
            <h3 class="text-white text-[15px] mb-2">
              Core templates
            </h3>

            <p class="text-white/35 text-sm leading-relaxed">
              Enough to launch something clean and thoughtful.
            </p>
          </div>

          <div>
            <h3 class="text-white text-[15px] mb-2">
              AI-assisted editing
            </h3>

            <p class="text-white/35 text-sm leading-relaxed">
              Edit layouts naturally without learning complicated tools.
            </p>
          </div>

          <div>
            <h3 class="text-white text-[15px] mb-2">
              Instant publishing
            </h3>

            <p class="text-white/35 text-sm leading-relaxed">
              No setup rituals. No technical friction.
            </p>
          </div>

        </div>

        <button class="w-full rounded-2xl border border-white/10 py-4 text-white text-sm hover:bg-white/[0.04] transition-all duration-300">
          Start building
        </button>

      </div>

      <!-- premium -->
      <div class="relative rounded-[32px] border border-white/15 bg-white/[0.045] p-10">

        <!-- badge -->
        <div class="absolute top-6 right-6">

          <span class="text-[9px] uppercase tracking-[0.2em] text-white/35 border border-white/10 rounded-full px-3 py-1">
            Premium
          </span>

        </div>

        <div class="mb-14">

          <p class="text-[10px] uppercase tracking-[0.24em] text-white/20 mb-6">
            Quietly premium
          </p>

          <div class="flex items-end gap-3 mb-4">

            <h2 class="rox text-[64px] leading-none text-white">
              €6.66
            </h2>

            <span class="text-white/30 text-sm mb-2">
              / month
            </span>

          </div>

          <p class="text-white/35 text-sm italic leading-relaxed max-w-sm">
            Unlock what you need, when you need it.
          </p>

        </div>

        <div class="space-y-7 mb-16">

          <div>
            <h3 class="text-white text-[15px] mb-2">
              One premium unlock every month
            </h3>

            <p class="text-white/45 text-sm leading-relaxed">
              Your unlocked templates stay forever.
            </p>
          </div>

          <div>
            <h3 class="text-white text-[15px] mb-2">
              Save and revisit projects
            </h3>

            <p class="text-white/45 text-sm leading-relaxed">
              Build slowly. Return whenever you want.
            </p>
          </div>

          <div>
            <h3 class="text-white text-[15px] mb-2">
              Full layout + code access
            </h3>

            <p class="text-white/45 text-sm leading-relaxed">
              Change things your way without platform limits.
            </p>
          </div>

          <div>
            <h3 class="text-white text-[15px] mb-2">
              Better aesthetics, less effort
            </h3>

            <p class="text-white/45 text-sm leading-relaxed">
              Because presentation still matters.
            </p>
          </div>

        </div>

        <button class="w-full rounded-2xl bg-white text-black py-4 text-sm font-medium hover:bg-neutral-200 transition-all duration-300">
          Continue
        </button>

        <p class="text-center text-[10px] tracking-[0.16em] uppercase text-white/15 mt-5">
          Cancel anytime
        </p>

      </div>

    </div>

    <!-- footer -->
    <div class="mt-28 flex flex-col items-center">

      <div class="w-16 h-px bg-white/10 mb-6"></div>

      <p class="text-white/15 uppercase tracking-[0.28em] text-[10px]">
        Built for independent builders
      </p>

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