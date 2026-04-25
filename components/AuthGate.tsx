"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { BrandHeader } from "./BrandHeader";

export default function AuthGate({
  defaultMode = "login",
  onBack,
}: {
  defaultMode?: "login" | "signup";
  onBack?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(defaultMode === "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSignUp(defaultMode === "signup");
  }, [defaultMode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-pitch-bg flex flex-col items-center justify-center p-4 relative">
        <button
          onClick={() => {
            setIsForgotPassword(false);
            setResetSent(false);
            setError(null);
          }}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        <div className="mb-8 scale-125">
          <BrandHeader />
        </div>

        <div className="w-full max-w-md bg-pitch-card border border-pitch-line rounded-sm shadow-2xl p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">
              Reset Password
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-2 uppercase tracking-wide">
              We&apos;ll send you a recovery link
            </p>
          </div>

          {resetSent ? (
            <div className="p-6 bg-brand-grass/10 border border-brand-grass/50 rounded-sm text-center">
              <CheckCircle className="text-brand-grass mx-auto mb-3" size={32} />
              <h3 className="text-white font-bold uppercase mb-2">
                Check Your Email
              </h3>
              <p className="text-slate-400 text-xs font-mono">
                We&apos;ve sent a password reset link to{" "}
                <span className="text-brand-grass">{email}</span>.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-sm flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-red-200 font-mono">{error}</p>
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <EmailField email={email} setEmail={setEmail} />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-sky hover:bg-sky-500 text-pitch-bg font-bold uppercase py-3 rounded-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pitch-bg flex flex-col items-center justify-center p-4 relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      <div className="mb-8 scale-125">
        <BrandHeader />
      </div>

      <div className="w-full max-w-md bg-pitch-card border border-pitch-line rounded-sm shadow-2xl p-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">
            {isSignUp ? "Join the Tournament" : "Coach Login"}
          </h2>
          <p className="text-slate-400 text-xs font-mono mt-2 uppercase tracking-wide">
            {isSignUp ? "Create your account" : "Back to the dugout"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-sm flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-red-200 font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <EmailField email={email} setEmail={setEmail} />

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                  }}
                  className="text-[10px] text-brand-sky hover:text-sky-300 font-mono uppercase tracking-wide transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                type="password"
                required
                minLength={6}
                className="w-full bg-pitch-bg border border-pitch-line rounded-sm py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-brand-sky transition-colors placeholder:text-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-sky hover:bg-sky-500 text-pitch-bg font-bold uppercase py-3 rounded-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isSignUp ? "Create Account" : "Enter Dashboard"}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-slate-500 hover:text-brand-sky font-mono uppercase tracking-wide transition-colors underline underline-offset-4"
          >
            {isSignUp
              ? "Already have an account? Log In"
              : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailField({
  email,
  setEmail,
}: {
  email: string;
  setEmail: (s: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">
        Email Address
      </label>
      <div className="relative">
        <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
        <input
          type="email"
          required
          className="w-full bg-pitch-bg border border-pitch-line rounded-sm py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-brand-sky transition-colors placeholder:text-slate-600"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </div>
  );
}
