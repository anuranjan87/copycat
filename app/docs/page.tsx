"use client";

import Link from "next/link";
import React, { useState } from "react";

// ---------- PRODUCT DATA (template packs) ----------
const PRODUCTS = [
  {
    id: 1,
    name: "Horoscope AI Engine",
    price: 49500.00,
    image: "https://www.cnet.com/a/img/resize/d15d56ccc57f9711188e2415ea352c4e70d6641d/hub/2017/04/06/0b0715bf-11e6-4db5-afc1-e034384d6d20/hubblejupiter.jpg?auto=webp&width=1200",
    description:
      "A flawless, turn-key digital asset capturing the high-margin spiritual-tech market. Integrates premium minimalist layouts with a predictive Horoscope AI engine engineered for elite user retention.",
  },
  {
    id: 2,
    name: "Omni-Channel E-Commerce Suite",
    price: 89000.00,
    image: "https://www.extensiv.com/hubfs/Skubana/Blog%20Pages/Imported_Blog_Media/ecommerce%20shopping-Oct-12-2022-05-50-36-36-PM.jpg",
    description:
      "Too little infrastructure slows small stores. Too much infrastructure slows large enterprises. Our platform removes both extremes, reducing item setup to a single green button.",
  },
  {
    id: 3,
    name: "The 'Brilliant Cut' Concierge & AI Vault",
    price: 169000.00,
    image: "https://theboutiquechalet.com/wp-content/uploads/2020/02/concierge-1.jpg.webp",
    description:
      "Finding the right answer shouldn't depend on the size of your company. Our AI Concierge and Knowledge Vault make expertise instantly accessible.",
  },
];

// ---------- SIDEBAR SECTIONS (mapped to section IDs) ----------
const sections = [
  {
    title: "Introduction",
    items: [
      { label: "What is 7wingz?", id: "what-is-7wingz" },
      { label: "Why 7wingz", id: "why-7wingz" },
      { label: "Core Philosophy", id: "core-philosophy" },
      { label: "Getting Started", id: "getting-started" },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Templates", id: "templates" },
      { label: "AI Builder", id: "ai-builder" },
      { label: "Code Editor", id: "code-editor" },
      { label: "Publishing", id: "publishing" },
      { label: "Analytics", id: "analytics" },
      { label: "CRM", id: "crm" },
    ],
  },
  {
    title: "Developer",
    items: [
      { label: "React", id: "react" },
      { label: "Next.js", id: "nextjs" },
      { label: "Tailwind CSS", id: "tailwind" },
      { label: "API", id: "api" },
      { label: "Components", id: "components" },
    ],
  },
  {
    title: "Guides",
    items: [
      { label: "Create Website", id: "create-website" },
      { label: "Edit Website", id: "edit-website" },
      { label: "Publish Website", id: "publish-website" },
      { label: "Custom Domains", id: "custom-domains" },
      { label: "SEO", id: "seo" },
    ],
  },
];

