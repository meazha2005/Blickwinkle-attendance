"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import DeviceGate from "@/components/DeviceGate";

export default function StaffLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
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

    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid phone number. Contact administrator.");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeviceGate>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between max-w-md mx-auto px-6 py-8">
        {/* Top Header / Branding */}
        <div className="pt-4">
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="Blickwinkle"
              width={160}
              height={45}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          {/* Main Login Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Staff & Intern Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered mobile number to mark attendance.
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

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
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
