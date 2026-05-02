"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { BrandHeader } from "../../components/BrandHeader";
import { Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else setDone(true);
  }

  return (
    <div className="min-h-screen bg-pitch-bg flex flex-col items-center justify-center p-4">
      <div className="mb-8 scale-125">
        <BrandHeader />
      </div>
      <div className="w-full max-w-md bg-pitch-card border border-pitch-line rounded-sm p-8">
        <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter text-center mb-6">
          New Password
        </h2>
        {done ? (
          <div className="p-6 bg-brand-grass/10 border border-brand-grass/50 rounded-sm text-center">
            <CheckCircle className="text-brand-grass mx-auto mb-3" size={32} />
            <p className="text-sm">Password updated. You can now log in.</p>
            <a
              href="/"
              className="inline-block mt-4 bg-brand-sky text-pitch-bg px-4 py-2 rounded-sm font-bold uppercase text-xs"
            >
              Go to App
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-sm flex items-start gap-3">
                <AlertCircle className="text-red-500 mt-0.5" size={16} />
                <p className="text-xs text-red-200 font-mono">{error}</p>
              </div>
            )}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="New password"
                className="w-full bg-pitch-bg border border-pitch-line rounded-sm py-2.5 pl-10 pr-4 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-brand-sky hover:brightness-110 text-pitch-bg font-bold uppercase py-3 rounded-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
