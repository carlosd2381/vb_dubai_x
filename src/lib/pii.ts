import crypto from "crypto";

function getKey() {
  const raw = process.env.PII_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("Missing PII_ENCRYPTION_KEY env var");
  }

  const key = Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error("PII_ENCRYPTION_KEY must be base64 for 32-byte key");
  }

  return key;
}

export function encryptPII(value: string) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptPII(payload: string) {
  const key = getKey();
  const [ivB64, tagB64, encryptedB64] = payload.split(".");

  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function last4(value: string) {
  const clean = value.trim();
  return clean.length > 4 ? clean.slice(-4) : clean;
}
