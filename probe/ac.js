import { getToken } from "firebase/app-check";
import { appCheck } from "../src/ai.js";
export async function tok() {
  try { const t = await getToken(appCheck, true); return { ok: true, len: t.token.length, err: t.error ? String(t.error) : null }; }
  catch (e) { return { ok: false, err: String(e).slice(0, 400) }; }
}
