"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

type Result = {
  domain: string;
  available: boolean;
  price?: number;
  priceInr?: number;
  currency?: string;
  error?: string;
};

type Registrant = {
  nameFirst: string;
  nameLast: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Agreement = {
  agreementKey: string;
  title: string;
  url: string;
  content?: string;
};

type OwnedDomain = {
  domain: string;
  status: string;
  expires_at: string;
};

type DnsRecord = {
  type: string;
  name: string;
  data: string;
  ttl: number;
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
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (payment: RazorpayPayment) => void | Promise<void>;
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (
  options: RazorpayOptions,
) => RazorpayInstance;

type RazorpayWindow = Window & {
  Razorpay?: RazorpayConstructor;
};

const emptyRegistrant: Registrant = {
  nameFirst: "",
  nameLast: "",
  email: "",
  phone: "",
  address1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
};

const registrantFields: Array<keyof Registrant> = [
  "nameFirst",
  "nameLast",
  "email",
  "phone",
  "address1",
  "city",
  "state",
  "postalCode",
  "country",
];

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function formatFieldName(field: string) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase());
}

function formatPhoneForGoDaddy(phone: string) {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+")) {
    return trimmed.replace(/[^\d+]/g, "");
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length > 10) {
    return `+${digits}`;
  }

  return `+91${digits}`;
}

