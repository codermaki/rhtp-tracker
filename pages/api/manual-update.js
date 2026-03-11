import { getUpdateStatus, setUpdateStatus } from "../../lib/storage";

// This kicks off the nightly cron job on-demand by calling it internally.
// We do NOT await it — we fire and forget, then the client polls /api/status.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const status = await getUpdateStatus();
  if (status.running) {
    return res.status(409).json({ error: "Update already in progress", status });
  }

  // Fire the nightly job asynchronously (don't await)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  fetch(`${baseUrl}/api/cron/nightly`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
    },
  }).catch(() => {}); // fire and forget

  // Mark running immediately so UI updates right away
  await setUpdateStatus({
    running: true,
    progress: 0,
    total: 51,
    startedAt: new Date().toISOString(),
    trigger: "manual",
    currentState: "Starting…",
  });

  return res.status(200).json({ ok: true, message: "Update started" });
}
