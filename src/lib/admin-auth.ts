import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "mulholland_admin_session";
const HOUR_IN_MS = 60 * 60 * 1000;
const SESSION_TTL_MS = 12 * HOUR_IN_MS;
const FALLBACK_DEV_PASSWORD = "change-me";
const FALLBACK_DEV_SECRET = "development-only-admin-session-secret";
const runtimeSecretFallback = crypto.randomBytes(32).toString("hex");
let hasWarnedAboutFallbackSecret = false;
let hasWarnedAboutFallbackPassword = false;

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

function getAdminPassword() {
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  if (process.env.NODE_ENV === "development") {
    if (!hasWarnedAboutFallbackPassword) {
      console.warn("ADMIN_PASSWORD is not set; using the development fallback password.");
      hasWarnedAboutFallbackPassword = true;
    }
    return FALLBACK_DEV_PASSWORD;
  }

  return null;
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

function encodeSession(payload: { username: string; expiresAt: number }) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token?: string | null) {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      username: string;
      expiresAt: number;
    };

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

export function validateAdminCredentials(username: string, password: string) {
  const configuredPassword = getAdminPassword();
  if (!configuredPassword) {
    return false;
  }

  return username === getAdminUsername() && password === configuredPassword;
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return {
    token: encodeSession({ username: getAdminUsername(), expiresAt }),
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
