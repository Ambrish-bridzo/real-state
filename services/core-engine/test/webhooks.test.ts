import test from "node:test";
import assert from "node:assert/strict";
import {
  createWebhookSchema,
  listQuerySchema,
  updateWebhookSchema,
  generateWebhookSecret,
  toBool,
  roleCanReadAll,
} from "../src/webhooks/validators";

test("createWebhookSchema validates URL and events", () => {
  const parsed = createWebhookSchema.safeParse({
    url: "https://example.com/hook",
    events: ["lead.created"],
    description: "Primary",
  });

  assert.equal(parsed.success, true);
});

test("updateWebhookSchema requires at least one property", () => {
  const parsed = updateWebhookSchema.safeParse({});
  assert.equal(parsed.success, false);
});

test("listQuerySchema applies defaults", () => {
  const parsed = listQuerySchema.parse({});
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.sortBy, "created_at");
  assert.equal(parsed.sortOrder, "desc");
});

test("generateWebhookSecret creates whsec prefix", () => {
  const secret = generateWebhookSecret();
  assert.match(secret, /^whsec_[a-f0-9]{48}$/);
});

test("toBool parses tri-state query values", () => {
  assert.equal(toBool("true"), true);
  assert.equal(toBool("false"), false);
  assert.equal(toBool("other"), undefined);
});

test("roleCanReadAll only for owner and super_admin", () => {
  assert.equal(roleCanReadAll("owner"), true);
  assert.equal(roleCanReadAll("super_admin"), true);
  assert.equal(roleCanReadAll("broker"), false);
});
