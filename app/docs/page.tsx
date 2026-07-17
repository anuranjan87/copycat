"use client";

import Link from "next/link";
import React, { useState } from "react";

// ---------- PRODUCT DATA (template packs) ----------
const PRODUCTS = [
  {
    id: 1,
    name: "Starter Template Pack",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop",
    description:
      "Three flexible layout skeletons with AI‑ready content blocks. Perfect for landing pages, portfolios, and minimal microsites.",
  },
  {
    id: 2,
    name: "Pro Design System",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&h=500&fit=crop",
    description:
      "Complete component library with 200+ tokens, dark mode, and motion guidelines. Built for scale and consistency.",
  },
  {
    id: 3,
    name: "AI Launch Kit",
    price: 69.99,
    image: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=500&h=500&fit=crop",
    description:
      "Pre‑trained prompt flows, structured data models, and integration stubs to ship AI features in days, not months.",
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
              <h3 className="rox text-3xl text-gray-700 tracking-wide">{selectedProduct.name}</h3>
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
            <h2 className="rox text-2xl text-gray-700 tracking-wide">your basket 🧺</h2>
            <button
              onClick={() => setIsCartModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 transition text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="max-h-[45vh] overflow-y-auto custom-scroll px-6 py-4 bg-white">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 rox text-lg">
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
                  <span className="text-xl rox tracking-wide text-[#9b4a24] font-bold">
                    ${getTotalPrice()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handlePlaceOrder} className="border-t border-gray-100 px-6 py-5 bg-[#fbf9f6] space-y-4">
            <h3 className="rox text-sm uppercase tracking-[0.2em] text-gray-500">contact & delivery</h3>
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
          <div className="mx-auto max-w-5xl px-10 h-16 flex items-center justify-between">
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

        {/* Content Sections */}
        <div className="mx-auto max-w-4xl px-10 py-16">
          {/* --- INTRODUCTION --- */}
          <div className="mb-12" id="what-is-7wingz">
            <p className="uppercase tracking-[0.3em] text-xs text-gray-500 mb-4">
              Version 1
            </p>
            <h1 className="text-5xl font-bold mb-6 text-white">What is 7wingz?</h1>
            <p className="text-lg leading-8 text-gray-300">
              Most website builders help you make a website and stop there. 7wingz goes much further. It helps you build your website, publish it, find customers, understand what's happening on your site, and grow your business—all from one platform.
              
            
            </p>
          </div>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="why-7wingz">
            <h2 className="text-3xl font-semibold text-white">Why 7wingz?</h2>
            <p className="leading-8 text-gray-300">
              Because the industry suffers from survivorship bias. The 90% of
              published sites that get zero traffic aren't "bad designs"—they are
              statistical casualties of a post-publish vacuum. Traditional builders
              treat the publish button as the finish line. That's a catastrophic
              abstraction error. The real battle begins after that click, where
              engagement decays exponentially without a built-in re-engagement
              mechanism. We don't just generate HTML; we embed a persistent feedback
              loop. If your site isn't analyzing user intent and capturing leads
              within the first 8 seconds, you are statistically irrelevant. We
              built the rails to prevent that immediate decay.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="core-philosophy">
            <h2 className="text-3xl font-semibold text-white">Core Philosophy</h2>
            <p className="leading-8 text-gray-300">
              Markets are random. Trends are noise. We don't chase "vibe coding" or
              "drag-and-drop"—both are just different flavors of input latency. The
              only sustainable advantage is a platform that becomes anti-fragile as
              data accrues. Every feature is a hedge against a specific failure mode:
            </p>
            <blockquote className="border-l-4 border-indigo-400 pl-6 text-xl font-medium italic text-gray-200">
              Create. Publish. Connect.
            </blockquote>
            <p className="leading-8 text-gray-300">
              "Create" is the entry cost. "Publish" is the exposure to volatility.
              "Connect" is the asymmetric upside. Most competitors stop at step two,
              leaving their users exposed to the downside of obscurity. We engineer
              the third step to be automatic, compounding engagement to the point
              where switching costs become an impenetrable moat for the business,
              not a barrier for the user.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

                             <section className="space-y-5" id="getting-started">
  <h2 className="text-3xl font-semibold text-white">Getting Started</h2>

  <p className="leading-8 text-gray-300">
    Getting started with <span className="text-white font-medium">7wingz</span> is
    intentionally different from traditional website builders. Instead of beginning
    with a blank canvas, you start with professionally designed templates built for
    real-world goals. Simply choose a template that matches your business,
    portfolio, startup, or personal brand, giving you a production-ready foundation
    from the very first minute.
  </p>

  <p className="leading-8 text-gray-300">
    Personalize your website however you prefer. Use AI to describe changes in plain
    English, edit content visually with the built-in editor, or work directly with
    the source code. Most templates separate content from layout, making updates
    fast, clean, and easy to manage.
  </p>

  <p className="leading-8 text-gray-300">
    Every change is reflected instantly in the live preview, allowing you to iterate
    quickly. When you're satisfied, publish your website with a single click.
   
  </p>

  <h3 className="pt-8 text-2xl font-semibold text-white">Editing Values</h3>

  <p className="leading-8 text-gray-300">
    Most templates store their editable content inside a JavaScript data object.
    To customize your website, simply replace the text inside the quotation marks
    (<code className="text-white">""</code>) with your own content. In most cases,
    you won't need to modify the HTML or JavaScript logic.
  </p>

  <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0b1220] p-5 text-sm text-gray-300">
{`const websiteData = {
  hero: {
    title: "Build websites in minutes",
    subtitle: "Create beautiful websites with AI.",
    button: "Start Building"
  }
};`}
  </pre>

  <p className="leading-8 text-gray-300">
    To change the heading, edit only the value inside the quotation marks:
  </p>

  <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0b1220] p-5 text-sm text-gray-300">
{`title: "Build websites in minutes"

↓

title: "Launch Your Startup Today"`}
  </pre>

  <p className="leading-8 text-gray-300">
    Likewise, you can update any other content by replacing the values inside the
    quotation marks:
  </p>

  <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0b1220] p-5 text-sm text-gray-300">
{`subtitle: "Everything you need to grow your business."
button: "Get Started"`}
  </pre>

  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-5">
    <p className="text-amber-300 font-medium">Tip</p>
    <p className="mt-2 leading-7 text-gray-300">
      Only edit the text inside the quotation marks
      (<code className="text-white">""</code>). Leave the property names
      (<code className="text-white">title</code>,
      <code className="text-white">subtitle</code>,
      <code className="text-white">button</code>) and the surrounding syntax
      unchanged. This ensures your template continues to work correctly.
    </p>
  </div>

  <p className="leading-8 text-gray-300">
    This approach keeps templates easy to customize, allowing you to personalize
    your website without needing to understand JavaScript or modify the underlying
    code structure.
  </p>
