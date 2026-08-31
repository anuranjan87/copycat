"use client"

import { useEffect, useRef } from "react"
import { sendEnquiry } from "@/lib/website-actions"

interface IframeWithLinkHandlerProps {
  content: string
  username: string
}

export default function IframeWithLinkHandler({
  content,
  username,
}: IframeWithLinkHandlerProps) {

  const iframeRef =
    useRef<HTMLIFrameElement>(null)

  useEffect(() => {

    const handleMessage = async (
      event: MessageEvent
    ) => {

      /*
       * Only accept messages coming from
       * our iframe.
       */
      if (
        event.source !==
        iframeRef.current?.contentWindow
      ) {
        return
      }

      const message = event.data

      if (!message) {
        return
      }

      /*
       * Handle links.
       *
       * Generated website can send:
       *
       * window.parent.postMessage({
       *   openLink: "https://example.com"
       * }, "*")
       */
      if (message.openLink) {

        const url = String(message.openLink)

        /*
         * Basic URL validation.
         */
        try {

          const parsedUrl = new URL(url)

          if (
            parsedUrl.protocol === "http:" ||
            parsedUrl.protocol === "https:"
          ) {

            window.open(
              parsedUrl.href,
              "_blank",
              "noopener,noreferrer"
            )

          }

        } catch {

          console.warn(
            "Invalid URL:",
            url
          )

        }

        return
      }

      /*
       * Handle form submission.
       */
      if (
        message.type !== "formSubmit" ||
        !message.formData
      ) {
        return
      }

      const formData = new FormData()

      /*
       * Convert iframe form data
       * into a real FormData object.
       */
      Object.entries(
        message.formData as Record<string, unknown>
      ).forEach(([key, value]) => {

        /*
         * Ignore null/undefined.
         */
        if (value == null) {
          return
        }

        /*
         * Objects/arrays → JSON.
         */
        if (typeof value === "object") {

          formData.append(
            key,
            JSON.stringify(value)
          )

          return
        }

        /*
         * Normal values.
         */
        const stringValue =
          String(value).trim()

        /*
         * Ignore empty fields.
         */
        if (stringValue !== "") {

          formData.append(
            key,
            stringValue
          )

        }

      })

      /*
       * Don't send empty submissions.
       */
      if (
        [...formData.keys()].length === 0
      ) {
        return
      }

      try {

        /*
         * Send enquiry to your backend.
         */
        await sendEnquiry(
          username,
          formData
        )

        console.log(
          "ENQUIRY SENT:",
          Object.fromEntries(
            formData.entries()
          )
        )

        /*
         * Tell iframe that submission
         * was successful.
         */
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "formResponse",
            status: "success",
          },
          "*"
        )

      } catch (error) {

        console.error(
          "Error sending enquiry:",
          error
        )

        /*
         * Tell iframe that submission
         * failed.
         */
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "formResponse",
            status: "error",
          },
          "*"
        )

      }

    }

    window.addEventListener(
      "message",
      handleMessage
    )

    return () => {

      window.removeEventListener(
        "message",
        handleMessage
      )

    }

  }, [username])

  return (
    <iframe
      ref={iframeRef}
      srcDoc={content}
      className="w-full h-screen border-0"
      title={`${username}'s website`}
    />
  )
}