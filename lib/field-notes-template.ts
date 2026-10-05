export const fieldNotesDefaults = {
  subject: "A quieter way to make a living",
  publication: "Field Notes",
  issue: "ISSUE 04 / 24",
  eyebrow: "A note from the desk",
  headline: "A quieter way to make a living",
  paragraphs: [
    "The best work doesn’t always announce itself. Sometimes it arrives quietly, between the second cup of coffee and the moment the street lights come on.",
    "This week, we’re looking at the small rituals that make room for good ideas — and a few tools for protecting that room.",
  ] as [string, string],
  linkText: "Read the full story →",
  website: "fieldnotes.co",
}

export type FieldNotesContent = {
  subject: string
  publication: string
  issue: string
  eyebrow: string
  headline: string
  paragraphs: [string, string]
  linkText: string
  website: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })
}

export function buildFieldNotesTemplate(content: FieldNotesContent = fieldNotesDefaults) {
  const [firstParagraph, secondParagraph] = content.paragraphs

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Future Pulse — Landing Page</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f5f5f5;
      color: #0f172a;
    }

    .page-background {
      background: #f5f5f5;
      min-height: 100vh;
      padding: 40px 0;
    }

    .page {
      width: calc(100% - 32px);
      max-width: 1152px;
      min-height: 100vh;
      margin: 0 auto;
      background: #ffffff;
      border-left: 4px solid #0f172a;
      border-right: 4px solid #0f172a;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    /* =========================
       HEADER
    ========================= */

    .hero {
      background: #facc15;
      border-bottom: 4px solid #0f172a;
      padding: 64px;
      position: relative;
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
    }

    .issue {
      font-size: 12px;
      line-height: 1;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      font-weight: 700;
      color: #0f172a;
    }

    .arrow-box {
      width: 40px;
      height: 40px;
      border: 2px solid #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }

    .hero h1 {
      margin: 0 0 32px 0;
      color: #0f172a;
      font-size: 96px;
      line-height: 0.85;
      font-weight: 800;
      letter-spacing: -0.05em;
    }

    .hero-description {
      max-width: 448px;
    }

    .hero-description p {
      margin: 0;
      color: #0f172a;
      font-size: 18px;
      line-height: 1.1;
      font-weight: 700;
      text-transform: uppercase;
    }

    /* =========================
       CATEGORY SECTION
    ========================= */

    .categories {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-bottom: 4px solid #0f172a;
    }

    .category {
      padding: 32px;
      border-right: 1px solid #0f172a;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .category:last-child {
      border-right: none;
    }

    .category:hover {
      background: #0f172a;
      color: #ffffff;
    }

    .category-number {
      display: block;
      margin-bottom: 16px;
      font-size: 36px;
      line-height: 1;
      font-weight: 900;
    }

    .category h3 {
      margin: 0 0 12px 0;
      font-size: 20px;
      line-height: 1.2;
      font-weight: 800;
      text-transform: uppercase;
    }

    .category p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      opacity: 0.8;
    }

    /* =========================
       CONTENT SECTION
    ========================= */

    .content {
      display: grid;
      grid-template-columns: 1fr 2fr;
    }

    .quote-panel {
      padding: 40px;
      background: #0f172a;
      color: #facc15;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .quote-panel h2 {
      margin: 0;
      font-size: 30px;
      line-height: 1;
      font-weight: 900;
      font-style: italic;
    }

    .quote-footer {
      margin-top: 40px;
    }

    .quote-line {
      width: 48px;
      height: 4px;
      background: #facc15;
      margin-bottom: 16px;
    }

    .quote-author {
      margin: 0;
      font-size: 12px;
      line-height: 1;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 700;
    }

    .article {
      padding: 40px;
    }

    .article-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
    }

    .article-copy {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .article-copy p {
      margin: 0;
      color: #334155;
      font-size: 12px;
      line-height: 1.6;
    }

    .article-action {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .join-button {
      width: 100%;
      padding: 16px 24px;
      background: transparent;
      border: 4px solid #0f172a;
      color: #0f172a;
      font-family: inherit;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .join-button:hover {
      background: #facc15;
    }

    .terms {
      margin: 16px 0 0 0;
      color: #94a3b8;
      font-size: 10px;
      line-height: 1.3;
      letter-spacing: -0.02em;
      text-align: center;
      text-transform: uppercase;
    }

    /* =========================
       FOOTER
    ========================= */

    .footer {
      padding: 16px 40px;
      background: #0f172a;
      color: rgba(255, 255, 255, 0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    /* =========================
       TABLET
    ========================= */

    @media (max-width: 900px) {
      .hero {
        padding: 48px;
      }

      .hero h1 {
        font-size: 76px;
      }

      .category {
        padding: 24px;
      }

      .quote-panel,
      .article {
        padding: 32px;
      }
    }

    /* =========================
       MOBILE
    ========================= */

    @media (max-width: 700px) {
      .page-background {
        padding: 0;
      }

      .page {
        width: 100%;
        border-left: none;
        border-right: none;
        margin: 0;
      }

      .hero {
        padding: 32px 24px;
      }

      .hero-top {
        margin-bottom: 40px;
      }

      .issue {
        font-size: 10px;
        letter-spacing: 0.2em;
      }

      .arrow-box {
        width: 36px;
        height: 36px;
      }

      .hero h1 {
        font-size: 58px;
        line-height: 0.88;
        margin-bottom: 28px;
      }

      .hero-description p {
        font-size: 16px;
      }

      .categories {
        grid-template-columns: 1fr;
      }

      .category {
        padding: 24px;
        border-right: none;
        border-bottom: 1px solid #0f172a;
      }

      .category:last-child {
        border-bottom: none;
      }

      .content {
        grid-template-columns: 1fr;
      }

      .quote-panel {
        padding: 32px 24px;
      }

      .quote-panel h2 {
        font-size: 28px;
      }

      .article {
        padding: 32px 24px;
      }

      .article-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      .footer {
        padding: 16px 24px;
        gap: 16px;
        flex-direction: column;
        align-items: flex-start;
      }
    }

    /* =========================
       SMALL MOBILE
    ========================= */

    @media (max-width: 420px) {
      .hero h1 {
        font-size: 48px;
      }

      .hero-description p {
        font-size: 14px;
      }

      .category-number {
        font-size: 32px;
      }

      .quote-panel h2 {
        font-size: 25px;
      }
    }
  </style>
</head>

<body>
  <div class="page-background">

    <main class="page">

      <!-- HEADER -->
      <header class="hero">

        <div class="hero-top">
          <div class="issue">
            Issue No. 01 // Q1 2026
          </div>

          <div class="arrow-box">
            →
          </div>
        </div>

        <h1>
          THE NEW<br />
          FRONTIER.
        </h1>

        <div class="hero-description">
          <p>
            Navigating the intersection of exponential technology and global
            capital markets.
          </p>
        </div>

      </header>


      <!-- CATEGORIES -->
      <section class="categories">

        <div class="category">
          <span class="category-number">01</span>

          <h3>Analysis</h3>

          <p>
            Deep dives into the algorithms shaping the next decade of wealth.
          </p>
        </div>


        <div class="category">
          <span class="category-number">02</span>

          <h3>Strategy</h3>

          <p>
            Risk management techniques for a high-volatility AI economy.
          </p>
        </div>


        <div class="category">
          <span class="category-number">03</span>

          <h3>Insights</h3>

          <p>
            Exclusive interviews with the architects of the silicon boom.
          </p>
        </div>


        <div class="category">
          <span class="category-number">04</span>

          <h3>Forecast</h3>

          <p>
            Quarterly outlooks on the S&amp;P 500 and emerging tech sectors.
          </p>
        </div>

      </section>


      <!-- MAIN CONTENT -->
      <section class="content">

        <div class="quote-panel">

          <h2>
            "The greatest risk is not the bubble, but being left behind by the
            transformation."
          </h2>

          <div class="quote-footer">
            <div class="quote-line"></div>

            <p class="quote-author">
              The Editorial Board
            </p>
          </div>

        </div>


        <div class="article">

          <div class="article-grid">

            <div class="article-copy">

              <p>
                The current market cycle is defined by a concentration of
                capital rarely seen in history. While critics point to the
                dot-com era as a cautionary tale, the cash flows of the
                "Magnificent Seven" tell a different story of dominance.
              </p>

              <p>
                As we move into 2026, the question remains: will the
                infrastructure spending translate into consumer-level utility
                fast enough to sustain these valuations?
              </p>

            </div>


            <div class="article-action">

              <button class="join-button">
                Join the Network
              </button>

              <p class="terms">
                Terms and conditions apply. Professional investors only.
              </p>

            </div>

          </div>

        </div>

      </section>


      <!-- FOOTER -->
      <footer class="footer">
        <span>© 2026 Pulse Media Group</span>
        <span>All Rights Reserved</span>
      </footer>

    </main>

  </div>
</body>
</html>

`
}

export const fieldNotesSubject = fieldNotesDefaults.subject
export const fieldNotesTemplateHtml = buildFieldNotesTemplate()
