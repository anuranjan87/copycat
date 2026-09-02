"use client"

import {
  useEffect,
  useRef,
} from "react"

import {
  sendEnquiry,
} from "@/lib/website-actions"


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


  /*
   * ============================================================
   * MESSAGE HANDLER
   * ============================================================
   */
  useEffect(() => {

    console.log("")
    console.log("========================================")
    console.log("[PARENT] IFRAME COMPONENT MOUNTED")
    console.log("========================================")

    console.log(
      "[PARENT] Username:",
      username
    )

    console.log(
      "[PARENT] HTML length:",
      content.length
    )


    /*
     * Show the HTML being sent to iframe.
     */
    console.log(
      "[PARENT] iframe HTML:",
      content
    )


    /*
     * ==========================================================
     * HANDLE MESSAGES FROM IFRAME
     * ==========================================================
     */
    const handleMessage = async (
      event: MessageEvent
    ) => {

      console.log(
        "[PARENT] MESSAGE RECEIVED:",
        event.data
      )


      /*
       * Only accept our iframe.
       */
      if (
        event.source !==
        iframeRef.current?.contentWindow
      ) {

        console.log(
          "[PARENT] Ignoring message from unknown source"
        )

        return
      }


      const message =
        event.data


      if (!message) {

        return

      }


      /*
       * ========================================================
       * LINK HANDLING
       * ========================================================
       */
      if (
        message.openLink
      ) {

        const url =
          String(
            message.openLink
          )


        console.log(
          "[PARENT] Open link:",
          url
        )


        try {

          const parsedUrl =
            new URL(url)


          /*
           * Only allow http/https.
           */
          if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
          ) {

            console.warn(
              "[PARENT] Blocked invalid protocol:",
              parsedUrl.protocol
            )

            return

          }


          window.open(
            parsedUrl.href,
            "_blank",
            "noopener,noreferrer"
          )


        } catch {

          console.warn(
            "[PARENT] Invalid URL:",
            url
          )

        }


        return

      }


      /*
       * ========================================================
       * FORM SUBMISSION
       * ========================================================
       */
      if (
        message.type !==
        "formSubmit"
      ) {

        return

      }


      if (
        !message.formData
      ) {

        console.warn(
          "[PARENT] formSubmit received without formData"
        )

        return

      }


      console.log("")
      console.log("========================================")
      console.log("[PARENT] FORM DATA RECEIVED")
      console.log("========================================")

      console.log(
        message.formData
      )


      /*
       * Create real FormData.
       */
      const formData =
        new FormData()


      /*
       * Convert object → FormData.
       */
      Object.entries(
        message.formData as Record<
          string,
          unknown
        >
      ).forEach(
        ([key, value]) => {

          /*
           * Ignore null.
           */
          if (
            value == null
          ) {

            return

          }


          /*
           * Objects / arrays.
           */
          if (
            typeof value ===
            "object"
          ) {

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
           * Don't add empty fields.
           */
          if (
            stringValue !== ""
          ) {

            formData.append(
              key,
              stringValue
            )

          }

        }
      )


      console.log(
        "[PARENT] FormData:",
        Object.fromEntries(
          formData.entries()
        )
      )


      /*
       * Don't send empty form.
       */
      if (
        [...formData.keys()].length === 0
      ) {

        console.warn(
          "[PARENT] Empty form submission"
        )

        return

      }


      /*
       * ========================================================
       * SEND ENQUIRY
       * ========================================================
       */
      try {

        console.log(
          "[PARENT] Sending enquiry..."
        )


        await sendEnquiry(
          username,
          formData
        )


        console.log(
          "[PARENT] ✅ ENQUIRY SENT"
        )


        /*
         * Tell iframe success.
         */
        iframeRef.current
          ?.contentWindow
          ?.postMessage(
            {
              type:
                "formResponse",

              status:
                "success",
            },
            "*"
          )


      } catch (error) {

        console.error(
          "[PARENT] ❌ SEND ENQUIRY FAILED"
        )

        console.error(
          error
        )


        /*
         * Tell iframe failure.
         */
        iframeRef.current
          ?.contentWindow
          ?.postMessage(
            {
              type:
                "formResponse",

              status:
                "error",
            },
            "*"
          )

      }

    }


    /*
     * Register listener.
     */
    window.addEventListener(
      "message",
      handleMessage
    )


    /*
     * Cleanup.
     */
    return () => {

      window.removeEventListener(
        "message",
        handleMessage
      )

    }


  }, [
    username,
    content
  ])


  /*
   * ============================================================
   * IFRAME
   * ============================================================
   */
  return (
    <iframe
      ref={iframeRef}

      srcDoc={content}

      title={`${username}'s website`}

      className="w-full h-screen border-0"

      onLoad={() => {

        console.log("")
        console.log("========================================")
        console.log("[PARENT] ✅ IFRAME LOADED")
        console.log("========================================")

      }}

      onError={(error) => {

        console.error(
          "[PARENT] ❌ IFRAME ERROR:",
          error
        )

      }}
    />
  )
}