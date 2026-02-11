"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword() {
    setError("");
    setResetMessage("");

    if (!email.trim()) {
      setError("Inserisci la tua email prima di richiedere il reset della password.");
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setResetMessage("Ti abbiamo inviato un'email con le istruzioni per reimpostare la password.");
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div
        className="w-full bg-white"
        style={{
          maxWidth: 420,
          borderRadius: 12,
          border: "1px solid var(--neutral-200)",
          padding: 40,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="flex items-center justify-center text-white font-bold"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--orange-600), var(--gold-600))",
              fontSize: 18,
            }}
          >
            &alpha;
          </div>
          <span
            className="text-navy-800 font-bold"
            style={{ fontSize: 18, letterSpacing: "-0.02em" }}
          >
            Alphaleads
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-navy-800 text-center font-bold mb-1"
          style={{ fontSize: 20 }}
        >
          Accedi al tuo account
        </h1>
        <p
          className="text-neutral-500 text-center mb-7"
          style={{ fontSize: 14 }}
        >
          Inserisci le tue credenziali per continuare
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="text-neutral-600 font-semibold mb-1.5"
              style={{ fontSize: 13 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="nome@azienda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-neutral-800"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--neutral-300)",
                fontSize: 14,
              }}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-neutral-600 font-semibold mb-1.5"
              style={{ fontSize: 13 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-neutral-800"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--neutral-300)",
                fontSize: 14,
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-coral-600" style={{ fontSize: 13 }}>
              {error}
            </p>
          )}

          {/* Reset message */}
          {resetMessage && (
            <p style={{ fontSize: 13, color: "var(--success-text)" }}>
              {resetMessage}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold cursor-pointer transition-all duration-150 hover:brightness-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              padding: 11,
              borderRadius: 10,
              fontSize: 14,
              background: "linear-gradient(135deg, var(--orange-600), var(--orange-700))",
              boxShadow: "0 2px 12px rgba(240,123,63,0.25)",
              border: "none",
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Accedi
          </button>
        </form>

        {/* Forgot password */}
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-orange-600 cursor-pointer bg-transparent border-none hover:underline"
            style={{ fontSize: 13 }}
          >
            Password dimenticata?
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-neutral-400" style={{ fontSize: 12 }}>
            oppure
          </span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Register link */}
        <p className="text-center text-neutral-500" style={{ fontSize: 13 }}>
          Non hai un account?{" "}
          <Link
            href="/register"
            className="text-orange-600 font-semibold hover:underline"
          >
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
