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

  return `
<table role="presentation" class="mx-auto w-full max-w-[760px] bg-white" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:760px;margin:0 auto;border-collapse:collapse;background-color:#ffffff">
  <tbody>
    <tr>
      <td class="px-7 py-10 sm:px-12 sm:py-14" style="padding:40px 28px;font-family:Arial,Helvetica,sans-serif;color:#242321">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border-bottom:1px solid #e8e8e8">
          <tbody><tr>
            <td align="left" valign="middle" style="padding:0 8px 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#242321">${escapeHtml(content.publication)}<span style="color:#a48ed7">.</span></td>
            <td align="right" valign="middle" style="padding:0 0 20px 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8a8a8a;white-space:nowrap">${escapeHtml(content.issue)}</td>
          </tr></tbody>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
          <tbody>
            <tr><td style="padding:32px 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;line-height:1.4;letter-spacing:.12em;text-transform:uppercase;color:#777">${escapeHtml(content.eyebrow)}</td></tr>
            <tr><td style="padding:0;font-family:Georgia,'Times New Roman',serif;font-size:42px;font-weight:400;line-height:1.08;color:#303030">${escapeHtml(content.headline)}</td></tr>
            <tr><td style="padding:28px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.65;color:#4b4942"><p style="margin:0 0 20px">${escapeHtml(firstParagraph)}</p><p style="margin:0">${escapeHtml(secondParagraph)}</p></td></tr>
            <tr><td style="padding:40px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border-top:1px solid #e5e5e5"><tbody><tr>
              <td align="left" valign="middle" style="padding:20px 8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px"><a href="#" style="color:#303030;font-weight:500;text-decoration:none">${escapeHtml(content.linkText)}</a></td>
              <td align="right" valign="middle" style="padding:20px 0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#888;white-space:nowrap">${escapeHtml(content.website)}</td>
            </tr></tbody></table></td></tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>`
}

export const fieldNotesSubject = fieldNotesDefaults.subject
export const fieldNotesTemplateHtml = buildFieldNotesTemplate()
