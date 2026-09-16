"use client";

import Script from "next/script";
import { useState } from "react";

type DomainResult = {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
};

type RazorpayPayment = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (payment: RazorpayPayment) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: RazorpayOptions) => { open: () => void };
};

export default function DomainsPage() {
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState("20");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"normal" | "error" | "success">("normal");

  function showMessage(value: string, type: "normal" | "error" | "success" = "normal") {
    setMessage(value);
    setMessageType(type);
  }

  async function searchDomains() {
    if (!prompt.trim()) {
      showMessage("Describe your idea first.", "error");
      return;
    }

    setLoading(true);
    setResults([]);
    setMessage("");

    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, budget: Number(budget) }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to search domains.");
      }

      setResults(data.results || []);
      if (!data.results?.length) {
        showMessage("No matching domains were found.");
      }
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to search domains.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkout(domain: DomainResult) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-checkout", domain: domain.domain }),
      });
      const order = await response.json();

      if (!response.ok) {
        throw new Error(order.error || "Unable to start checkout.");
      }

      const Razorpay = (window as RazorpayWindow).Razorpay;
      if (!Razorpay) {
        throw new Error("Payment checkout is still loading. Please try again.");
      }

      const payment = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "7wingz",
        description: `Register ${order.domain}`,
        order_id: order.orderId,
        modal: { ondismiss: () => setLoading(false) },
        handler: async (paymentDetails: RazorpayPayment) => {
          const verificationResponse = await fetch("/api/domains", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "verify-payment",
              domain: order.domain,
              razorpayOrderId: paymentDetails.razorpay_order_id,
              razorpayPaymentId: paymentDetails.razorpay_payment_id,
              razorpaySignature: paymentDetails.razorpay_signature,
            }),
          });
          const verification = await verificationResponse.json();

          if (!verificationResponse.ok) {
            throw new Error(verification.error || "Payment verification failed.");
          }

          showMessage(`${order.domain} was registered successfully.`, "success");
          setLoading(false);
        },
      });

      payment.open();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to start checkout.",
        "error",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#202020] sm:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="mx-auto max-w-3xl">
        <header className="mb-12 flex items-center justify-between">
          <a href="/" className="text-xl font-bold">
            7wingz
          </a>

          <a
            href="/"
            className="rounded-full border border-black/10 px-5 py-2.5 text-sm transition hover:bg-black hover:text-white"
          >
            Back to home
          </a>
        </header>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#8c7967]">
            Domain studio
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Find a name that feels like yours.</h1>

          <p className="mt-5 text-base leading-7 text-black/65 sm:text-lg">Describe your idea and get brandable .com suggestions with live availability and pricing.</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void searchDomains();
              }}
              placeholder="A calm productivity app for remote teams"
              aria-label="Describe your domain idea"
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/40"
            />
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              type="number"
              min="1"
              max="999"
              placeholder="Budget USD"
              aria-label="Annual budget in USD"
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/40"
            />
            <button
              onClick={() => void searchDomains()}
              disabled={loading}
              className="rounded-2xl bg-[#202020] px-6 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Working..." : "Find names"}
            </button>
          </div>

          {message && (
            <p className={`mt-5 rounded-xl border p-4 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-700" : messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-black/10 bg-black/[0.02] text-black/60"}`} role="status">
              {message}
            </p>
          )}
        </section>

        {results.length > 0 && (
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            {results.map((result) => (
              <article key={result.domain} className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="min-w-0">
                  <h2 className="break-all font-semibold">{result.domain}</h2>
                  <p className={`mt-1 text-xs ${result.available ? "text-emerald-600" : "text-black/40"}`}>
                    {result.available ? result.price ? `${result.currency || "USD"} ${result.price}/year` : "Available" : "Unavailable or over budget"}
                  </p>
                </div>
                {result.available && (
                  <button
                    onClick={() => void checkout(result)}
                    disabled={loading}
                    className="shrink-0 rounded-xl bg-[#202020] px-4 py-2 text-sm text-white transition hover:bg-black disabled:opacity-50"
                  >
                    Register
                  </button>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
