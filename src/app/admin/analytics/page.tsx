"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  UserCheck,
  AlertTriangle,
  Award,
} from "lucide-react";

interface StatusCount {
  status: string;
  count: number;
}

interface DailyTrend {
  date: string;
  totalCheckedIn: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  avgHours: number;
}

interface StaffBreakdownItem {
  id: number;
  name: string;
  phone: string;
  role: string;
  totalPresentDays: number;
  lateDays: number;
  halfDays: number;
  totalHoursWorked: number;
  avgDailyHours: number;
}

interface RoleStat {
  role: string;
  attendanceCount: number;
  memberCount: number;
}

export default function AdminAnalyticsPage() {
  const getInitialDates = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const thirtyDaysAgo = new Date(istNow.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      from: thirtyDaysAgo.toISOString().split("T")[0],
      to: istNow.toISOString().split("T")[0],
    };
  };

  const [dates, setDates] = useState(getInitialDates());
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [staffBreakdown, setStaffBreakdown] = useState<StaffBreakdownItem[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStat[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?from=${dates.from}&to=${dates.to}`);
      if (res.ok) {
        const data = await res.json();
        setStatusCounts(data.statusCounts || []);
        setDailyTrends(data.dailyTrends || []);
        setStaffBreakdown(data.staffBreakdown || []);
        setRoleStats(data.roleStats || []);
      }
    } catch (err) {
      console.error("Fetch analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics();
  };

  // Export Staff Attendance to CSV
  const exportToCSV = () => {
    if (staffBreakdown.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Staff Name",
      "Mobile Number",
      "Role",
      "Total Days Present",
      "Late Days",
      "Half Days",
      "Total Hours Logged",
      "Avg Daily Hours",
    ];

    const rows = staffBreakdown.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.phone}"`,
      s.role,
      s.totalPresentDays,
      s.lateDays,
      s.halfDays,
      s.totalHoursWorked,
      s.avgDailyHours,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Blickwinkle_Attendance_Report_${dates.from}_to_${dates.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregate stats
  const totalEntries = statusCounts.reduce((acc, curr) => acc + Number(curr.count), 0);
  const onTimeCount = statusCounts.find((s) => s.status === "present")?.count || 0;
  const lateCount = statusCounts.find((s) => s.status === "late")?.count || 0;
  const punctualityRate = totalEntries > 0 ? Math.round((onTimeCount / totalEntries) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Punctuality metrics, employee leaderboard, and payroll export data.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* Date Filter Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={dates.from}
              onChange={(e) => setDates({ ...dates, from: e.target.value })}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={dates.to}
              onChange={(e) => setDates({ ...dates, to: e.target.value })}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Period</span>
          </button>
        </form>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Check-Ins</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalEntries}</p>
          <p className="text-xs text-slate-500 mt-1">Recorded in selected period</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Punctuality Score</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{punctualityRate}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {onTimeCount} on time vs {lateCount} late
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600">{lateCount}</p>
          <p className="text-xs text-slate-500 mt-1">Checked in past grace period</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Staff Members</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-indigo-600">{staffBreakdown.length}</p>
          <p className="text-xs text-slate-500 mt-1">Tracked employees & interns</p>
        </div>
      </div>

      {/* Staff Leaderboard Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Member Performance & Hours</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative attendance, punctuality, and total hours worked.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading analytics breakdown...</p>
          </div>
        ) : staffBreakdown.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No member data recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Days Present</th>
                  <th className="px-5 py-3">Late Days</th>
                  <th className="px-5 py-3">Half Days</th>
                  <th className="px-5 py-3">Total Hours Logged</th>
                  <th className="px-5 py-3">Avg Daily Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffBreakdown.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-bold text-slate-900">
                      <div>{s.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{s.phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                        {s.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-700">
                      {s.totalPresentDays} days
                    </td>
                    <td className="px-5 py-3 font-semibold text-amber-700">
                      {s.lateDays}
                    </td>
                    <td className="px-5 py-3 font-semibold text-purple-700">
                      {s.halfDays}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-800">
                      {s.totalHoursWorked} hrs
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {s.avgDailyHours} hrs/day
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Trends Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Daily Attendance Breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Day-by-day attendance volume and average shift lengths.
          </p>
        </div>

        {dailyTrends.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No daily records in this date range.</p>
        ) : (
          <div className="space-y-2">
            {dailyTrends.map((d) => (
              <div
                key={d.date}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 min-w-[100px]">
                    {new Date(d.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {d.presentCount} On Time
                    </span>
                    {d.lateCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {d.lateCount} Late
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-600">
                  <span className="font-medium">Total: {d.totalCheckedIn} checked in</span>
                  <span className="font-bold text-slate-800 font-mono">{d.avgHours} hrs avg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