export default function DomainsPage() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const [domains, setDomains] = useState<OwnedDomain[]>([]);
  const [records, setRecords] = useState<DnsRecord[]>([]);

  const [registrant, setRegistrant] =
    useState<Registrant>(emptyRegistrant);

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [acceptedAgreementKeys, setAcceptedAgreementKeys] = useState<
    string[]
  >([]);

  const [selectedDomain, setSelectedDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [dnsLoading, setDnsLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "normal" | "success" | "error"
  >("normal");

  const [dns, setDns] = useState({
    type: "A",
    name: "@",
    data: "",
    ttl: "3600",
  });

  const requiredAgreementKeys = useMemo(
    () =>
      agreements
        .map((agreement) => agreement.agreementKey)
        .filter(Boolean),
    [agreements],
  );

  const hasAcceptedAllAgreements =
    requiredAgreementKeys.length > 0 &&
    requiredAgreementKeys.every((key) =>
      acceptedAgreementKeys.includes(key),
    );

  const canPurchase =
    Boolean(result?.available) &&
    hasAcceptedAllAgreements &&
    !loading;

  useEffect(() => {
    void loadDomains();
  }, []);

  function showMessage(
    value: string,
    type: "normal" | "success" | "error" = "normal",
  ) {
    setMessage(value);
    setMessageType(type);
  }

  async function loadDomains() {
    try {
      const response = await fetch("/api/domains", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load domains.");
      }

      setDomains(data.domains || []);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your domains.",
        "error",
      );
    }
  }

  async function checkDomain() {
    const cleanDomain = normalizeDomain(domain);

    if (!cleanDomain) {
      showMessage("Enter a domain name first.", "error");
      return;
    }

    setLoading(true);
    setResult(null);
    setMessage("");
    setAgreements([]);
    setAcceptedAgreementKeys([]);

    try {
      const response = await fetch(
        `/api/domains/check?domain=${encodeURIComponent(cleanDomain)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to check domain.");
      }

      setResult({
        domain: data.domain || cleanDomain,
        available: Boolean(data.available),
        price: data.price,
        priceInr: data.priceInr,
        currency: data.currency,
        error: data.error,
      });

      /*
       * Agreements are fetched together with domain availability.
       * The API should return:
       *
       * {
       *   domain,
       *   available,
       *   price,
       *   currency,
       *   agreements: [...]
       * }
       */
      const returnedAgreements: Agreement[] = Array.isArray(
        data.agreements,
      )
        ? data.agreements
        : [];

      setAgreements(returnedAgreements);

      if (data.available && returnedAgreements.length === 0) {
        showMessage(
          "The domain is available, but the required agreements could not be loaded.",
          "error",
        );
      }
    } catch (error) {
      setResult({
        domain: cleanDomain,
        available: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while checking the domain.",
      });
    } finally {
      setLoading(false);
    }
  }

  function updateRegistrant(
    field: keyof Registrant,
    value: string,
  ) {
    setRegistrant((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateRegistrant() {
    const requiredFields: Array<keyof Registrant> = [
      "nameFirst",
      "nameLast",
      "email",
      "phone",
      "address1",
      "city",
      "state",
      "postalCode",
      "country",
    ];

    const missingField = requiredFields.find(
      (field) => !registrant[field].trim(),
    );

    if (missingField) {
      showMessage(
        `Please complete the ${formatFieldName(missingField)} field.`,
        "error",
      );
      return false;
    }

    if (!registrant.email.includes("@")) {
      showMessage("Enter a valid email address.", "error");
      return false;
    }

    const phoneDigits = registrant.phone.replace(/\D/g, "");

    if (phoneDigits.length < 10) {
      showMessage("Enter a valid phone number.", "error");
      return false;
    }

    if (requiredAgreementKeys.length === 0) {
      showMessage(
        "Required GoDaddy agreements are not available.",
        "error",
      );
      return false;
    }

    if (!hasAcceptedAllAgreements) {
      showMessage(
        "Please read and accept all required agreements.",
        "error",
      );
      return false;
    }

    return true;
  }

  function toggleAgreement(
    agreementKey: string,
    checked: boolean,
  ) {
    setAcceptedAgreementKeys((current) => {
      if (checked) {
        return current.includes(agreementKey)
          ? current
          : [...current, agreementKey];
      }

      return current.filter((key) => key !== agreementKey);
    });
  }

  async function beginPurchase() {
    if (!result?.available) {
      return;
    }

    if (!validateRegistrant()) {
      return;
    }

    /*
     * Freeze the accepted consent values before opening checkout.
     * This guarantees that the exact consent submitted after payment
     * is the consent selected by the customer before payment.
     */
    const consentAgreementKeys = [...acceptedAgreementKeys];
    const consentTimestamp = new Date().toISOString();

    setLoading(true);
    setMessage("");

    try {
      const orderResponse = await fetch("/api/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-order",
          domain: result.domain,
        }),
      });

      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          order.error || "Unable to create payment order.",
        );
      }

      const razorpayWindow = window as RazorpayWindow;
      const Razorpay = razorpayWindow.Razorpay;

      if (!Razorpay) {
        throw new Error(
          "Payment checkout is still loading. Please try again.",
        );
      }

      const checkout = new Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "7wingz",
        description: `Register ${order.domain}`,
        order_id: order.orderId,
        prefill: {
          email: registrant.email,
          name: `${registrant.nameFirst} ${registrant.nameLast}`,
          contact: formatPhoneForGoDaddy(registrant.phone),
        },
        theme: {
          color: "#202020",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showMessage("Payment checkout was closed.");
          },
        },
        handler: async (payment: RazorpayPayment) => {
          try {
            setLoading(true);

            const verifyResponse = await fetch("/api/domains", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "verify-and-purchase",
                domain: order.domain,
                quoteToken: order.quoteToken,

                razorpay_order_id: payment.razorpay_order_id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,

                registrant: {
                  ...registrant,
                  phone: formatPhoneForGoDaddy(registrant.phone),
                },

                agreementKeys: consentAgreementKeys,
                agreedAt: consentTimestamp,
              }),
            });

            const data = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                data.error || "Domain purchase failed.",
              );
            }

            showMessage(
              `${order.domain} was registered and added to your account.`,
              "success",
            );

            setResult(null);
            setDomain("");
            setAgreements([]);
            setAcceptedAgreementKeys([]);
            setRegistrant(emptyRegistrant);

            await loadDomains();
          } catch (error) {
            showMessage(
              error instanceof Error
                ? error.message
                : "Domain purchase failed.",
              "error",
            );
          } finally {
            setLoading(false);
          }
        },
      });

      checkout.open();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to start the purchase.",
        "error",
      );

      setLoading(false);
    }
  }

  async function openDomain(value: string) {
    setSelectedDomain(value);
    setRecords([]);
    setMessage("");

    try {
      const response = await fetch(
        `/api/domains?domain=${encodeURIComponent(value)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load DNS records.");
      }

      setRecords(data.records || []);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to load DNS records.",
        "error",
      );
    }
  }

  async function updateDns() {
    if (!selectedDomain) {
      showMessage("Select a domain first.", "error");
      return;
    }

    if (!dns.name.trim() || !dns.data.trim()) {
      showMessage("Enter a DNS name and value.", "error");
      return;
    }

    const ttl = Number(dns.ttl);

    if (!Number.isFinite(ttl) || ttl <= 0) {
      showMessage("Enter a valid TTL value.", "error");
      return;
    }

    setDnsLoading(true);

    try {
      const response = await fetch("/api/domains", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: selectedDomain,
          type: dns.type,
          name: dns.name.trim(),
          data: dns.data.trim(),
          ttl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "DNS update failed.");
      }

      showMessage("DNS record updated successfully.", "success");
      await openDomain(selectedDomain);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "DNS update failed.",
        "error",
      );
    } finally {
      setDnsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#202020] sm:px-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-5xl">
        <header className="mb-16 flex items-center justify-between">
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

        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[#8c7967]">
            Your next big idea
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Find a domain
            <br />
            <span className="text-[#9b8067]">for your idea.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-black/55 sm:text-lg">
            Search, purchase, and manage your domain from your 7wingz
            account.
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center rounded-full border border-black/10 bg-white px-5 py-1 shadow-sm">
              <span className="mr-2 text-sm text-black/40">
                www.
              </span>

              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void checkDomain();
                  }
                }}
                placeholder="yourdomain.com"
                aria-label="Domain name"
                className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none"
              />
            </div>

            <button
              onClick={() => void checkDomain()}
              disabled={loading || !domain.trim()}
              className="rounded-full bg-[#202020] px-7 py-4 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Working..." : "Search domain"}
            </button>
          </div>
        </section>

        {result && (
          <section className="mx-auto mt-12 max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    result.error
                      ? "text-red-600"
                      : result.available
                        ? "text-emerald-600"
                        : "text-red-600"
                  }`}
                >
                  {result.error
                    ? "Error"
                    : result.available
                      ? "Available"
                      : "Already taken"}
                </p>

                <h2 className="mt-2 break-all text-2xl font-semibold">
                  {result.domain}
                </h2>

                {result.price ? (
                  <p className="mt-2 text-sm text-black/50">
                    {result.priceInr
                      ? `INR ${result.priceInr} (USD ${result.price})`
                      : `${result.currency || "USD"} ${result.price}`} per
                    year, plus 7wingz service fee
                  </p>
                ) : null}

                {result.error ? (
                  <p className="mt-2 text-xs text-red-600">
                    {result.error}
                  </p>
                ) : null}
              </div>

              {result.available && (
                <button
                  onClick={() => void beginPurchase()}
                  disabled={!canPurchase}
                  className="rounded-full bg-[#202020] px-6 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Working..." : "Pay and register"}
                </button>
              )}
            </div>

            {result.available && !hasAcceptedAllAgreements ? (
              <p className="mt-4 text-xs text-black/50">
                Complete the registrant details and accept all required
                agreements below before purchasing.
              </p>
            ) : null}
          </section>
        )}

        {result?.available && (
          <section className="mx-auto mt-6 max-w-2xl rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
            <h2 className="font-semibold">Registrant details</h2>

            <p className="mt-1 text-sm leading-6 text-black/55">
              These details will be sent to GoDaddy for domain
              registration. Use your legal name and a valid phone
              number with your country code.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {registrantFields.map((field) => (
                <input
                  key={field}
                  value={registrant[field]}
                  onChange={(event) =>
                    updateRegistrant(field, event.target.value)
                  }
                  placeholder={formatFieldName(field)}
                  autoComplete="off"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/40"
                />
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-black/45">
              Phone numbers are automatically formatted for GoDaddy
              using the country code when the purchase request is sent.
            </p>
          </section>
        )}

        {result?.available && (
          <section className="mx-auto mt-6 max-w-2xl rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Terms and conditions
                </h2>

                <p className="mt-1 text-sm leading-6 text-black/55">
                  Review and accept every required GoDaddy agreement
                  before continuing to payment.
                </p>
              </div>

              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/55">
                {acceptedAgreementKeys.length}/
                {requiredAgreementKeys.length}
              </span>
            </div>

            {agreements.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                Required agreements could not be loaded. Please search
                for the domain again before continuing.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {agreements.map((agreement) => {
                  const checked = acceptedAgreementKeys.includes(
                    agreement.agreementKey,
                  );

                  return (
                    <label
                      key={agreement.agreementKey}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        checked
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-black/10 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          toggleAgreement(
                            agreement.agreementKey,
                            event.target.checked,
                          )
                        }
                        className="mt-1 h-4 w-4 accent-black"
                      />

                      <span className="min-w-0 text-sm leading-6">
                        <span className="block font-medium">
                          {agreement.title ||
                            `Agreement ${agreement.agreementKey}`}
                        </span>

                        <span className="mt-1 block text-xs text-black/45">
                          Agreement key: {agreement.agreementKey}
                        </span>

                        {agreement.content ? (
                          <ScrollArea className="mt-3 h-56 rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                            <div
                              className="pr-4 text-xs leading-5 text-black/65 [&_a]:underline [&_a]:underline-offset-2 [&_p]:mb-3 [&_strong]:font-semibold"
                              dangerouslySetInnerHTML={{
                                __html: agreement.content,
                              }}
                            />
                          </ScrollArea>
                        ) : null}

                        {agreement.url ? (
                          <a
                            href={agreement.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                            className="mt-2 inline-block font-medium underline underline-offset-4"
                          >
                            Read full agreement
                          </a>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div
              className={`mt-5 rounded-xl border p-4 text-sm ${
                hasAcceptedAllAgreements
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-black/10 bg-black/[0.025] text-black/55"
              }`}
              role="status"
            >
              {hasAcceptedAllAgreements
                ? "All required agreements accepted. You can continue to payment."
                : `You must accept all ${requiredAgreementKeys.length} required agreement(s) before payment.`}
            </div>

            <button
              onClick={() => void beginPurchase()}
              disabled={!canPurchase}
              className="mt-5 w-full rounded-full bg-[#202020] px-6 py-4 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Processing..."
                : hasAcceptedAllAgreements
                  ? "Continue to secure payment"
                  : "Accept all agreements to continue"}
            </button>
          </section>
        )}

        {message && (
          <p
            className={`mx-auto mt-6 max-w-2xl rounded-xl border p-4 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : messageType === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-black/10 bg-white"
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        {domains.length > 0 && (
          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-xl font-semibold">Your domains</h2>

            <div className="mt-4 grid gap-3">
              {domains.map((item) => (
                <button
                  key={item.domain}
                  onClick={() => void openDomain(item.domain)}
                  className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-5 text-left transition hover:border-black/30"
                >
                  <span className="font-medium">{item.domain}</span>

                  <span className="text-xs uppercase text-emerald-600">
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {selectedDomain && (
          <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">
                DNS records for {selectedDomain}
              </h2>

              <button
                onClick={() => void openDomain(selectedDomain)}
                className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black hover:text-white"
              >
                Refresh
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-black/50">
                    <th className="py-3 pr-4">Type</th>
                    <th className="pr-4">Name</th>
                    <th className="pr-4">Value</th>
                    <th>TTL</th>
                  </tr>
                </thead>

                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-black/45"
                      >
                        No DNS records found.
                      </td>
                    </tr>
                  ) : (
                    records.map((record, index) => (
                      <tr
                        key={`${record.type}-${record.name}-${index}`}
                        className="border-b border-black/5"
                      >
                        <td className="py-3 pr-4">{record.type}</td>
                        <td className="pr-4">{record.name}</td>
                        <td className="max-w-xs break-all pr-4">
                          {record.data}
                        </td>
                        <td>{record.ttl}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-5">
              <select
                value={dns.type}
                onChange={(event) =>
                  setDns((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                className="rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-black/40"
              >
                <option value="A">A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="TXT">TXT</option>
                <option value="MX">MX</option>
                <option value="NS">NS</option>
              </select>

              <input
                value={dns.name}
                onChange={(event) =>
                  setDns((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Name"
                className="rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-black/40"
              />

              <input
                value={dns.data}
                onChange={(event) =>
                  setDns((current) => ({
                    ...current,
                    data: event.target.value,
                  }))
                }
                placeholder="Value"
                className="rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-black/40"
              />

              <input
                value={dns.ttl}
                onChange={(event) =>
                  setDns((current) => ({
                    ...current,
                    ttl: event.target.value,
                  }))
                }
                type="number"
                min="1"
                placeholder="TTL"
                className="rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-black/40"
              />

              <button
                onClick={() => void updateDns()}
                disabled={dnsLoading}
                className="rounded-xl bg-[#202020] px-4 py-3 text-sm text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {dnsLoading ? "Saving..." : "Save DNS"}
              </button>
            </div>
          </section>
        )}

        <footer className="mt-28 border-t border-black/10 pt-6 text-center text-xs text-black/35">
          © {new Date().getFullYear()} 7wingz. Build something amazing.
        </footer>
      </div>
    </main>
  );
}