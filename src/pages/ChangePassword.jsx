import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { authFetch } from "../utils/auth";
import { LuLock, LuArrowLeft, LuCheck } from "react-icons/lu";

const ChangePassword = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        if (errors[e.target.name]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
        }
    };

    const validate = () => {
        let temp = {};
        if (!form.currentPassword) {
            temp.currentPassword = "Current password is required";
        } else if (form.currentPassword.length < 8) {
            temp.currentPassword = "Password must be at least 8 characters";
        }

        if (!form.newPassword) {
            temp.newPassword = "New password is required";
        } else if (form.newPassword.length < 8) {
            temp.newPassword = "Password must be at least 8 characters";
        } else if (form.newPassword === form.currentPassword) {
            temp.newPassword = "New password must be different from current password";
        }

        if (!form.confirmPassword) {
            temp.confirmPassword = "Confirmation password is required";
        } else if (form.confirmPassword !== form.newPassword) {
            temp.confirmPassword = "Passwords do not match";
        }

        setErrors(temp);
        return Object.keys(temp).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/users/change-password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                    confirmPassword: form.confirmPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to update password");
            }
            toast.success("Password changed successfully!");
            navigate("/api/users/profile");
        } catch (err) {
            toast.error(err.message || "Error changing password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
                {/* Glow Element */}
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-100 opacity-50 blur-3xl -z-10" />

                {/* Back Button */}
                <button
                    onClick={() => navigate("/api/users/profile")}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-600 transition mb-6 bg-transparent border-none focus:outline-none cursor-pointer font-semibold"
                >
                    <LuArrowLeft size={14} /> Back to Profile
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <LuLock size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Security Setting</h2>
                        <p className="text-xs text-gray-500">Change your account password below</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">
                            Current Password
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={form.currentPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${errors.currentPassword ? "border-red-500" : "border-gray-200"
                                }`}
                        />
                        {errors.currentPassword && (
                            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.currentPassword}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">
                            New Password
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            value={form.newPassword}
                            onChange={handleChange}
                            placeholder="Min. 8 characters"
                            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${errors.newPassword ? "border-red-500" : "border-gray-200"
                                }`}
                        />
                        {errors.newPassword && (
                            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.newPassword}</p>
                        )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter new password"
                            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${errors.confirmPassword ? "border-red-500" : "border-gray-200"
                                }`}
                        />
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-100 transition disabled:opacity-60 cursor-pointer text-sm mt-2 border-none"
                    >
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <LuCheck size={16} />
                        )}
                        {loading ? "Saving changes..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
