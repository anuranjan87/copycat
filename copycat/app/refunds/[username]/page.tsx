// app/pricing/[username]/page.tsx

import * as React from "react";
import Nav from "@/components/nav";

export default function Page({ params }: { params: { username: string } }) {
  const { username } = params;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Some of Our Awesome Projects | React + Tailwind</title>
  
  <!-- Tailwind CSS v4 -->
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  
  <!-- React + Babel -->
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    .text-balance { text-wrap: balance; }
    .text-pretty { text-wrap: pretty; }
    body { text-rendering: optimizeLegibility; }
  </style>
</head>
<body class="antialiased">

<div id="root"></div>

<script type="text/babel">
  // -----------------------------------------------
  // DATA OBJECT – renamed to "Data" (capital D)
  // -----------------------------------------------
  const data = {
  header: {
  title: "Refunds, made simple and fair.",
  subtitle: "This is the place where you can understand how refunds work. We keep things clear and honest so you always feel safe while using 7winks."
},

firstGrid: {
  darkCard: {
    title: "Why refunds are easy here",
    text: "We don’t want anyone to feel stuck after paying. If you tried 7winks and it didn’t help you the way you expected, you can ask for a refund. No tricks, no confusing steps. We just check your request and help you quickly."
  },
  features: [
    {
      title: "Tell us what happened",
      description: "Just submit a small request and tell us why you want a refund. You don’t need big explanations. Simple words are enough."
    },
    {
      title: "We check honestly",
      description: "Our team reads your request carefully and fairly. We don’t try to reject you for small reasons."
    },
    {
      title: "Get your refund",
      description: "If everything is okay, your money is sent back safely to your original payment method."
    }
  ]
},

secondGrid: {
  features: [
    {
      title: "No hidden rules",
      description: "We clearly tell you what is allowed. No confusing terms or surprise conditions later."
    },
    {
      title: "Fast response",
      description: "We try to reply quickly because waiting for money is not a good feeling."
    },
    {
      title: "Respect first",
      description: "We treat every user with respect, whether you stay or leave."
    }
  ],
  darkCard: {
    title: "Why many still choose Premium",
    text: "Most users don’t ask for refunds because they start seeing value after using premium features. You get better templates, more control, and save a lot of time. But still, if it doesn’t work for you, we’re here to help you exit safely."
  }
}
  };

  // ---------- React App Component ----------
  const App = () => {
    // SVG icon components (hardcoded, not from data)
    const IconMessage = () => (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
    );
    const IconChart = () => (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    );
    const IconGear = () => (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    );
    const IconSync = () => (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
    );
    const IconUsers = () => (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
      </svg>
    );
    const IconZap = () => (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    );

    const getFirstIcon = (idx) => {
      if (idx === 0) return <IconMessage />;
      if (idx === 1) return <IconChart />;
      return <IconGear />;
    };
    const getSecondIcon = (idx) => {
      if (idx === 0) return <IconSync />;
      if (idx === 1) return <IconUsers />;
      return <IconZap />;
    };

    return (
      <main className="bg-gray-50 min-h-screen py-16 px-6 md:py-20 lg:py-24">
        <div className="max-w-3xl mx-auto">
          {/* HEADER */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
              {data.header.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
              {data.header.subtitle}
            </p>
          </div>

          {/* FIRST GRID */}
          <div className="grid gap-8 mb-16 lg:grid-cols-2">
            {/* Dark card */}
            <div className="bg-black text-white rounded-lg shadow overflow-hidden p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{data.firstGrid.darkCard.title}</h2>
              <p className="text-gray-300 text-lg leading-relaxed">{data.firstGrid.darkCard.text}</p>
            </div>
            {/* Three features */}
            <div className="space-y-8">
              {data.firstGrid.features.map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 text-gray-700 mt-1">
                    {getFirstIcon(idx)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECOND GRID */}
          <div className="grid gap-8 mb-8 lg:grid-cols-2">
            {/* Three features (second set) */}
            <div className="space-y-8">
              {data.secondGrid.features.map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 text-gray-700 mt-1">
                    {getSecondIcon(idx)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Dark card (Trello) */}
            <div className="bg-black text-white rounded-lg shadow overflow-hidden p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{data.secondGrid.darkCard.title}</h2>
              <p className="text-gray-300 text-lg leading-relaxed">{data.secondGrid.darkCard.text}</p>
            </div>
          </div>
        </div>
      </main>
    );
  };

  // Render the app into root
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
</script>
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