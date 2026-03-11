import { getStateData, getFederalData } from "../../lib/storage";

export default async function handler(req, res) {
  const [stateData, federalData] = await Promise.all([
    getStateData(),
    getFederalData(),
  ]);
  return res.status(200).json({ stateData, federalData });
}
