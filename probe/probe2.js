import { initializeApp, getApps } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { firebaseConfig } from "../src/firebase-config.js";
const app = getApps()[0] || initializeApp(firebaseConfig);
const ai = getAI(app, { backend: new GoogleAIBackend() });
const t = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("timeout " + ms)), ms))]);
export async function run(which) {
  const lang = { expectedInputs: [{ type: "text", languages: ["en"] }], expectedOutputs: [{ type: "text", languages: ["en"] }] };
  const m = which === "device"
    ? getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE, onDeviceParams: { createOptions: lang } })
    : getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD });
  try { const r = await t(m.generateContent(`Reply with exactly: ${which.toUpperCase()}_OK`), 30000); return { text: r.response.text(), src: r.response.inferenceSource }; }
  catch (e) { return { err: String(e).slice(0, 500) }; }
}
