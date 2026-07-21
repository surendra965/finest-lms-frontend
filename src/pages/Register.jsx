import { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import registerill from "../assets/Sign up-amico.png";
import { toast } from "react-toastify";
import { LuEye, LuEyeOff } from "react-icons/lu";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* =========================
     HELPERS
  ========================= */
  const cleanString = (value) => value.trim().replace(/\s+/g, " ");

  /* =========================
     VALIDATION
  ========================= */
  const validateForm = () => {
    const nextErrors = {};

    const firstName = cleanString(form.firstName);
    const lastName = cleanString(form.lastName);
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    const nameRegex = /^[A-Za-z]+$/;

    // FIRST NAME
    if (!firstName) {
      nextErrors.firstName = "First name is required";
    } else if (!nameRegex.test(firstName)) {
      nextErrors.firstName = "Only letters are allowed";
    } else if (firstName.length > 50) {
      nextErrors.firstName = "Maximum 50 characters allowed";
    }

    // LAST NAME (optional — validate only if provided)
    if (lastName && !nameRegex.test(lastName)) {
      nextErrors.lastName = "Only letters are allowed";
    } else if (lastName && lastName.length > 50) {
      nextErrors.lastName = "Maximum 50 characters allowed";
    }

    // EMAIL
    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Invalid email address";
    }

    // PASSWORD
    if (!password) {
      nextErrors.password = "Password is required";
    } else if (/\s/.test(password)) {
      nextErrors.password = "Password cannot contain spaces";
    } else if (password.length < 8) {
      nextErrors.password = "Minimum 8 characters required";
    } else if (password.length > 30) {
      nextErrors.password = "Maximum 30 characters allowed";
    } else if (!/[A-Z]/.test(password)) {
      nextErrors.password = "Must include at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      nextErrors.password = "Must include at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      nextErrors.password = "Must include at least one number";
    }

    return nextErrors;
  };

  /* =========================
     INPUT CHANGE
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error("Invalid Fields");
      return;
    }

    const trimmedLastName = cleanString(form.lastName);
    const payload = {
      firstName: cleanString(form.firstName),
      ...(trimmedLastName && { lastName: trimmedLastName }),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    setIsSubmitting(true);

    const result = await register(payload);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "Registered successfully!");
      navigate("/api/auth/login");
      return;
    }

    toast.error(result.message || "Registration failed");
  };

  return (
    <div className="flex h-screen bg-white">

      {/* LEFT IMAGE */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-50">
        <img src={registerill} alt="register" className="w-[80%]" />
      </div>

      {/* RIGHT FORM */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6">

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">

          {/* HEADING */}
          <div>
            <h1 className="text-4xl font-serif mb-2">
              Create your account
            </h1>
            <p className="text-gray-500">
              Enter your details to get started
            </p>
          </div>

          {/* FIRST NAME */}
          <div>
            <label className="text-sm font-medium">First Name</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              className={`w-full mt-1 px-4 py-3 rounded-lg bg-gray-100 ${
                errors.firstName ? "border border-red-500" : ""
              }`}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* LAST NAME (Optional) */}
          <div>
            <label className="text-sm font-medium">
              Last Name{" "}
              <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Enter last name (optional)"
              className={`w-full mt-1 px-4 py-3 rounded-lg bg-gray-100 ${
                errors.lastName ? "border border-red-500" : ""
              }`}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`w-full mt-1 px-4 py-3 rounded-lg bg-gray-100 ${
                errors.email ? "border border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative mt-1">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 ${
                  errors.password ? "border border-red-500" : ""
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
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 disabled:bg-gray-500"
          >
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </button>

          {/* LOGIN LINK */}
          <p className="text-sm text-center">
            Already have an account?{" "}
            <Link to="/api/auth/login" className="text-purple-600 hover:underline">
              Log in
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Register;