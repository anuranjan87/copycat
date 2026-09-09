
import {
  getWebsiteContent,
  trackVisit,
} from "@/lib/website-actions"

import { notFound } from "next/navigation"
import IframeWithLinkHandler from "@/components/IframeWithLinkHandler"
import { headers } from "next/headers"

interface PageProps {
  params: Promise<{
    username: string
  }>
}

/*
 * ================================================================
 * NORMALIZE WEBSITE DATA
 * ================================================================
 */

function normalizeWebsiteData(
  rawData: string | null | undefined
): string {
  if (!rawData || !rawData.trim()) {
    return "{}"
  }

  const source = rawData.trim()

  /*
   * const data = {...}
   * let data = {...}
   * var data = {...}
   */
  const declarationMatch = source.match(
    /(?:^|[\r\n])\s*(?:const|let|var)\s+data\s*=\s*\{/
  )

  if (
    declarationMatch &&
    declarationMatch.index !== undefined
  ) {
    const declarationStart = declarationMatch.index

    const openingBrace = source.indexOf(
      "{",
      declarationStart
    )

    if (openingBrace !== -1) {
      const closingBrace = findMatchingBrace(
        source,
        openingBrace
      )

      if (closingBrace !== -1) {
        return source
          .slice(
            openingBrace,
            closingBrace + 1
          )
          .trim()
      }
    }
  }

  /*
   * Raw object:
   *
   * {
   *   hero: {...}
   * }
   */
  if (source.startsWith("{")) {
    const closingBrace = findMatchingBrace(
      source,
      0
    )

    if (closingBrace !== -1) {
      return source
        .slice(
          0,
          closingBrace + 1
        )
        .trim()
    }
  }

  /*
   * Object body:
   *
   * hero: {...}
   * nav: {...}
   */
  return `{\n${source}\n}`
}


/*
 * ================================================================
 * FIND MATCHING BRACE
 * ================================================================
 */

function findMatchingBrace(
  source: string,
  openingBraceIndex: number
): number {
  let depth = 0

  let quote:
    | '"'
    | "'"
    | "`"
    | null = null

  let escaped = false
  let inLineComment = false
  let inBlockComment = false

  for (
    let i = openingBraceIndex;
    i < source.length;
    i++
  ) {
    const char = source[i]
    const next = source[i + 1]

    /*
     * Line comment
     */
    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false
      }

      continue
    }

    /*
     * Block comment
     */
    if (inBlockComment) {
      if (
        char === "*" &&
        next === "/"
      ) {
        inBlockComment = false
        i++
      }

      continue
    }

    /*
     * Inside string
     */
    if (quote !== null) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === "\\") {
        escaped = true
        continue
      }

      if (char === quote) {
        quote = null
      }

      continue
    }

    /*
     * Start comments
     */
    if (
      char === "/" &&
      next === "/"
    ) {
      inLineComment = true
      i++
      continue
    }

    if (
      char === "/" &&
      next === "*"
    ) {
      inBlockComment = true
      i++
      continue
    }

    /*
     * Start strings
     */
    if (
      char === '"' ||
      char === "'" ||
      char === "`"
    ) {
      quote =
        char as '"' | "'" | "`"

      continue
    }

    /*
     * Braces
     */
    if (char === "{") {
      depth++
      continue
    }

    if (char === "}") {
      depth--

      if (depth === 0) {
        return i
      }
    }
  }

  return -1
}


/*
 * ================================================================
 * DETECT BABEL
 * ================================================================
 */

function hasBabelScript(
  html: string
): boolean {
  return /<script[^>]*type=["']text\/babel["'][^>]*>/i.test(
    html
  )
}


/*
 * ================================================================
 * BUILD HTML FOR BABEL WEBSITE
 * ================================================================
 */

