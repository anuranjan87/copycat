export const fieldNotesDefaults = {
  subject: "Build a brand customers choose",
  publication: "Field Notes",
  issue: "ISSUE 04 / 24",
  eyebrow: "A note from the desk",
  headline: "Build a brand customers choose",
  paragraphs: [
    "Strong brands begin with a clear understanding of the people they serve. Listen closely to what customers value, then make every interaction useful, simple, and trustworthy.",
    "This week, we explore practical ways to sharpen your positioning, deliver consistent value, and build relationships that keep customers coming back.",
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

export function buildFieldNotesTemplate(_content: FieldNotesContent = fieldNotesDefaults) {
  return `<style>
@media only screen and (max-width: 700px) {
  .newsletter-shell { width: 100% !important; }
  .newsletter-category { display: block !important; width: 100% !important; border-right: 0 !important; border-bottom: 1px solid #0f172a !important; }
  .newsletter-category-last { border-bottom: 0 !important; }
  .newsletter-quote, .newsletter-article { display: block !important; width: 100% !important; }
  .newsletter-hero { padding: 32px 24px !important; }
  .newsletter-headline { font-size: 58px !important; }
  .newsletter-quote, .newsletter-article { padding: 32px 24px !important; }
}
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;background:#f5f5f5;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <tr>
    <td align="center" style="padding:40px 16px">
      <table role="presentation" class="newsletter-shell" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:1152px;margin:0 auto;background:#ffffff;border-left:4px solid #0f172a;border-right:4px solid #0f172a;border-collapse:collapse">
        <tr>
          <td class="newsletter-hero" style="padding:64px;background:#facc15;border-bottom:4px solid #0f172a">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:0 0 48px;font-size:12px;line-height:1;letter-spacing:0.3em;text-transform:uppercase;font-weight:700">Issue No. 01 // Q1 2026</td>
                <td align="right" style="padding:0 0 48px">
                  <span style="display:inline-block;width:40px;height:40px;border:2px solid #0f172a;text-align:center;font-size:18px;line-height:36px;font-weight:700">→</span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0 0 32px">
                  <h1 class="newsletter-headline" style="margin:0;color:#0f172a;font-size:96px;line-height:0.85;font-weight:800;letter-spacing:-0.05em">WIN THE<br>RIGHT MARKET.</h1>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="max-width:448px;color:#0f172a;font-size:18px;line-height:1.1;font-weight:700;text-transform:uppercase">Create customer value with a clear position, a relevant offer, and an experience people trust.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border-bottom:4px solid #0f172a">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;table-layout:fixed">
              <tr>
                <td class="newsletter-category" width="25%" valign="top" style="width:25%;padding:32px;border-right:1px solid #0f172a">
                  <strong style="display:block;margin-bottom:16px;font-size:36px;line-height:1">01</strong>
                  <h2 style="margin:0 0 12px;font-size:20px;line-height:1.2;font-weight:800;text-transform:uppercase">Analysis</h2>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#454545">Understand the needs, choices, and expectations shaping your audience.</p>
                </td>
                <td class="newsletter-category" width="25%" valign="top" style="width:25%;padding:32px;border-right:1px solid #0f172a">
                  <strong style="display:block;margin-bottom:16px;font-size:36px;line-height:1">02</strong>
                  <h2 style="margin:0 0 12px;font-size:20px;line-height:1.2;font-weight:800;text-transform:uppercase">Strategy</h2>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#454545">Choose the customers you can serve best and define why your offer matters.</p>
                </td>
                <td class="newsletter-category" width="25%" valign="top" style="width:25%;padding:32px;border-right:1px solid #0f172a">
                  <strong style="display:block;margin-bottom:16px;font-size:36px;line-height:1">03</strong>
                  <h2 style="margin:0 0 12px;font-size:20px;line-height:1.2;font-weight:800;text-transform:uppercase">Insights</h2>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#454545">Turn customer feedback into better products and stronger experiences.</p>
                </td>
                <td class="newsletter-category newsletter-category-last" width="25%" valign="top" style="width:25%;padding:32px">
                  <strong style="display:block;margin-bottom:16px;font-size:36px;line-height:1">04</strong>
                  <h2 style="margin:0 0 12px;font-size:20px;line-height:1.2;font-weight:800;text-transform:uppercase">Forecast</h2>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#454545">Track the signals that reveal changing needs and new opportunities.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
              <tr>
                <td class="newsletter-quote" width="33.333%" valign="top" style="width:33.333%;padding:40px;background:#0f172a;color:#facc15">
                  <h2 style="margin:0;font-size:30px;line-height:1;font-weight:900;font-style:italic">"Lasting growth starts when customers see real value in choosing you."</h2>
                  <div style="width:48px;height:4px;margin:40px 0 16px;background:#facc15"></div>
                  <p style="margin:0;font-size:12px;line-height:1;letter-spacing:0.15em;text-transform:uppercase;font-weight:700">The Editorial Board</p>
                </td>
                <td class="newsletter-article" width="66.667%" valign="top" style="width:66.667%;padding:40px">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
                    <tr>
                      <td width="60%" valign="top" style="width:60%;padding-right:32px;color:#334155;font-size:12px;line-height:1.6">
                        <p style="margin:0 0 16px">Customers compare more than features. They weigh the whole experience: how easily they can find, understand, buy, and use an offer—and whether it delivers on its promise.</p>
                        <p style="margin:0">Start with a specific audience. Learn what matters to them, make your difference easy to recognize, and align every part of your service around the value you promise.</p>
                      </td>
                      <td width="40%" valign="bottom" style="width:40%">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:4px solid #0f172a;border-collapse:collapse">
                          <tr><td align="center" style="padding:16px 12px;font-size:14px;font-weight:900;text-transform:uppercase;color:#0f172a">Know Your Customer</td></tr>
                        </table>
                        <p style="margin:16px 0 0;color:#94a3b8;font-size:10px;line-height:1.3;text-align:center;text-transform:uppercase">Listen. Learn. Deliver value.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;background:#0f172a;color:#a1a1aa;font-size:10px;line-height:1;letter-spacing:0.15em;text-transform:uppercase">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;color:#a1a1aa;font-size:10px;line-height:1;letter-spacing:0.15em;text-transform:uppercase">
              <tr><td>© 2026 Field Notes</td><td align="right">Ideas for customer-led growth</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

export const fieldNotesSubject = fieldNotesDefaults.subject
export const fieldNotesTemplateHtml = buildFieldNotesTemplate()
