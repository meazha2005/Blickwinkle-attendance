"use client";

import { useEffect, useState, ReactNode } from "react";
import { Smartphone, Camera, MapPin, ShieldAlert, Laptop } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isMobileOrTabletClient } from "@/lib/device";

interface DeviceGateProps {
  children: ReactNode;
}

export default function DeviceGate({ children }: DeviceGateProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      setIsMobile(isMobileOrTabletClient());
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // During SSR or first render tick, render nothing or fallback to avoid flash
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="relative w-9 h-9 shrink-0">
              <Image
                src="/logo.png"
                alt="Blickwinkle"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              BLICKWINKLE
            </span>
          </div>

          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-amber-200">
            <Smartphone className="w-10 h-10 animate-bounce" />
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Mobile or Tablet Required
          </h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Staff and Intern attendance requires active front selfie camera and GPS location verification on an Android or iPhone device.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 mb-6 space-y-3">
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <Camera className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span>Front selfie camera is required to capture live check-in photo.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Device GPS location must be active to record accurate coordinates.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <Laptop className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <span>Desktop access for staff attendance is disabled for integrity.</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
              📱 Open <span className="font-bold underline">attendance.blickwinkle.com</span> in Chrome or Safari on your phone.
            </div>

            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              Are you an Admin? Open Admin Portal
            </Link>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Powered by ZTOI TECH
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
