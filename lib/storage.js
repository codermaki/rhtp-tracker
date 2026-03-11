import { kv } from "@vercel/kv";

const STATE_KEY   = "rhtp:states";
const FEDERAL_KEY = "rhtp:federal";
const STATUS_KEY  = "rhtp:updateStatus";

export async function getStateData() {
  try {
    const data = await kv.get(STATE_KEY);
    return data || {};
  } catch { return {}; }
}

export async function setStateData(data) {
  await kv.set(STATE_KEY, data);
}

export async function getFederalData() {
  try {
    const data = await kv.get(FEDERAL_KEY);
    return data || null;
  } catch { return null; }
}

export async function setFederalData(data) {
  await kv.set(FEDERAL_KEY, data);
}

export async function getUpdateStatus() {
  try {
    const data = await kv.get(STATUS_KEY);
    return data || { running: false, progress: 0, total: 50, startedAt: null, trigger: null };
  } catch {
    return { running: false, progress: 0, total: 50, startedAt: null, trigger: null };
  }
}

export async function setUpdateStatus(status) {
  await kv.set(STATUS_KEY, status, { ex: 3600 }); // expires in 1hr
}
