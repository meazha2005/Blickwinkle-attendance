"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Filter,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import DeviceGate from "@/components/DeviceGate";
import MobileBottomNav from "@/components/MobileBottomNav";
import DevelopedByZtoi from "@/components/DevelopedByZtoi";

interface AttendanceItem {
  id: number;
  date: string;
  check_in_time: string | null;
  check_in_selfie_url: string | null;
  check_in_address: string | null;
  check_out_time: string | null;
  check_out_selfie_url: string | null;
  check_out_address: string | null;
  work_duration_minutes: number;
  status: "present" | "half_day" | "late" | "absent";
}

interface Stats {
  totalRecords: number;
  totalPresent: number;
  totalLate: number;
  totalHalfDay: number;
  totalHours: string;
}

export default function AttendanceHistoryPage() {
  const router = useRouter();

  // Dates default: 1st of current month to today
  const getInitialDates = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const y = istNow.getFullYear();
    const m = String(istNow.getMonth() + 1).padStart(2, "0");
    const d = String(istNow.getDate()).padStart(2, "0");

    return {
      from: `${y}-${m}-01`,
      to: `${y}-${m}-${d}`,
    };
  };

  const [dates, setDates] = useState(getInitialDates());
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal for selfie & location details
  const [activeItem, setActiveItem] = useState<AttendanceItem | null>(null);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/history?from=${dates.from}&to=${dates.to}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <DeviceGate>
      <div className="min-h-screen bg-slate-100/70 pb-24 max-w-md mx-auto flex flex-col justify-between">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 shrink-0">
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
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              History
            </span>
          </div>

          {/* Date Filter Card (From Date & To Date) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <form onSubmit={handleFilterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dates.from}
                    onChange={(e) => setDates({ ...dates, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dates.to}
                    onChange={(e) => setDates({ ...dates, to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Date Filter</span>
              </button>
            </form>
          </div>

          {/* Stats Summary Card */}
          {stats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Present</p>
                <p className="text-lg font-black text-emerald-600">{stats.totalPresent}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Late</p>
                <p className="text-lg font-black text-amber-600">{stats.totalLate}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Hours</p>
                <p className="text-lg font-black text-blue-600">{stats.totalHours}h</p>
              </div>
            </div>
          )}

          {/* Records List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Attendance Records ({records.length})
            </h3>

            {loading ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading history...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No attendance records in this period.</p>
              </div>
            ) : (
              records.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {new Date(item.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
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
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>In: {item.check_in_time || "--:--"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Out: {item.check_out_time || "--:--"}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {Math.floor(item.work_duration_minutes / 60)}h{" "}
                      {item.work_duration_minutes % 60}m
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal: Record Details (Selfie + Location) */}
        {activeItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Attendance Details</h4>
                  <p className="text-[11px] text-slate-500">
                    {new Date(activeItem.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Check In Selfie & Details */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Check In
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {activeItem.check_in_time}
                    </span>
                  </div>
                  {activeItem.check_in_selfie_url && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeItem.check_in_selfie_url}
                        alt="Check-in selfie"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  {activeItem.check_in_address && (
                    <p className="text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{activeItem.check_in_address}</span>
                    </p>
                  )}
                </div>

                {/* Check Out Selfie & Details */}
                {activeItem.check_out_time && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Check Out
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {activeItem.check_out_time}
                      </span>
                    </div>
                    {activeItem.check_out_selfie_url && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeItem.check_out_selfie_url}
                          alt="Check-out selfie"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    {activeItem.check_out_address && (
                      <p className="text-[11px] text-slate-500 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{activeItem.check_out_address}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-4 text-center">
          <DevelopedByZtoi />
        </div>

        {/* Bottom Nav */}
        <MobileBottomNav />
      </div>
    </DeviceGate>
  );
}
