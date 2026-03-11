export async function queryClaudeWithSearch(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text in response");

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse JSON from response");

  return JSON.parse(jsonMatch[0]);
}

export function buildStatePrompt(stateName, stateUrl) {
  return `You are a policy analyst monitoring the Rural Health Transformation Program (RHTP). Search for the LATEST news and updates (2025-2026) specifically for ${stateName}'s RHTP.

Check:
1. ${stateUrl}
2. "${stateName} Department of Health Rural Health Transformation Program" news
3. Any RFPs, RFAs, sub-grant announcements, or implementation milestones for ${stateName}

Respond ONLY with this JSON (no markdown, no explanation):
{
  "lastActivity": "brief description of the most recent activity found",
  "activityDate": "date if found, else null",
  "rfpStatus": "Active RFPs/RFAs open | RFPs announced but not open | No active RFPs found | Unknown",
  "implementationPhase": "Planning | Procurement | Implementation | Reporting",
  "keyHighlight": "single most important recent development in one sentence",
  "source": "URL or source name"
}`;
}

export function buildFederalPrompt() {
  return `Search for the LATEST federal-level updates on the CMS Rural Health Transformation Program (RHTP) from cms.gov and hhs.gov in 2025-2026.

Look for: new guidance documents, policy updates, reporting requirements, CMS announcements, program changes, Rural Health Summit plans, Office of Rural Health Transformation news.

Respond ONLY with this JSON (no markdown, no explanation):
{
  "latestAnnouncement": "description of most recent federal announcement",
  "announcementDate": "date if found, else null",
  "programPhase": "current phase of the federal program",
  "keyGuidance": "any new guidance or policy published recently, else null",
  "cmsUrl": "direct URL to most recent announcement"
}`;
}
