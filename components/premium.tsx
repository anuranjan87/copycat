"use client";

import * as React from "react";

interface PremiumProps {
  username: string;
}

interface Credits {
  ai: number;
  email: number;
  googleAds: number;
}

type RechargeType = "ai" | "email" | "googleAds";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Premium({ username }: PremiumProps) {
  // ==================================================
  // CREDITS
  // ==================================================

  const [credits, setCredits] = React.useState<Credits>({
    ai: 0,
    email: 0,
    googleAds: 0,
  });

  const [loading, setLoading] = React.useState(true);

  // ==================================================
  // RECHARGE MODAL
  // ==================================================

  const [rechargeOpen, setRechargeOpen] =
    React.useState(false);

  const [rechargeType, setRechargeType] =
    React.useState<RechargeType | null>(null);

  const [rechargeAmount, setRechargeAmount] =
    React.useState("10");

  const [rechargeLoading, setRechargeLoading] =
    React.useState(false);

  const [rechargeError, setRechargeError] =
    React.useState("");

  // ==================================================
  // LOAD RAZORPAY
  // ==================================================

  const loadRazorpay = React.useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          resolve(!!window.Razorpay);
        });

        existingScript.addEventListener("error", () => {
          resolve(false);
        });

        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = () => {
        resolve(!!window.Razorpay);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  }, []);

  // ==================================================
  // LOAD CREDITS
  // ==================================================

  const loadCredits = React.useCallback(async () => {
    try {
      setLoading(true);

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

      const data = await response.json();

      if (response.ok && data?.premium) {
        setCredits({
          ai: Number(data?.credits?.ai ?? 0),
          email: Number(data?.credits?.email ?? 0),
          googleAds: Number(
            data?.credits?.googleAds ?? 0
          ),
        });
      }
    } catch (error) {
      console.error(
        "Unable to load credits:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  // ==================================================
  // OPEN RECHARGE
  // ==================================================

  const openRecharge = (
    type: RechargeType
  ) => {
    setRechargeType(type);

    setRechargeAmount("10");

    setRechargeError("");

    setRechargeOpen(true);
  };

  // ==================================================
  // CLOSE RECHARGE
  // ==================================================

  const closeRecharge = () => {
    if (rechargeLoading) {
      return;
    }

    setRechargeOpen(false);

    setRechargeType(null);

    setRechargeAmount("10");

    setRechargeError("");
  };

  // ==================================================
  // RECHARGE PAYMENT
  // ==================================================

  const handleRechargePayment = async () => {
    setRechargeError("");

    // ----------------------------------------------
    // CHECK TYPE
    // ----------------------------------------------

    if (!rechargeType) {
      setRechargeError(
        "Please select a credit type."
      );

      return;
    }

    // ----------------------------------------------
    // CHECK AMOUNT
    // ----------------------------------------------

    const numericAmount = Number(
      rechargeAmount
    );

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setRechargeError(
        "Please enter a valid recharge amount."
      );

      return;
    }

    // ----------------------------------------------
    // MINIMUM AMOUNT
    // ----------------------------------------------

    if (numericAmount < 1) {
      setRechargeError(
        "Minimum recharge amount is €1."
      );

      return;
    }

    // ----------------------------------------------
    // MAXIMUM AMOUNT
    // ----------------------------------------------

    if (numericAmount > 10000) {
      setRechargeError(
        "Please enter an amount below €10,000."
      );

      return;
    }

    try {
      setRechargeLoading(true);

      // --------------------------------------------
      // LOAD RAZORPAY
      // --------------------------------------------

      const razorpayLoaded =
        await loadRazorpay();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay. Please refresh and try again."
        );
      }

      // --------------------------------------------
      // CREATE ORDER
      // --------------------------------------------

      const orderResponse = await fetch(
        "/api/razorpay/create-recharge-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Send both formats so the API
            // remains compatible with either naming style.

            rechargeType: rechargeType,
            recharge_type: rechargeType,

            amount: numericAmount,

            rechargeAmount: numericAmount,
            recharge_amount: numericAmount,
          }),
        }
      );

      let orderData: any = {};

      try {
        orderData =
          await orderResponse.json();
      } catch {
        orderData = {};
      }

      if (!orderResponse.ok) {
        throw new Error(
          orderData?.error ||
            orderData?.message ||
            "Unable to create recharge."
        );
      }

      // --------------------------------------------
      // ORDER ID
      // --------------------------------------------

      const orderId =
        orderData?.order?.id ||
        orderData?.orderId ||
        orderData?.id;

      if (!orderId) {
        throw new Error(
          "Razorpay order was not created."
        );
      }

      // --------------------------------------------
      // RAZORPAY KEY
      // --------------------------------------------

      const razorpayKey =
        orderData?.key ||
        orderData?.key_id ||
        process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error(
          "Razorpay key is missing."
        );
      }

      // --------------------------------------------
      // OPEN RAZORPAY
      // --------------------------------------------

      const razorpayOptions = {
        key: razorpayKey,

        amount:
          orderData?.order?.amount ||
          orderData?.amount,

        currency:
          orderData?.order?.currency ||
          orderData?.currency ||
          "INR",

        name: "7Winks",

        description:
          `${getRechargeLabel(
            rechargeType
          )} credit recharge`,

        order_id: orderId,

        handler: async function (
          paymentResponse: any
        ) {
          await verifyRecharge(
            paymentResponse,
            rechargeType,
            numericAmount
          );
        },

        modal: {
          ondismiss: function () {
            setRechargeLoading(false);
          },
        },

        theme: {
          color: "#171717",
        },
      };

      const razorpay =
        new window.Razorpay(
          razorpayOptions
        );

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setRechargeLoading(false);

          setRechargeError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Recharge error:",
        error
      );

      setRechargeLoading(false);

      setRechargeError(
        error instanceof Error
          ? error.message
          : "Unable to start recharge."
      );
    }
  };

  // ==================================================
  // VERIFY RECHARGE
  // ==================================================

  const verifyRecharge = async (
    paymentResponse: any,
    type: RechargeType,
    amount: number
  ) => {
    try {
      // --------------------------------------------
      // CHECK RAZORPAY RESPONSE
      // --------------------------------------------

      if (
        !paymentResponse?.razorpay_order_id ||
        !paymentResponse?.razorpay_payment_id ||
        !paymentResponse?.razorpay_signature
      ) {
        throw new Error(
          "Incomplete payment information received from Razorpay."
        );
      }

      // --------------------------------------------
      // VERIFY WITH SERVER
      // --------------------------------------------

      const verifyResponse = await fetch(
        "/api/razorpay/verify-recharge",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            // Razorpay details

            razorpay_order_id:
              paymentResponse.razorpay_order_id,

            razorpay_payment_id:
              paymentResponse.razorpay_payment_id,

            razorpay_signature:
              paymentResponse.razorpay_signature,

            // Credit type

            rechargeType: type,
            recharge_type: type,

            // Recharge amount

            amount: amount,

            rechargeAmount: amount,
            recharge_amount: amount,
          }),
        }
      );

      let verifyData: any = {};

      try {
        verifyData =
          await verifyResponse.json();
      } catch {
        verifyData = {};
      }

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData?.error ||
            verifyData?.message ||
            "Payment verification failed."
        );
      }

      // --------------------------------------------
      // PAYMENT SUCCESS
      // --------------------------------------------

      if (
        verifyData?.success ||
        verifyData?.verified
      ) {
        setRechargeLoading(false);

        setRechargeOpen(false);

        setRechargeError("");

        /*
         * Important:
         *
         * Reload the Premium page after the
         * database has been updated.
         *
         * This makes /api/razorpay/status run again
         * and displays the new balance.
         */

        window.location.reload();

        return;
      }

      throw new Error(
        "Payment could not be verified."
      );
    } catch (error) {
      console.error(
        "Recharge verification error:",
        error
      );

      setRechargeLoading(false);

      setRechargeError(
        error instanceof Error
          ? error.message
          : "Payment verification failed."
      );
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <>
      <main className="min-h-screen bg-[#f6f6f3] text-[#171717] pt-16">
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">

            {/* -------------------------------------- */}
            {/* HEADER */}
            {/* -------------------------------------- */}

            <p className="text-[10px] uppercase tracking-[0.25em] text-black/30">
              Premium
            </p>

            <h1 className="mt-6 font-serif text-6xl tracking-[-0.04em]">
              Welcome inside.
            </h1>

            <p className="mt-5 text-sm text-black/40">
              Your Premium access is active.
            </p>

            {/* -------------------------------------- */}
            {/* CHARACTER */}
            {/* -------------------------------------- */}

            <img
              src="/jas.gif"
              alt="7Winks"
              className="mt-12 w-56 h-auto"
            />

            {/* -------------------------------------- */}
            {/* CREDITS */}
            {/* -------------------------------------- */}

            <div className="mt-20 max-w-xl">

              <div className="flex items-center justify-between pb-5 border-b border-black/[0.08]">

                <p className="text-[10px] uppercase tracking-[0.25em] text-black/30">
                  Available credits
                </p>

                <p className="text-[10px] text-black/25">
                  {username}
                </p>

              </div>

              {/* AI */}

              <CreditRow
                name="AI"
                description="AI generation and editing"
                amount={credits.ai}
                loading={loading}
                onRecharge={() =>
                  openRecharge("ai")
                }
              />

              {/* EMAIL */}

              <CreditRow
                name="Email"
                description="Email campaigns"
                amount={credits.email}
                loading={loading}
                onRecharge={() =>
                  openRecharge("email")
                }
              />

              {/* GOOGLE ADS */}

              <CreditRow
                name="Google Ads"
                description="Google Ads campaigns"
                amount={credits.googleAds}
                loading={loading}
                onRecharge={() =>
                  openRecharge("googleAds")
                }
              />

              {/* ------------------------------------ */}
              {/* NOTE */}
              {/* ------------------------------------ */}

              <div className="mt-8 pt-6 border-t border-black/[0.06]">

                <p className="text-xs leading-[1.8] text-black/35">
                  Credits carry forward and never
                  expire. When you run out, you can
                  recharge them anytime.
                </p>

              </div>

            </div>

          </div>
        </section>
      </main>

      {/* ================================================== */}
      {/* RECHARGE MODAL */}
      {/* ================================================== */}

      {rechargeOpen && (
        <RechargeModal
          type={rechargeType}
          amount={rechargeAmount}
          loading={rechargeLoading}
          error={rechargeError}
          onAmountChange={(value) => {
            setRechargeAmount(value);
            setRechargeError("");
          }}
          onClose={closeRecharge}
          onContinue={handleRechargePayment}
        />
      )}
    </>
  );
}

