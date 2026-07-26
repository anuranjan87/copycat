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

    // ✅ Securely load the API Key on the server
    const openAiApiKey = process.env.OPENAI_API_KEY || ""

    // ✅ Inject form handler & OpenAI key script
    const forceLinkScript = `
<script>
// Expose the API key globally inside the iframe environment
window.OPENAI_API_KEY = "${openAiApiKey}";

(function() {
  function getAllFormData(form) {
    const formData = new FormData(form);
    const values = {};
    for (let [key, value] of formData.entries()) {
      values[key] = value;
    }
    return values;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = getAllFormData(form);
      window.parent.postMessage({
        formData: formData,
        username: "${username}"
      }, "*");
      console.log("SENDING DATA:", formData);
    });
  });
})();
</script>
`.trim();

    // ✅ BUILDER FUNCTION
    const buildFinalHtml = (html: string, data: string) => {
      let cleaned = html
        .replace(/<script\s+src="data\.js"><\/script>/g, "")
        .replace(/const\s+data\s*=\s*{[\s\S]*?};?/g, "")

      const injectedData = `
<script>
const data = {
${data}
};
</script>
`

      let withData = cleaned.replace(
        '<script type="type/babel">',
        `${injectedData}\n<script type="text/babel">`
      )

      if (withData.includes("</body>")) {
        withData = withData.replace("</body>", `${forceLinkScript}\n</body>`)
      } else {
        withData += forceLinkScript
      }

      return withData
    }

    const finalHtml = buildFinalHtml(content.html, content.data)

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