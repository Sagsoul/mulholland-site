import { NextRequest } from "next/server";

export function getSiteUrl(request?: NextRequest): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not configured. Please set it in your environment variables. " +
      "This is required for generating email verification and password reset links."
    );
  }

  // Ensure URL ends without trailing slash for consistency
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}