// ======================================================
// CREDIT ROW
// ======================================================

function CreditRow({
  name,
  description,
  amount,
  loading,
  onRecharge,
}: {
  name: string;
  description: string;
  amount: number;
  loading: boolean;
  onRecharge: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-8 py-6 border-b border-black/[0.06]">

      {/* LEFT */}

      <div className="min-w-0">

        <p className="text-sm text-black/70">
          {name}
        </p>

        <p className="mt-1 text-xs text-black/30">
          {description}
        </p>

      </div>

      {/* RIGHT */}

      <div className="flex items-center gap-7 shrink-0">

        {/* CREDIT COUNT */}

        <div className="text-right">

          {loading ? (
            <div className="w-10 h-7 rounded bg-black/[0.05] animate-pulse" />
          ) : (
            <p className="font-serif text-3xl tracking-[-0.03em]">
              {amount.toLocaleString()}
            </p>
          )}

          <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-black/25">
            credits
          </p>

        </div>

        {/* SUBTLE RECHARGE */}

        <button
          type="button"
          onClick={onRecharge}
          className="group text-[10px] uppercase tracking-[0.14em] text-black/25 hover:text-black/55 transition-colors duration-200"
        >
          <span>Recharge</span>

          <span className="ml-1 opacity-0 -translate-x-1 inline-block group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-200">
            →
          </span>
        </button>

      </div>
    </div>
  );
}

