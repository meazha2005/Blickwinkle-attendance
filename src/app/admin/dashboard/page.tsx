"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  UserX,
  TrendingUp,
  ArrowUpRight,
  Plus,
  CalendarCheck,
  Settings,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalActive: number;
  staffCount: number;
  internCount: number;
  checkedInToday: number;
  presentToday: number;
  lateToday: number;
  halfDayToday: number;
  absentToday: number;
  attendanceRate: number;
  avgWorkHours: string;
}

interface RecentActivityItem {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_phone: string;
  staff_role: string;
  check_in_time: string;
  check_in_selfie_url: string;
  check_in_address: string;
  status: string;
  check_out_time: string | null;
  work_duration_minutes: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setActivities(data.recentActivity);
        setTodayStr(data.today);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner with Date & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Today is{" "}
            <span className="font-semibold text-slate-700">
              {todayStr ? new Date(todayStr).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }) : "Today"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <Link
            href="/admin/staff"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff/Intern</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Active Members */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Active</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.totalActive}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats.staffCount} Staff · {stats.internCount} Interns
            </p>
          </div>

          {/* Card 2: Checked In Today */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Checked In</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{stats.checkedInToday}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Rate: <span className="font-semibold text-emerald-700">{stats.attendanceRate}%</span>
            </p>
          </div>

          {/* Card 3: On Time */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">On Time</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.presentToday}</p>
            <p className="text-[11px] text-slate-500 mt-1">Within office start time</p>
          </div>

          {/* Card 4: Late Check-ins */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Late Today</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{stats.lateToday}</p>
            <p className="text-[11px] text-slate-500 mt-1">Exceeded grace period</p>
          </div>

          {/* Card 5: Absent / Not In */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Yet to Mark</span>
              <UserX className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600">{stats.absentToday}</p>
            <p className="text-[11px] text-slate-500 mt-1">Pending today</p>
          </div>

          {/* Card 6: Average Hours */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg Shift</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-indigo-600">{stats.avgWorkHours}h</p>
            <p className="text-[11px] text-slate-500 mt-1">Average shift length</p>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/attendance"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
              Split Screen Attendance Viewer
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect daily attendance lists side-by-side with live selfie photos and GPS map pins.
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
        </Link>

        <Link
          href="/admin/staff"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
              Staff & Intern Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              View, add, update shift timings, phone/aadhaar details, or manage staff members.
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
              Office & Geofence Settings
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure organization details, GPS geofence radius, and admin security.
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today&apos;s Live Check-Ins</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time feed of staff & intern check-ins for {todayStr || "today"}
            </p>
          </div>
          <Link
            href="/admin/attendance"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View All Records →
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading live activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No attendance marked yet today</p>
            <p className="text-xs text-slate-400 mt-1">
              When staff check in on their phones, their selfies and timing will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Selfie</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Check-In</th>
                  <th className="px-5 py-3">Check-Out</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div>{item.staff_name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{item.staff_phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      {item.check_in_selfie_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.check_in_selfie_url}
                          alt={item.staff_name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <span className="text-slate-400">No photo</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                        {item.staff_role}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {item.check_in_time || "--:--"}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {item.check_out_time || "--:--"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          item.status === "present"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "late"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.check_in_address || "Recorded"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
