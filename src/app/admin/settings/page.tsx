"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Clock,
  MapPin,
  Lock,
  Building,
  CheckCircle2,
  AlertCircle,
  Shield,
  LocateFixed,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsToast, setSettingsToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [settings, setSettings] = useState({
    office_name: "Blickwinkle",
    strict_geofence: "0",
    office_latitude: "13.0827",
    office_longitude: "80.2707",
    office_radius_meters: "250",
  });

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwToast, setPwToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsToast(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update settings.");
      }

      setSettingsToast({ type: "success", text: "Office settings saved successfully!" });
      setTimeout(() => setSettingsToast(null), 4000);
    } catch (err: any) {
      setSettingsToast({ type: "error", text: err.message || "Error saving settings." });
    } finally {
      setSavingSettings(false);
    }
  };

  // Use Admin's current GPS location as office coordinate
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings({
          ...settings,
          office_latitude: pos.coords.latitude.toFixed(6),
          office_longitude: pos.coords.longitude.toFixed(6),
        });
        alert(`Location detected: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        alert("Failed to detect location: " + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwToast(null);

    if (newPassword !== confirmPassword) {
      setPwToast({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setPwToast({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to change password.");
      }

      setPwToast({ type: "success", text: "Admin password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwToast(null), 4000);
    } catch (err: any) {
      setPwToast({ type: "error", text: err.message || "Error updating password." });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">System & Geofence Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure office name, strict GPS geofence radius, and admin security credentials. Attendance timing parameters are configured individually per staff/intern in Staff Management.
        </p>
      </div>

      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Office & Geofence Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6 text-slate-900 font-bold text-base">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Office & Geofence Settings</span>
          </div>

          {settingsToast && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                settingsToast.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {settingsToast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{settingsToast.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Company / Office Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Office / Organization Name
              </label>
              <input
                type="text"
                value={settings.office_name}
                onChange={(e) => setSettings({ ...settings, office_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            {/* Geofence Parameters */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Strict Office Geofence Enforcement</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When enabled, staff must be within the office radius to record attendance.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.strict_geofence === "1"}
                    onChange={(e) =>
                      setSettings({ ...settings, strict_geofence: e.target.checked ? "1" : "0" })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Office Latitude
                  </label>
                  <input
                    type="text"
                    value={settings.office_latitude}
                    onChange={(e) =>
                      setSettings({ ...settings, office_latitude: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Office Longitude
                  </label>
                  <input
                    type="text"
                    value={settings.office_longitude}
                    onChange={(e) =>
                      setSettings({ ...settings, office_longitude: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Allowed Radius (Meters)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="5000"
                    value={settings.office_radius_meters}
                    onChange={(e) =>
                      setSettings({ ...settings, office_radius_meters: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={detectCurrentLocation}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                  <span>Use Current Device Location for Office Coords</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
              >
                {savingSettings && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Save Office Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Admin Password Change Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6 text-slate-900 font-bold text-base">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>Change Administrator Password</span>
          </div>

          {pwToast && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                pwToast.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {pwToast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{pwToast.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password (Min. 6 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Keep admin credentials secure. Use at least 6 characters with a combination of letters and numbers.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwLoading}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
              >
                {pwLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Update Admin Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
