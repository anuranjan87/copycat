"use client"

import { useEffect, useRef } from "react"
import { sendEnquiry } from "@/lib/website-actions"

export default function IframeWithLinkHandler({
  content,
  username,
}: {
  content: string
  username: string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // ✅ Only accept messages from THIS iframe
      if (event.source !== iframeRef.current?.contentWindow) return

      const data = event.data
      if (!data) return

      // 🔗 Open links
      if (data.openLink) {
        window.open(data.openLink, "_blank", "noopener,noreferrer")
        return
      }

      // 📩 Handle form submission
      if (data.formData) {
        const formData = new FormData()

        // 🔥 Remove empty fields (FIXES your bug)
        Object.entries(data.formData).forEach(([key, value]) => {
          const v = String(value).trim()
          if (v !== "") {
            formData.append(key, v)
          }
        })

        // ❗ If nothing left, don't send
        if ([...formData.keys()].length === 0) return

        try {
          await sendEnquiry(username, formData)
console.log(Object.fromEntries(formData.entries()));

iframeRef.current?.contentWindow?.postMessage(
            { status: "success" },
            "*"
          )
        } catch {
          iframeRef.current?.contentWindow?.postMessage(
            { status: "error" },
            "*"
          )
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [username])

  return (
    <iframe
      ref={iframeRef}
      key={content}
      srcDoc={content}
      className="w-full h-screen border-0"
   />
  )
}