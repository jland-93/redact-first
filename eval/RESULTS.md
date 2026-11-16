# Detection eval (2026-11-16)

12 short English work messages written for this test (eval/cases.json), 30 sensitive values marked by hand.
Chrome 156, Apple M5 Pro, Gemini Nano via Firebase AI Logic (ONLY_ON_DEVICE) merged with local rules.

| Mode | Recall | Extra items masked | Avg time |
|---|---|---|---|
| On-device Gemini Nano + rules | 30/30 (100%) | 4 (March, June, First Union Bank, Acme) | 1.7 s |
| Local rules only (no on-device model) | 24/30 (80%) | 1 | instant |

Small, self-written set; treat as a sanity check, not a benchmark.
