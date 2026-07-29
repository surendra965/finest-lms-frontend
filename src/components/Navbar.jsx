import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/authContext";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import { LuLogOut, LuTrash2, LuCheckCheck } from "react-icons/lu";
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

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  if (isNaN(diffMs) || diffMs < 0) return "Just now";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const NotificationMenu = ({ alignClass = "right-0" }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-gray-600 hover:text-purple-600 rounded-full hover:bg-gray-100 transition cursor-pointer flex items-center justify-center bg-transparent border-none focus:outline-none"
        title="Notifications"
      >
        <HiOutlineBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${alignClass} mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/70">
            <span className="font-bold text-gray-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  try {
                    markAllAsRead();
                  } catch (err) {
                    console.error("Mark all read failed:", err);
                  }
                }}
                className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-semibold cursor-pointer border-none bg-transparent focus:outline-none"
              >
                <LuCheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* Contents */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="p-3 bg-purple-50 rounded-full text-purple-500 mb-2">
                  <HiOutlineBell size={24} />
                </div>
                <p className="text-xs font-semibold text-gray-705">No notifications yet</p>
                <p className="text-[10px] text-gray-400 mt-0.5">We'll notify you when actions occur</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) {
                      try {
                        markAsRead(n._id);
                      } catch (err) {
                        console.error("Mark as read failed:", err);
                      }
                    }
                  }}
                  className={`group flex items-start gap-2.5 p-3 hover:bg-purple-50/20 transition cursor-pointer ${!n.isRead ? "bg-purple-50/10" : ""
                    }`}
                >
                  {/* Purple Dot for unread */}
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs break-words leading-relaxed ${!n.isRead ? "font-semibold text-gray-900" : "font-normal text-gray-600"}`}>
                      {n.message}
                    </p>
                    <span className="text-[9px] text-gray-400 font-medium block mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        deleteNotification(n._id);
                      } catch (err) {
                        console.error("Delete notification failed:", err);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer shrink-0 border-none bg-transparent focus:outline-none"
                    title="Delete notification"
                  >
                    <LuTrash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [showFindCourses, setShowFindCourses] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Search suggestion states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const dropdownRef = useRef();
  const searchRef = useRef();

  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recent searches:", e);
    }
  }, []);

  const removeRecentSearch = (term) => {
    const updated = recentSearches.filter((t) => t !== term);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.setItem("recentSearches", JSON.stringify([]));
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGuestLink = (anchorId) => {
    setMobileMenuOpen(false);
    if (window.location.pathname === "/") {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${anchorId}`);
    }
  };

  // Fetch search suggestions from API when search field query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/courses/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`
        );
        const result = await res.json();
        if (res.ok) {
          setSuggestions(result.data || []);
        }
      } catch (err) {
        console.error("Suggestions retrieval failed:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/categories`,
        );
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

  const displayCategories =
    categories.length > 0
      ? categories
      : [
        { _id: "development", name: "Development", slug: "development" },
        { _id: "business", name: "Business", slug: "business" },
        {
          _id: "it-and-software",
          name: "IT & Software",
          slug: "it-and-software",
        },
        { _id: "design", name: "Design", slug: "design" },
        { _id: "marketing", name: "Marketing", slug: "marketing" },
        { _id: "photography", name: "Photography", slug: "photography" },
        {
          _id: "health-and-fitness",
          name: "Health & Fitness",
          slug: "health-and-fitness",
        },
        { _id: "music", name: "Music", slug: "music" },
      ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerSearch = () => {
    if (searchQuery.trim()) {
      const term = searchQuery.trim();
      const updated = [term, ...recentSearches.filter((t) => t !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      navigate(`/courses?search=${encodeURIComponent(term)}`);
      setMobileSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  if (!user) {
    return (
      <>
        <div className={`sticky top-0 z-50 transition-all duration-300 flex items-center justify-between px-4 md:px-6 py-3.5 ${isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50"
          : "bg-white border-b border-gray-100"
          }`}>
          {/* LEFT SECTION (Logo) */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1 text-gray-700 hover:text-[#A259FF] focus:outline-none cursor-pointer"
              aria-label="Open Menu"
            >
              <HiOutlineMenu size={24} />
            </button>

            <Link to="/" className="flex items-center gap-2 select-none">
              <span className="w-8 h-8 rounded-lg bg-[#A259FF] flex items-center justify-center text-white text-base font-black shrink-0 shadow-md shadow-purple-200">
                F
              </span>
              <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                Fine Course Mart
              </h1>
            </Link>
          </div>

          {/* CENTER SECTION (Nav Links) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-black text-gray-500 uppercase tracking-wider">
            <Link
              to="/"
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="hover:text-[#A259FF] transition duration-150"
            >
              Home
            </Link>
            <button onClick={() => handleGuestLink("trending-courses")} className="hover:text-[#A259FF] transition duration-150 cursor-pointer bg-transparent border-none font-black text-xs uppercase tracking-wider">Courses</button>
            <button onClick={() => handleGuestLink("learning-categories")} className="hover:text-[#A259FF] transition duration-150 cursor-pointer bg-transparent border-none font-black text-xs uppercase tracking-wider">Categories</button>
            <button onClick={() => handleGuestLink("featured-instructors")} className="hover:text-[#A259FF] transition duration-150 cursor-pointer bg-transparent border-none font-black text-xs uppercase tracking-wider">Instructors</button>
            <button onClick={() => handleGuestLink("about")} className="hover:text-[#A259FF] transition duration-150 cursor-pointer bg-transparent border-none font-black text-xs uppercase tracking-wider">About</button>
          </nav>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4">
            {/* Search inputs */}
            <div ref={searchRef} className="hidden lg:relative lg:flex flex-col items-center w-40 xl:w-56 z-55">
              <div className="flex items-center w-full border border-gray-200 rounded-full px-3 py-1.5 bg-gray-50 hover:bg-white hover:border-purple-300 transition-all select-none">
                <HiOutlineSearch
                  size={16}
                  className="text-gray-500 cursor-pointer shrink-0"
                  onClick={triggerSearch}
                />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
                  className="w-full bg-transparent outline-none text-xs ml-2 text-gray-700 placeholder-gray-400 font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
                  >
                    <HiOutlineX size={14} />
                  </button>
                )}
              </div>

              {/* Suggestions popover */}
              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-55 overflow-hidden max-h-96 overflow-y-auto">
                  {searchQuery.trim() ? (
                    suggestionsLoading ? (
                      <div className="flex items-center gap-2 p-4 text-xs text-gray-500 justify-center">
                        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#A259FF] rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="p-4 text-xs text-gray-500 text-center">
                        No matches found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {suggestions.map((course) => (
                          <button
                            key={course._id}
                            onClick={() => {
                              setShowSuggestions(false);
                              setSearchQuery("");
                              navigate(`/api/public/courses/${course._id}`);
                            }}
                            className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-purple-50/40 transition cursor-pointer border-none bg-transparent"
                          >
                            <img
                              src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80"}
                              alt={course.title}
                              className="w-10 h-7 object-cover rounded bg-slate-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-800 truncate">{course.title}</p>
                              <p className="text-[9px] text-gray-400 truncate">
                                By {course.instructorId?.userId?.firstName || "Instructor"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="p-4 bg-white text-xs text-gray-400 text-center font-medium italic">
                      Type to search course catalogue
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/api/auth/login"
              className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition duration-150"
            >
              Login
            </Link>
            <Link
              to="/api/auth/register"
              className="px-4 py-2 bg-[#A259FF] text-white text-xs font-bold rounded-xl hover:bg-[#8e45ec] shadow-lg shadow-purple-100 transition duration-150"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Mobile Menu Drawer for Guests */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white p-6 shadow-2xl transition duration-300 lg:hidden flex flex-col justify-between overflow-y-auto block">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                  <h2 className="text-base font-black text-gray-900">Fine Course Mart</h2>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-gray-450 hover:text-gray-700 font-bold p-1">
                    <HiOutlineX size={20} />
                  </button>
                </div>

                <nav className="flex flex-col gap-2 pt-2 text-sm font-extrabold text-gray-650">
                  <Link
                    to="/"
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (window.location.pathname === "/") {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-[#A259FF] transition"
                  >
                    Home
                  </Link>
                  <button onClick={() => handleGuestLink("trending-courses")} className="text-left px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-[#A259FF] transition cursor-pointer bg-transparent border-none font-extrabold text-sm text-gray-650">Courses</button>
                  <button onClick={() => handleGuestLink("learning-categories")} className="text-left px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-[#A259FF] transition cursor-pointer bg-transparent border-none font-extrabold text-sm text-gray-650">Categories</button>
                  <button onClick={() => handleGuestLink("featured-instructors")} className="text-left px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-[#A259FF] transition cursor-pointer bg-transparent border-none font-extrabold text-sm text-gray-650">Instructors</button>
                  <button onClick={() => handleGuestLink("about")} className="text-left px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-[#A259FF] transition cursor-pointer bg-transparent border-none font-extrabold text-sm text-gray-655 font-sans">About</button>
                </nav>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 select-none">
                <Link to="/api/auth/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl">
                  Login
                </Link>
                <Link to="/api/auth/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 bg-[#A259FF] text-white text-xs font-bold hover:bg-[#8e45ec] rounded-xl shadow-md">
                  Sign Up
                </Link>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <div className={`sticky top-0 z-40 transition-all duration-300 flex items-center justify-between px-4 md:px-6 py-3.5 ${isScrolled
        ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50"
        : "bg-white border-b border-gray-100"
        }`}>
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

          <Link to="/" className="flex items-center gap-2 select-none">
            <span className="w-8 h-8 rounded-lg bg-[#A259FF] flex items-center justify-center text-white text-base font-black shrink-0 shadow-md shadow-purple-200">
              F
            </span>
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
              Fine Course Mart
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
                className={`transition-transform duration-200 ${showFindCourses
                  ? "rotate-180 text-purple-600"
                  : "text-gray-500"
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

        {/* SEARCH BAR & AUTOCOMPLETE PLAY (Desktop Only) */}
        <div ref={searchRef} className="hidden lg:relative lg:flex flex-col items-center w-[20%] xl:w-[25%] z-50">
          <div className="flex items-center w-full border border-gray-200 rounded-full px-4 py-2 bg-gray-50 hover:bg-white hover:border-purple-300 transition-all">
            <HiOutlineSearch
              size={18}
              className="text-gray-500 cursor-pointer shrink-0"
              onClick={triggerSearch}
            />
            <input
              type="text"
              placeholder="Search for anything"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
              className="w-full bg-transparent outline-none text-sm ml-2 text-gray-700 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                }}
                className="text-gray-450 hover:text-gray-600 border-none bg-transparent cursor-pointer"
              >
                <HiOutlineX size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete suggestion popover list */}
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-55 overflow-hidden max-h-96 overflow-y-auto duration-200">
              {searchQuery.trim() ? (
                suggestionsLoading ? (
                  <div className="flex items-center gap-2 p-4 text-xs text-gray-550 justify-center">
                    <span className="w-3.5 h-3.5 border-2 border-slate-350 border-t-purple-600 rounded-full animate-spin" />
                    Loading suggestions...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    No courses match "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {suggestions.map((course) => (
                      <button
                        key={course._id}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchQuery("");
                          navigate(`/api/public/courses/${course._id}`);
                        }}
                        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-purple-50/40 transition cursor-pointer border-none bg-transparent"
                      >
                        <img
                          src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80"}
                          alt={course.title}
                          className="w-12 h-8 object-cover rounded-lg bg-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{course.title}</p>
                          <p className="text-[10px] text-gray-505 mt-0.5 capitalize">
                            {course.categoryId?.name || "Category"} • By {course.instructorId?.userId?.firstName || "Fine Course Mart"} {course.instructorId?.userId?.lastName || "Instructor"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-extrabold text-purple-750">
                            {course.discountPrice > 0 ? `₹${course.discountPrice}` : (course.price > 0 ? `₹${course.price}` : "Free")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="p-4 bg-white">
                  {/* Recent Searches */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-50">
                      <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                        Recent Searches
                      </span>
                      {recentSearches.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearRecentSearches();
                          }}
                          className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 cursor-pointer bg-transparent border-none outline-none"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {recentSearches.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-1 px-1">No recent searches</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {recentSearches.map((term, index) => (
                          <div key={index} className="flex items-center bg-gray-50 border border-gray-100 hover:border-purple-200 rounded-full px-3 py-1 transition-all duration-200">
                            <button
                              onClick={() => {
                                setSearchQuery(term);
                                navigate(`/courses?search=${encodeURIComponent(term)}`);
                                setShowSuggestions(false);
                              }}
                              className="text-xs font-medium text-gray-700 hover:text-purple-600 bg-transparent border-none cursor-pointer outline-none mr-1.5 flex items-center gap-1"
                            >
                              <span className="text-[10px] text-gray-400">🕒</span>
                              {term}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecentSearch(term);
                              }}
                              className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer text-[10px] leading-none p-0 focus:outline-none"
                              title="Delete search"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trending Searches */}
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                      🔥 Trending Searches
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {["React", "Javascript", "Python", "Data Science", "Figma", "Web Development"].map((trend) => (
                        <button
                          key={trend}
                          onClick={() => {
                            setSearchQuery(trend);
                            const updated = [trend, ...recentSearches.filter(t => t !== trend)].slice(0, 5);
                            setRecentSearches(updated);
                            localStorage.setItem("recentSearches", JSON.stringify(updated));
                            navigate(`/courses?search=${encodeURIComponent(trend)}`);
                            setShowSuggestions(false);
                          }}
                          className="text-xs font-semibold text-purple-650 bg-purple-50 hover:bg-purple-100 border border-purple-100 hover:border-purple-200 rounded-full px-3 py-1 transition duration-150 cursor-pointer outline-none"
                        >
                          {trend}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SECTION (Desktop Actions & Mobile Icons) */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Desktop Right Links */}
          {user && (
            <div className="hidden lg:flex items-center gap-5 xl:gap-6">
              {/* ROLE BASED BUTTON */}
              {user?.role === "admin" ? (
                <div
                  className="relative py-2"
                  onMouseEnter={() => setShowAdminMenu(true)}
                  onMouseLeave={() => setShowAdminMenu(false)}
                >
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-1.5 text-sm xl:text-base font-semibold text-white bg-[#a435f0] hover:bg-[#8710d8] px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Admin Panel
                    <HiOutlineChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${showAdminMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showAdminMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-55 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <span className="font-semibold text-slate-800">Admin Dashboard</span>
                      </Link>
                      <Link
                        to="/admin/courses/pending"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <span className="font-semibold text-slate-800">Course Reviews</span>
                      </Link>
                      <Link
                        to="/admin/categories"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <span className="font-semibold text-slate-800">Manage Categories</span>
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link
                        to="/instructor/home"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <span className="font-semibold text-slate-800">My Courses</span>
                      </Link>
                      <Link
                        to="/instructor/create-course"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <span className="font-semibold text-slate-800">Create Course</span>
                      </Link>
                    </div>
                  )}
                </div>
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
                onClick={() => navigate("/all-courses")}
                className="text-sm xl:text-base font-semibold text-gray-700 hover:text-purple-600 cursor-pointer"
              >
                All Courses
              </button>

              {user?.role === "student" && (
                <button
                  onClick={() => navigate("/learning")}
                  className="text-sm xl:text-base font-semibold text-gray-700 hover:text-purple-600 cursor-pointer"
                >
                  My Learning
                </button>
              )}

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
              <NotificationMenu alignClass="right-0" />
            </div>
          )}

          {/* Desktop Profile / Login button */}
          <div className="hidden lg:block">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setOpen(!open)}
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border border-purple-200 overflow-hidden bg-purple-600 text-white font-bold text-sm"
                >
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

                {open && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5">
                    <div className="px-4 py-2 border-b border-gray-50 text-sm font-semibold text-gray-700">
                      {user.firstName} {user.lastName}
                      <p className="text-[11px] text-purple-600 font-medium capitalize mt-0.5">
                        {user.role}
                      </p>
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
                        navigate("/");
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

            {user && (
              <NotificationMenu alignClass="-right-16" />
            )}

            {/* Mobile Menu Trigger Avatar */}
            {user ? (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-8 h-8 rounded-full border border-purple-200 overflow-hidden cursor-pointer flex items-center justify-center bg-purple-600 text-white font-bold text-xs"
                aria-label="Open User Menu"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
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
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 select-none">
                  <span className="w-8 h-8 rounded-lg bg-[#A259FF] flex items-center justify-center text-white text-base font-black shrink-0">
                    F
                  </span>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    Fine Course Mart
                  </h2>
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
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 border-purple-200 overflow-hidden bg-purple-600 text-white font-bold text-sm">
                    {user.avatar ? (
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
                      <div className="space-y-1">
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#a435f0] hover:bg-[#8710d8] transition mb-2"
                        >
                          Admin Panel
                        </Link>
                        <div className="pl-3 space-y-1.5">
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Admin Dashboard
                          </Link>
                          <Link
                            to="/admin/courses/pending"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Course Reviews
                          </Link>
                          <Link
                            to="/admin/categories"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Manage Categories
                          </Link>
                          <Link
                            to="/instructor/home"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            My Courses
                          </Link>
                          <Link
                            to="/instructor/create-course"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Create Course
                          </Link>
                        </div>
                      </div>
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
                      to="/all-courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                    >
                      All Courses
                    </Link>

                    {user?.role === "student" && (
                      <Link
                        to="/learning"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                      >
                        My Learning
                      </Link>
                    )}
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
                    navigate("/");
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
