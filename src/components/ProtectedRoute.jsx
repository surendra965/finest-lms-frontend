import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  /* =========================
     NOT LOGGED IN
  ========================= */
  if (!user) {
    return (
      <Navigate
        to="/api/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  /* =========================
     ROLE BASED ACCESS
  ========================= */
  if (role && user.role !== role) {
    if (user.role === "admin" && role === "instructor") {
      // Admins are allowed to access instructor routes (e.g. creating courses)
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;