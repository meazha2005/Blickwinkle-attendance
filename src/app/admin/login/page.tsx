"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, AlertCircle, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials.");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to login as admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white px-5 py-3 rounded-2xl mb-4 shadow-sm flex items-center gap-3">
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Blickwinkle"
                  fill
                  sizes="32px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                BLICKWINKLE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Control Center</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white mb-1 text-center">Administrator Sign In</h1>
          <p className="text-slate-400 text-xs text-center mb-6">
            Enter your admin credentials to access the attendance dashboard and settings.
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-2xl text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-2xl text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Powered by ZTOI TECH */}
      <div className="py-4 text-center">
        <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
          Powered by ZTOI TECH
        </p>
      </div>
    </div>
  );
}
