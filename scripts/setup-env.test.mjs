import test from "node:test";
import assert from "node:assert/strict";
import { ensureHttpUrl, formatEnv, toBooleanValue } from "./setup-env.mjs";

test("toBooleanValue parses yes/no with fallback", () => {
  assert.equal(toBooleanValue("y", false), true);
  assert.equal(toBooleanValue("YES", false), true);
  assert.equal(toBooleanValue("n", true), false);
  assert.equal(toBooleanValue("", true), true);
});

test("ensureHttpUrl normalizes and falls back for invalid values", () => {
  assert.equal(ensureHttpUrl("http://localhost:8080/", "http://fallback"), "http://localhost:8080");
  assert.equal(ensureHttpUrl("https://example.com/path", "http://fallback"), "https://example.com/path");
  assert.equal(ensureHttpUrl("ftp://bad", "http://fallback"), "http://fallback");
  assert.equal(ensureHttpUrl("not-a-url", "http://fallback"), "http://fallback");
});

test("formatEnv renders key value pairs", () => {
  const rendered = formatEnv([
    ["KEY_A", "value-a"],
    ["KEY_B", ""],
  ]);

  assert.equal(rendered, 'KEY_A="value-a"\nKEY_B=""\n');
});

test("formatEnv escapes special characters", () => {
  const rendered = formatEnv([
    ["HASH", "#start"],
    ["QUOTES", `"double'and'single"`],
    ["SPACES", " leading and trailing "],
    ["MULTILINE", "line1\nline2"],
  ]);

  assert.equal(
    rendered,
    'HASH="#start"\nQUOTES="\\"double\'and\'single\\""\nSPACES=" leading and trailing "\nMULTILINE="line1\\nline2"\n',
  );
});
