import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import InstructorProfile from "./pages/InstructorProfile";
import InstructorHome from "./pages/InstructorHome";
import ProtectedRoute from "./components/ProtectedRoute";
import CoursePreview from "./pages/CoursePreview";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CreateCourseWizard from "./pages/CreateCourseWizard";
import CreateCourseDetails from "./pages/CreateCourseDetails";
import InstructorCourseDetails from "./pages/InstructorCourseDetails";
import EditCourse from "./pages/EditCourse";
import CategoryCourses from "./pages/CategoryCourses";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentHistory from "./pages/PaymentHistory";
import PaymentDetail from "./pages/PaymentDetail";
import Learning from "./pages/Learning";
import LearningCourse from "./pages/LearningCourse";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPendingCourses from "./pages/admin/AdminPendingCourses";
import AdminCourseReview from "./pages/admin/AdminCourseReview";
import AdminCreateCategory from "./pages/admin/AdminCreateCategory";

import ChangePassword from "./pages/ChangePassword";

import VerifyCertificate from "./pages/VerifyCertificate";
import AllCourses from "./pages/AllCourses";

// ✅ Centralized route config
const HIDE_NAVBAR_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
];

function Layout() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const shouldHideNavbar =
    HIDE_NAVBAR_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith("/api/auth/reset-password") ||
    // Hide navbar on the watch page (/learning/:id) but NOT on the dashboard (/learning)
    (location.pathname.startsWith("/learning/") && location.pathname.length > "/learning/".length) ||
    // Hide navbar on all admin pages — admin sidebar handles nav
    location.pathname.startsWith("/admin");

  return (
    <>
      <ToastContainer position="top-right" className="mt-15" autoClose={3000} />

      {!shouldHideNavbar && <Navbar />}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/api/public/courses/:id" element={<CoursePreview />} />
        <Route path="/api/auth/login" element={<Login />} />
        <Route path="/api/auth/register" element={<Register />} />
        <Route path="/api/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/api/auth/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-certificate/:code" element={<VerifyCertificate />} />

        {/* USER PROTECTED */}
        <Route
          path="/api/users/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* INSTRUCTOR ROUTES */}
        <Route
          path="/api/instructors/become-instructor"
          element={
            <ProtectedRoute>
              <InstructorProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/home"
          element={
            <ProtectedRoute role="instructor">
              <InstructorHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/create-course"
          element={
            <ProtectedRoute role="instructor">
              <CreateCourseWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/course/create"
          element={
            <ProtectedRoute role="instructor">
              <CreateCourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/course/:id"
          element={
            <ProtectedRoute role="instructor">
              <InstructorCourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/course/:id/edit"
          element={
            <ProtectedRoute role="instructor">
              <EditCourse />
            </ProtectedRoute>
          }
        />
        <Route path="/courses" element={<CategoryCourses />} />
        <Route path="/courses/:slug" element={<CategoryCourses />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute role="student">
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute role="student">
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute role="student">
              <PaymentHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id"
          element={
            <ProtectedRoute role="student">
              <PaymentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute role="student">
              <Learning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning/:id"
          element={
            <ProtectedRoute role="student">
              <LearningCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/all-courses"
          element={
            <ProtectedRoute>
              <AllCourses />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/pending"
          element={
            <ProtectedRoute role="admin">
              <AdminPendingCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:courseId/review"
          element={
            <ProtectedRoute role="admin">
              <AdminCourseReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute role="admin">
              <AdminCreateCategory />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;