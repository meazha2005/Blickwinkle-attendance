"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Maximize2,
  X,
  User,
  Radio,
} from "lucide-react";
import DeviceGate from "@/components/DeviceGate";
import SelfieCamera, { SelfieCameraRef } from "@/components/SelfieCamera";
import MobileBottomNav from "@/components/MobileBottomNav";

interface StaffInfo {
  id: number;
  name: string;
  phone: string;
  role: "staff" | "intern";
}

interface AttendanceRecord {
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

export default function StaffDashboardPage() {
  const router = useRouter();
  const cameraRef = useRef<SelfieCameraRef>(null);

  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    title?: string;
    text: string;
  } | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Live Clock
  const [currentTime, setCurrentTime] = useState("");

  // GPS Location State
  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Image Preview Modal
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial profile & today's attendance
  useEffect(() => {
    fetchInitialData();
    requestLocation();
  }, []);

  const fetchInitialData = async () => {
    try {
      const meRes = await fetch("/api/staff/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setStaff(meData.staff);

      const todayRes = await fetch("/api/attendance/today");
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setRecord(todayData.record);
      }
    } catch (err) {
      console.error("Initial load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationLoading(false);
      },
      (err) => {
        let msg = "GPS Location is required.";
        if (err.code === 1) {
          msg = "Please allow location permission in Chrome/Safari site settings.";
        } else if (err.code === 2) {
          msg = "Turn on device location (GPS) in phone settings.";
        } else {
          msg = "Location request timed out. Please retry.";
        }
        setLocationError(msg);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await fetch("/api/staff/logout", { method: "POST" });
      router.push("/login");
    }
  };

  const handleMarkAttendance = async (action: "check_in" | "check_out") => {
    setNotification(null);

    if (!cameraRef.current || !cameraRef.current.isCameraActive()) {
      setNotification({
        type: "error",
        title: "Camera Required",
        text: "Please start the selfie camera before recording attendance.",
      });
      return;
    }

    const selfieBase64 = cameraRef.current.takeSnapshot();
    if (!selfieBase64) {
      setNotification({
        type: "error",
        title: "Selfie Not Captured",
        text: "Could not capture front camera selfie. Please ensure face is visible.",
      });
      return;
    }

    setSubmitting(true);

    const getFreshLocation = (): Promise<{ lat: number; lng: number; accuracy: number }> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Device does not support GPS location."));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          () => {
            reject(
              new Error(
                "Device GPS location is required. Please turn on location in phone settings."
              )
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0,
          }
        );
      });
    };

    try {
      const loc = await getFreshLocation();
      setLocationCoords(loc);
      setLocationError(null);

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          selfie: selfieBase64,
          latitude: loc.lat,
          longitude: loc.lng,
          accuracy: loc.accuracy,
          deviceInfo: navigator.userAgent.slice(0, 100),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to record attendance.");
      }

      // No celebration popup - clean notification only
      const isCheckIn = action === "check_in";
      setNotification({
        type: "success",
        title: isCheckIn ? "Checked In Successfully" : "Checked Out Successfully",
        text: data.message,
      });

      // Stop camera stream to preserve phone battery and privacy
      if (cameraRef.current?.stopCamera) {
        cameraRef.current.stopCamera();
      }

      await fetchInitialData();
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Attendance Not Recorded",
        text: err.message || "An error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isCheckedIn = Boolean(record && record.check_in_time);
  const isCheckedOut = Boolean(record && record.check_out_time);

  return (
    <DeviceGate>
      <div className="min-h-screen bg-[#f8fafc] pb-24 max-w-md mx-auto flex flex-col justify-between">
        <div className="p-4 space-y-4">
          {/* Top Brand Header */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 flex items-center justify-between">
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
            {staff && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {staff.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full inline-flex items-center leading-none">
                    {staff.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Clean Notification Toast (No celebration popup) */}
          {notification && (
            <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-top-3 fade-in duration-200">
              <div
                className={`p-3.5 rounded-2xl shadow-xl border flex items-start gap-3 bg-white/95 backdrop-blur-md ${
                  notification.type === "success"
                    ? "border-emerald-300 text-slate-800 shadow-emerald-600/10"
                    : "border-rose-300 text-slate-800 shadow-rose-600/10"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                    notification.type === "success"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}
                >
                  {notification.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  {notification.title && (
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {notification.title}
                    </p>
                  )}
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-snug">
                    {notification.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg shrink-0 -mr-1 -mt-1"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Live Clock & GPS Status Bar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-mono">{currentTime || "--:--:--"}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin
                className={`w-3.5 h-3.5 shrink-0 ${
                  locationError
                    ? "text-rose-500"
                    : locationCoords
                    ? "text-emerald-600"
                    : "text-amber-500 animate-pulse"
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[170px]">
                {locationLoading
                  ? "Locating GPS..."
                  : locationError
                  ? "GPS Needed"
                  : locationCoords
                  ? `GPS ±${Math.round(locationCoords.accuracy)}m`
                  : "Detecting GPS"}
              </span>
              {locationError && (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-[10px] font-bold text-blue-600 underline ml-1"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Card 1: Mark Attendance (Exact layout from user screenshot) */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Mark Attendance
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            {/* Live Selfie Camera Video Box */}
            <SelfieCamera ref={cameraRef} />

            {/* Attendance Action Buttons */}
            <div>
              {!isCheckedIn ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleMarkAttendance("check_in")}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#10b981] hover:bg-[#059669] active:scale-[0.99] disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Check In
                    </>
                  )}
                </button>
              ) : !isCheckedOut ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleMarkAttendance("check_out")}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0071BC] hover:bg-[#005c99] active:scale-[0.99] disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Check Out
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Attendance Recorded for Today</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Today's Activity */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
              Today&apos;s Activity
            </h3>

            {!record ? (
              <div className="py-8 text-center">
                <p className="text-slate-400 text-xs font-medium">No activity recorded today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Check In info */}
                {record.check_in_time && (
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {record.check_in_selfie_url ? (
                        <div
                          onClick={() => setModalImage(record.check_in_selfie_url)}
                          className="relative cursor-pointer group shrink-0"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={record.check_in_selfie_url}
                            alt="Check-in selfie"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/logo.png";
                              target.className = "w-12 h-12 rounded-xl object-contain p-1 border border-slate-200 bg-white";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Checked In</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              record.status === "late"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {record.status === "late" ? "Late" : "On Time"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{record.check_in_time}</span>
                        </p>
                        {record.check_in_address && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 max-w-[210px]">
                            {record.check_in_address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Check Out info */}
                {record.check_out_time ? (
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {record.check_out_selfie_url ? (
                        <div
                          onClick={() => setModalImage(record.check_out_selfie_url)}
                          className="relative cursor-pointer group shrink-0"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={record.check_out_selfie_url}
                            alt="Check-out selfie"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/logo.png";
                              target.className = "w-12 h-12 rounded-xl object-contain p-1 border border-slate-200 bg-white";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Checked Out</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-700">
                            Completed
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>{record.check_out_time}</span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-800 mt-1">
                          Total Hours: {Math.floor(record.work_duration_minutes / 60)}h{" "}
                          {record.work_duration_minutes % 60}m
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-xs text-blue-600 font-medium">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-blue-600" />
                    <span>Shift in progress. Remember to Check Out when leaving.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selfie Modal Popup on Tap */}
        {modalImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setModalImage(null)}
          >
            <div className="relative max-w-xs w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="absolute -top-10 right-0 p-2 text-white"
              >
                <X className="w-6 h-6" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={modalImage}
                alt="Enlarged selfie"
                className="w-full rounded-2xl object-cover shadow-2xl border border-white/20"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 pb-2 text-center space-y-0.5">
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            Powered by ZTOI TECH
          </p>
        </div>

        {/* Bottom Nav */}
        <MobileBottomNav />
      </div>
    </DeviceGate>
  );
}
