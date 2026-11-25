# Detection eval (2026-11-16)

12 short English work messages written for this test (eval/cases.json), 30 sensitive values marked by hand.
Chrome 156, Apple M5 Pro, Gemini Nano via Firebase AI Logic (ONLY_ON_DEVICE) merged with local rules.

| Mode | Recall | Extra items masked | Avg time |
|---|---|---|---|
| On-device Gemini Nano + rules | 30/30 (100%) | 4 (March, June, First Union Bank, Acme) | 1.7 s |
| Local rules only (no on-device model), first version | 24/30 (80%) | 1 | instant |
| Local rules only, after rule update (2026-11-25) | 30/30 (100%) | 0 | instant |

Small, self-written set; treat as a sanity check, not a benchmark.

## Rule update (2026-11-25)

The rules were extended after looking at the six values the first version missed: one-word names after a greeting ("Hi Priya,"), identifiers right after a label (MRN, employee ID, account, passport, SSN, policy, case, claim number), and passwords written without "is" when the value contains a digit or symbol. Organisation names ending in Bank, Inc, Group and similar are no longer masked as people.

Because these rules were written while looking at this set, the 30/30 above is optimistic. A separate check written after the change (eval/heldout.json) gave 9/9 sensitive values found and 0 false masks across 10 sentences with no sensitive data.
