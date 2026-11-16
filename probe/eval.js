import { detect } from "../src/ai.js";
import { ruleDetect, mergeItems } from "../src/redact.js";
export async function run() {
  const cases = await (await fetch("/eval-cases.json")).json();
  const score = (found, gold) => {
    const f = found.map((x) => x.text);
    const hit = gold.filter((g) => f.some((x) => x.includes(g) || g.includes(x))).length;
    const fp = f.filter((x) => !gold.some((g) => x.includes(g) || g.includes(x))).length;
    return { hit, total: gold.length, fp };
  };
  const out = [];
  for (const c of cases) {
    const t0 = performance.now();
    const d = await detect(c.text);
    const ms = Math.round(performance.now() - t0);
    const r = mergeItems(c.text, ruleDetect(c.text));
    out.push({ device: score(d.items, c.gold), rules: score(r, c.gold), ms, engine: d.engine,
      missDevice: c.gold.filter((g) => !d.items.some((x) => x.text.includes(g) || g.includes(x.text))),
      fpDevice: d.items.filter((x) => !c.gold.some((g) => x.text.includes(g) || g.includes(x.text))).map((x) => x.text) });
  }
  const sum = (k, f) => out.reduce((a, o) => a + o[k][f], 0);
  return { device: { recall: sum("device", "hit") / sum("device", "total"), fp: sum("device", "fp") }, rules: { recall: sum("rules", "hit") / sum("rules", "total"), fp: sum("rules", "fp") }, avgMs: Math.round(out.reduce((a, o) => a + o.ms, 0) / out.length), engines: [...new Set(out.map((o) => o.engine))], detail: out.map((o) => ({ md: o.missDevice, fd: o.fpDevice })) };
}
