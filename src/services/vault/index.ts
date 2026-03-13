import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.VAULT_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "VAULT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    );
  }
  return Buffer.from(key, "hex");
}

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt plaintext using AES-256-GCM
 * CRITICAL: Generates a new random IV per call — never reuses IVs
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * Throws on authentication failure
 */
export function decrypt(
  ciphertext: string,
  iv: string,
  tag: string
): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt credentials into a single stored blob
 * Format: JSON with encrypted username and password payloads
 */
export function encryptCredentials(
  username: string,
  password: string
): { encryptedUsername: string; encryptedBlob: string } {
  const usernamePayload = encrypt(username);
  const passwordPayload = encrypt(password);

  return {
    encryptedUsername: JSON.stringify(usernamePayload),
    encryptedBlob: JSON.stringify(passwordPayload),
  };
}
