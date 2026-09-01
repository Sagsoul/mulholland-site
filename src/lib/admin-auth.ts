import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get } from "@/lib/db";

const COOKIE_NAME = "mulholland_admin_session";
const HOUR_IN_MS = 60 * 60 * 1000;
const SESSION_TTL_MS = 12 * HOUR_IN_MS;
const FALLBACK_DEV_SECRET = "development-only-admin-session-secret";
const runtimeSecretFallback = crypto.randomBytes(32).toString("hex");
let hasWarnedAboutFallbackSecret = false;

interface SessionPayload {
  userId: string;
  email: string;
  expiresAt: number;
}

interface AdminUserRecord {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
}

function getSessionSecret() {
  if (process.env.ADMIN_SESSION_SECRET) {
    return process.env.ADMIN_SESSION_SECRET;
  }

  if (!hasWarnedAboutFallbackSecret) {
    console.warn(
      process.env.NODE_ENV === "development"
        ? "ADMIN_SESSION_SECRET is not set; using a development-only fallback secret."
        : "ADMIN_SESSION_SECRET is not set; using an ephemeral runtime secret and invalidating sessions on restart."
    );
    hasWarnedAboutFallbackSecret = true;
  }

  return process.env.NODE_ENV === "development" ? FALLBACK_DEV_SECRET : runtimeSecretFallback;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token?: string | null) {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;

    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminSessionFromToken(token?: string | null) {
  return decodeSession(token);
}

function getCookieConfig(expiresAt?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt ? new Date(expiresAt) : new Date(0),
  };
}

export async function validateAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await get<AdminUserRecord>(
    "SELECT id, email, password_hash, email_verified FROM users WHERE email = ?",
    [normalizedEmail]
  );

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.email_verified),
  };
}

export function isEmailVerificationRequired() {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== "false";
}

export function createAdminSessionToken(user: { id: string; email: string }) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return {
    token: encodeSession({ userId: user.id, email: user.email, expiresAt }),
    expiresAt,
  };
}

export function getAdminSessionCookieName() {
  return COOKIE_NAME;
}

export function getAdminSessionCookieConfig(expiresAt?: number) {
  return getCookieConfig(expiresAt);
}

export async function getAdminSession() {
  return decodeSession(cookies().get(COOKIE_NAME)?.value);
}

export async function requireAdminPageSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export function createInvoiceAccessToken(saleId: string) {
  return sign(`invoice:${saleId}`);
}

export function verifyInvoiceAccessToken(saleId: string, token?: string | null) {
  if (!token) return false;
  return token === createInvoiceAccessToken(saleId);
}
