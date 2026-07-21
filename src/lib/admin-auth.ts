import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "mulholland_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "change-me";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || `${getAdminUsername()}-${getAdminPassword()}-session-secret`;
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
  return username === getAdminUsername() && password === getAdminPassword();
}

export function createAdminSessionResponse() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, encodeSession({ username: getAdminUsername(), expiresAt }), getCookieConfig(expiresAt));
  return response;
}

export function clearAdminSessionResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", getCookieConfig());
  return response;
}

export function getAdminSessionFromRequest(request: NextRequest) {
  return decodeSession(request.cookies.get(COOKIE_NAME)?.value);
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

export function requireAdminApiSession(request: NextRequest) {
  return getAdminSessionFromRequest(request);
}
