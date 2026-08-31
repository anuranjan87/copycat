import { getWebsiteContent, trackVisit } from "@/lib/website-actions"
import { notFound } from "next/navigation"
import IframeWithLinkHandler from "@/components/IframeWithLinkHandler"
import { headers } from "next/headers"

interface PageProps {
  params: {
    username: string
  }
}

export default async function UserWebsitePage({ params }: PageProps) {
  const { username } = await params

  try {
    const content = await getWebsiteContent(username)

    if (!content || !content.html) {
      return notFound()
    }

    // Get client IP
    const headersList = await headers()

    const forwardedFor = headersList.get("x-forwarded-for")
    const realIp = headersList.get("x-real-ip")

    const clientIp =
      forwardedFor?.split(",")[0]?.trim() ||
      realIp ||
      "unknown"

    // Track visitor
    await trackVisit(username, clientIp)

    /*
     * IMPORTANT:
     * The OpenAI API key is NOT safe to expose to the browser.
     *
     * If your generated website needs AI functionality,
     * call your own server API instead of exposing OPENAI_API_KEY.
     */

    const forceLinkScript = `
<script>
(function () {

  function getAllFormData(form) {
    const formData = new FormData(form)
    const values = {}

    for (const [key, value] of formData.entries()) {
      values[key] = value
    }

    return values
  }

  document.addEventListener("DOMContentLoaded", function () {

    const form = document.querySelector("form")

    if (!form) return

    form.addEventListener("submit", function (e) {

      e.preventDefault()

      const formData = getAllFormData(form)

      window.parent.postMessage(
        {
          type: "formSubmit",
          formData: formData,
          username: "${username}"
        },
        "*"
      )

      console.log("SENDING DATA:", formData)

    })

  })

})()
</script>
`.trim()

    /*
     * Builds the final HTML that will be placed
     * inside the iframe.
     */
    const buildFinalHtml = (
      html: string,
      data: string
    ) => {

      let cleaned = html

      /*
       * Remove external data.js reference if present.
       */
      cleaned = cleaned.replace(
        /<script\s+src=["']data\.js["']\s*><\/script>/gi,
        ""
      )

      /*
       * Remove an existing const data = {...}
       * so we don't create duplicate declarations.
       */
      cleaned = cleaned.replace(
        /const\s+data\s*=\s*{[\s\S]*?};?\s*/g,
        ""
      )

      /*
       * Inject the database data.
       *
       * content.data should contain:
       *
       * nav: {...},
       * hero: {...},
       * slider: {...}
       *
       * NOT:
       *
       * const data = {...}
       */
      const injectedData = `
<script>
const data = {
${data}
};
</script>
`.trim()

      /*
       * IMPORTANT:
       *
       * Your HTML contains:
       *
       * <script type="text/babel">
       *
       * So we must replace THAT exact tag.
       */
      const babelTagRegex =
        /<script\s+type=["']text\/babel["']\s*>/i

      if (babelTagRegex.test(cleaned)) {

        cleaned = cleaned.replace(
          babelTagRegex,
          `${injectedData}\n<script type="text/babel">`
        )

      } else {

        /*
         * If there is no Babel script,
         * add the data before </body>.
         */
        if (cleaned.includes("</body>")) {

          cleaned = cleaned.replace(
            "</body>",
            `${injectedData}\n</body>`
          )

        } else {

          cleaned += injectedData

        }

      }

      /*
       * Inject form handling script.
       */
      if (cleaned.includes("</body>")) {

        cleaned = cleaned.replace(
          "</body>",
          `${forceLinkScript}\n</body>`
        )

      } else {

        cleaned += forceLinkScript

      }

      return cleaned
    }

    /*
     * Build final website HTML.
     */
    const finalHtml = buildFinalHtml(
      content.html,
      content.data || ""
    )

    return (
      <IframeWithLinkHandler
        content={finalHtml}
        username={username}
      />
    )

  } catch (error) {

    console.error(
      "Error loading user website:",
      error
    )

    return notFound()
  }
}

export async function generateMetadata({
  params,
}: PageProps) {

  const { username } = await params

  return {
    title: `${username}'s Website`,
    description: `Website for ${username}`,
  }
}