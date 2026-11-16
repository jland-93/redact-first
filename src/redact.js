export const TYPES = ["PERSON", "EMAIL", "PHONE", "ADDRESS", "DATE_OF_BIRTH", "ID_NUMBER", "FINANCIAL", "SECRET", "CONFIDENTIAL"];

export const DETECT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" }, type: { type: "string", enum: TYPES } },
        required: ["text", "type"],
      },
    },
  },
  required: ["items"],
};

export const DETECT_SYSTEM =
  "You find sensitive information in text before it is sent to a cloud AI. " +
  "Return every exact substring that is personal data (names of people, emails, phone numbers, street addresses, dates of birth), " +
  "identifiers (account, claim, case, passport, employee or customer IDs), financial details (card or bank numbers, prices, revenue), " +
  "credentials (passwords, API keys, tokens), or confidential business information (internal project names, unreleased plans). " +
  "Copy each value exactly as it appears, and copy only the value itself: for a person only their name, for an identifier only the code. " +
  "Never include surrounding words such as verbs, labels, or nouns like 'invoice', 'claim', 'customer' or 'please'.";

const RULES = [
  { type: "EMAIL", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { type: "PHONE", re: /(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)[\s-]?)?\d{2,4}[\s-]\d{3,4}[\s-]\d{3,4}/g },
  { type: "FINANCIAL", re: /\b(?:\d[ -]?){13,19}\b/g },
  { type: "SECRET", re: /\b(?:sk|pk|AKIA|ghp|xox[baprs])[-_A-Za-z0-9]{12,}\b/g },
  { type: "SECRET", re: /(?<=password(?: is|:)\s*)\S+/gi },
  { type: "DATE_OF_BIRTH", re: /(?<=(?:born|birth|DOB)[^\d]{0,20})\d{4}-\d{2}-\d{2}/gi },
  { type: "ID_NUMBER", re: /\b[A-Z]{2,6}-\d{3,}\b/g },
  { type: "ADDRESS", re: /\b\d{1,5}(?: [A-Z][a-z]+)+ (?:Street|St|Avenue|Ave|Road|Rd|Terrace|Lane|Ln|Drive|Dr|Boulevard|Blvd|Way|Court|Ct|Place|Pl)\b\.?/g },
  { type: "FINANCIAL", re: /\$\d[\d,]*(?:\.\d+)?(?:\/\w+)?/g },
  { type: "CONFIDENTIAL", re: /(?<=(?:[Pp]roject|[Cc]ode ?name)(?: is)?\s+"?)[A-Z][A-Za-z0-9]+/g },
  { type: "PERSON", re: /(?<!\d )\b[A-Z][a-z]+(?: [A-Z][a-z]+(?:-[A-Z][a-z]+)?){1,3}\b/g },
];

const NOT_NAMES = /^(?:Hi|Dear|Hello|Thanks|Thank|Our|The|Please|Customer|Team|She|He|They|We|If|Her|His)\b/;

export function ruleDetect(text) {
  const items = [];
  for (const { type, re } of RULES) {
    for (const m of text.matchAll(re)) {
      const t = m[0].trim().replace(/[.,;:!?)]+$/, "");
      if (type === "PERSON") {
        const words = t.split(" ");
        while (words.length && NOT_NAMES.test(words[0])) words.shift();
        if (words.length < 2) continue;
        items.push({ text: words.join(" "), type });
        continue;
      }
      items.push({ text: t, type });
    }
  }
  return items;
}

export function mergeItems(text, ...lists) {
  const seen = new Map();
  for (const list of lists) {
    for (const it of list) {
      const t = (it.text || "").trim();
      if (t.length < 2 || !text.includes(t)) continue;
      if (!seen.has(t)) seen.set(t, { text: t, type: TYPES.includes(it.type) ? it.type : "CONFIDENTIAL", on: true });
    }
  }
  const arr = [...seen.values()];
  return arr.filter((a) => !arr.some((b) => b !== a && b.text.length > a.text.length && b.text.includes(a.text)));
}

export function mask(text, items) {
  const counters = {};
  const map = [];
  let out = text;
  const active = items.filter((i) => i.on).sort((a, b) => b.text.length - a.text.length);
  for (const it of active) {
    counters[it.type] = (counters[it.type] || 0) + 1;
    const token = `[${it.type}_${counters[it.type]}]`;
    map.push({ token, value: it.text, type: it.type });
    out = out.split(it.text).join(token);
  }
  return { masked: out, map };
}

export function unmask(text, map) {
  let out = text;
  for (const { token, value } of map) out = out.split(token).join(value);
  return out.replace(/\[(?:PERSON|EMAIL|PHONE|ADDRESS|DATE_OF_BIRTH|ID_NUMBER|FINANCIAL|SECRET|CONFIDENTIAL)_\d+\]/g, "___");
}

export function leaked(text, map) {
  return map.filter(({ value }) => text.includes(value)).map((m) => m.value);
}
