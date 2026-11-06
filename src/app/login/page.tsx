"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import DeviceGate from "@/components/DeviceGate";

export default function StaffLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDisplayPhone = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 10);
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)} ${raw.slice(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid phone number or password.");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeviceGate>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between max-w-md mx-auto px-6 py-8">
        {/* Top Header / Branding */}
        <div className="pt-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src="/logo.png"
                alt="Blickwinkle"
                fill
                sizes="40px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              BLICKWINKLE
            </span>
          </div>

          {/* Main Login Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Staff & Intern Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered mobile number and password to mark attendance.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-slate-600 font-semibold text-xs border-r border-slate-200 pr-2.5 py-1">
                    <span className="text-sm">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    placeholder="98765 43210"
                    value={formatDisplayPhone(phone)}
                    onChange={handlePhoneChange}
                    className="w-full pl-20 pr-4 py-3 bg-slate-50/70 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full pl-10 pr-11 py-3 bg-slate-50/70 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || !password}
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-[#0071BC] hover:bg-[#005c99] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue to Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Face selfie & GPS coordinates verified</span>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="pt-8 pb-2 text-center space-y-1">
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            Powered by ZTOI TECH
          </p>
          <p className="text-[10px] text-slate-400">
            Blickwinkle Workplace System
          </p>
        </div>
      </div>
    </DeviceGate>
  );
}
