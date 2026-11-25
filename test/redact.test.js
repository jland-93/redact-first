import test from "node:test";
import assert from "node:assert/strict";
import { ruleDetect, mergeItems, mask } from "../src/redact.js";

test("password keeps trailing punctuation that is part of it", () => {
  const text = "The staging DB password is Hunter2! if you need it.";
  const items = mergeItems(text, ruleDetect(text));
  assert.ok(items.some((i) => i.type === "SECRET" && i.text === "Hunter2!"));
  assert.ok(!mask(text, items).masked.includes("!"));
});

test("weekday is not kept as a date of birth", () => {
  const text = "Please fix this before Friday.";
  const items = mergeItems(text, [{ text: "Friday", type: "DATE_OF_BIRTH" }]);
  assert.equal(items.length, 0);
});

test("real birth date is still kept", () => {
  const text = "Her date of birth is 1987-03-12.";
  const items = mergeItems(text, ruleDetect(text));
  assert.ok(items.some((i) => i.type === "DATE_OF_BIRTH" && i.text === "1987-03-12"));
});

test("labeled identifiers, greeting names and bare passwords are found by rules", () => {
  const text = "Hi Priya, MRN 4471-20833 and passport number X12345678; the admin password Winter2026! stays private.";
  const got = mergeItems(text, ruleDetect(text)).map((i) => i.text);
  for (const v of ["Priya", "4471-20833", "X12345678", "Winter2026!"]) assert.ok(got.includes(v), v);
});

test("titles, organisations and ordinary words are not masked", () => {
  for (const text of ["Dear Sir, thanks!", "Please reset your password before Monday.", "Wire it to First Union Bank today.", "Our account manager will join."]) {
    assert.equal(mergeItems(text, ruleDetect(text)).length, 0, text);
  }
});
