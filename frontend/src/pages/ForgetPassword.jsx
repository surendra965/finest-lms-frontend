import { useState } from "react";
import forgotill from "../assets/Forgot password-cuate.svg";
import { getApiErrorMessage, readJson } from "../utils/auth";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  /* =========================
     HELPERS
  ========================= */
  const cleanEmail = (value) => value.trim().toLowerCase();

  const validateEmail = (value) => {
    const email = value.trim().toLowerCase();

    if (!email) return "Email is required";
    if (email.length > 254) return "Email is too long";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Invalid email address";
    }

    return "";
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedEmail = cleanEmail(email);
    const validationError = validateEmail(cleanedEmail);

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanedEmail }),
      });

      const data = await readJson(res);

      if (res.ok) {
        const msg =
          data?.message ||
          "If that email exists, a reset link has been sent.";

        toast.success(msg);
      } else {
        const errMsg = getApiErrorMessage(
          data,
          "Unable to send reset link"
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
        <img src={forgotill} alt="forgot" className="w-[80%]" />
      </div>

      {/* RIGHT FORM */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6">

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">

          {/* HEADING */}
          <div>
            <h1 className="text-4xl font-serif mb-2">
              Forgot Password
            </h1>
            <p className="text-gray-500">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              placeholder="Enter your email"
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className={`w-full mt-1 px-4 py-3 rounded-lg bg-gray-100 ${
                error ? "border border-red-500" : ""
              }`}
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 disabled:bg-gray-500"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;