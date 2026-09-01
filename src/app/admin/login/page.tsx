"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verifiedParam, setVerifiedParam] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVerifiedParam(params.get("verified"));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to sign in");
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setVerificationEmail(email);
        }
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Mulholland Traders Pvt Ltd" width={160} height={48} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-navy">Admin Portal</h1>
          <p className="text-sm text-gray-500">Sign in to manage your store</p>
          {verifiedParam === "1" && (
            <p className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              Email verified successfully. You can now sign in.
            </p>
          )}
          {verifiedParam === "0" && (
            <p className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              Verification link is invalid or expired. Request a new one below.
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white py-3 rounded-lg font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/admin/signup" className="text-navy font-medium hover:underline">
              Sign up
            </Link>
          </p>
          <p>
            <Link href="/admin/forgot-password" className="text-navy font-medium hover:underline">
              Forgot your password?
            </Link>
          </p>
          {verificationEmail && (
            <p>
              Need another verification email?{" "}
              <Link href={`/admin/signup?email=${encodeURIComponent(verificationEmail)}`} className="text-navy font-medium hover:underline">
                Resend verification
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