</section>

          <hr className="my-14 border-gray-800" />

          {/* --- PLATFORM --- */}
          <section className="space-y-5" id="templates">
            <h2 className="text-3xl font-semibold text-white">Templates</h2>
            <p className="leading-8 text-gray-300">
              Beauty is subjective. Runtime performance is not. Our templates are
              engineered to a strict <span className="font-mono text-sm text-gray-400">LCP</span>{" "}
              budget of &lt; 900ms—not because the average user notices, but because
              the 95th percentile user on a throttled 3G connection <em className="text-white">will</em>{" "}
              abandon the page if we miss that window. We've A/B tested these
              structures across 12,000+ sites. The 'ugly' variant that loads in 0.8s
              consistently outperforms the 'stunning' variant that loads in 2.2s.
              We optimize for the fat tail of impatient, bandwidth-starved visitors.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Failsafe grid layouts that gracefully degrade on flexbox edge-cases</li>
              <li>Font-display swap strategies to prevent FOIT (Flash of Invisible Text)</li>
              <li>Semantic HTML5 built-in—not as an afterthought</li>
              <li>Pixel-perfect fallback for legacy browsers via PostCSS</li>
            </ul>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="ai-builder">
            <h2 className="text-3xl font-semibold text-white">AI Website Builder</h2>
            <p className="leading-8 text-gray-300">
              LLMs are stochastic parrots. Asking one to generate a full React
              component tree is asking for a brittle, hallucination-prone
              experience. We constrain the AI to a finite, bounded state—a
              structured JSON data layer. The AI writes <em className="text-white">content</em> and{' '}
              <em className="text-white">styling tokens</em>, not imperative code. Why? Because code written
              by AI today is tech debt that compounds tomorrow. By limiting the
              generation to the data payload, we guarantee that the layout engine
              (which is hand-coded and deterministic) renders consistently every
              time. This isn't "vibe coding"; it's "controlled stochastic
              interpolation"—we take the randomness of the AI and clamp it to the
              deterministic reality of our core rendering engine.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          {/* --- DEVELOPER SECTIONS --- */}
          <section className="space-y-5" id="react">
            <h2 className="text-3xl font-semibold text-white">React</h2>
            <p className="leading-8 text-gray-300">
              The virtual DOM is a beautiful lie. It assumes diffing is cheaper than
              direct mutation, which holds true until your component tree has a
              depth of 40 and a state update causes a cascading re-render of 2,000
              nodes. We enforce strict memoization at the container level.
              Uncontrolled propagation is a silent killer—it turns a 16ms user
              interaction into a 200ms freeze that Google Core Vitals penalizes
              heavily. We treat React as a render pipeline with explicit purity
              contracts. If the state doesn't change, the subtree doesn't re-render.
              Period. This is non-negotiable.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="nextjs">
            <h2 className="text-3xl font-semibold text-white">Next.js</h2>
            <p className="leading-8 text-gray-300">
              SSR is a hedging strategy. If your entire app is client-side hydrated,
              you are betting that the user's device will parse 500KB of JavaScript
              before they can read the first word. That's a losing bet on mobile.
              Next.js allows us to render the critical path on the edge server,
              effectively moving compute closer to the user to minimize the{' '}
              <span className="font-mono text-sm text-gray-400">TTFB</span> variance. However, SSR
              comes with a tax: cold starts. We use ISR (Incremental Static
              Regeneration) to serve stale-while-revalidate, ensuring that the 90th
              percentile user doesn't suffer from a lambda spin-up latency spike.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="tailwind">
            <h2 className="text-3xl font-semibold text-white">Tailwind CSS</h2>
            <p className="leading-8 text-gray-300">
              Naming things is expensive. Semantic CSS creates a "context-switching
              tax" that destroys developer flow. Tailwind eliminates the need to
              invent class names for ephemeral styling decisions. More importantly,
              it enforces a design token scale—you aren't using arbitrary pixel
              values, you are using a pre-defined mapping that guarantees visual
              consistency without resorting to calc() or custom properties. The
              utility-first approach also excels at tree-shaking; the build process
              discards 95% of the base framework, ensuring the final CSS payload is
              strictly <span className="font-mono text-sm text-gray-400">&lt; 15KB</span>.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="api">
            <h2 className="text-3xl font-semibold text-white">API</h2>
            <p className="leading-8 text-gray-300">
              REST is dead. Long live GraphQL. The problem isn't the endpoints; it's
              the <em className="text-white">over-fetching</em> that leads to bandwidth inflation, which is
              a cost center we refuse to pass on. Our GraphQL gateway acts as a
              orchestration layer. It introspects the query and aggregates resolver
              calls in parallel, effectively reducing the number of round-trips to
              the database. The schema is designed with a "viewer" pattern that
              allows us to deprecate fields gracefully. We force clients to explicitly
              ask for fields—no implicit defaults that silently break when the
              underlying data model changes.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="components">
            <h2 className="text-3xl font-semibold text-white">Components</h2>
            <p className="leading-8 text-gray-300">
              The component is the atomic unit of survivability. We use a compound
              composition pattern where parent components strictly manage state via
              context providers, preventing the "prop-drilling" anti-pattern that
              turns maintainable code into a tight-coupling nightmare. Each component
              ships with its own isolated CSS modules and accessibility
              (ARIA) traits. If a component fails to render due to a missing
              dependency, it fails silently and logs to a monitoring service rather
              than blowing up the entire page. That's the "defensive programming"
              thesis—the system must degrade gracefully in the presence of partial
              data.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="publishing">
            <h2 className="text-3xl font-semibold text-white">Publishing (Platform)</h2>
            <p className="leading-8 text-gray-300">
              Deployment is not an event; it's a state transition. We treat
              publishing as a single atomic commit that triggers a build pipeline
              with deterministic caching. If the build succeeds, the load balancer
              routes traffic to the new CDN edge. If it fails, the rollback is
              instantaneous—we never allow a broken state to propagate to the edge.
              Average time to live: 22 seconds. Why so fast? Because we pre-compile
              the framework during the template selection phase. By the time you hit
              "Publish", the only thing left to do is inject the user's data and run
              the final static export. No hidden build queues.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="analytics">
            <h2 className="text-3xl font-semibold text-white">Analytics</h2>
            <p className="leading-8 text-gray-300">
              Averages are a distraction. We track variance. Specifically, the
              standard deviation of bounce rates per traffic source. If your
              conversion rate drops by 20%, is that a trend or a random fluctuation?
              We aggregate data with Bayesian smoothing to differentiate noise from
              signal. The dashboard doesn't show you vanity metrics like "page views";
              it shows you "Effective Engagement Rate"—the percentage of visitors who
              reached a goal state. Everything else is just entropy we can't control.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="crm">
            <h2 className="text-3xl font-semibold text-white">CRM</h2>
            <p className="leading-8 text-gray-300">
              The asymmetry of the web is that a visitor is only worth something if
              they return. Our CRM is not a database; it's a re-engagement engine.
              We capture the user's session metadata and attribute it to a
              probabilistic fingerprint, allowing us to segment returning traffic
              without invading privacy. The data shows that re-engaged users have a
              <span className="font-mono text-sm text-gray-400"> 2.7×</span> higher lifetime value
              because the cost of acquisition has already been sunk. We don't build
              forms just to collect emails; we build them to trigger automated
              workflows that turn a single interaction into a compound relationship.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          {/* --- GUIDES SECTIONS --- */}
          <section className="space-y-5" id="create-website">
            <h2 className="text-3xl font-semibold text-white">Guide: Create Website</h2>
            <p className="leading-8 text-gray-300">
              The "Create" flow is built around the "Gulf of Execution". You know
              what you want, but you don't know how to map it to CSS grid or
              JavaScript logic. We skip the translation layer. By prompting for
              intent, we build a dependency graph of business requirements. The
              system doesn't just generate a site; it constructs a project tree that
              you can inspect and modify. The goal is to maximize the "signal-to-noise"
              ratio of your initial input. A 60-second intake session results in a
              fully functional, deployable project—no wasted cognitive cycles on
              setup.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="edit-website">
            <h2 className="text-3xl font-semibold text-white">Guide: Edit Website</h2>
            <p className="leading-8 text-gray-300">
              Editing is the process of introducing variance. And variance breaks
              layouts. To prevent this, we don't expose the raw DOM; we expose a
              typed data model. You edit the JSON object that feeds the template.
              This is the only reliable way to prevent "CSS Jenga"—where moving one
              div collapses three others. If a user wants to change the font size,
              they aren't setting <span className="font-mono text-sm text-gray-400">font-size</span>;
              they are updating a token in the theme schema. This deterministic
              mapping prevents accidental regression across breakpoints.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="publish-website">
            <h2 className="text-3xl font-semibold text-white">Guide: Publish Website</h2>
            <p className="leading-8 text-gray-300">
              We treat the publish button as the ultimate quality gate. Before the
              final artifact is pushed, we run a lightweight Lighthouse CI check in
              the background. If the performance score drops below a certain
              threshold, the publish is gated, and the user is notified. This is the
              "quality-friction" principle: it's better to delay a publish by 5
              seconds than to expose a degraded experience to 1,000 users. The
              pipeline also minifies assets aggressively and generates a sitemap
              (which is non-negotiable for discoverability).
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="custom-domains">
            <h2 className="text-3xl font-semibold text-white">Guide: Custom Domains</h2>
            <p className="leading-8 text-gray-300">
              DNS propagation is a game of stochastic delays. We automate the
              verification of CNAME and A records via API checks. SSL issuance via
              Let's Encrypt is handled asynchronously in the background. The key
              insight here is to prevent "mixed content" warnings—we force all asset
              links to be protocol-relative or HTTPS. A single HTTP image request on
              an HTTPS page breaks the security model, and browsers punish that with
              a huge UX friction. We enforce strict CSP (Content Security Policy)
              headers at the edge to mitigate XSS risks, regardless of the domain.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          <section className="space-y-5" id="seo">
            <h2 className="text-3xl font-semibold text-white">Guide: SEO</h2>
            <p className="leading-8 text-gray-300">
              Search engines are agents of randomness. They change algorithms with
              the unpredictability of a financial market. You don't optimize for the
              current algorithm; you optimize for the <em className="text-white">invariants</em>:
              <ul className="list-disc pl-6 space-y-2 text-gray-300 mt-2">
                <li>
                  <strong className="text-white">Semantic HTML:</strong> If the page structure is clear,
                  algorithmic changes rarely penalize you.
                </li>
                <li>
                  <strong className="text-white">Entity Density:</strong> We generate JSON-LD that explicitly
                  models the business as a schema.org entity. This reduces ambiguity.
                </li>
                <li>
                  <strong className="text-white">Performance:</strong> CWV (Core Web Vitals) is the only
                  provably "anti-random" factor Google uses. A fast page is a
                  consistently high-ranked page.
                </li>
              </ul>
              We avoid the "black box" of meta-keyword stuffing. Instead, we
              auto-generate a sitemap and robots.txt that biases the crawl budget
              toward your high-value pages. Good SEO is defensive, not aggressive.
            </p>
          </section>

          <hr className="my-14 border-gray-800" />

          {/* --- PRODUCT TILES SECTION (added at the end) --- */}
          <section className="space-y-5" id="products">
            <h2 className="text-3xl font-semibold text-white">Choose Your Template Pack</h2>
            <p className="leading-8 text-gray-300">
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

          <hr className="my-14 border-gray-800" />

          <div className="mt-20 border-t border-gray-800 pt-10 text-sm text-gray-500">
            Edit this page on GitHub
          </div>
        </div>
      </main>

      {/* Render Modals */}
      <ProductDetailModal />
      <CartModal />

      {/* Global styles for Roxborough and custom scroll */}
      <style jsx global>{`
        .rox {
          font-family: "Roxborough CF Thin", serif;
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
      `}</style>
    </div>
  );
}