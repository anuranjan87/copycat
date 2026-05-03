// app/draft/[username]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { sendEnquiry } from "@/lib/website-actions";

export default function DraftPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const previewKey = searchParams.get("previewKey");

  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Retrieve the code from sessionStorage
  useEffect(() => {
    if (!previewKey) {
      setHtmlContent(null);
      return;
    }
    const stored = sessionStorage.getItem(previewKey);
    if (stored) {
      setHtmlContent(stored);
      // Clean up after reading
      sessionStorage.removeItem(previewKey);
    } else {
      setHtmlContent(null);
    }
  }, [previewKey]);

  // Message handler for form submissions and link opening
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const data = event.data;
      if (!data) return;

      // Open links in new tab
      if (data.openLink) {
        window.open(data.openLink, "_blank", "noopener,noreferrer");
        return;
      }

      // Handle form submission
      if (data.formData) {
        const formData = new FormData();
        Object.entries(data.formData).forEach(([key, value]) => {
          const v = String(value).trim();
          if (v !== "") {
            formData.append(key, v);
          }
        });

        if ([...formData.keys()].length === 0) return;

        try {
          await sendEnquiry(username, formData);
          iframeRef.current?.contentWindow?.postMessage({ status: "success" }, "*");
        } catch {
          iframeRef.current?.contentWindow?.postMessage({ status: "error" }, "*");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [username]);

  if (!previewKey || htmlContent === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p className="text-center p-4">
          No preview data found. Please go back to the editor and click the maximize button again.
        </p>
      </div>
    );
  }

  // Inject the form‑handling script into the HTML (same as live site)
  const forceLinkScript = `
<script>
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector("[name='email']")?.value || "";
      const message = form.querySelector("[name='your_message']")?.value || "";
      window.parent.postMessage({
        formData: { email, message },
        username: "${username}"
      }, "*");
    });
  }
});
</script>
`.trim();

  let finalHtml = htmlContent;
  if (finalHtml.includes("</body>")) {
    finalHtml = finalHtml.replace("</body>", `${forceLinkScript}\n</body>`);
  } else {
    finalHtml += forceLinkScript;
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={finalHtml}
      className="w-full h-screen border-0"
      title="Draft Preview"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}