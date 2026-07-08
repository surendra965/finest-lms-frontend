import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/authContext";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { LuLogOut } from "react-icons/lu";
import { CgProfile } from "react-icons/cg";
import { AiOutlineShoppingCart } from "react-icons/ai";
import {
  HiOutlineSearch,
  HiOutlineHeart,
  HiOutlineBell,
  HiOutlineChevronDown,
  HiOutlineCode,
  HiOutlineDesktopComputer,
  HiOutlineTrendingUp,
  HiOutlineColorSwatch,
  HiOutlineChartBar,
  HiOutlineCamera,
  HiOutlineMusicNote,
  HiOutlineAcademicCap,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";

const getCategoryIcon = (slug) => {
  switch (slug) {
    case "development":
    case "web-development":
      return HiOutlineCode;
    case "business":
      return HiOutlineTrendingUp;
    case "it-and-software":
      return HiOutlineDesktopComputer;
    case "design":
      return HiOutlineColorSwatch;
    case "marketing":
      return HiOutlineChartBar;
    case "photography":
      return HiOutlineCamera;
    case "health-and-fitness":
      return HiOutlineHeart;
    case "music":
      return HiOutlineMusicNote;
    default:
      return HiOutlineAcademicCap;
  }
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [showFindCourses, setShowFindCourses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const dropdownRef = useRef();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
        const data = await res.json();
        if (res.ok) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories in Navbar:", err);
      }
    };
    fetchCategories();
  }, []);

  const displayCategories = categories.length > 0 ? categories : [
    { _id: "development", name: "Development", slug: "development" },
    { _id: "business", name: "Business", slug: "business" },
    { _id: "it-and-software", name: "IT & Software", slug: "it-and-software" },
    { _id: "design", name: "Design", slug: "design" },
    { _id: "marketing", name: "Marketing", slug: "marketing" },
    { _id: "photography", name: "Photography", slug: "photography" },
    { _id: "health-and-fitness", name: "Health & Fitness", slug: "health-and-fitness" },
    { _id: "music", name: "Music", slug: "music" }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <div className="relative z-40 flex items-center justify-between px-4 md:px-6 py-3.5 shadow-sm bg-white border-b border-gray-100">
        
        {/* LEFT SECTION (Logo & Find Courses) */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Hamburger Menu (Mobile Only) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-1 text-gray-700 hover:text-purple-600 focus:outline-none cursor-pointer"
            aria-label="Open Menu"
          >
            <HiOutlineMenu size={24} />
          </button>

          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-purple-600 cursor-pointer tracking-tight">
              LMS
            </h1>
          </Link>

          {/* Find Courses Hover Dropdown (Desktop Only) */}
          <div
            className="hidden lg:relative lg:block py-2"
            onMouseEnter={() => setShowFindCourses(true)}
            onMouseLeave={() => setShowFindCourses(false)}
          >
            <button className="flex items-center gap-1 text-sm lg:text-base font-semibold cursor-pointer hover:text-purple-600 focus:outline-none bg-transparent border-none">
              Find Courses
              <HiOutlineChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  showFindCourses ? "rotate-180 text-purple-600" : "text-gray-500"
                }`}
              />
            </button>

            {showFindCourses && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {displayCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.slug);
                  return (
                    <Link
                      key={cat._id || cat.slug}
                      to={`/courses/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-")}`}
                      className="group flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      onClick={() => setShowFindCourses(false)}
                    >
                      <Icon
                        size={18}
                        className="text-gray-400 group-hover:text-purple-600 transition-colors"
                      />
                      <span className="font-medium">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SEARCH BAR (Desktop Only) */}
        <div className="hidden lg:flex items-center w-[35%] xl:w-[45%] border border-gray-200 rounded-full px-4 py-2 bg-gray-50 hover:bg-white hover:border-purple-300 transition-all">
          <HiOutlineSearch size={18} className="text-gray-500 cursor-pointer" onClick={triggerSearch} />
          <input
            type="text"
            placeholder="Search for anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
            className="w-full bg-transparent outline-none text-sm ml-2 text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* RIGHT SECTION (Desktop Actions & Mobile Icons) */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Desktop Right Links */}
          {user && (
            <div className="hidden lg:flex items-center gap-5 xl:gap-6">
              {/* ROLE BASED BUTTON */}
              {user?.role === "admin" ? (
                <button
                  onClick={() => navigate("/admin")}
                  className="text-sm xl:text-base font-semibold text-white bg-[#a435f0] hover:bg-[#8710d8] px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Admin Panel
                </button>
              ) : user?.role === "instructor" ? (
                <button
                  onClick={() => navigate("/instructor/home")}
                  className="text-sm xl:text-base font-semibold text-gray-700 hover:text-purple-600 cursor-pointer"
                >
                  Instructor
                </button>
              ) : (
                <button
                  onClick={() => navigate("/api/instructors/become-instructor")}
                  className="text-sm xl:text-base font-semibold text-gray-700 hover:text-purple-600 cursor-pointer"
                >
                  Become Instructor
                </button>
              )}

              <button
                onClick={() => navigate("/learning")}
                className="text-sm xl:text-base font-semibold text-gray-700 hover:text-purple-600 cursor-pointer"
              >
                My Learning
              </button>

              <HiOutlineHeart size={20} className="cursor-pointer text-gray-600 hover:text-purple-600 transition" />
              
              {user?.role === "student" && (
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="relative flex items-center gap-2 text-gray-600 hover:text-purple-600 cursor-pointer"
                  title="Cart"
                >
                  <AiOutlineShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              <HiOutlineBell size={20} className="cursor-pointer text-gray-600 hover:text-purple-600 transition" />
            </div>
          )}

          {/* Desktop Profile / Login button */}
          <div className="hidden lg:block">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setOpen(!open)}
                  className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center cursor-pointer border border-purple-200 overflow-hidden"
                >
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>

                {open && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5">
                    <div className="px-4 py-2 border-b border-gray-50 text-sm font-semibold text-gray-700">
                      {user.firstName} {user.lastName}
                      <p className="text-[11px] text-purple-600 font-medium capitalize mt-0.5">{user.role}</p>
                    </div>

                    <button
                      onClick={() => {
                        navigate("/api/users/profile");
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer"
                    >
                      <CgProfile size={16} /> My Profile
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        navigate("/api/auth/login");
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <LuLogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/api/auth/login"
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  Login
                </Link>

                <Link
                  to="/api/auth/register"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 shadow-md shadow-purple-200 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE ONLY ICONS */}
          <div className="flex lg:hidden items-center gap-3.5">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-1 text-gray-600 hover:text-purple-600 focus:outline-none cursor-pointer"
              aria-label="Toggle Search"
            >
              <HiOutlineSearch size={22} />
            </button>

            {/* Mobile Cart */}
            {(!user || user?.role === "student") && (
              <Link
                to="/cart"
                className="relative p-1 text-gray-600 hover:text-purple-600 transition"
                aria-label="Shopping Cart"
              >
                <AiOutlineShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Menu Trigger Avatar */}
            {user ? (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-8 h-8 rounded-full border border-purple-200 overflow-hidden cursor-pointer"
                aria-label="Open User Menu"
              >
                <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
              </button>
            ) : (
              <Link
                to="/api/auth/login"
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Login
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* MOBILE SEARCH EXPANSION */}
      {mobileSearchOpen && (
        <div className="lg:hidden p-3 bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-white">
            <HiOutlineSearch size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search for courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <HiOutlineX size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* MOBILE DRAWER SIDE MENU */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Side Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 shadow-2xl transition-transform duration-300 lg:hidden flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <h2 className="text-xl font-bold text-purple-600 tracking-tight">LMS Catalog</h2>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
                >
                  <HiOutlineX size={24} />
                </button>
              </div>

              {/* User Identity Info */}
              {user ? (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl">
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-purple-200"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-purple-600 font-semibold uppercase tracking-wider">
                      {user.role}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 pb-2">
                  <Link
                    to="/api/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-center text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/api/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-center text-xs font-bold hover:bg-purple-700"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Menu Links */}
              <nav className="flex flex-col gap-1 pt-2">
                {user && (
                  <>
                    {user.role === "admin" ? (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#a435f0] hover:bg-[#8710d8] transition"
                      >
                        Admin Panel
                      </Link>
                    ) : user.role === "instructor" ? (
                      <Link
                        to="/instructor/home"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                      >
                        Instructor Home
                      </Link>
                    ) : (
                      <Link
                        to="/api/instructors/become-instructor"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                      >
                        Become Instructor
                      </Link>
                    )}

                    <Link
                      to="/learning"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                    >
                      My Learning
                    </Link>
                  </>
                )}

                {/* Categories List */}
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                    Browse Categories
                  </p>
                  <div className="flex flex-col max-h-60 overflow-y-auto pr-1">
                    {displayCategories.map((cat) => (
                      <Link
                        key={cat._id || cat.slug}
                        to={`/courses/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>
            </div>

            {/* Bottom Actions */}
            {user && (
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-1.5">
                <Link
                  to="/api/users/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                >
                  <CgProfile size={18} />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate("/api/auth/login");
                  }}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LuLogOut size={18} />
                  Logout
                </button>
              </div>
            )}

          </div>
        </>
      )}
    </>
  );
};

export default Navbar;