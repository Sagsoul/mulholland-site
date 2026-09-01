import { Resend } from "resend";

const DEFAULT_FROM_EMAIL = "Mulholland Traders <onboarding@resend.dev>";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
}

function emailLayout(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f3f5f8;padding:24px;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e3a8a;color:#ffffff;padding:20px 24px;">
          <h1 style="margin:0;font-size:20px;">Mulholland Traders</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${title}</h2>
          ${body}
          <p style="margin:24px 0 0;font-size:14px;color:#475569;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResendClient();
  await resend.emails.send({
    from: getFromEmail(),
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(to: string) {
  await sendEmail(
    to,
    "Welcome to Mulholland Admin",
    emailLayout(
      "Welcome!",
      `<p style="margin:0 0 12px;font-size:15px;color:#334155;">Your admin account has been created successfully.</p>
       <p style="margin:0;font-size:15px;color:#334155;">You can now sign in and manage inventory, pricing, and sales.</p>`
    )
  );
}

export async function sendEmailVerificationEmail(to: string, verificationUrl: string) {
  await sendEmail(
    to,
    "Verify your Mulholland account",
    emailLayout(
      "Verify your email address",
      `<p style="margin:0 0 12px;font-size:15px;color:#334155;">Please confirm your email to activate your account.</p>
       <p style="margin:20px 0;">
         <a href="${verificationUrl}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
           Verify Email
         </a>
       </p>
       <p style="margin:0;font-size:13px;color:#64748b;">This link expires in 24 hours.</p>`
    )
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail(
    to,
    "Reset your Mulholland password",
    emailLayout(
      "Password reset request",
      `<p style="margin:0 0 12px;font-size:15px;color:#334155;">We received a request to reset your password.</p>
       <p style="margin:20px 0;">
         <a href="${resetUrl}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
           Reset Password
         </a>
       </p>
       <p style="margin:0;font-size:13px;color:#64748b;">This link expires in 24 hours.</p>`
    )
  );
}
