"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import Image from "next/image";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState<string>("Admin");

  // Don't render layout shell on login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage) {
      fetch("/api/admin/me")
        .then((res) => {
          if (!res.ok) {
            router.push("/admin/login");
          } else {
            return res.json();
          }
        })
        .then((data) => {
          if (data?.admin?.name) {
            setAdminName(data.admin.name);
          }
        })
        .catch(() => {
          router.push("/admin/login");
        });
    }
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">
            <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Blickwinkle Attendance System
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Admin Console
              </span>
            </div>
            <div className="sm:hidden">
              <Image
                src="/logo.png"
                alt="Blickwinkle"
                width={100}
                height={26}
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">{adminName}</span>
            </div>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>

        {/* Admin Footer */}
        <footer className="bg-white border-t border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>© {new Date().getFullYear()} Blickwinkle. All rights reserved.</span>
          <span className="font-semibold text-slate-400 tracking-wider uppercase text-[11px]">
            Powered by ZTOI TECH
          </span>
        </footer>
      </div>
    </div>
  );
}
