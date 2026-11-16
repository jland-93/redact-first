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
