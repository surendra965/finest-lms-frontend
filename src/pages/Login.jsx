import { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import loginill from "../assets/Computer login-amico.png";
import { toast } from "react-toastify";
import { LuEye, LuEyeOff } from "react-icons/lu";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* =========================
     VALIDATION
  ========================= */
  const validateForm = () => {
    const nextErrors = {};
    const email = form.email.trim();

    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Invalid email address";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (/\s/.test(form.password)) {
      nextErrors.password = "Password cannot contain spaces";
    } else if (form.password.length < 8) {
      nextErrors.password = "Minimum 8 characters required";
    } else if (form.password.length > 50) {
      nextErrors.password = "Maximum 50 characters allowed";
    }

    return nextErrors;
  };

  /* =========================
     INPUT CHANGE
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    // clear only that field error
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* =========================
     LOGIN HANDLER
  ========================= */
  const handleLogin = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error("Invalid fields");
      return;
    }

    setIsSubmitting(true);

    const result = await login(form.email.trim(), form.password);

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Logged in successfully!");
      if (result.role === "admin") {
        navigate("/");
      } else {
        const from = location.state?.from?.pathname || "/";
        navigate(from);
      }
      return;
    }

    toast.error(result.message || "Invalid email or password");
  };

  return (
    <div className="flex h-screen bg-white">

      {/* LEFT IMAGE */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-50">
        <img src={loginill} alt="login" className="w-[80%]" />
      </div>

      {/* RIGHT FORM */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6">

        <form onSubmit={handleLogin} className="w-full max-w-md">

          {/* HEADING */}
          <h1 className="text-4xl font-serif mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 mb-6">
            Enter your email and password
          </p>

          {/* EMAIL */}
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            placeholder="Enter your email"
            onChange={handleChange}
            className={`w-full mt-1 px-4 py-3 rounded-lg bg-gray-100 focus:outline-none ${errors.email ? "border border-red-500" : ""
              }`}
          />
          {errors.email && (
            <p className="mt-1 mb-3 text-sm text-red-600">{errors.email}</p>
          )}

          {/* PASSWORD */}
          <label className="text-sm font-medium">Password</label>
          <div className="relative mt-1 mb-1">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              placeholder="Enter your password"
              onChange={handleChange}
              className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 focus:outline-none ${errors.password ? "border border-red-500" : ""
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
          {errors.password && (
            <p className="mt-1 mb-3 text-sm text-red-600">{errors.password}</p>
          )}

          {/* FORGOT */}
          <div className="flex justify-between items-center mb-5 text-sm">
            <Link to="/api/auth/forgot-password" className="text-gray-500 hover:text-purple-600">
              Forgot Password
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 disabled:bg-gray-500"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          {/* REGISTER */}
          <p className="mt-6 text-sm text-center">
            Don't have an account?{" "}
            <Link to="/api/auth/register" className="text-purple-600 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;