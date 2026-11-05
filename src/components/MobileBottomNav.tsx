"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isDashboard = pathname === "/" || pathname === "";
  const isHistory = pathname === "/history";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] px-6 py-2 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
            isDashboard
              ? "text-[#0071BC] font-bold"
              : "text-slate-400 hover:text-slate-700 font-medium"
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 transition-transform ${isDashboard ? "stroke-[2.4] scale-105" : "stroke-[1.8]"}`}
          />
          <span className="text-[11px] tracking-tight">Dashboard</span>
        </Link>

        <Link
          href="/history"
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
            isHistory
              ? "text-[#0071BC] font-bold"
              : "text-slate-400 hover:text-slate-700 font-medium"
          }`}
        >
          <CalendarCheck
            className={`w-5 h-5 transition-transform ${isHistory ? "stroke-[2.4] scale-105" : "stroke-[1.8]"}`}
          />
          <span className="text-[11px] tracking-tight">Attendance</span>
        </Link>
      </div>
    </nav>
  );
}
