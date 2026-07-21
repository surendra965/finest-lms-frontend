import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import {
  LuLayoutDashboard,
  LuBookOpen,
  LuLogOut,
  LuShieldCheck,
  LuChevronRight,
  LuCirclePlus,
  LuLayers,
  LuBookMarked,
} from "react-icons/lu";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview & analytics",
    icon: LuLayoutDashboard,
    path: "/admin",
    exact: true,
  },
  {
    id: "pending",
    label: "Course Reviews",
    description: "Approve or reject submissions",
    icon: LuBookOpen,
    path: "/admin/courses/pending",
  },
  {
    id: "create-course",
    label: "Create Course",
    description: "Publish a new course",
    icon: LuCirclePlus,
    path: "/instructor/create-course",
  },
  {
    id: "categories",
    label: "Categories",
    description: "Manage course categories",
    icon: LuLayers,
    path: "/admin/categories",
  },
];

// Map path prefixes → breadcrumb label
const PAGE_LABELS = {
  "/admin/courses/pending": "Course Review Queue",
  "/admin/courses": "Course Review",
  "/admin/categories": "Category Management",
  "/instructor/create-course": "Create Course",
  "/admin": "Dashboard",
};

const getPageLabel = (pathname) => {
  for (const [prefix, label] of Object.entries(PAGE_LABELS)) {
    if (pathname.startsWith(prefix)) return label;
  }
  return "Admin Panel";
};

const AdminLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/api/auth/login");
  };

  const initials = user
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase()
    : "";

  const pageLabel = getPageLabel(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-[#1c1d1f] text-white flex flex-col min-h-screen fixed top-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-[#a435f0] rounded-lg flex items-center justify-center">
              <LuShieldCheck size={16} className="text-white" />
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-white">CourseHub Admin</p>
              <p className="text-[10px] text-gray-400 font-medium">Control Panel</p>
            </div>
          </Link>
        </div>

        {/* Admin User Card */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white/20 overflow-hidden bg-purple-600 text-white font-bold text-xs">
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
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-purple-400 font-bold uppercase tracking-wide">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3">
            Management
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                  ${isActive
                    ? "bg-[#a435f0] text-white"
                    : "text-gray-300 hover:bg-white/8 hover:text-white"
                  }`}
              >
                <Icon size={18} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.label}</p>
                  <p className={`text-[11px] truncate ${isActive ? "text-purple-200" : "text-gray-500"}`}>
                    {item.description}
                  </p>
                </div>
                {isActive && <LuChevronRight size={14} className="text-purple-200 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 pb-5 border-t border-white/10 pt-4 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/8 hover:text-white transition text-sm font-medium"
          >
            <LuBookMarked size={16} />
            View Student Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-sm font-medium cursor-pointer"
          >
            <LuLogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-base font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500 mt-0.5">{pageLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full">
              <LuShieldCheck size={13} />
              Admin Access
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
