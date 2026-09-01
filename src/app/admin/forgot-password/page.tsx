"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to request password reset");
        return;
      }

      setMessage(data.message ?? "If an account exists, a reset email has been sent.");
    } catch (err: any) {
      setError(err.message ?? "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Mulholland Traders Pvt Ltd" width={160} height={48} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-navy">Forgot Password</h1>
          <p className="text-sm text-gray-500">Enter your email to receive a reset link</p>
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

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white py-3 rounded-lg font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Back to{" "}
          <Link href="/admin/login" className="text-navy font-medium hover:underline">
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
