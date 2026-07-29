import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import resetill from "../assets/Reset password-amico.png";
import { toast } from "react-toastify";
import { getApiErrorMessage, readJson } from "../utils/auth";
import { LuEye, LuEyeOff } from "react-icons/lu";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  /* =========================
     VALIDATION
  ========================= */
  const validatePassword = () => {
    const { password, confirmPassword } = form;

    if (!password) return "Password is required";

    if (/\s/.test(password))
      return "Password cannot contain spaces";

    if (password.length < 8)
      return "Minimum 8 characters required";

    if (password.length > 30)
      return "Maximum 30 characters allowed";

    if (!/[A-Z]/.test(password))
      return "Must include uppercase letter";

    if (!/[a-z]/.test(password))
      return "Must include lowercase letter";

    if (!/[0-9]/.test(password))
      return "Must include a number";

    if (!confirmPassword) return "Confirm password is required";

    if (password !== confirmPassword)
      return "Passwords do not match";

    return "";
  };

  /* =========================
     HANDLE CHANGE
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validatePassword();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${API_URL}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: form.password,
          }),
        }
      );

      const data = await readJson(res);

      if (res.ok) {
        toast.success("Password updated successfully!");
        navigate("/api/auth/login");
      } else {
        const errMsg = getApiErrorMessage(
          data,
          "Error resetting password"
        );
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      console.error(err);
      setError("Backend connection error");
      toast.error("Backend connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">

      {/* LEFT IMAGE */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-50">
        <img src={resetill} alt="reset" className="w-[80%]" />
      </div>

      {/* RIGHT FORM */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6">

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-4"
        >

          {/* HEADING */}
          <div>
            <h1 className="text-4xl font-serif mb-2">
              Reset Password
            </h1>
            <p className="text-gray-500">
              Enter your new password
            </p>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 ${
                  error ? "border border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <LuEye size={18} /> : <LuEyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 ${
                  error ? "border border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <LuEye size={18} /> : <LuEyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 disabled:bg-gray-500"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ResetPassword;