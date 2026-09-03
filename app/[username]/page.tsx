

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
 *
 * Supports all of these formats:
 *
 * 1.
 * const data = {
 *   form: {...}
 * };
 *
 * 2.
 * let data = {
 *   form: {...}
 * };
 *
 * 3.
 * var data = {
 *   form: {...}
 * };
 *
 * 4.
 * {
 *   form: {...}
 * }
 *
 * 5.
 * form: {
 *   ...
 * }
 *
 * Everything becomes:
 *
 * {
 *   form: {
 *     ...
 *   }
 * }
 */
function normalizeWebsiteData(
  rawData: string | null | undefined
): string {

  console.log("")
  console.log("========================================")
  console.log("[DATA] RAW DATABASE DATA")
  console.log("========================================")
  console.log(rawData)

  /*
   * ------------------------------------------------------------
   * DATA.JS FORMAT SUPPORT
   * ------------------------------------------------------------
   *
   * The saved data.js may contain:
   *
   * 1. Comments + const data = {...}
   * 2. Comments + let data = {...}
   * 3. Comments + var data = {...}
   * 4. Just {...}
   * 5. Just the object body:
   *
   *      // Hero section
   *      hero: {
   *        heading: "Hello"
   *      }
   *
   * Comments are allowed before the declaration and inside the
   * object. Comments inside the object are preserved.
   *
   * The result is ALWAYS a JavaScript object literal:
   *
   * {
   *   ...
   * }
   */

  if (!rawData || !rawData.trim()) {
    console.warn(
      "[DATA] No data found. Using empty object."
    )

    return "{}"
  }

  const source = rawData.trim()

  /*
   * Find the opening `{` of:
   *
   * const data = {
   * let data = {
   * var data = {
   *
   * This is intentionally NOT anchored to the beginning because
   * users may place helpful comments above the declaration.
   */
  const declarationMatch = source.match(
    /(?:^|[\r\n])\s*(?:const|let|var)\s+data\s*=\s*\{/
  )

  /*
   * ------------------------------------------------------------
   * CASE 1: Complete data declaration exists.
   * ------------------------------------------------------------
   */
  if (declarationMatch && declarationMatch.index !== undefined) {

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

        const objectLiteral = source
          .slice(
            openingBrace,
            closingBrace + 1
          )
          .trim()

        console.log("")
        console.log("========================================")
        console.log("[DATA] NORMALIZED DATA")
        console.log("========================================")
        console.log(objectLiteral)

        return objectLiteral
      }

      console.error(
        "[DATA] ❌ Could not find closing brace for data object."
      )

      return "{}"
    }
  }

  /*
   * ------------------------------------------------------------
   * CASE 2: Raw object literal.
   *
   * Example:
   *
   * {
   *   // Hero
   *   hero: {...}
   * }
   * ------------------------------------------------------------
   */
  if (
    source.startsWith("{")
  ) {

    const closingBrace = findMatchingBrace(
      source,
      0
    )

    if (
      closingBrace !== -1
    ) {

      const objectLiteral = source
        .slice(
          0,
          closingBrace + 1
        )
        .trim()

      console.log("")
      console.log("========================================")
      console.log("[DATA] NORMALIZED DATA")
      console.log("========================================")
      console.log(objectLiteral)

      return objectLiteral
    }

  }

  /*
   * ------------------------------------------------------------
   * CASE 3: Object body only.
   *
   * Example:
   *
   * // Navigation
   * nav: {
   *   brand: "Bumper Special"
   * },
   *
   * // Hero
   * hero: {
   *   heading: "Hello"
   * }
   *
   * Wrap the body in `{}`.
   * ------------------------------------------------------------
   */

  const objectLiteral =
    `{\n${source}\n}`

  console.log("")
  console.log("========================================")
  console.log("[DATA] NORMALIZED DATA")
  console.log("========================================")
  console.log(objectLiteral)

  return objectLiteral
}


