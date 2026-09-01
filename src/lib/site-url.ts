import { NextRequest } from "next/server";

export function getSiteUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}
