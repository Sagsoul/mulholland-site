import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionResponse } from "@/lib/admin-auth-route";
import {
  createEmailVerificationToken,
  isEmailVerificationRequired,
  registerUser,
  validatePasswordStrength,
} from "@/lib/auth-users";
import { sendEmailVerificationEmail, sendWelcomeEmail } from "@/lib/email-service";
import { getSiteUrl } from "@/lib/site-url";


export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!validatePasswordStrength(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const registration = await registerUser(email, password);

    if (registration.reason === "already_exists") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    if (!registration.user) {
      return NextResponse.json({ error: "Unable to create account" }, { status: 500 });
    }

    const shouldVerifyEmail = isEmailVerificationRequired();

    if (shouldVerifyEmail) {
      if (registration.created) {
        await sendWelcomeEmail(registration.user.email, true);
      }
      const token = await createEmailVerificationToken(registration.user.id);
      const verificationUrl = `${getSiteUrl(request)}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
      await sendEmailVerificationEmail(registration.user.email, verificationUrl);

      return NextResponse.json({
        success: true,
        requiresEmailVerification: true,
        message: "Account created. Please check your email to verify your account.",
      });
    }

    if (registration.created) {
      await sendWelcomeEmail(registration.user.email, false);
    }

    return createAdminSessionResponse({ id: registration.user.id, email: registration.user.email });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create account" }, { status: 500 });
  }
}
