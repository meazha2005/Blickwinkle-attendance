"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import DevelopedByZtoi from "@/components/DevelopedByZtoi";

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Staff & Interns",
      href: "/admin/staff",
      icon: Users,
    },
    {
      name: "Attendance Logs",
      href: "/admin/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Analytics & Reports",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Office Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out of Admin portal?")) {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    }
  };

  return (
    <aside className="h-full flex flex-col justify-between bg-white text-slate-800 w-64 border-r border-slate-200/90 p-4 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      <div>
        {/* Brand Logo & Name Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
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
            <span className="text-base font-black tracking-tight text-slate-900">
              BLICKWINKLE
            </span>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation links (Light Theme) */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-[#0071BC] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-white stroke-[2.5]" : "text-slate-500"}`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Logout and Developed by ZTOI TECH */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <div className="pt-2 text-center">
          <DevelopedByZtoi prefixClassName="text-[10px] font-bold text-slate-400 uppercase tracking-wider" />
        </div>
      </div>
    </aside>
  );
}