/*
 * ================================================================
 * FIND MATCHING BRACE
 * ================================================================
 *
 * Finds the `}` matching an opening `{` while correctly ignoring
 * braces inside:
 *
 * - strings
 * - template literals
 * - single-line comments
 * - block comments
 *
 * This is important for data.js because values may contain text
 * such as:
 *
 *   description: "Click {here}"
 *
 * or:
 *
 *   // Section {comment}
 *
 * or:
 *
 *   html: `<div>{value}</div>`
 */
function findMatchingBrace(
  source: string,
  openingBraceIndex: number
): number {

  let depth = 0

  let quote:
    '"' |
    "'" |
    "`" |
    null = null

  let escaped = false

  let inLineComment = false
  let inBlockComment = false

  for (
    let i = openingBraceIndex;
    i < source.length;
    i++
  ) {

    const char =
      source[i]

    const next =
      source[i + 1]


    /*
     * ----------------------------------------------------------
     * Single-line comment
     * ----------------------------------------------------------
     */
    if (
      inLineComment
    ) {

      if (
        char === "\n"
      ) {

        inLineComment =
          false

      }

      continue
    }


    /*
     * ----------------------------------------------------------
     * Block comment
     * ----------------------------------------------------------
     */
    if (
      inBlockComment
    ) {

      if (
        char === "*" &&
        next === "/"
      ) {

        inBlockComment =
          false

        i++

      }

      continue
    }


    /*
     * ----------------------------------------------------------
     * Inside a string / template literal
     * ----------------------------------------------------------
     */
    if (
      quote !== null
    ) {

      if (
        escaped
      ) {

        escaped =
          false

        continue

      }

      if (
        char === "\\"
      ) {

        escaped =
          true

        continue

      }

      if (
        char === quote
      ) {

        quote =
          null

      }

      continue
    }


    /*
     * ----------------------------------------------------------
     * Start comments
     * ----------------------------------------------------------
     */
    if (
      char === "/" &&
      next === "/"
    ) {

      inLineComment =
        true

      i++

      continue
    }

    if (
      char === "/" &&
      next === "*"
    ) {

      inBlockComment =
        true

      i++

      continue
    }


    /*
     * ----------------------------------------------------------
     * Start strings
     * ----------------------------------------------------------
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
     * ----------------------------------------------------------
     * Track braces
     * ----------------------------------------------------------
     */
    if (
      char === "{"
    ) {

      depth++

      continue
    }

    if (
      char === "}"
    ) {

      depth--

      if (
        depth === 0
      ) {

        return i

      }

    }

  }


  return -1
}

/*
 * ================================================================
 * BUILD FINAL HTML
 * ================================================================
 */
