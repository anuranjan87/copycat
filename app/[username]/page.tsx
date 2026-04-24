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

    // ✅ Get client IP
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIp = headersList.get("x-real-ip")
    const clientIp = forwardedFor?.split(",")[0] || realIp || "unknown"

    await trackVisit(username, clientIp)

    // ✅ Inject form handler
    const forceLinkScript = `
<script>
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form")
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = form.querySelector("[name='email']")?.value || ""
      const message = form.querySelector("[name='your_message']")?.value || ""

      window.parent.postMessage({
        formData: { email, message },
        username: "${username}"
      }, "*")
    })
  }

})
</script>
`.trim()

    // ✅ MAIN BUILDER FUNCTION (THIS WAS YOUR MISSING PIECE)
    const buildFinalHtml = (html: string, data: string) => {
      let cleaned = html
        // remove old external data file
        .replace(/<script\s+src="data\.js"><\/script>/g, "")
        // remove any existing const data block
        .replace(/const\s+data\s*=\s*{[\s\S]*?};?/g, "")

      const injectedData = `
<script>
const data = {
${data}
};
</script>
`

      // inject BEFORE babel script
      let withData = cleaned.replace(
        '<script type="text/babel">',
        `${injectedData}\n<script type="text/babel">`
      )

      // inject form handler before </body>
      if (withData.includes("</body>")) {
        withData = withData.replace("</body>", `${forceLinkScript}\n</body>`)
      } else {
        withData += forceLinkScript
      }

      return withData
    }

    // ✅ FINAL HTML (THIS WAS MISSING IN YOUR CODE)
    const finalHtml = buildFinalHtml(content.html, content.data)
console.log(finalHtml)
    return (
      <IframeWithLinkHandler
        content={finalHtml}
        username={username}
      />
    )

  } catch (error) {
    console.error("Error loading user website:", error)
    return notFound()
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params

  return {
    title: `${username}'s Website`,
    description: `Website for ${username}`,
  }
}