import { setFederalData } from "../../lib/storage";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { result, checkedAt } = req.body;
  try {
    await setFederalData({ result, checkedAt });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