function buildFinalHtml(
  html: string,
  rawData: string | null | undefined,
  username: string
): string {

  console.log("")
  console.log("========================================")
  console.log("[HTML] BUILDING FINAL HTML")
  console.log("========================================")


  let finalHtml =
    html


  /*
   * Remove a previous data injection created by this component.
   * This prevents duplicate window.__SITE_DATA__ declarations if
   * the same HTML is processed more than once.
   */
  finalHtml =
    finalHtml.replace(
      /\s*<!-- WEBSITE_DATA_INJECTION_START -->[\s\S]*?<!-- WEBSITE_DATA_INJECTION_END -->\s*/gi,
      "\n"
    )


  /*
   * Normalize data.js.
   *
   * normalizeWebsiteData() safely extracts the actual object even
   * when data.js contains comments before `const data` or comments
   * inside the object.
   */
  const normalizedData =
    normalizeWebsiteData(rawData)


  /*
   * ============================================================
   * DATA SCRIPT
   * ============================================================
   *
   * Keep the user's data comments out of the executable injection
   * while preserving the resulting data object exactly.
   */
  const dataScript = `
<!-- WEBSITE_DATA_INJECTION_START -->
<script>
window.__SITE_DATA__ = ${normalizedData};

console.log(
  "[SITE DATA] Loaded:",
  window.__SITE_DATA__
);
</script>
<!-- WEBSITE_DATA_INJECTION_END -->
`.trim()


  /*
   * ============================================================
   * BABEL SCRIPT
   * ============================================================
   */
  const babelScriptRegex =
    /<script[^>]*type=["']text\/babel["'][^>]*>/i


  if (
    !babelScriptRegex.test(finalHtml)
  ) {

    console.error(
      "[HTML] ❌ No <script type=\"text/babel\"> found."
    )

    /*
     * Still inject the data.
     */
    if (
      finalHtml.includes("</body>")
    ) {

      finalHtml =
        finalHtml.replace(
          "</body>",
          `${dataScript}
</body>`
        )

    } else {

      finalHtml =
        `${dataScript}
${finalHtml}`

    }

  } else {

    /*
     * Insert data immediately BEFORE
     * the Babel React script.
     */
    finalHtml =
      finalHtml.replace(
        babelScriptRegex,
        `${dataScript}

$&`
      )


    /*
     * Now insert:
     *
     * const data = window.__SITE_DATA__;
     *
     * INSIDE the Babel script.
     */
    finalHtml =
      finalHtml.replace(
        babelScriptRegex,
        `$&
    
const data = window.__SITE_DATA__;

console.log(
  "[BABEL] data:",
  data
);

console.log(
  "[BABEL] data.form:",
  data?.form
);

console.log(
  "[BABEL] data.form.fields:",
  data?.form?.fields
);

`
      )

  }


  /*
   * ============================================================
   * FORM HANDLER
   * ============================================================
   *
   * This runs inside iframe.
   */
  const formHandlerScript = `
<script>
(function () {

  console.log(
    "[FORM HANDLER] Script loaded"
  );


  function getFormData(form) {

    const formData =
      new FormData(form);

    const values = {};


    for (
      const [key, value]
      of formData.entries()
    ) {

      values[key] = value;

    }


    return values;

  }


  function setupForm() {

    const form =
      document.querySelector("form");


    if (!form) {

      console.warn(
        "[FORM HANDLER] No form found"
      );

      return;

    }


    console.log(
      "[FORM HANDLER] Form found"
    );


    /*
     * Prevent duplicate handler.
     */
    if (
      form.dataset.parentHandlerAttached === "true"
    ) {

      return;

    }


    form.dataset.parentHandlerAttached =
      "true";


    /*
     * Capture phase.
     *
     * This lets us intercept the generated
     * React form before its own submit logic.
     */
    form.addEventListener(
      "submit",
      function (event) {

        console.log(
          "[FORM HANDLER] Submit detected"
        );


        /*
         * Stop the original form.
         */

        


        /*
         * Get values.
         */
        const values =
          getFormData(form);


        console.log(
          "[FORM HANDLER] FORM DATA:",
          values
        );


        /*
         * Send to parent.
         */
        window.parent.postMessage(
          {
            type: "formSubmit",

            formData: values,

            username:
              ${JSON.stringify(username)}
          },
          "*"
        );


        console.log(
          "[FORM HANDLER] Sent to parent"
        );

      },
      true
    );

  }


  /*
   * Try after DOM is ready.
   */
  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      setupForm
    );

  } else {

    setupForm();

  }


  /*
   * React may create the form AFTER
   * DOMContentLoaded.
   *
   * So check again shortly after.
   */
  setTimeout(
    setupForm,
    100
  );


  setTimeout(
    setupForm,
    500
  );


  setTimeout(
    setupForm,
    1000
  );


})();
</script>
`.trim()


  /*
   * ============================================================
   * ERROR HANDLER
   * ============================================================
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
      );

    }
  );


  window.addEventListener(
    "unhandledrejection",
    function (event) {

      console.error(
        "[WEBSITE PROMISE ERROR]",
        event.reason
      );

    }
  );


  console.log(
    "[WEBSITE] iframe JavaScript started"
  );


  console.log(
    "[WEBSITE] React:",
    typeof React !== "undefined"
      ? "LOADED"
      : "NOT LOADED"
  );


  console.log(
    "[WEBSITE] ReactDOM:",
    typeof ReactDOM !== "undefined"
      ? "LOADED"
      : "NOT LOADED"
  );


  console.log(
    "[WEBSITE] Babel:",
    typeof Babel !== "undefined"
      ? "LOADED"
      : "NOT LOADED"
  );


  console.log(
    "[WEBSITE] Root:",
    document.getElementById("root")
  );


})();
</script>
`.trim()


  /*
   * ============================================================
   * INJECT ERROR HANDLER
   * ============================================================
   *
   * Put it at the beginning so it can catch
   * errors from later scripts.
   */
  if (
    finalHtml.includes("<head>")
  ) {

    finalHtml =
      finalHtml.replace(
        "<head>",
        `<head>
${errorHandlerScript}`
      )

  }


  /*
   * ============================================================
   * INJECT FORM HANDLER
   * ============================================================
   */
  if (
    finalHtml.includes("</body>")
  ) {

    finalHtml =
      finalHtml.replace(
        "</body>",
        `${formHandlerScript}
</body>`
      )

  } else {

    finalHtml +=
      `\n${formHandlerScript}`

  }


  /*
   * ============================================================
   * FINAL DEBUG
   * ============================================================
   */
  console.log("")
  console.log("========================================")
  console.log("[HTML] FINAL HTML LENGTH")
  console.log("========================================")

  console.log(
    finalHtml.length
  )


  /*
   * Print the area around data injection.
   */
  const dataIndex =
    finalHtml.indexOf(
      "window.__SITE_DATA__"
    )


  if (
    dataIndex !== -1
  ) {

    console.log("")
    console.log("========================================")
    console.log("[HTML] DATA INJECTION")
    console.log("========================================")

    console.log(
      finalHtml.substring(
        Math.max(
          0,
          dataIndex - 300
        ),
        Math.min(
          finalHtml.length,
          dataIndex + 1500
        )
      )
    )

  }


  /*
   * Print the area around Babel.
   */
  const babelIndex =
    finalHtml.indexOf(
      'type="text/babel"'
    )


  if (
    babelIndex !== -1
  ) {

    console.log("")
    console.log("========================================")
    console.log("[HTML] BABEL AREA")
    console.log("========================================")

    console.log(
      finalHtml.substring(
        Math.max(
          0,
          babelIndex - 300
        ),
        Math.min(
          finalHtml.length,
          babelIndex + 2500
        )
      )
    )

  }


  console.log("")
  console.log("========================================")
  console.log("[HTML] FINAL HTML")
  console.log("========================================")

  console.log(
    finalHtml
  )

  console.log(
    "========================================"
  )


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

  const {
    username
  } = await params


  try {

    console.log("")
    console.log("========================================")
    console.log("[PAGE] LOADING WEBSITE")
    console.log("========================================")

    console.log(
      "Username:",
      username
    )


    /*
     * Get website content.
     */
    const content =
      await getWebsiteContent(
        username
      )


    console.log(
      "[PAGE] Website content:",
      content
    )


    /*
     * No website.
     */
    if (
      !content ||
      !content.html
    ) {

      console.error(
        "[PAGE] ❌ No HTML"
      )

      return notFound()

    }


    /*
     * ============================================================
     * IP ADDRESS
     * ============================================================
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


    /*
     * ============================================================
     * TRACK VISIT
     * ============================================================
     */
    await trackVisit(
      username,
      clientIp
    )


    /*
     * ============================================================
     * BUILD HTML
     * ============================================================
     */
    const finalHtml =
      buildFinalHtml(
        content.html,
        content.data,
        username
      )


    console.log("")
    console.log("========================================")
    console.log("[PAGE] PASSING HTML TO IFRAME")
    console.log("========================================")

    console.log(
      "Length:",
      finalHtml.length
    )


    return (
      <IframeWithLinkHandler
        content={finalHtml}
        username={username}
      />
    )


  } catch (error) {

    console.error("")
    console.error("========================================")
    console.error("[PAGE] ❌ WEBSITE ERROR")
    console.error("========================================")

    console.error(
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

  const {
    username
  } = await params


  return {

    title:
      `${username}'s Website`,

    description:
      `Website for ${username}`,

  }

}