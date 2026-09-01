import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { get, run } from "@/lib/db";

const TOKEN_EXPIRATION_HOURS = 24;
const PASSWORD_MIN_LENGTH = 8;

type UserRow = {
  id: string;
  email: string;
  email_verified: number;
};

type TokenRow = {
  tokenId: string;
  userId: string;
};

function toSqliteDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function getTokenExpiryDate() {
  return toSqliteDateTime(new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000));
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isEmailVerificationRequired() {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== "false";
}

export function validatePasswordStrength(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH;
}

async function createToken(tableName: "email_verification_tokens" | "password_reset_tokens", userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await run(`DELETE FROM ${tableName} WHERE user_id = ?`, [userId]);
  await run(
    `INSERT INTO ${tableName} (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
    [uuidv4(), userId, tokenHash, getTokenExpiryDate()]
  );

  return token;
}

export async function findUserByEmail(email: string) {
  return get<UserRow>("SELECT id, email, email_verified FROM users WHERE email = ?", [normalizeEmail(email)]);
}

export async function registerUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await findUserByEmail(normalizedEmail);
  const passwordHash = await bcrypt.hash(password, 12);
  const shouldVerifyEmail = isEmailVerificationRequired();

  if (existing?.email_verified) {
    return { created: false as const, reason: "already_exists" as const };
  }

  if (existing) {
    await run("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, existing.id]);
    return { created: false as const, reason: "updated_unverified" as const, user: existing };
  }

  const userId = uuidv4();
  await run("INSERT INTO users (id, email, password_hash, email_verified) VALUES (?, ?, ?, ?)", [
    userId,
    normalizedEmail,
    passwordHash,
    shouldVerifyEmail ? 0 : 1,
  ]);

  return {
    created: true as const,
    user: {
      id: userId,
      email: normalizedEmail,
      email_verified: shouldVerifyEmail ? 0 : 1,
    },
  };
}

export async function createEmailVerificationToken(userId: string) {
  return createToken("email_verification_tokens", userId);
}

export async function createPasswordResetToken(userId: string) {
  return createToken("password_reset_tokens", userId);
}

export async function verifyEmailToken(token: string) {
  const record = await get<TokenRow>(
    `SELECT id AS tokenId, user_id AS userId
     FROM email_verification_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`,
    [hashToken(token)]
  );

  if (!record) return null;

  await run("UPDATE users SET email_verified = 1 WHERE id = ?", [record.userId]);
  await run("UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [record.tokenId]);
  await run("DELETE FROM email_verification_tokens WHERE user_id = ? AND id != ?", [record.userId, record.tokenId]);
  return true;
}

export async function resetPasswordWithToken(token: string, password: string) {
  const record = await get<TokenRow>(
    `SELECT id AS tokenId, user_id AS userId
     FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`,
    [hashToken(token)]
  );

  if (!record) return false;

  const passwordHash = await bcrypt.hash(password, 12);
  await run("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, record.userId]);
  await run("UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [record.tokenId]);
  await run("DELETE FROM password_reset_tokens WHERE user_id = ? AND id != ?", [record.userId, record.tokenId]);
  return true;
}
