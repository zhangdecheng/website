const FROM = "Flourish Website <business@flourish-culture.com>";
const ROUTES = Object.freeze({
  brand: {
    to: "hannah@flourish-culture.com",
    subject: "[Flourish Website] New Brand Inquiry",
    fields: [
      ["Name", "name"],
      ["Email", "replyTo"],
      ["Company", "company"],
      ["Budget", "budget"],
      ["Growth Objectives", "growthObjectives"],
    ],
  },
  creator: {
    to: "irisa@flourishculture.com",
    subject: "[Flourish Website] New Creator Application",
    fields: [
      ["Name", "name"],
      ["Email", "replyTo"],
      ["Social Media Handles", "socialHandles"],
      ["Niche", "niche"],
      ["Main Audience Demographics", "audienceDemographics"],
    ],
  },
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("\n", "<br>");
}

export function buildMailMessage(submission) {
  const route = ROUTES[submission.role];
  if (!route) throw new Error("Unsupported contact role");
  const rows = route.fields.map(([label, key]) => [label, submission[key]]);
  return {
    from: FROM,
    to: route.to,
    replyTo: submission.replyTo,
    subject: route.subject,
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n\n"),
    html: `<h1>${escapeHtml(route.subject)}</h1><dl>${rows
      .map(([label, value]) => `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value)}</dd>`)
      .join("")}</dl>`,
  };
}