// Helper: smooth scroll to section
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function Page() {
  // Cart state
  const [cartItems, setCartItems] = useState<
    { id: number; name: string; price: number; quantity: number; image: string }[]
  >([]);

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<(typeof PRODUCTS)[0] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Customer info (email, phone, address)
  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    phone: "",
    fullName: "",
    street: "",
    city: "",
    postalCode: "",
  });

  // ---------- CART HELPERS ----------
  const addToCart = (product: (typeof PRODUCTS)[0], qty: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          image: product.image,
        },
      ];
    });
  };

  const updateCartItemQuantity = (id: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const removeCartItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getTotalItems = () => cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  // Modal handlers
  const openProductModal = (product: (typeof PRODUCTS)[0]) => {
    setSelectedProduct(product);
    setQuantity(1);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCartFromModal = () => {
    if (selectedProduct && quantity > 0) {
      addToCart(selectedProduct, quantity);
      closeProductModal();
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- ORDER SUBMISSION (postMessage) ----------
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty. Pick a template pack to get started ✨");
      return;
    }

    const { email, phone, fullName, street, city, postalCode } = customerInfo;
    if (
      !email.trim() ||
      !phone.trim() ||
      !fullName.trim() ||
      !street.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      alert("Please fill in all fields: Email, Phone, Full Name, Street, City, Postal Code.");
      return;
    }

    const itemsList = cartItems.map((item) => ({
      itemName: item.name,
      quantity: item.quantity,
      itemTotal: (item.price * item.quantity).toFixed(2),
    }));

    const orderData = {
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: {
        fullName: customerInfo.fullName,
        street: customerInfo.street,
        city: customerInfo.city,
        postalCode: customerInfo.postalCode,
      },
      items: itemsList,
      totalAmount: getTotalPrice(),
      timestamp: new Date().toISOString(),
    };

    console.log("SENDING DATA:", orderData);
    if (typeof window !== "undefined") {
      window.parent.postMessage({ formData: orderData }, "*");
    }

    const itemsSummary = itemsList
      .map((i) => `  • ${i.itemName} x${i.quantity} = $${i.itemTotal}`)
      .join("\n");
    const alertMsg = `✅ ORDER PLACED!\n\n📧 Email: ${customerInfo.email}\n📞 Phone: ${customerInfo.phone}\n\n📍 Address:\n  ${customerInfo.fullName}\n  ${customerInfo.street}\n  ${customerInfo.city}, ${customerInfo.postalCode}\n\n📦 Items:\n${itemsSummary}\n\n💰 Total: $${getTotalPrice()}\n\nCheck console for full details.`;
    alert(alertMsg);

    setCartItems([]);
    setCustomerInfo({
      email: "",
      phone: "",
      fullName: "",
      street: "",
      city: "",
      postalCode: "",
    });
    setIsCartModalOpen(false);
  };

  // ---------- MODAL COMPONENTS ----------
  const ProductDetailModal = () => {
    if (!isProductModalOpen || !selectedProduct) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white w-full max-w-3xl mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-[#faf6f0] flex items-center justify-center p-6">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full max-h-72 object-contain rounded-lg drop-shadow-md"
            />
          </div>
          <div className="md:w-1/2 p-6 flex flex-col">
            <div className="flex justify-between items-start">
              <h3 className="text-3xl text-gray-700 tracking-wide" style={{ fontFamily: '"Roxborough CF Thin", serif' }}>
                {selectedProduct.name}
              </h3>
              <button onClick={closeProductModal} className="text-gray-400 hover:text-gray-800 text-2xl">
                ✕
              </button>
            </div>
            <p className="text-2xl font-light text-[#9b4a24] mt-2">${selectedProduct.price}</p>
            <p className="text-gray-600 text-sm leading-relaxed mt-4 tracking-wide">
              {selectedProduct.description}
            </p>
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCartFromModal}
                className="bg-[#2c2c2c] text-white px-6 py-2 rounded-md text-sm font-semibold tracking-wider hover:bg-black transition shadow-md"
              >
                ADD TO CART — ${(selectedProduct.price * quantity).toFixed(2)}
              </button>
            </div>
            <button onClick={closeProductModal} className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline self-start">
              continue shopping
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CartModal = () => {
    if (!isCartModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-[#fefaf5]">
            <h2 className="text-2xl text-gray-700 tracking-wide" style={{ fontFamily: '"Roxborough CF Thin", serif' }}>
              your basket 🧺
            </h2>
            <button
              onClick={() => setIsCartModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 transition text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="max-h-[45vh] overflow-y-auto custom-scroll px-6 py-4 bg-white">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-lg" style={{ fontFamily: '"Roxborough CF Thin", serif' }}>
                cart is dreaming ... add something magical
              </div>
            ) : (
              <div className="space-y-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md shadow-sm" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 tracking-wide">{item.name}</h4>
                      <div className="text-sm text-amber-700/80">${item.price}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-gray-800 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="ml-2 text-red-400 hover:text-red-600 text-xs underline"
                      >
                        remove
                      </button>
                    </div>
                    <div className="text-right font-mono text-gray-800 w-20">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 mt-2">
                  <span className="font-semibold text-gray-700">TOTAL</span>
                  <span className="text-xl tracking-wide text-[#9b4a24] font-bold" style={{ fontFamily: '"Roxborough CF Thin", serif' }}>
                    ${getTotalPrice()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handlePlaceOrder} className="border-t border-gray-100 px-6 py-5 bg-[#fbf9f6] space-y-4">
            <h3 className="text-sm uppercase tracking-[0.2em] text-gray-500" style={{ fontFamily: '"Roxborough CF Thin", serif' }}>
              contact & delivery
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                name="email"
                value={customerInfo.email}
                onChange={handleCustomerChange}
                placeholder="Email address *"
                className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                required
              />
              <input
                type="tel"
                name="phone"
                value={customerInfo.phone}
                onChange={handleCustomerChange}
                placeholder="Phone number *"
                className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                required
              />
              <input
                type="text"
                name="fullName"
                value={customerInfo.fullName}
                onChange={handleCustomerChange}
                placeholder="Full name *"
                className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                required
              />
              <input
                type="text"
                name="street"
                value={customerInfo.street}
                onChange={handleCustomerChange}
                placeholder="Street address *"
                className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                required
              />
              <input
                type="text"
                name="city"
                value={customerInfo.city}
                onChange={handleCustomerChange}
                placeholder="City *"
                className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                required
              />
              <input
                type="text"
                name="postalCode"
                value={customerInfo.postalCode}
                onChange={handleCustomerChange}
                placeholder="Postal code *"
                className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2c2c2c] hover:bg-black text-white font-medium py-3 rounded-md transition-all shadow-md hover:shadow-xl text-sm tracking-wider"
            >
              PLACE ORDER • secure checkout
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              order summary will be sent via postMessage (email, phone, address, items + total)
            </p>
          </form>
        </div>
      </div>
    );
  };

  // ---------- MAIN RENDER: Sidebar + Content ----------
  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-[270px] border-r border-gray-800 bg-gray-900 overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 z-20 border-b border-gray-800 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
              7
            </div>
            <div>
              <h1 className="font-semibold text-lg text-white">7wingz</h1>
              <p className="text-xs text-gray-400">Documentation</p>
            </div>
          </div>
        </div>
        <nav className="px-6 py-8 space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.id)}
                    className="block text-left w-full rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header with Cart Icon */}
        <header className="sticky top-0 z-20 border-b border-gray-800 bg-black/80 backdrop-blur">
          <div className="mx-auto max-w-4xl px-10 h-16 flex items-center justify-between">
            <div className="text-sm text-gray-400">Documentation</div>
            <div className="flex items-center gap-8 text-sm text-gray-300">
              <Link href="#" className="hover:text-white">Guides</Link>
              <Link href="#" className="hover:text-white">Templates</Link>
              <Link href="#" className="hover:text-white">API</Link>
              <Link href="#" className="hover:text-white">Showcase</Link>
              <Link href="#" className="hover:text-white">GitHub</Link>
              {/* Cart icon */}
              <button
                onClick={() => setIsCartModalOpen(true)}
                className="relative flex items-center gap-2 bg-gray-800 px-4 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-white"
              >
                <span className="text-xl">🛒</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {getTotalItems()}
                  </span>
                )}
                <span className="hidden sm:inline-block text-sm font-medium">
                  ${getTotalPrice()}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Sections - improved typography */}
        <div className="mx-auto max-w-3xl px-10 py-16">

          {/* --- INTRODUCTION (single column) --- */}
          <div className="mb-16" id="what-is-7wingz">
            <p className="uppercase tracking-[0.3em] text-xs text-gray-500 mb-4">
              Version 1
            </p>
            <section className="space-y-8" id="learning-curve">
              <h2 className="text-4xl font-light text-white leading-tight">
                Mastering <span className="font-bold">7wingz</span>
              </h2>
              <p className="text-lg leading-relaxed text-gray-300">
                Like any professional productivity tool—a DSLR camera, a video editor, or a design application—<span className="font-medium text-white">7wingz</span> rewards those who invest time in learning it.
              </p>
              <p className="text-lg leading-relaxed text-gray-300">
                You can build and publish a beautiful website in minutes, but unlocking the platform's full potential requires understanding how templates, structured content, AI editing, JavaScript data objects, SEO, analytics, and growth tools work together. The more you learn, the more value you gain.
              </p>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">Why Learning Matters</h3>
                <ul className="mt-4 space-y-3 text-gray-300">
                  <li>• Build websites with fewer design decisions.</li>
                  <li>• Customize templates without breaking layouts.</li>
                  <li>• Generate better results from AI using effective prompts.</li>
                  <li>• Improve search visibility with SEO best practices.</li>
                  <li>• Understand visitor behavior through analytics.</li>
                  <li>• Convert more visitors into customers using built‑in business tools.</li>
                </ul>
              </div>
            </section>

            {/* What is 7wingz? - two paragraphs */}
            <h2 className="text-3xl font-bold mt-16 mb-6 text-white">What is 7wingz?</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4 mb-6">
              A website isn't just a collection of pages—it's a digital storefront, a credibility signal, and often the first impression you make. But 90% of websites built with traditional tools never get meaningful traffic. They become digital tumbleweeds. The industry has normalized mediocrity.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              That's exactly why 7wingz exists. We combine thoughtful design, structured templates, and intelligent tools into a single workflow that helps ideas become real businesses. We don't just give you a site—we give you a fighting chance to be seen, trusted, and remembered.
            </p>
          </div>

          <hr className="my-16 border-gray-800" />

          {/* --- Why 7wingz? --- */}
          <section className="space-y-8 mb-16" id="why-7wingz">
            <h2 className="text-3xl font-semibold text-white">Why 7wingz?</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Because the industry suffers from survivorship bias. The 90% of published sites that get zero traffic aren't "bad designs"—they are statistical casualties of a post‑publish vacuum. Traditional builders treat the publish button as the finish line. That's a catastrophic abstraction error. The real battle begins after that click, where engagement decays exponentially without a built‑in re‑engagement mechanism.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              But 7wingz offers a way out. Our platform doesn't just generate HTML; we embed a persistent feedback loop. If your site isn't analyzing user intent and capturing leads within the first 8 seconds, you are statistically irrelevant. We built the rails to prevent that immediate decay. With 7wingz, your site keeps working for you long after launch.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          {/* --- Core Philosophy --- */}
          <section className="space-y-8 mb-16" id="core-philosophy">
            <h2 className="text-3xl font-semibold text-white">Core Philosophy</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Markets are random. Trends are noise. We don't chase "vibe coding" or "drag‑and‑drop"—both are just different flavors of input latency. The only sustainable advantage is a platform that becomes closer to your vision as data accrues. Every feature is a hedge against a specific failure mode.
            </p>
            <blockquote className="border-l-4 border-indigo-400 pl-6 text-xl font-medium italic text-gray-200">
              Create. Publish. Connect.
            </blockquote>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              "Create" is the entry cost. "Publish" is the exposure to volatility. But "Connect" is the asymmetric upside—and we engineer that third step to be automatic, compounding engagement to the point where switching costs become an impenetrable moat for your business, not a barrier for you.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          {/* --- Getting Started --- */}
          <section className="space-y-8 mb-16" id="getting-started">
            <h2 className="text-3xl font-semibold text-white">Getting Started</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Let's be honest—the learning curve is real. You can't expect to master a professional tool without effort. Blank canvas builders are a myth; they give you an empty page and call it freedom. But freedom without structure is paralysis.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              That's why 7wingz is intentionally different. Instead of starting from scratch, you get professionally designed templates built for real‑world goals. Choose a template that fits your business, portfolio, or brand—and you have a production‑ready foundation in minutes. Personalize with AI, edit visually, or dive into the code. We've designed the path to be rewarding, not punishing.
            </p>
            <p className="text-lg leading-relaxed text-gray-300">
              Every change is reflected instantly in the live preview, allowing you to iterate quickly. When you're satisfied, publish your website with a single click.
            </p>

            <h3 className="text-2xl font-semibold text-white pt-6">Editing Values</h3>
            <p className="text-lg leading-relaxed text-gray-300">
              Our templates store their editable content inside a JavaScript data object. To customize your website, simply replace the text inside the quotation marks (<code className="text-white">""</code>) with your own content. That way, you won't need to modify the HTML or JavaScript logic.
            </p>
            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0b1220] p-5 text-sm text-gray-300">
{`
  hero: {
    title: "Build websites in minutes",
    subtitle: "Create beautiful websites with AI.",
    button: "Start Building"
  };`}
            </pre>
            <p className="text-lg leading-relaxed text-gray-300">
              To change the heading, edit only the value inside the quotation marks:
            </p>
            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0b1220] p-5 text-sm text-gray-300">
{`title: "Build websites in minutes"

↓

title: "Launch Your Startup Today"`}
            </pre>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-amber-300 font-medium">Tip</p>
              <p className="mt-2 leading-7 text-gray-300">
                Only edit the text inside the quotation marks (<code className="text-white">""</code>). Leave the property names (<code className="text-white">title</code>, <code className="text-white">subtitle</code>, <code className="text-white">button</code>) and the surrounding syntax unchanged. This ensures your template continues to work correctly.
              </p>
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          {/* --- PLATFORM sections (two paragraphs each) --- */}
          <section className="space-y-8 mb-16" id="templates">
            <h2 className="text-3xl font-semibold text-white">Templates</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Beauty is subjective. Runtime performance is not. Most template marketplaces are filled with bloated, slow code that looks great in a demo but crumbles on a throttled 3G connection. The average user won't forgive a 2‑second delay; they'll just leave.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              Our templates are engineered to a strict <span className="font-mono text-sm text-gray-400">LCP</span> budget of &lt; 900ms—not because the average user notices, but because the 95th percentile user on a throttled connection <em className="text-white">will</em> abandon the page if we miss that window. We've A/B tested these structures across 12,000+ sites. The 'ugly' variant that loads in 0.8s consistently outperforms the 'stunning' variant that loads in 2.2s. We optimize for the fat tail of impatient, bandwidth‑starved visitors—and that pays off for everyone.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Failsafe grid layouts that gracefully degrade on flexbox edge-cases</li>
              <li>Font-display swap strategies to prevent FOIT (Flash of Invisible Text)</li>
              <li>Semantic HTML5 built‑in—not as an afterthought</li>
              <li>Pixel‑perfect fallback for legacy browsers via PostCSS</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950 p-8 mt-10 mb-16">
            <h2 className="text-3xl font-bold text-white mb-3">When a visitor submits a form</h2>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-800 p-6 text-sm leading-7 text-slate-200">
{`Visitor types
      │
      ▼
Input fields
      │
      ▼
customerInfo object
      │
      ▼
Place Order button
      │
      ▼
handleFormSubmit()
      │
      ▼
Create order data
      │
      ▼
Send to 7wingz`}
            </pre>
          </section>

          <section className="space-y-8 mb-16" id="form-submission">
            <h2 className="text-3xl font-semibold text-white">Handling Form Submission</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Most form handlers are a security nightmare—they expose your backend to spam, injection attacks, and data leaks. You can't just trust any form to work safely.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              That's why 7wingz uses a clean, secure pattern. Once the user clicks the <span className="text-white font-medium">Submit</span> button, the <code className="text-cyan-400">handleSubmit()</code> function is executed. It collects all the form values, converts them into a JavaScript object, and sends the data to 7wingz using <code className="text-cyan-400">postMessage()</code>—keeping your data safe and your backend simple.
            </p>
            <div className="rounded-xl border border-gray-800 bg-[#0B1220] overflow-hidden">
              <div className="border-b border-gray-800 px-5 py-3 bg-[#111827]">
                <p className="text-sm font-medium text-gray-200">Example: handleSubmit()</p>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-7 text-gray-300">
                <code>{`const handleSubmit = (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const values = Object.fromEntries(formData.entries());

  console.log("SENDING DATA:", values);

  window.parent.postMessage(
    { formData: values },
    "*"
  );
};`}</code>
              </pre>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
              <h3 className="text-lg font-semibold text-white mb-2">What each line does</h3>
              <ul className="space-y-3 text-gray-300 leading-7">
                <li><code className="text-cyan-400">e.preventDefault()</code> stops the browser from refreshing the page.</li>
                <li><code className="text-cyan-400">new FormData(e.target)</code> collects every input field inside the form.</li>
                <li><code className="text-cyan-400">Object.fromEntries()</code> converts the form into a simple JavaScript object.</li>
                <li><code className="text-cyan-400">console.log()</code> lets you inspect the data in the browser console.</li>
                <li><code className="text-cyan-400">window.parent.postMessage()</code> sends the collected form data to the 7wingz platform.</li>
              </ul>
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="ai-builder">
            <h2 className="text-3xl font-semibold text-white">AI Website Builder</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Most AI systems today are powered by Retrieval-Augmented Generation (RAG)—the AI keeps looking things up but it never truly learned them. That leads to generic, inconsistent results. The industry defaults to the cheapest approach, not the best.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              We chose to go all‑in on fine‑tuning instead. It's like cramming notes into a student's pocket before every test versus teaching them the subject so well they don't need the notes. We prefer teaching. A well‑trained model is faster, more consistent, and far less likely to improvise when precision matters. Your AI‑generated sites will be on‑brand and reliable.
            </p>
            <div className="mt-10 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-6">
              <h3 className="text-xl font-semibold text-emerald-300">Need a Turnkey Fine‑Tuned LLM Solution?</h3>
              <p className="mt-3 leading-7 text-slate-300">
                If you're looking to build a production‑ready AI application with a fine‑tuned LLM, seamless integrations, and a user‑friendly interface, we'd be happy to help.
              </p>
              <a
                href="mailto:sales@7wingz.com"
                className="mt-5 inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Contact Us — sales@7wingz.com
              </a>
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          {/* --- Developer sections (two paragraphs) --- */}
          <section className="space-y-8 mb-16" id="react">
            <h2 className="text-3xl font-semibold text-white">React</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Maintaining expensive build servers just to render React is a waste of money. Most platforms pass that cost to you with high monthly fees and slow preview times.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              We transpile React in the browser using Babel, turning every user's browser into its own build environment. No server‑side compilation. No rendering queues. Virtually zero infrastructure cost per preview. That's an unfair advantage. The more users we have, the less our costs scale compared to traditional platforms. It also enables a sustainable freemium model—because we're not paying for every render. One thing we've learned: if you offer free server compute, users will eventually treat it like free crypto mining. Client‑side rendering removes that problem entirely.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="nextjs">
            <h2 className="text-3xl font-semibold text-white">Next.js</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              If your entire app is client‑side hydrated, you are betting that the user's device will parse 500KB of JavaScript before they can read the first word. That's a losing bet on mobile.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              Next.js allows us to render the critical path on the edge server, effectively moving compute closer to the user to minimize the <span className="font-mono text-sm text-gray-400">TTFB</span> variance. However, SSR comes with a tax: cold starts. We use ISR (Incremental Static Regeneration) to serve stale‑while‑revalidate, ensuring that the 90th percentile user doesn't suffer from a lambda spin‑up latency spike. Your pages stay fast, always.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="tailwind-css">
            <h2 className="text-3xl font-semibold text-white">Tailwind CSS</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Maintaining thousands of custom CSS rules is a recipe for technical debt. Over time, stylesheets become unmanageable and inconsistent.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              We chose <span className="font-semibold text-white">Tailwind CSS</span> because it makes design deterministic. Instead of inventing class names and managing global styles, you work with utility classes that map directly to design tokens. This lowers maintenance costs and ensures a platform that can scale without accumulating years of styling debt.
            </p>
            <div className="rounded-xl border border-gray-800 bg-[#0B1220] overflow-hidden">
              <div className="border-b border-gray-800 px-4 py-2 bg-[#111827]">
                <span className="text-sm font-medium text-gray-300">Traditional CSS</span>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-7 text-gray-300">
{`/* styles.css */
.primary-button {
  background: #2563eb;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
}

/* component */
<button class="primary-button">
  Get Started
</button>`}
              </pre>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#0B1220] overflow-hidden">
              <div className="border-b border-gray-800 px-4 py-2 bg-[#111827]">
                <span className="text-sm font-medium text-gray-300">Tailwind CSS</span>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-7 text-gray-300">
{`<button
  className="
    bg-blue-600
    text-white
    px-6
    py-3
    rounded-lg
    hover:bg-blue-700
    transition
  "
>
  Get Started
</button>`}
              </pre>
            </div>
            <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-4">
              <p className="text-sm leading-7 text-gray-300">
                <span className="font-semibold text-blue-400">Key Insight:</span> With Tailwind, the styling lives directly beside the component instead of in a separate stylesheet. There's no need to invent CSS class names or manage large style files. Every utility maps to a predefined design token, keeping the UI consistent while allowing unused styles to be removed automatically during production.
              </p>
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="api">
            <h2 className="text-3xl font-semibold text-white">API</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Most APIs are a mess—inconsistent endpoints, poor documentation, and rate limits that kill your productivity.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              Our API is designed to be simple, predictable, and well‑documented. Whether you're integrating fine‑tuned LLMs or building custom workflows, we give you the tools to extend 7wingz without fighting the system.
            </p>
            <div className="mt-10 rounded-xl border border-blue-800/50 bg-blue-950/30 p-6">
              <h3 className="text-xl font-semibold text-blue-300">Need API Access for Fine‑Tuned LLMs?</h3>
              <p className="mt-3 leading-7 text-slate-300">
                If you're looking for production‑ready API access to fine‑tuned LLMs, we can help you integrate custom AI models into your existing applications and workflows without changing your frontend.
              </p>
              <a
                href="mailto:sales@7wingz.com"
                className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Contact Us — sales@7wingz.com
              </a>
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="template-architecture">
            <h2 className="text-3xl font-semibold text-white">Template Architecture</h2>
            <p className="text-lg leading-relaxed text-gray-300">
              Every 7wingz template follows the same architecture. Instead of mixing HTML, content, and business logic together, each template is divided into independent layers that make it easy to customize, maintain, and generate with AI.
            </p>
            <p className="text-lg leading-relaxed text-gray-300">
              Recreating the architecture is only a small part of the work. The real value comes from the complete ecosystem: production‑ready templates, reusable components, AI workflows, continuous improvements, and hundreds of engineering decisions refined over time.
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0b1220] p-6">
              <pre className="whitespace-pre text-sm leading-7 text-gray-300">
{`HTML Boilerplate
        │
        ▼
React + Babel
(Client-Side Rendering)
        │
        ▼
Data Object
(Content & Configuration)
        │
        ▼
React Components
(Reusable Sections)
        │
        ▼
App Component
(Page Assembly)
        │
        ▼
Rendered Website`}
              </pre>
            </div>
            <p className="text-lg leading-relaxed text-gray-300">
              With 7wingz Premium, you can start with this architecture and focus on building your business instead of rebuilding infrastructure. By doing so, you avoid investing significant engineering time to solve the same problems we've already solved.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">HTML Boilerplate</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  Provides the page structure and loads the required libraries, including Tailwind CSS, React, ReactDOM, and Babel.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">React + Babel</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  Babel transpiles JSX directly in the browser, allowing React to render the website on the client without requiring a build step.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">Data Object</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  Stores all editable content, including navigation, headings, text, images, buttons, and section‑specific configuration. Most website updates only require editing this object.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">React Components</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  Each website section is built as a reusable React component that receives its content from the data object, making templates modular and easy to reuse.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 md:col-span-2">
                <h3 className="text-lg font-semibold text-white">App Component</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  The main <code>App</code> component assembles all sections together and renders the complete website. Every 7wingz template follows this same architecture regardless of its design or industry.
                </p>
              </div>
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="publishing">
            <h2 className="text-3xl font-semibold text-white">Publishing (Platform)</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Publishing on many platforms is a gamble—you hit deploy and cross your fingers. Downtime, broken assets, and slow rollbacks are common.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              Reliable publishing is as much about speed as it's about consistency. Every time you publish, we automatically prepare, optimize, and deploy your website using the same production workflow as your previous release. Each release is version‑controlled, enabling safe updates and instant recovery. Our aim is to transform publishing from a technical operation into a predictable business workflow.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="dashboard">
            <h2 className="text-3xl font-semibold text-white">Dashboard</h2>
            <p className="text-lg leading-relaxed text-gray-300">
              Publishing a website is only the beginning. Once your website is live, 7wingz continuously tracks how visitors interact with it, giving you the information you need to grow your business—not just your website.
            </p>
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Real‑Time Website Monitoring</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  View live visitors, total traffic, and incoming customer enquiries from a single dashboard. Every important metric is available immediately after publishing—no third‑party analytics setup required.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Performance Analytics</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  Track traffic trends over time with interactive charts that help you understand how your website is growing. Switch between daily and monthly views to monitor performance.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Built‑in Customer Inbox</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  Every enquiry submitted through your website is automatically collected in one centralized inbox. Instead of managing emails across multiple platforms, customer conversations remain organized alongside your website analytics.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Everything in One Platform</h3>
                <p className="mt-3 leading-7 text-gray-300">
                  You no longer need separate tools for analytics, contact form management, visitor tracking, and reporting. 7wingz brings these capabilities together in a single platform, allowing you to manage your website from one dashboard.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-pink-800/40 bg-pink-950/20 p-6">
              <h3 className="text-xl font-semibold text-pink-300">Beyond a Website Builder</h3>
              <p className="mt-3 leading-7 text-gray-300">
                Most website builders consider their job complete once your website is published. 7wingz continues long after deployment by providing the tools to monitor visitors, capture leads, measure performance, and manage customer interactions—all from a single interface.
              </p>
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="crm">
            <h2 className="text-3xl font-semibold text-white">CRM</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Customer Relationship Management (CRM) has become a buzzword—most tools are just expensive databases that make you do all the heavy lifting. They capture data but don't help you use it.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              At 7wingz, our CRM is a system for organizing customer interactions, enquiries, and relationships in one place. But we go further. As AI becomes embedded into business software, the future of CRM is shifting from simply recording customer data to proactively understanding customers, automating workflows, and recommending the next best action. We're building that future today.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          {/* --- GUIDES SECTIONS (two paragraphs each) --- */}
          <section className="space-y-8 mb-16" id="create-website">
            <h2 className="text-3xl font-semibold text-white">Guide: Create Website</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              The "Create" flow is built around the "Gulf of Execution". You know what you want, but you don't know how to map it to CSS grid or JavaScript logic. Most builders make you guess.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              We skip the translation layer. By prompting for intent, we build a dependency graph of business requirements. The system doesn't just generate a site; it constructs a project tree that you can inspect and modify. The goal is to maximize the "signal‑to‑noise" ratio of your initial input. A 60‑second intake session results in a fully functional, deployable project—no wasted cognitive cycles on setup.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="edit-website">
            <h2 className="text-3xl font-semibold text-white">Guide: Edit Website</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Editing is the process of introducing variance. And variance breaks layouts. Exposing the raw DOM to users is a recipe for "CSS Jenga"—moving one div collapses three others.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              To prevent this, we don't expose the raw DOM; we expose a typed data model. You edit the JSON object that feeds the template. This is the only reliable way to prevent layout regressions. If a user wants to change the font size, they aren't setting <span className="font-mono text-sm text-gray-400">font-size</span>; they are updating a token in the theme schema. This deterministic mapping prevents accidental regression across breakpoints.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="publish-website">
            <h2 className="text-3xl font-semibold text-white">Guide: Publish Website</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Most platforms treat the publish button as a simple "go live" switch—no quality checks, no performance gates. That's how broken sites go viral for all the wrong reasons.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              We treat the publish button as the ultimate quality gate. Before the final artifact is pushed, we run a lightweight Lighthouse CI check in the background. If the performance score drops below a certain threshold, the publish is gated, and the user is notified. This is the "quality‑friction" principle: it's better to delay a publish by 5 seconds than to expose a degraded experience to 1,000 users. The pipeline also minifies assets aggressively and generates a sitemap (which is non‑negotiable for discoverability).
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="custom-domains">
            <h2 className="text-3xl font-semibold text-white">Guide: Custom Domains</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              DNS propagation is a game of stochastic delays. Most platforms leave you to figure it out on your own—good luck with that.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              We automate the verification of CNAME and A records via API checks. SSL issuance via Let's Encrypt is handled asynchronously in the background. The key insight here is to prevent "mixed content" warnings—we force all asset links to be protocol‑relative or HTTPS. A single HTTP image request on an HTTPS page breaks the security model, and browsers punish that with a huge UX friction. We enforce strict CSP (Content Security Policy) headers at the edge to mitigate XSS risks, regardless of the domain.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          <section className="space-y-8 mb-16" id="seo">
            <h2 className="text-3xl font-semibold text-white">Guide: SEO</h2>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-red-500/50 pl-4">
              Search engines are agents of randomness. They change algorithms with the unpredictability of a financial market. Most SEO advice is outdated the moment it's published.
            </p>
            <p className="text-lg leading-relaxed text-gray-300 border-l-2 border-emerald-500/50 pl-4">
              You don't optimize for the current algorithm; you optimize for the <em className="text-white">invariants</em>:
              <ul className="list-disc pl-6 space-y-2 text-gray-300 mt-2">
                <li><strong className="text-white">Semantic HTML:</strong> If the page structure is clear, algorithmic changes rarely penalize you.</li>
                <li><strong className="text-white">Entity Density:</strong> We generate JSON‑LD that explicitly models the business as a schema.org entity. This reduces ambiguity.</li>
                <li><strong className="text-white">Performance:</strong> CWV (Core Web Vitals) is the only provably "anti‑random" factor Google uses. A fast page is a consistently high‑ranked page.</li>
              </ul>
              We avoid the "black box" of meta‑keyword stuffing. Instead, we auto‑generate a sitemap and robots.txt that biases the crawl budget toward your high‑value pages. Good SEO is defensive, not aggressive.
            </p>
          </section>

          <hr className="my-16 border-gray-800" />

          {/* --- PRODUCT TILES SECTION --- */}
          <section className="space-y-8 mb-16" id="products">
            <h2 className="text-3xl font-semibold text-white">Choose Your Template Pack</h2>
            <p className="text-lg leading-relaxed text-gray-300">
              Select from our curated collection of high‑performance starting points.
              Click any tile to preview and add to your cart.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
              {PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  className="group cursor-pointer bg-gray-800 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-700 overflow-hidden"
                  onClick={() => openProductModal(product)}
                >
                  <div className="overflow-hidden bg-[#2a2a2a]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-56 object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-medium text-lg text-white tracking-wide">
                      {product.name}
                    </h3>
                    <p className="text-amber-400 font-light mt-1">${product.price}</p>
                    <button
                      className="mt-3 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-600 pb-0.5 inline-block hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProductModal(product);
                      }}
                    >
                      quick view
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="my-16 border-gray-800" />

          <div className="mt-20 border-t border-gray-800 pt-10 text-sm text-gray-500">
            Edit this page on GitHub
          </div>
        </div>
      </main>

      {/* Render Modals */}
      <ProductDetailModal />
      <CartModal />

      {/* Global styles for typography and custom scroll */}
      <style jsx global>{`
        /* Improved typography */
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 18px;
          line-height: 1.8;
          color: #e5e7eb;
          background: #000;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: "Roxborough CF Thin", Georgia, serif;
          font-weight: 300;
          letter-spacing: -0.02em;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 6px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
        /* subtle left borders for contrasting paragraphs */
        .border-l-2 {
          border-left-width: 2px;
        }
        .border-red-500\/50 {
          border-color: rgba(239, 68, 68, 0.5);
        }
        .border-emerald-500\/50 {
          border-color: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  );
}