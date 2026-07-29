import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { authFetch } from "../utils/auth";
import { uploadAvatar, deleteAvatar } from "../services/userService";
import { toast } from "react-toastify";
import { LuLogOut, LuUser } from "react-icons/lu";
import { MdOutlineEmail } from "react-icons/md";
import { FiPhone, FiTrash2, FiEdit3, FiUpload } from "react-icons/fi";
import { AiFillInfoCircle, AiOutlineCalendar, AiOutlineBook, AiOutlineTeam, AiFillCheckCircle, AiFillStar, AiOutlineTag, AiOutlineEdit } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";

/* ══════════════════════════════════════════
   REUSABLE PRIMITIVES
══════════════════════════════════════════ */

/* ── Input Field ── */
const Field = ({ label, id, type = "text", value, onChange, placeholder, readOnly, icon }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[11px] font-bold text-[#6a6f73] uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6f73] text-sm pointer-events-none">
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full ${icon ? "pl-9" : "pl-4"} pr-4 py-2.5 text-sm border rounded outline-none transition-all duration-150
          ${readOnly
            ? "bg-[#f7f9fa] text-[#6a6f73] cursor-not-allowed border-[#d1d7dc]"
            : "bg-white text-[#1c1d1f] border-[#d1d7dc] focus:border-[#a435f0] focus:ring-2 focus:ring-[#a435f0]/10"
          }`}
      />
    </div>
  </div>
);

/* ── Info Tile ── */
const InfoTile = ({ label, value }) => (
  <div className="bg-[#f7f9fa] border border-[#e8e8e8] rounded px-4 py-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6a6f73] mb-1">{label}</p>
    <div className="text-sm font-semibold text-[#1c1d1f]">{value || "—"}</div>
  </div>
);

/* ── Stat Card (hero) ── */
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/10 border border-white/10 rounded-lg px-5 py-4">
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[#cec0fc] text-sm">
        {icon}
      </span>
      <span className="text-[#cec0fc] text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>

    <p className="text-white text-[18px] font-extrabold">
      {value}
    </p>
  </div>
);

/* ══════════════════════════════════════════
   EDIT MODAL
══════════════════════════════════════════ */
const EditModal = ({ user, onClose, onSave }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const fileRef = useRef();

  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    avatar: user.avatar || null,
  });
  const [preview, setPreview] = useState(user.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select a valid image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB.");
    setAvatarFile(file);
    setAvatarRemoved(false);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.firstName.trim()) return "First name is required.";
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) return "Enter a valid 10-digit phone number.";
    return "";
  };

  const handleRemoveAvatar = async () => {
    if (avatarFile) {
      setAvatarFile(null);
      setAvatarRemoved(true);
      setForm((prev) => ({ ...prev, avatar: null }));
      setPreview(null);
      return;
    }

    if (!user.avatar) return;

    try {
      setLoading(true);
      await deleteAvatar();
      setAvatarRemoved(true);
      setForm((prev) => ({ ...prev, avatar: null }));
      setPreview(null);
      toast.success("Avatar removed successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to remove avatar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setLoading(true);
    try {
      let avatarUrl = form.avatar;

      if (avatarRemoved) {
        avatarUrl = null;
      }

      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        avatarUrl = uploaded?.avatar || uploaded?.url || avatarUrl;
      }

      const res = await authFetch(`${API_URL}/api/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone || "",
          avatar: avatarUrl || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully!");
        onSave(data.data);
        onClose();
      } else {
        toast.error(data.message || "Update failed.");
      }
    } catch {
      toast.error("Server error. Please try again.");
    }
    setLoading(false);
  };

  const initials = `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase();

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto font-sans">

        {/* Modal header — Udemy dark */}
        <div className="bg-[#1c1d1f] px-6 py-5 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-white text-[17px] font-extrabold">Edit Profile</h2>
            <p className="text-[#6a6f73] text-xs mt-0.5">Update your personal information</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Avatar upload */}
        <div className="flex flex-col items-center pt-7 pb-1 px-6">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileRef.current.click()}
          >
            <div className="w-24 h-24 rounded-full ring-4 ring-[#a435f0]/20 overflow-hidden bg-[#a435f0] flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
              {preview
                ? <img src={preview} className="w-full h-full object-cover" alt="preview" />
                : initials}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] gap-1 font-semibold">
              <FiUpload size={20} className="text-white" />
              Upload
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button type="button" onClick={() => fileRef.current.click()} className="text-[13px] text-[#a435f0] font-bold hover:underline">
              Change profile photo
            </button>
            {(preview || user.avatar) && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={loading}
                className="text-[13px] text-red-500 font-bold hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#6a6f73] mt-0.5">JPG, PNG or WebP · Max 5 MB</p>
        </div>

        <div className="border-t border-[#e8e8e8] mx-6 my-5" />

        {/* Form */}
        <div className="px-6 pb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" id="firstName" value={form.firstName} onChange={set("firstName")} placeholder="John" icon={<LuUser size={18} className="text-[#6a6f73]" />} />
            <Field label="Last Name" id="lastName" value={form.lastName} onChange={set("lastName")} placeholder="Doe" />
          </div>
          <Field label="Email Address" id="email" type="email" value={user.email} readOnly icon={<MdOutlineEmail size={18} className="text-[#6a6f73]" />} />
          <Field label="Phone Number" id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="9876543210" icon={<FiPhone size={18} className="text-[#6a6f73]" />} />

          {/* Info note */}
          <div className="flex items-start gap-2.5 bg-[#f0e6ff] border border-[#c6a3f7] rounded px-4 py-3 text-[12px] text-[#5c2d91]">
            <AiFillInfoCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>Email address cannot be changed here. Contact support to update it.</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded border border-[#d1d7dc] text-[#1c1d1f] text-sm font-bold hover:bg-[#f7f9fa] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded bg-[#a435f0] hover:bg-[#8710d8] text-white text-sm font-bold transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════════ */
const Profile = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${API_URL}/api/users/profile`);
        const data = await res.json();
        if (!res.ok) { logout(); navigate("/api/auth/login"); return; }
        setUser(data.data);
        if (data.data.role === "instructor") {
          const rI = await authFetch(`${API_URL}/api/instructors/profile`);
          const dI = await rI.json();
          if (rI.ok) setInstructor(dI.data);
        }
      } catch { toast.error("Failed to load profile."); }
    })();
  }, [API_URL, logout, navigate]);

  const handleDelete = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone.")) return;
    try {
      const res = await authFetch(`${API_URL}/api/users/profile`, { method: "DELETE" });
      if (res.ok) { toast.success("Account deleted."); logout(); navigate("/api/auth/register"); }
    } catch { toast.error("Server error."); }
  };

  /* Loading */
  if (!user)
    return (
      <div className="h-[60vh] flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#e8e8e8] border-t-[#a435f0] rounded-full animate-spin" />
      </div>
    );

  const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
  const isInstructor = user.role === "instructor";

  return (
    <>
      {showModal && <EditModal user={user} onClose={() => setShowModal(false)} onSave={setUser} />}

      <div className="min-h-screen bg-[#f7f9fa] font-sans">

        {/* ══════════════════════════════════════
            HERO — Udemy #1c1d1f dark
        ══════════════════════════════════════ */}
        <div className="bg-[#1c1d1f]">
          <div className="max-w-[1180px] mx-auto px-6 py-8">

            {/* Top: avatar + name + actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full ring-4 ring-[#a435f0]/30 overflow-hidden bg-[#a435f0] flex items-center justify-center text-white text-2xl font-extrabold shadow-xl">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    title="Edit profile"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#a435f0] hover:bg-[#8710d8] text-white flex items-center justify-center shadow-lg transition"
                  >
                    <FiEdit3 size={16} className="font-bold" />
                  </button>
                </div>

                {/* Name + meta */}
                <div>
                  <p className="text-[#cec0fc] text-xs font-bold uppercase tracking-widest mb-1">
                    {isInstructor ? "Instructor Account" : "Student Account"}
                  </p>
                  <h1 className="text-white text-2xl font-extrabold leading-tight">
                    {user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName}
                  </h1>
                  <p className="text-[#6a6f73] text-sm mt-0.5">{user.email}</p>
                  {user.phone && (
                    <p className="text-[#6a6f73] text-xs mt-1 flex items-center gap-1">
                      <FiPhone size={16} className="text-[#6a6f73]" /> {user.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-white hover:bg-[#f7f9fa] text-[#1c1d1f] px-5 py-2.5 rounded font-bold text-sm border border-[#d1d7dc] transition"
                >
                  <FiEdit3 size={18} className="font-bold" /> Edit Profile
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 px-5 py-2.5 rounded font-bold text-sm transition"
                >
                  <FiTrash2 size={18} className="font-bold" /> Delete Account
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#3e4143]">
              <StatCard icon={<LuUser size={22} className="mx-auto" />} label="Account Type" value={user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} />
              <StatCard icon={<AiOutlineCalendar size={22} className="mx-auto" />} label="Member Since" value={user.createdAt && !isNaN(new Date(user.createdAt).getTime()) ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"} />
              {isInstructor && instructor ? (
                <>
                  <StatCard icon={<AiOutlineBook size={22} className="mx-auto" />} label="Total Courses" value={instructor.totalCourses ?? "—"} />
                  <StatCard icon={<AiOutlineTeam size={22} className="mx-auto" />} label="Total Students" value={instructor.totalStudents ?? "—"} />
                </>
              ) : (
                <>
                  <StatCard icon={<FiPhone size={22} className="mx-auto" />} label="Phone" value={user.phone || "Not added"} />
                  <StatCard icon={<AiFillCheckCircle size={22} className="mx-auto" />} label="Status" value="Active" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            WHITE BODY
        ══════════════════════════════════════ */}
        <div className="max-w-[1180px] mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Account summary */}
            <div className="bg-white border border-[#d1d7dc] rounded-lg p-5">
              <h3 className="text-[15px] font-extrabold text-[#1c1d1f] pb-3 mb-3 border-b border-[#e8e8e8]">
                Account Summary
              </h3>
              <ul className="space-y-3 text-[15px] text-[#1c1d1f]">
                <li className="flex items-center gap-2.5">
                  <span className="text-[#6a6f73] w-4 flex-shrink-0"><MdOutlineEmail size={20} className="text-black" /></span>
                  <span className="truncate">{user.email}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#6a6f73] w-4 flex-shrink-0"><FiPhone size={18} className="text-[#6a6f73]" /></span>
                  <span>{user.phone || <em className="text-[#6a6f73]">Not added</em>}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#6a6f73] w-4 flex-shrink-0"><AiOutlineCalendar size={18} className="text-[#6a6f73]" /></span>
                  <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#6a6f73] w-4 flex-shrink-0"><AiOutlineTag size={18} className="text-[#6a6f73]" /></span>
                  <span className="capitalize font-semibold">{user.role}</span>
                </li>
              </ul>
            </div>

            {/* Quick actions */}
            <div className="bg-white border border-[#d1d7dc] rounded-lg p-5">
              <h3 className="text-[15px] font-extrabold text-[#1c1d1f] pb-3 mb-2 border-b border-[#e8e8e8]">
                Quick Actions
              </h3>
              <div className="space-y-0.5">
                {[
                  { label: "Edit personal info", icon: <AiOutlineEdit size={18} className="font-bold" />, onClick: () => setShowModal(true), style: "text-[#a435f0] hover:bg-[#f7f0ff]" },
                  { label: "Change password", icon: <RiLockPasswordLine size={18} className="font-bold" />, onClick: () => navigate("/change-password"), style: "text-[#1c1d1f] hover:bg-[#f7f9fa]" },
                  ...(isInstructor ? [{ label: "My courses", icon: <AiOutlineBook size={18} className="font-bold" />, onClick: () => navigate("/instructor/home"), style: "text-[#1c1d1f] hover:bg-[#f7f9fa]" }] : []),
                  { label: "Logout", icon: <LuLogOut size={20} className="stroke-[2.5]" />, onClick: () => { logout(); navigate("/"); }, style: "text-[#1c1d1f] hover:bg-[#f7f9fa]" },
                  { label: "Delete account", icon: <FiTrash2 size={18} className="font-bold" />, onClick: handleDelete, style: "text-[#c0392b] hover:bg-[#fef2f2]" },
                ].map(({ label, icon, onClick, style }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className={`w-full text-left text-[15px] font-medium px-3 py-2.5 rounded flex items-center gap-2.5 transition ${style}`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main 2/3 ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal information */}
            <div className="bg-white border border-[#d1d7dc] rounded-lg p-6">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#e8e8e8]">
                <h2 className="text-[18px] font-extrabold text-[#1c1d1f]">Personal Information</h2>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-[13px] font-bold text-[#a435f0] hover:underline flex items-center gap-1"
                >
                  <FiEdit3 size={16} className="font-bold" /> Edit
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <InfoTile label="First Name" value={user.firstName} />
                <InfoTile label="Last Name" value={user.lastName} />
                <InfoTile label="Email Address" value={user.email} />
                <InfoTile label="Phone Number" value={user.phone} />
                <InfoTile
                  label="Account Role"
                  value={
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-[#f0e6ff] text-[#a435f0] rounded capitalize">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a435f0]" />
                      {user.role}
                    </span>
                  }
                />
                <InfoTile
                  label="Member Since"
                  value={user.createdAt && !isNaN(new Date(user.createdAt).getTime()) ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                />
              </div>
            </div>

            {/* Instructor section */}
            {isInstructor && instructor && (
              <div className="bg-white border border-[#d1d7dc] rounded-lg p-6">
                <div className="pb-4 mb-5 border-b border-[#e8e8e8]">
                  <h2 className="text-[18px] font-extrabold text-[#1c1d1f]">Instructor Overview</h2>
                  <p className="text-[13px] text-[#6a6f73] mt-0.5">Your teaching stats and profile details</p>
                </div>

                {/* Instructor stat cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Courses", value: instructor.totalCourses ?? "—", icon: <AiOutlineBook size={26} className="mx-auto" />, color: "bg-[#f7f0ff] text-[#a435f0]" },
                    { label: "Total Students", value: instructor.totalStudents ?? "—", icon: <AiOutlineTeam size={26} className="mx-auto" />, color: "bg-[#ecfdf5] text-[#065f46]" },
                    { label: "Avg. Rating", value: instructor.averageRating ?? "—", icon: <AiFillStar size={26} className="mx-auto" />, color: "bg-[#fef9c3] text-[#854d0e]" },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className={`${color} rounded-lg px-4 py-4 text-center`}>
                      <p className="text-2xl mb-1">{icon}</p>
                      <p className="text-xl font-extrabold leading-tight">{value}</p>
                      <p className="text-[11px] font-semibold mt-0.5 opacity-80">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Instructor profile fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Headline", value: instructor.headline },
                    { label: "Biography", value: instructor.biography },
                    { label: "Expertise", value: instructor.expertise?.join(", ") },
                  ].filter(({ value }) => value).map(({ label, value }) => (
                    <InfoTile key={label} label={label} value={value} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;