import { STATES } from "../../../lib/states";
import { queryClaudeWithSearch, buildStatePrompt, buildFederalPrompt } from "../../../lib/claude";
import {
  getStateData, setStateData,
  getFederalData, setFederalData,
  setUpdateStatus,
} from "../../../lib/storage";

// Vercel cron calls this at 0 2 * * * (2:00 AM UTC daily)
export default async function handler(req, res) {
  // Protect: only Vercel cron or your own calls (via CRON_SECRET env var)
  const authHeader = req.headers.authorization;
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Mark as running
  await setUpdateStatus({
    running: true,
    progress: 0,
    total: STATES.length + 1, // +1 for federal
    startedAt: new Date().toISOString(),
    trigger: "nightly",
    currentState: "Federal (CMS/HHS)",
  });

  const stateData = await getStateData();
  let completed = 0;

  // 1. Federal update
  try {
    const result = await queryClaudeWithSearch(buildFederalPrompt());
    await setFederalData({ result, checkedAt: new Date().toISOString() });
  } catch (e) {
    await setFederalData({ result: { latestAnnouncement: e.message }, checkedAt: new Date().toISOString(), error: true });
  }
  completed++;
  await setUpdateStatus({
    running: true, progress: completed, total: STATES.length + 1,
    startedAt: (await getUpdateStatus()).startedAt,
    trigger: "nightly",
    currentState: STATES[0]?.name || "States",
  });

  // 2. All 50 states, with a small delay between each
  for (let i = 0; i < STATES.length; i++) {
    const s = STATES[i];
    try {
      const result = await queryClaudeWithSearch(buildStatePrompt(s.name, s.url));
      stateData[s.code] = { result, checkedAt: new Date().toISOString() };
    } catch (e) {
      stateData[s.code] = {
        result: { keyHighlight: e.message },
        checkedAt: new Date().toISOString(),
        error: true,
      };
    }

    // Save after each state so partial results are persisted
    await setStateData(stateData);
    completed++;

    await setUpdateStatus({
      running: true,
      progress: completed,
      total: STATES.length + 1,
      startedAt: (await getUpdateStatus()).startedAt,
      trigger: "nightly",
      currentState: STATES[i + 1]?.name || "Finishing…",
    });

    // Pace requests — 700ms between states
    if (i < STATES.length - 1) {
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  // Done
  await setUpdateStatus({
    running: false,
    progress: STATES.length + 1,
    total: STATES.length + 1,
    startedAt: null,
    trigger: "nightly",
    completedAt: new Date().toISOString(),
    currentState: null,
  });

  return res.status(200).json({ ok: true, updated: STATES.length });
}

// Give Vercel up to 5 minutes to complete
export const config = { maxDuration: 300 };
