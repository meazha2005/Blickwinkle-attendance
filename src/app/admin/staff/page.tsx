"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  MapPin,
  CalendarCheck,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface Staff {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  aadhar_no: string | null;
  role: "staff" | "intern";
  timing_type?: "fixed" | "any_time";
  work_start_time?: string | null;
  work_end_time?: string | null;
  late_grace_period_minutes?: number;
  status: "active" | "inactive";
  created_at: string;
}

export default function AdminStaffPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    address: "",
    aadhar_no: "",
    role: "staff",
    timing_type: "fixed" as "fixed" | "any_time",
    work_start_time: "09:30",
    work_end_time: "18:30",
    late_grace_period_minutes: 30,
    status: "active",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/staffs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStaffs(data.staffs || []);
      }
    } catch (err) {
      console.error("Fetch staff error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaffs();
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      phone: "",
      password: "",
      address: "",
      aadhar_no: "",
      role: "staff",
      timing_type: "fixed",
      work_start_time: "09:30",
      work_end_time: "18:30",
      late_grace_period_minutes: 30,
      status: "active",
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    setFormData({
      name: s.name,
      phone: s.phone,
      password: "",
      address: s.address || "",
      aadhar_no: s.aadhar_no || "",
      role: s.role,
      timing_type: s.timing_type || "fixed",
      work_start_time: s.work_start_time ? s.work_start_time.substring(0, 5) : "09:30",
      work_end_time: s.work_end_time ? s.work_end_time.substring(0, 5) : "18:30",
      late_grace_period_minutes:
        s.late_grace_period_minutes !== undefined && s.late_grace_period_minutes !== null
          ? s.late_grace_period_minutes
          : 30,
      status: s.status,
    });
    setFormError(null);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!formData.name.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }

    if (!editingStaff && (!formData.password || formData.password.trim().length < 4)) {
      setFormError("Password is required for login (minimum 4 characters).");
      return;
    }

    if (editingStaff && formData.password && formData.password.trim().length < 4) {
      setFormError("New password must be at least 4 characters long.");
      return;
    }

    setFormLoading(true);
    try {
      const url = editingStaff
        ? `/api/admin/staffs/${editingStaff.id}`
        : "/api/admin/staffs";
      const method = editingStaff ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save staff member.");
      }

      setSuccessToast(
        editingStaff
          ? "Staff member updated successfully!"
          : "New staff member added successfully!"
      );
      setTimeout(() => setSuccessToast(null), 4000);

      setShowAddModal(false);
      setEditingStaff(null);
      await fetchStaffs();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/staffs/${deletingStaff.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete staff.");
      }

      setSuccessToast("Staff member deleted successfully.");
      setTimeout(() => setSuccessToast(null), 4000);
      setDeletingStaff(null);
      await fetchStaffs();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Staff & Intern Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employees, 10-digit mobile credentials, and Aadhaar numbers.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone (10-digit) or Aadhaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Roles</option>
            <option value="staff">Staff Only</option>
            <option value="intern">Intern Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading members...</p>
          </div>
        ) : staffs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No staff or intern members found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Add New Member&quot; above to register your team members.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Timing</th>
                  <th className="px-5 py-3">Aadhaar No</th>
                  <th className="px-5 py-3">Address</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-bold text-slate-900">{s.name}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>+91 {s.phone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          s.role === "intern"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {s.timing_type === "any_time" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                          Any Time (Flexible)
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {(s.work_start_time || "09:30").substring(0, 5)} -{" "}
                            {(s.work_end_time || "18:30").substring(0, 5)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            +{s.late_grace_period_minutes !== undefined ? s.late_grace_period_minutes : 30}m grace
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {s.aadhar_no || "--"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">
                      {s.address || "--"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          s.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/attendance?staff_id=${s.id}`}
                          title="View Attendance History"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <CalendarCheck className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStaff(s)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingStaff) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingStaff ? "Update Staff / Intern" : "Add New Staff or Intern"}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the member credentials for mobile login.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStaff(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  required
                />
              </div>

              {/* Phone (10 digits) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number (10 digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                    }
                    className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Used by staff to log in on attendance.blickwinkle.com
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Login Password{" "}
                  {editingStaff ? (
                    <span className="text-slate-400 font-normal text-[11px]">
                      (leave blank to keep current)
                    </span>
                  ) : (
                    <span className="text-rose-500">*</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder={
                    editingStaff
                      ? "Enter new password to update"
                      : "Set login password (min 4 characters)"
                  }
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  required={!editingStaff}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Staff will use this password along with their mobile number to log in.
                </p>
              </div>

              {/* Aadhaar Number (up to 16 digits) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Aadhaar Card Number (12 to 16 digits)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 123456789012"
                  value={formData.aadhar_no}
                  onChange={(e) =>
                    setFormData({ ...formData, aadhar_no: e.target.value.replace(/\D/g, "") })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Postal Code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="staff">Regular Staff</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Office Attendance Parameters (Per-Staff Timing) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Office Attendance Parameters
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Individual Staff Timing
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Timing Mode <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, timing_type: "any_time" })}
                      className={`p-3 rounded-xl border text-left transition ${
                        formData.timing_type === "any_time"
                          ? "bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                          : "bg-white/60 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">Any Time</span>
                        {formData.timing_type === "any_time" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 leading-snug block">
                        No late marking or fixed hours. Check in & out anytime.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, timing_type: "fixed" })}
                      className={`p-3 rounded-xl border text-left transition ${
                        formData.timing_type === "fixed"
                          ? "bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                          : "bg-white/60 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">Fixed Timing</span>
                        {formData.timing_type === "fixed" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 leading-snug block">
                        Set fixed office shift hours with late grace threshold.
                      </span>
                    </button>
                  </div>
                </div>

                {formData.timing_type === "fixed" && (
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Work Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.work_start_time}
                        onChange={(e) =>
                          setFormData({ ...formData, work_start_time: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required={formData.timing_type === "fixed"}
                      />
                      <p className="text-[9px] text-slate-400 mt-0.5">e.g. 09:30 AM</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Work End Time
                      </label>
                      <input
                        type="time"
                        value={formData.work_end_time}
                        onChange={(e) =>
                          setFormData({ ...formData, work_end_time: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required={formData.timing_type === "fixed"}
                      />
                      <p className="text-[9px] text-slate-400 mt-0.5">e.g. 18:30 (06:30 PM)</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Late Grace (Minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={formData.late_grace_period_minutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            late_grace_period_minutes: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required={formData.timing_type === "fixed"}
                      />
                      <p className="text-[9px] text-slate-400 mt-0.5">Late if checked in after Start + Grace</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {formLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{editingStaff ? "Update Member" : "Save Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Member?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800">{deletingStaff.name}</span>? All
              associated attendance records will also be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={formLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                {formLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
