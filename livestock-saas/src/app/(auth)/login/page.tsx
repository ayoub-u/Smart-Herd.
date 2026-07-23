"use client";
import { useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

type Mode = "sign-in" | "sign-up";

// Shared input class — identical to before
const INPUT =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors";

// Shared password field with show/hide toggle
function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={INPUT + " pr-11"}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("sign-in");

  // ── Sign In state ─────────────────────────────────────────────────────────
  const [siEmail,    setSiEmail]    = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError,    setSiError]    = useState<string | null>(null);

  // ── Sign Up state ─────────────────────────────────────────────────────────
  const [suFullName,  setSuFullName]  = useState("");
  const [suEmail,     setSuEmail]     = useState("");
  const [suPassword,  setSuPassword]  = useState("");
  const [suConfirm,   setSuConfirm]   = useState("");
  const [suError,     setSuError]     = useState<string | null>(null);
  const [suLoading,   setSuLoading]   = useState(false);

  // ── Forgot password state ─────────────────────────────────────────────────
  const [showReset,    setShowReset]    = useState(false);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState<string | null>(null);

  // ── Switch mode — clear all fields and errors ─────────────────────────────
  function switchMode(next: Mode) {
    setMode(next);
    setSiError(null);
    setSuError(null);
    setSiEmail(""); setSiPassword("");
    setSuFullName(""); setSuEmail(""); setSuPassword(""); setSuConfirm("");
  }

  // ── Sign In submit ────────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSiError(null);

    const result = await login({ email: siEmail.trim(), password: siPassword });

    if (result.error) {
      const msg = result.error;
      if (msg.includes("Invalid login credentials")) {
        setSiError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setSiError("Please verify your email address before signing in.");
      } else {
        setSiError(msg);
      }
    }
    // On success, login() navigates to ROUTES.DASHBOARD automatically
  }

  // ── Sign Up submit ────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSuError(null);

    // Client-side validation
    if (!suFullName.trim()) {
      setSuError("Please enter your full name.");
      return;
    }
    if (suPassword !== suConfirm) {
      setSuError("Passwords do not match.");
      return;
    }
    if (suPassword.length < 8) {
      setSuError("Password must be at least 8 characters.");
      return;
    }

    setSuLoading(true);

    // Register with Supabase — pass full_name in metadata so the
    // automatic profile trigger (handle_new_user) can store it.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    suEmail.trim(),
      password: suPassword,
      options: {
        data: {
          full_name: suFullName.trim(),
        },
      },
    });

    if (signUpError) {
      setSuLoading(false);
      // Map common Supabase sign-up errors to readable messages
      const msg = signUpError.message;
      if (msg.includes("already registered") || msg.includes("User already registered")) {
        setSuError("An account with this email already exists. Sign in instead.");
      } else if (msg.includes("Password should be")) {
        setSuError("Password is too weak. Use at least 8 characters.");
      } else {
        setSuError(msg);
      }
      return;
    }

    // Supabase can require email confirmation (depends on project settings).
    // If the session is immediately available, sign the user in now.
    // If not, show a message asking them to check their email.
    if (data.session) {
      // Session available — onAuthStateChange in AuthContext will fire,
      // populate user + auto-create farm, then we navigate to dashboard.
      router.push(ROUTES.DASHBOARD);
    } else {
      // Email confirmation required — tell the user
      setSuLoading(false);
      setSuError(
        "✉️ Check your email to confirm your account, then sign in."
      );
    }
  }

  // ── Forgot password submit ────────────────────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
  }

  // ── Forgot password panel ─────────────────────────────────────────────────
  if (showReset) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-green shadow-lg mb-4">
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
            <p className="text-sm text-gray-400 mt-1.5">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {resetSent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
              <p className="font-semibold text-gray-800">Check your email</p>
              <p className="text-sm text-gray-500">
                We sent a password reset link to <strong>{resetEmail}</strong>
              </p>
              <button
                onClick={() => {
                  setShowReset(false);
                  setResetSent(false);
                  setResetEmail("");
                }}
                className="text-sm text-emerald-600 font-semibold hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {resetError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{resetError}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@yourfarm.com"
                  className={INPUT}
                />
              </div>
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {resetLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                ← Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Sign In form ──────────────────────────────────────────────────────────
  if (mode === "sign-in") {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-green shadow-lg mb-4">
              <span className="text-2xl">🐄</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-400 mt-1.5">Sign in to your SmartHerd account</p>
          </div>

          {/* Error */}
          {siError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{siError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Email address
              </label>
              <input
                type="email"
                required
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                placeholder="you@yourfarm.com"
                autoComplete="email"
                className={INPUT}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                value={siPassword}
                onChange={setSiPassword}
                autoComplete="current-password"
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 accent-emerald-600 cursor-pointer"
                defaultChecked
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Keep me signed in
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !siEmail || !siPassword}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-emerald-200"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Switch to Sign Up — stays on page */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("sign-up")}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Create one
            </button>
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {["🔒 Secure login", "🌾 14-day free trial", "✓ No credit card"].map((t) => (
            <span key={t} className="text-xs text-gray-400">{t}</span>
          ))}
        </div>
      </div>
    );
  }

  // ── Sign Up form ──────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-green shadow-lg mb-4">
            <span className="text-2xl">🌱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-400 mt-1.5">Start managing your farm today</p>
        </div>

        {/* Error / info */}
        {suError && (
          <div className={`border rounded-xl p-3.5 mb-5 flex items-start gap-2.5 ${
            suError.startsWith("✉️")
              ? "bg-blue-50 border-blue-200"
              : "bg-red-50 border-red-200"
          }`}>
            <AlertCircle
              size={15}
              className={`shrink-0 mt-0.5 ${suError.startsWith("✉️") ? "text-blue-500" : "text-red-500"}`}
            />
            <p className={`text-xs ${suError.startsWith("✉️") ? "text-blue-700" : "text-red-700"}`}>
              {suError}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Full Name
            </label>
            <input
              type="text"
              required
              value={suFullName}
              onChange={(e) => setSuFullName(e.target.value)}
              placeholder="Ahmed Benali"
              autoComplete="name"
              className={INPUT}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Email address
            </label>
            <input
              type="email"
              required
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              placeholder="you@yourfarm.com"
              autoComplete="email"
              className={INPUT}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Password
            </label>
            <PasswordInput
              value={suPassword}
              onChange={setSuPassword}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Confirm Password
            </label>
            <PasswordInput
              value={suConfirm}
              onChange={setSuConfirm}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={suLoading || !suFullName || !suEmail || !suPassword || !suConfirm}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-emerald-200"
          >
            {suLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Switch back to Sign In */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 mt-6">
        {["🔒 Secure login", "🌾 7-day free trial", "✓ No credit card"].map((t) => (
          <span key={t} className="text-xs text-gray-400">{t}</span>
        ))}
      </div>
    </div>
  );
}