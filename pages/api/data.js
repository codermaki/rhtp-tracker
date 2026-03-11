import { getStateData, getFederalData, getUpdateStatus } from "../../lib/storage";

export default async function handler(req, res) {
  // Allow caching for 30s on the CDN, but always revalidate
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");

  const [stateData, federalData, updateStatus] = await Promise.all([
    getStateData(),
    getFederalData(),
    getUpdateStatus(),
  ]);

  return res.status(200).json({ stateData, federalData, updateStatus });
}
