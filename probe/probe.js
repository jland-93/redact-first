import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { firebaseConfig } from "../src/firebase-config.js";
const app = initializeApp(firebaseConfig);
const ai = getAI(app, { backend: new GoogleAIBackend() });
const out = document.getElementById("o");
const log = (k, v) => { window.__res = window.__res || {}; window.__res[k] = v; out.textContent = JSON.stringify(window.__res, null, 1); };
document.getElementById("b").onclick = async () => {
  try {
    const dev = getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE });
    const r1 = await dev.generateContent("Reply with exactly: DEVICE_OK");
    log("device", { text: r1.response.text(), src: r1.response.inferenceSource });
  } catch (e) { log("deviceErr", String(e)); }
  try {
    const cloud = getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD });
    const r2 = await cloud.generateContent("Reply with exactly: CLOUD_OK");
    log("cloud", { text: r2.response.text(), src: r2.response.inferenceSource });
  } catch (e) { log("cloudErr", String(e).slice(0, 400)); }
  log("done", true);
};
