import { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import loginill from "../assets/Computer login-amico.png";
import { toast } from "react-toastify";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      navigate("/");
      return;
    }

    // ❌ removed serverError state
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
            className={`w-full mt-1 px-4 py-3 rounded-lg bg-gray-100 focus:outline-none ${
              errors.email ? "border border-red-500" : ""
            }`}
          />
          {errors.email && (
            <p className="mt-1 mb-3 text-sm text-red-600">{errors.email}</p>
          )}

          {/* PASSWORD */}
          <label className="text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            placeholder="Enter your password"
            onChange={handleChange}
            className={`w-full mt-1 px-4 py-3 rounded-lg bg-gray-100 focus:outline-none ${
              errors.password ? "border border-red-500" : ""
            }`}
          />
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
            Don’t have an account?{" "}
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