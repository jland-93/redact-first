import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { firebaseConfig } from "./firebase-config.js";
import { RECAPTCHA_V3_SITE_KEY } from "./appcheck-config.js";
import { DETECT_SCHEMA, DETECT_SYSTEM, ruleDetect, mergeItems } from "./redact.js";

const app = initializeApp(firebaseConfig);
const isExtension = location.protocol === "chrome-extension:";
if (isExtension && typeof __APPCHECK_DEBUG_TOKEN__ === "string") self.FIREBASE_APPCHECK_DEBUG_TOKEN = __APPCHECK_DEBUG_TOKEN__;
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});
const ai = getAI(app, { backend: new GoogleAIBackend() });
export { appCheck };

const LANG = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};

const detector = getGenerativeModel(ai, {
  mode: InferenceMode.ONLY_ON_DEVICE,
  onDeviceParams: {
    createOptions: { ...LANG, initialPrompts: [{ role: "system", content: DETECT_SYSTEM }] },
    promptOptions: { responseConstraint: DETECT_SCHEMA },
  },
});

const assistant = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_ON_DEVICE,
  onDeviceParams: { createOptions: LANG },
  inCloudParams: { model: "gemini-3.5-flash-lite" },
});

const cloudOnly = getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD });

export async function deviceStatus() {
  if (typeof LanguageModel === "undefined") return "unsupported";
  try {
    return await LanguageModel.availability(LANG);
  } catch {
    return "unsupported";
  }
}

let warm = null;
export function warmUp() {
  if (!warm) warm = detector.generateContent("Contact Jane Roe at jane@example.com.").catch(() => null);
  return warm;
}

export async function detect(text) {
  const rules = ruleDetect(text);
  const status = await deviceStatus();
  if (status !== "available") return { items: mergeItems(text, rules), engine: "rules", status };
  await warmUp();
  const t0 = performance.now();
  const r = await detector.generateContent(text);
  let modelItems = [];
  try {
    modelItems = JSON.parse(r.response.text()).items || [];
  } catch {
    modelItems = [];
  }
  return {
    items: mergeItems(text, modelItems, rules),
    engine: r.response.inferenceSource,
    ms: Math.round(performance.now() - t0),
    status,
  };
}

const TASKS = {
  reply: "Draft a concise, polite reply to the message below.",
  summarize: "Summarize the text below in 3 bullet points.",
  actions: "List the action items in the text below as a checklist.",
};

export function buildPrompt(task, custom, masked) {
  const instruction = task === "custom" ? custom : TASKS[task];
  return (
    `${instruction}\n\n` +
    "The text contains placeholders in square brackets such as [PERSON_1] or [EMAIL_2]. " +
    "Keep every placeholder exactly as written, including the brackets, wherever you need to refer to that value. " +
    "Never invent real values for them and never create new placeholders; if you need a value you do not have, write ___ instead.\n\n---\n" +
    masked
  );
}

export async function runTask(prompt, where) {
  const model = where === "cloud" ? cloudOnly : assistant;
  const t0 = performance.now();
  const r = await model.generateContent(prompt);
  return { text: r.response.text(), engine: r.response.inferenceSource, ms: Math.round(performance.now() - t0) };
}
