"use client";

import * as React from "react";
import Script from "next/script";
import { useParams } from "next/navigation";

import Nav from "@/components/nav";
import Premium from "@/components/premium";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const params = useParams();

  const username =
    typeof params?.username === "string"
      ? params.username
      : "";

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [checkingPremium, setCheckingPremium] =
    React.useState(true);

  const [isPremium, setIsPremium] =
    React.useState(false);

  const [loading, setLoading] =
    React.useState(false);

  const [message, setMessage] =
    React.useState("");

  // --------------------------------------------------
  // CHECK PREMIUM STATUS
  // --------------------------------------------------

  React.useEffect(() => {
    let cancelled = false;

    async function checkPremiumStatus() {
      try {
        setCheckingPremium(true);

        const response = await fetch(
          "/api/razorpay/status",
          {
            method: "GET",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (!response.ok) {
          if (!cancelled) {
            setIsPremium(false);
          }

          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setIsPremium(
            data?.premium === true
          );
        }
      } catch (error) {
        console.error(
          "Premium status check failed:",
          error
        );

        if (!cancelled) {
          setIsPremium(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingPremium(false);
        }
      }
    }

    checkPremiumStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // RAZORPAY PAYMENT
  // --------------------------------------------------

  const handlePayment = async () => {
    if (loading || isPremium) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // ----------------------------------------------
      // CREATE ORDER
      // ----------------------------------------------

      const response = await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create payment."
        );
      }

      // ----------------------------------------------
      // CHECK RAZORPAY
      // ----------------------------------------------

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay failed to load. Please try again."
        );
      }

      // ----------------------------------------------
      // RAZORPAY OPTIONS
      // ----------------------------------------------

      const options = {
        key: data.key,

        amount: data.amount,

        currency: data.currency,

        name: "7Winks",

        description:
          "7Winks Premium",

        order_id: data.orderId,

        theme: {
          color: "#171717",
        },

        prefill: {
          name: username,
        },

        notes: {
          username,
        },

        // --------------------------------------------
        // PAYMENT SUCCESS
        // --------------------------------------------

        handler: async function (
          paymentResponse: any
        ) {
          try {
            setMessage(
              "Finishing things up..."
            );

            // ----------------------------------------
            // VERIFY PAYMENT
            // ----------------------------------------

            const verifyResponse =
              await fetch(
                "/api/razorpay/verify",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    username,

                    razorpay_order_id:
                      paymentResponse?.razorpay_order_id,

                    razorpay_payment_id:
                      paymentResponse?.razorpay_payment_id,

                    razorpay_signature:
                      paymentResponse?.razorpay_signature,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData?.error ||
                  "Payment verification failed."
              );
            }

            if (
              verifyData?.success !== true
            ) {
              throw new Error(
                "Payment could not be confirmed."
              );
            }

            // ----------------------------------------
            // PAYMENT VERIFIED
            // ----------------------------------------

            setMessage("");

            // This immediately replaces
            // the pricing page with Premium.
            //
            // The database is now the source
            // of truth.
            setIsPremium(true);
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            setMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },

        // --------------------------------------------
        // MODAL CLOSED
        // --------------------------------------------

        modal: {
          ondismiss: function () {
            setLoading(false);
            setMessage("");
          },
        },
      };

      // ----------------------------------------------
      // OPEN RAZORPAY
      // ----------------------------------------------

      const razorpay =
        new window.Razorpay(options);

      // ----------------------------------------------
      // PAYMENT FAILED
      // ----------------------------------------------

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setLoading(false);

          setMessage(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      setLoading(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  };

  // --------------------------------------------------
  // ALWAYS SHOW NAVBAR
  // --------------------------------------------------

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <Nav username={username} />

      {/* -------------------------------------------- */}
      {/* CHECKING PREMIUM */}
      {/* -------------------------------------------- */}

      {checkingPremium ? (
        <main className="min-h-screen bg-[#f6f6f3] text-[#171717] pt-16 flex items-center justify-center">

          <div className="flex flex-col items-center">

            <div className="w-7 h-7 rounded-full border-2 border-black/10 border-t-black/60 animate-spin" />

            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-black/30">
              Loading
            </p>

          </div>

        </main>
      ) : isPremium ? (
        /* ------------------------------------------ */
        /* PAID USER                                  */
        /* ------------------------------------------ */

        <Premium
          username={username}
        />
      ) : (
        /* ------------------------------------------ */
        /* FREE USER                                  */
        /* ------------------------------------------ */

        <FreePricing
          username={username}
          loading={loading}
          message={message}
          onPayment={handlePayment}
        />
      )}
    </>
  );
}


// ==================================================
// FREE PRICING
// ==================================================

function FreePricing({
  username,
  loading,
  message,
  onPayment,
}: {
  username: string;
  loading: boolean;
  message: string;
  onPayment: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f6f6f3] text-[#171717] pt-16 overflow-hidden">

      {/* ------------------------------------------ */}
      {/* ATMOSPHERE                                 */}
      {/* ------------------------------------------ */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-white blur-[120px] opacity-80" />

        <div className="absolute top-[35%] -left-40 w-[400px] h-[400px] rounded-full bg-[#e9e9e3] blur-[100px]" />

        <div className="absolute bottom-0 -right-40 w-[450px] h-[450px] rounded-full bg-[#e8e8e3] blur-[120px]" />

      </div>

      <section className="relative px-5 sm:px-8 lg:px-12 py-20 lg:py-28">

        <div className="max-w-6xl mx-auto">

          {/* ---------------------------------------- */}
          {/* TOP LABEL                                */}
          {/* ---------------------------------------- */}

          <div className="flex items-center justify-between mb-16">

            <div className="flex items-center gap-3">

              <div className="w-2 h-2 rounded-full bg-black/70" />

              <span className="text-[10px] uppercase tracking-[0.25em] text-black/45">
                7Winks Premium
              </span>

            </div>

            <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-black/25">
              {username}
            </span>

          </div>


          {/* ---------------------------------------- */}
          {/* HERO                                     */}
          {/* ---------------------------------------- */}

          <div className="grid lg:grid-cols-[1fr_420px] gap-14 lg:gap-24 items-center mb-20">

            <div>

              <h1 className="font-serif text-[54px] sm:text-[68px] lg:text-[82px] leading-[0.91] tracking-[-0.045em]">

                You haven't
                <br />

                <span className="text-black/35">
                  seen everything.
                </span>

              </h1>

              <p className="mt-8 max-w-xl text-[15px] sm:text-[16px] leading-[1.8] text-black/45">
                Free gets you started.
                Premium gives you more
                room to build.
              </p>

              {/* CTA */}

              <div className="mt-10 flex flex-wrap items-center gap-4">

                <button
                  onClick={onPayment}
                  disabled={loading}
                  className="group inline-flex items-center gap-4 rounded-full bg-[#171717] text-white px-7 py-4 text-sm font-medium shadow-[0_10px_35px_rgba(0,0,0,0.14)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
                >

                  <span>
                    {loading
                      ? "Opening..."
                      : "Unlock Premium"}
                  </span>

                  {!loading && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10">
                      →
                    </span>
                  )}

                </button>

                <span className="text-[11px] text-black/30">
                  €6.66 / month
                </span>

              </div>

              {message && (
                <p className="mt-5 text-xs text-black/45">
                  {message}
                </p>
              )}

            </div>


            {/* -------------------------------------- */}
            {/* JAS                                     */}
            {/* -------------------------------------- */}

            <div className="relative flex justify-center lg:justify-end">

              <div className="relative w-[330px] h-[330px] sm:w-[380px] sm:h-[380px] rounded-[42px] border border-black/[0.07] bg-white/55 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.08)] overflow-hidden">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,1),rgba(255,255,255,0)_65%)]" />

                <div
                  className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage:
                      "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg,#000 1px,transparent 1px)",
                    backgroundSize:
                      "32px 32px",
                  }}
                />

                <img
                  src="/jas.gif"
                  alt="7Winks"
                  className="absolute z-10 w-[210px] sm:w-[245px] h-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)]"
                />

                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/75 backdrop-blur-md border border-black/[0.06] px-4 py-3 flex items-center justify-between">

                  <span className="text-[10px] uppercase tracking-[0.18em] text-black/30">
                    Premium
                  </span>

                  <span className="text-[11px] text-black/50">
                    €6.66 / month
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* ---------------------------------------- */}
          {/* BENEFITS                                 */}
          {/* ---------------------------------------- */}

          <div className="grid lg:grid-cols-2 gap-5">

            {/* FREE */}

            <div className="rounded-[30px] border border-black/[0.07] bg-white/55 backdrop-blur-xl p-8 sm:p-10">

              <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-8">
                Free
              </p>

              <div className="space-y-6">

                <Benefit
                  title="Core templates"
                  text="Enough to launch something clean and thoughtful."
                />

                <Benefit
                  title="AI-assisted editing"
                  text="Edit layouts naturally without complicated tools."
                />

                <Benefit
                  title="Instant publishing"
                  text="No setup rituals. No technical friction."
                />

              </div>

            </div>


            {/* PREMIUM */}

            <div className="rounded-[30px] border border-black/[0.08] bg-white/70 backdrop-blur-xl p-8 sm:p-10">

              <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-8">
                Premium
              </p>

              <div className="space-y-6">

                <Benefit
                  title="Premium templates"
                  text="More distinctive layouts and design options."
                />

                <Benefit
                  title="Save and revisit projects"
                  text="Keep your work and return whenever you want."
                />

                <Benefit
                  title="Full layout + code access"
                  text="More control without platform limits."
                />

                <Benefit
                  title="AI, email & Google Ads credits"
                  text="Credits are included with your Premium purchase."
                />

              </div>

            </div>

          </div>


          {/* ---------------------------------------- */}
          {/* CREDITS                                  */}
          {/* ---------------------------------------- */}

          <div className="mt-5 rounded-[24px] border border-black/[0.06] bg-white/50 backdrop-blur-xl px-6 py-5 text-center">

            <p className="text-xs text-black/40">
              Credits carry forward and never expire.
              If you run out, you can recharge anytime.
            </p>

          </div>


          {/* ---------------------------------------- */}
          {/* FOOTER                                   */}
          {/* ---------------------------------------- */}

          <div className="mt-24 pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">

            <p className="text-[10px] uppercase tracking-[0.22em] text-black/20">
              7Winks
            </p>

            <p className="text-[10px] text-black/20">
              Built for people who care about the details.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}


// ==================================================
// BENEFIT
// ==================================================

function Benefit({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div>

      <h3 className="text-sm text-black/75">
        {title}
      </h3>

      <p className="mt-1.5 text-xs leading-[1.7] text-black/35">
        {text}
      </p>

    </div>
  );
}