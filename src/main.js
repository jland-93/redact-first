import { detect, deviceStatus, buildPrompt, runTask, warmUp } from "./ai.js";
import { mask, unmask, leaked } from "./redact.js";

const $ = (id) => document.getElementById(id);
const SAMPLE = `Hi team, please help me reply to this escalation.

Customer Sarah Lee (sarah.lee@acmehealth.com, +1 415-555-0142) says her insurance claim CLM-88231 was denied. Her date of birth is 1987-03-12 and she lives at 742 Evergreen Terrace, Springfield.

She mentioned she heard about our internal project "Falcon" and wants the $48/seat early pricing. The staging DB password is Hunter2! if you need to check her record.`;

let items = [];
let ruleOnly = false;
let current = { masked: "", map: [] };

const LABEL = {
  PERSON: "Person", EMAIL: "Email", PHONE: "Phone", ADDRESS: "Address", DATE_OF_BIRTH: "Birth date",
  ID_NUMBER: "ID", FINANCIAL: "Financial", SECRET: "Secret", CONFIDENTIAL: "Confidential",
};

async function showDevice() {
  const s = await deviceStatus();
  const el = $("device");
  const text = {
    available: "Gemini Nano ready on this device",
    downloadable: "On-device model not downloaded yet",
    downloading: "Downloading on-device model…",
    unavailable: "No on-device model: using local rules",
    unsupported: "No on-device model: using local rules",
  }[s] || s;
  el.textContent = text;
  el.className = "pill " + (s === "available" ? "ok" : "warn");
  if (s === "available") {
    el.textContent = "Warming up Gemini Nano on this device…";
    await warmUp();
    el.textContent = text;
  }
}

function render() {
  const chips = $("chips");
  chips.innerHTML = "";
  for (const it of items) {
    const b = document.createElement("button");
    b.className = "chip " + (it.on ? "on" : "off") + " t-" + it.type;
    b.innerHTML = `<span class="ty">${LABEL[it.type] || it.type}</span><span class="tx"></span>`;
    b.querySelector(".tx").textContent = it.text;
    b.title = it.on ? "Click to send this value as-is" : "Click to hide this value";
    b.onclick = () => { it.on = !it.on; render(); };
    chips.appendChild(b);
  }
  current = mask($("input").value, items);
  $("masked").textContent = current.masked || "—";
  $("masked").classList.toggle("empty", !current.masked);
  $("ask").disabled = !current.masked;
  $("copy").disabled = !current.masked;
  $("restore").disabled = !current.map.length;
}

$("copy").onclick = async () => {
  await navigator.clipboard.writeText(current.masked);
  $("copy").textContent = "Copied";
  setTimeout(() => ($("copy").textContent = "Copy masked text"), 1500);
};

$("restore").onclick = () => {
  const el = $("restored");
  el.hidden = false;
  el.textContent = unmask($("foreign").value, current.map) || "—";
  el.classList.toggle("empty", !$("foreign").value);
};

$("sample").onclick = () => { $("input").value = SAMPLE; };

$("scan").onclick = async () => {
  const text = $("input").value.trim();
  if (!text) return;
  $("scan").disabled = true;
  $("scanInfo").textContent = "Scanning on this device…";
  try {
    const r = await detect(text);
    items = r.items;
    ruleOnly = r.engine !== "on_device";
    $("confirmWrap").hidden = !ruleOnly;
    $("confirm").checked = false;
    $("scanInfo").textContent =
      r.engine === "on_device"
        ? `Found ${items.length} items with Gemini Nano on this device in ${(r.ms / 1000).toFixed(1)}s. Nothing was sent anywhere.`
        : `Found ${items.length} items with local rules (no on-device model on this browser). Nothing was sent anywhere.`;
    render();
  } catch (e) {
    $("scanInfo").textContent = "Scan failed: " + e.message;
  } finally {
    $("scan").disabled = false;
  }
};

document.querySelectorAll('input[name=task]').forEach((r) => (r.onchange = () => { $("custom").hidden = r.value !== "custom" || !r.checked; }));

$("ask").onclick = async () => {
  const task = document.querySelector('input[name=task]:checked').value;
  const prompt = buildPrompt(task, $("custom").value || "Help with this text.", current.masked);
  const where = $("forceCloud").checked ? "cloud" : "auto";
  $("audit").classList.remove("warn");
  if (ruleOnly && !$("confirm").checked) { $("audit").textContent = "Please review step 2 and tick the box above before sending."; $("audit").classList.add("warn"); return; }
  const stillVisible = leaked(prompt, current.map);
  if (stillVisible.length) { $("audit").textContent = "Blocked: some hidden values are still in the prompt."; $("audit").classList.add("warn"); return; }
  $("ask").disabled = true;
  $("result").textContent = "Working…";
  try {
    const r = await runTask(prompt, where);
    const restored = unmask(r.text, current.map);
    $("result").textContent = restored;
    $("result").classList.remove("empty");
    $("rawText").textContent = r.text;
    $("raw").hidden = false;
    const kept = items.filter((i) => !i.on).length;
    $("audit").textContent =
      `${r.engine === "in_cloud" ? "Gemini in the cloud" : "Gemini Nano on this device"} answered in ${(r.ms / 1000).toFixed(1)}s. ` +
      `${current.map.length} values stayed on this device` + (kept ? `, ${kept} you chose to send.` : ".");
  } catch (e) {
    $("result").textContent = "Request failed: " + e.message;
  } finally {
    $("ask").disabled = false;
  }
};

$("input").addEventListener("input", () => { if (items.length) render(); });

async function loadFromExtension() {
  if (!globalThis.chrome?.storage?.session) return;
  const { pending } = await chrome.storage.session.get("pending");
  if (pending?.text) {
    $("input").value = pending.text;
    await chrome.storage.session.remove("pending");
    $("scan").click();
  }
}
if (globalThis.chrome?.storage?.session) {
  chrome.storage.session.onChanged.addListener((c) => { if (c.pending?.newValue) loadFromExtension(); });
}

showDevice().then(loadFromExtension);
