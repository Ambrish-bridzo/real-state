import crypto from "crypto";

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () =>
    generateRandomToken(5)
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join("-") || generateRandomToken(5).toUpperCase()
  );
}