function buildBabelHtml(
  html: string,
  rawData: string | null | undefined,
  username: string
): string {
  let finalHtml = html

  /*
   * Remove previous injection
   */
  finalHtml = finalHtml.replace(
    /\s*<!-- WEBSITE_DATA_INJECTION_START -->[\s\S]*?<!-- WEBSITE_DATA_INJECTION_END -->\s*/gi,
    "\n"
  )

  /*
   * Normalize data.js
   */
  const normalizedData =
    normalizeWebsiteData(rawData)

  /*
   * Data script
   */
  const dataScript = `
<!-- WEBSITE_DATA_INJECTION_START -->
<script>
window.__SITE_DATA__ = ${normalizedData};
</script>
<!-- WEBSITE_DATA_INJECTION_END -->
`.trim()

  /*
   * Babel script
   */
  const babelScriptRegex =
    /<script[^>]*type=["']text\/babel["'][^>]*>/i

  /*
   * Inject data immediately before Babel.
   */
  finalHtml = finalHtml.replace(
    babelScriptRegex,
    `${dataScript}

$&`
  )

  /*
   * Make the data available
   * inside the Babel script.
   */
  finalHtml = finalHtml.replace(
    babelScriptRegex,
    `$&

const data = window.__SITE_DATA__;

`
  )

  /*
   * Form handler
   */
  const formHandlerScript = `
<script>
(function () {

  function getFormData(form) {
    const formData = new FormData(form)
    const values = {}

    for (const [key, value] of formData.entries()) {
      values[key] = value
    }

    return values
  }

  function setupForm() {
    const form = document.querySelector("form")

    if (!form) {
      return
    }

    if (
      form.dataset.parentHandlerAttached === "true"
    ) {
      return
    }

    form.dataset.parentHandlerAttached = "true"

    form.addEventListener(
      "submit",
      function (event) {

        const values = getFormData(form)

        window.parent.postMessage(
          {
            type: "formSubmit",
            formData: values,
            username: ${JSON.stringify(username)}
          },
          "*"
        )

      },
      true
    )
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      setupForm
    )
  } else {
    setupForm()
  }

  setTimeout(setupForm, 100)
  setTimeout(setupForm, 500)
  setTimeout(setupForm, 1000)

})()
</script>
`.trim()

  /*
   * Error handler
   */
  const errorHandlerScript = `
<script>
(function () {

  window.addEventListener(
    "error",
    function (event) {
      console.error(
        "[WEBSITE ERROR]",
        event.message,
        "File:",
        event.filename,
        "Line:",
        event.lineno,
        "Column:",
        event.colno,
        event.error
      )
    }
  )

  window.addEventListener(
    "unhandledrejection",
    function (event) {
      console.error(
        "[WEBSITE PROMISE ERROR]",
        event.reason
      )
    }
  )

})()
</script>
`.trim()

  /*
   * Inject error handler
   */
  if (finalHtml.includes("<head>")) {
    finalHtml = finalHtml.replace(
      "<head>",
      `<head>
${errorHandlerScript}`
    )
  }

  /*
   * Inject form handler
   */
  if (finalHtml.includes("</body>")) {
    finalHtml = finalHtml.replace(
      "</body>",
      `${formHandlerScript}
</body>`
    )
  } else {
    finalHtml += `\n${formHandlerScript}`
  }

  return finalHtml
}


/*
 * ================================================================
 * PAGE
 * ================================================================
 */

export default async function UserWebsitePage({
  params,
}: PageProps) {
  const { username } = await params

  try {
    /*
     * Get website
     */
    const content =
      await getWebsiteContent(username)

    /*
     * No website
     */
    if (
      !content ||
      !content.html
    ) {
      return notFound()
    }

    /*
     * Track visit
     */
    const headersList =
      await headers()

    const forwardedFor =
      headersList.get(
        "x-forwarded-for"
      )

    const realIp =
      headersList.get(
        "x-real-ip"
      )

    const clientIp =
      forwardedFor
        ?.split(",")[0]
        ?.trim() ||
      realIp ||
      "unknown"

    await trackVisit(
      username,
      clientIp
    )

    const html = content.html

    /*
     * ============================================================
     * STATIC HTML WEBSITE
     * ============================================================
     *
     * If there is NO Babel script:
     *
     * DO NOT:
     * - inject data.js
     * - inject React variables
     * - send through iframe handler
     * - modify links
     *
     * Just render the HTML.
     */
    if (!hasBabelScript(html)) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      )
    }

    /*
     * ============================================================
     * BABEL / REACT WEBSITE
     * ============================================================
     *
     * Only Babel websites go through
     * the iframe processing pipeline.
     */
    const finalHtml =
      buildBabelHtml(
        html,
        content.data,
        username
      )

    return (
      <IframeWithLinkHandler
        content={finalHtml}
        username={username}
      />
    )

  } catch (error) {
    console.error(
      "[PAGE] WEBSITE ERROR",
      error
    )

    return notFound()
  }
}


/*
 * ================================================================
 * METADATA
 * ================================================================
 */

export async function generateMetadata({
  params,
}: PageProps) {
  const { username } = await params

  return {
    title: `${username}'s Website`,
    description: `Website for ${username}`,
  }
}