// ======================================================
// RECHARGE MODAL
// ======================================================

function RechargeModal({
  type,
  amount,
  loading,
  error,
  onAmountChange,
  onClose,
  onContinue,
}: {
  type: RechargeType | null;
  amount: string;
  loading: boolean;
  error: string;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onContinue: () => void;
}) {
  if (!type) {
    return null;
  }

  const label = getRechargeLabel(type);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} recharge`}
    >

      {/* BACKDROP */}

      <div
        className="absolute inset-0 bg-black/[0.18] backdrop-blur-[5px]"
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />

      {/* MODAL */}

      <div className="relative w-full max-w-[620px] bg-[#f8f8f5] rounded-[30px] px-12 py-12 md:px-12 md:py-12 shadow-[0_30px_100px_rgba(0,0,0,0.16)]">

        {/* CLOSE */}

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-8 right-9 text-black/25 hover:text-black/55 text-lg transition-colors disabled:opacity-30"
          aria-label="Close"
        >
          ×
        </button>

        {/* LABEL */}

        <p className="text-[10px] uppercase tracking-[0.28em] text-black/30">
          Recharge
        </p>

        {/* TITLE */}

        <h2 className="mt-8 font-serif text-5xl md:text-[52px] tracking-[-0.045em]">
          {label} credits
        </h2>

        {/* DESCRIPTION */}

        <p className="mt-5 max-w-[470px] text-[15px] leading-[1.7] text-black/40">
          Add credit whenever you need it.
          Your existing balance will remain
          untouched.
        </p>

        {/* AMOUNT */}

        <div className="mt-16">

          <p className="text-[10px] uppercase tracking-[0.25em] text-black/30">
            Amount
          </p>

          <div className="mt-5 flex items-center border-b border-black/15 pb-4">

            <span className="text-2xl text-black/30 mr-3">
              €
            </span>

            <input
              type="number"
              inputMode="decimal"
              min="1"
              max="10000"
              step="1"
              value={amount}
              onChange={(event) =>
                onAmountChange(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !loading
                ) {
                  onContinue();
                }
              }}
              disabled={loading}
              autoFocus
              className="w-full bg-transparent outline-none border-none font-serif text-4xl tracking-[-0.03em] text-black placeholder:text-black/20"
              placeholder="10"
            />

          </div>

          <p className="mt-5 text-xs text-black/25">
            Enter the amount you want to add.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6">

            <p className="text-xs text-red-500">
              {error}
            </p>

          </div>
        )}

        {/* CONTINUE */}

        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="mt-12 w-full h-[78px] rounded-full bg-[#171717] text-white text-[16px] font-medium hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
              Processing
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              Continue
              <span className="text-xl">
                →
              </span>
            </span>
          )}
        </button>

        {/* FOOTER */}

        <p className="mt-7 text-center text-[11px] text-black/25">
          Secure payment via Razorpay
        </p>

      </div>
    </div>
  );
}

// ======================================================
// RECHARGE LABEL
// ======================================================

function getRechargeLabel(
  type: RechargeType
) {
  switch (type) {
    case "ai":
      return "AI";

    case "email":
      return "Email";

    case "googleAds":
      return "Google Ads";

    default:
      return "Credit";
  }
}