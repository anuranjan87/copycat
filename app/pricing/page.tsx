"use client"
import React, { useEffect } from 'react';

const PricingSection: React.FC = () => {
  // Inject external fonts into document head (avoids manual addition in index.html)
  useEffect(() => {
    // Add Montserrat and Roxborough fonts if they don't exist
    const linkMontserrat = document.createElement('link');
    linkMontserrat.rel = 'stylesheet';
    linkMontserrat.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap';
    
    const linkRoxborough = document.createElement('link');
    linkRoxborough.rel = 'stylesheet';
    linkRoxborough.href = 'https://db.onlinewebfonts.com/c/68b898f6044bbee439423445076f3168?family=Roxborough+CF+Thin';
    
    if (!document.querySelector('link[href*="Montserrat"]')) {
      document.head.appendChild(linkMontserrat);
    }
    if (!document.querySelector('link[href*="Roxborough"]')) {
      document.head.appendChild(linkRoxborough);
    }

    // Cleanup on unmount (optional, keeps head clean if component unmounts)
    return () => {
      if (linkMontserrat.parentNode) linkMontserrat.parentNode.removeChild(linkMontserrat);
      if (linkRoxborough.parentNode) linkRoxborough.parentNode.removeChild(linkRoxborough);
    };
  }, []);

  return (
    <>
      {/* Custom global styles for scrollbar and additional font styling */}
      <style>
        {`
          body {
            font-family: 'Montserrat', sans-serif;
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
        `}
      </style>

      {/* PRICING SECTION */}
      <section className="relative w-full px-6 lg:px-16 py-32 bg-black overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_50%)]"></div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="max-w-3xl mx-auto text-center mb-24">
            <h1 className="rox text-[48px] md:text-[64px] text-white leading-[1.1] tracking-tight mb-8">
              Pricing, without bias.
            </h1>
            <p className="text-[18px] md:text-[20px] text-white/60 leading-relaxed font-light">
              Gain the same toolkit used by high-end agencies. Everything in our library is now your competitive advantage
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Foundation Card */}
            <div className="group flex flex-col h-full p-12 rounded-[32px] 
                            bg-white/[0.03] backdrop-blur-2xl border border-white/10
                            shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                            hover:bg-white/[0.05] hover:border-white/20 transition-all duration-700">
              <div className="mb-12">
                <h3 className="rox text-3xl text-white mb-3">Foundation</h3>
                <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-8">Base Tier</p>
                <div className="text-5xl text-white font-light tracking-tighter rox">Free</div>
              </div>

              <ul className="space-y-5 text-white/50 text-sm mb-12 flex-grow">
                <li className="flex items-center gap-3">
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span> Core Templates
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span> Basic Customization
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span> Community Support
                </li>
              </ul>

              <button className="w-full py-4 rounded-2xl bg-white/5 text-white border border-white/10 
                                 hover:bg-white/10 hover:border-white/30 transition-all duration-300 tracking-wide font-medium">
                Get Started
              </button>
            </div>

            {/* Elite / Sovereign Card */}
            <div className="relative group flex flex-col h-full p-12 rounded-[32px] 
                            bg-white/[0.07] backdrop-blur-3xl border border-white/20
                            shadow-[0_40px_80px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.1)]
                            hover:border-white/40 transition-all duration-700">
              {/* Elite Badge */}
              <div className="absolute top-0 right-0 p-6">
                <span className="text-[9px] bg-white text-black px-3 py-1 rounded-full font-bold tracking-widest uppercase">
                  Elite
                </span>
              </div>

              <div className="mb-12">
                <div className="flex items-baseline gap-2 mt-6 mb-2">
                  <span className="text-5xl text-white font-light tracking-tighter rox">₹666</span>
                  <span className="text-white/40 text-sm">/ month</span>
                </div>
                <p className="text-white/50 text-sm italic">Unlock what you need, when you need it.</p>
              </div>

              <ul className="space-y-5 text-white/80 text-[15px] mb-12 flex-grow">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  <strong>All Foundation features</strong>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  Unlock one premium template every month
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  Save and revisit your designs
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  Full layout + code access
                </li>
              </ul>

              <button className="w-full py-4 rounded-2xl bg-white text-black hover:bg-neutral-200 
                                 transition-all duration-300 shadow-xl font-bold tracking-tight">
                Continue to Sovereign
              </button>
            </div>
          </div>

          {/* Footer text */}
          <div className="text-center mt-32 text-white/20 text-xs tracking-[0.2em] uppercase">
            From Berlin with love
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingSection;