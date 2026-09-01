"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AdminSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefilledEmail = new URLSearchParams(window.location.search).get("email");
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to sign up");
        return;
      }

      if (data.requiresEmailVerification) {
        setMessage("Account created. Please check your inbox for a verification link.");
      } else {
        window.location.href = "/admin";
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email to resend verification");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to resend verification");
        return;
      }

      setMessage("If your account needs verification, a new email has been sent.");
    } catch (err: any) {
      setError(err.message ?? "Failed to resend verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Mulholland Traders Pvt Ltd" width={160} height={48} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-navy">Create Admin Account</h1>
          <p className="text-sm text-gray-500">Sign up to access the admin portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="Minimum 8 characters"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white py-3 rounded-lg font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          disabled={loading}
          onClick={handleResend}
          className="w-full mt-3 border border-navy text-navy py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          Resend Verification Email
        </button>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-navy font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
