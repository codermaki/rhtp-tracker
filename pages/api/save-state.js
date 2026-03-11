import { getStateData, setStateData } from "../../lib/storage";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { code, result, checkedAt, error } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });
  try {
    const stateData = await getStateData();
    stateData[code] = { result: result || null, checkedAt, error: error || null };
    await setStateData(stateData);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
