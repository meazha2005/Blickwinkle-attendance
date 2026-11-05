"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Search,
  Filter,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Maximize2,
  X,
  User,
  Users,
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_phone: string;
  staff_role: string;
  staff_aadhar?: string;
  date: string;
  check_in_time: string | null;
  check_in_selfie_url: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_accuracy: number | null;
  check_in_address: string | null;
  check_out_time: string | null;
  check_out_selfie_url: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_accuracy: number | null;
  check_out_address: string | null;
  work_duration_minutes: number;
  status: "present" | "half_day" | "late" | "absent";
  device_info: string | null;
}

function AttendanceSplitScreenContent() {
  const searchParams = useSearchParams();
  const staffIdFromQuery = searchParams.get("staff_id") || "";

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState(staffIdFromQuery);

  // Full Image Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (dateFilter) params.append("date", dateFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (roleFilter) params.append("role", roleFilter);
      if (staffFilter) params.append("staff_id", staffFilter);

      const res = await fetch(`/api/admin/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list: AttendanceRecord[] = data.records || [];
        setRecords(list);

        // Auto-select first record or maintain selection
        if (list.length > 0) {
          if (!selectedRecord || !list.find((r) => r.id === selectedRecord.id)) {
            setSelectedRecord(list[0]);
          }
        } else {
          setSelectedRecord(null);
        }
      }
    } catch (err) {
      console.error("Fetch attendance records error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, statusFilter, roleFilter, staffFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Attendance Verification Log</h1>
          <p className="text-xs text-slate-500">
            Split-view attendance records with live camera selfies and GPS coordinates.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="present">Present (On Time)</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="staff">Staff</option>
            <option value="intern">Intern</option>
          </select>
        </div>
      </div>

      {/* 2-HALVES SPLIT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT HALF: Attendance List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </form>

          {/* Records List Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[78vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading attendance records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No records found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try adjusting the date or search filter.
                </p>
              </div>
            ) : (
              records.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className={`p-4 cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-50/80 border-l-4 border-l-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Selfie avatar thumbnail */}
                      {r.check_in_selfie_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.check_in_selfie_url}
                          alt={r.staff_name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {r.staff_name}
                          </p>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {r.staff_role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>In: {r.check_in_time || "--:--"}</span>
                          <span>·</span>
                          <span>Out: {r.check_out_time || "--:--"}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(r.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize block mb-1 ${
                          r.status === "present"
                            ? "bg-emerald-100 text-emerald-700"
                            : r.status === "late"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {Math.floor(r.work_duration_minutes / 60)}h{" "}
                        {r.work_duration_minutes % 60}m
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT HALF: Complete Details with Location & Selfie (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedRecord ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      {selectedRecord.staff_name}
                    </h2>
                    <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {selectedRecord.staff_role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone: <span className="font-semibold text-slate-700">+91 {selectedRecord.staff_phone}</span>
                    {selectedRecord.staff_aadhar && (
                      <span> · Aadhaar: {selectedRecord.staff_aadhar}</span>
                    )}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-slate-800">
                    {new Date(selectedRecord.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <span
                    className={`inline-block text-[11px] font-bold px-3 py-0.5 rounded-full capitalize mt-1 ${
                      selectedRecord.status === "present"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedRecord.status === "late"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    Status: {selectedRecord.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Both Check-In and Check-Out Details (Side by side on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Check-In Detail Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CHECK-IN DETAILS</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {selectedRecord.check_in_time || "--:--"}
                    </span>
                  </div>

                  {/* Selfie Preview */}
                  {selectedRecord.check_in_selfie_url ? (
                    <div className="relative group aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedRecord.check_in_selfie_url}
                        alt="Check-in selfie"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs text-slate-400">Photo preview unavailable</div>';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(selectedRecord.check_in_selfie_url)}
                        className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs flex items-center gap-1 backdrop-blur-xs transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Enlarge</span>
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                      No check-in selfie captured
                    </div>
                  )}

                  {/* GPS & Map */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        {selectedRecord.check_in_address || "GPS Address not recorded"}
                      </span>
                    </div>

                    {selectedRecord.check_in_latitude && selectedRecord.check_in_longitude && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {Number(selectedRecord.check_in_latitude).toFixed(5)},{" "}
                          {Number(selectedRecord.check_in_longitude).toFixed(5)}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedRecord.check_in_latitude},${selectedRecord.check_in_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Check-Out Detail Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CHECK-OUT DETAILS</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {selectedRecord.check_out_time || "Pending Check-Out"}
                    </span>
                  </div>

                  {/* Selfie Preview */}
                  {selectedRecord.check_out_selfie_url ? (
                    <div className="relative group aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedRecord.check_out_selfie_url}
                        alt="Check-out selfie"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs text-slate-400">Photo preview unavailable</div>';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(selectedRecord.check_out_selfie_url)}
                        className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs flex items-center gap-1 backdrop-blur-xs transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Enlarge</span>
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                      {selectedRecord.check_out_time
                        ? "No check-out selfie"
                        : "Shift in progress (Not checked out yet)"}
                    </div>
                  )}

                  {/* GPS & Map */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        {selectedRecord.check_out_address ||
                          (selectedRecord.check_out_time
                            ? "GPS Address not recorded"
                            : "Awaiting check-out")}
                      </span>
                    </div>

                    {selectedRecord.check_out_latitude && selectedRecord.check_out_longitude && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {Number(selectedRecord.check_out_latitude).toFixed(5)},{" "}
                          {Number(selectedRecord.check_out_longitude).toFixed(5)}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedRecord.check_out_latitude},${selectedRecord.check_out_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="bg-slate-100/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Duration</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {Math.floor(selectedRecord.work_duration_minutes / 60)} hours{" "}
                      {selectedRecord.work_duration_minutes % 60} mins
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-300" />
                  <div>
                    <span className="text-slate-400 text-[11px] block">Punctuality</span>
                    <span className="font-bold text-slate-900 text-sm capitalize">
                      {selectedRecord.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {selectedRecord.device_info && (
                  <div className="flex items-center gap-1.5 text-slate-500 max-w-xs truncate">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[10px] truncate">{selectedRecord.device_info}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                No Attendance Record Selected
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click on any staff attendance entry from the left list to view their live selfie photos,
                recorded GPS location coordinates, and Google Maps pin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Photo Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Enlarged selfie"
              className="w-auto h-auto max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading attendance viewer...</p>
        </div>
      }
    >
      <AttendanceSplitScreenContent />
    </Suspense>
  );
}
