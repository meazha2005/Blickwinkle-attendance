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
    <aside className="h-full flex flex-col justify-between bg-slate-900 text-white w-64 border-r border-slate-800 p-4">
      <div>
        {/* Logo and close button for mobile */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-xl">
              <Image
                src="/logo.png"
                alt="Blickwinkle"
                width={120}
                height={32}
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Logout and Powered by ZTOI TECH */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <div className="pt-2 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Powered by ZTOI TECH
          </p>
        </div>
      </div>
    </aside>
  );
}
