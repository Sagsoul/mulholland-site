import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminSessionCookieConfig,
  getAdminSessionCookieName,
  getAdminSessionFromToken,
} from "@/lib/admin-auth";

export function createAdminSessionResponse(user: { id: string; email: string }) {
  const { token, expiresAt } = createAdminSessionToken(user);
  const response = NextResponse.json({ success: true });
  response.cookies.set(getAdminSessionCookieName(), token, getAdminSessionCookieConfig(expiresAt));
  return response;
}

export function clearAdminSessionResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(getAdminSessionCookieName(), "", getAdminSessionCookieConfig());
  return response;
}

export function requireAdminApiSession(request: NextRequest) {
  return getAdminSessionFromToken(request.cookies.get(getAdminSessionCookieName())?.value);
}
