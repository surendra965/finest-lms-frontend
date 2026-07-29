import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiOutlineChevronRight,
  HiOutlineAcademicCap,
  HiOutlineFilter,
  HiOutlineSortDescending,
  HiOutlineRefresh,
  HiOutlineX,
} from "react-icons/hi";
import { AiFillStar } from "react-icons/ai";
import CourseCard from "../components/CourseCard";

const API_URL = import.meta.env.VITE_API_URL;

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

const CategoryCourses = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ total: 0, currentPage: 1, pageSize: 10, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Local state for price inputs
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const sortDropdownRef = useRef(null);

  // Sync inputs with URL params
  useEffect(() => {
    setMinPriceInput(searchParams.get("minPrice") || "");
    setMaxPriceInput(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  // Click outside to close sort dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Fetch categories ── */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        if (res.ok) {
          setCategories(data.data || []);
        }
      } catch {
        /* silent */
      }
    };
    fetchCategories();
  }, []);

  // Resolve active category
  const activeCategory = useMemo(() => {
    if (!categories.length) return null;
    if (slug) {
      return (
        categories.find(
          (cat) =>
            (cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-")) === slug
        ) || null
      );
    }
    const catQuery = searchParams.get("category");
    if (catQuery) {
      return (
        categories.find(
          (cat) => cat._id === catQuery || cat.slug === catQuery
        ) || null
      );
    }
    return null;
  }, [categories, slug, searchParams]);

  /* ── Fetch courses from backend based on filters ── */
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const queryParams = new URLSearchParams();

        // 1. Search term
        const search = searchParams.get("search");
        if (search) queryParams.set("search", search);

        // 2. Category
        if (activeCategory?._id) {
          queryParams.set("category", activeCategory._id);
        } else {
          const categoryParam = searchParams.get("category");
          if (categoryParam) queryParams.set("category", categoryParam);
        }

        // 3. Level
        const level = searchParams.get("level");
        if (level) queryParams.set("level", level);

        // 4. Language
        const language = searchParams.get("language");
        if (language) queryParams.set("language", language);

        // 5. Rating
        const rating = searchParams.get("rating");
        if (rating) queryParams.set("rating", rating);

        // 6. Price Type
        const priceType = searchParams.get("priceType");
        if (priceType) queryParams.set("priceType", priceType);

        // 7. Price Range
        const minPrice = searchParams.get("minPrice");
        if (minPrice) queryParams.set("minPrice", minPrice);
        const maxPrice = searchParams.get("maxPrice");
        if (maxPrice) queryParams.set("maxPrice", maxPrice);

        // 8. Sorting
        const sort = searchParams.get("sort") || "relevance";
        queryParams.set("sort", sort);

        // 9. Pagination
        const page = searchParams.get("page") || "1";
        queryParams.set("page", page);
        const limit = searchParams.get("limit") || "12";
        queryParams.set("limit", limit);

        const url = `${API_URL}/api/public/courses?${queryParams.toString()}`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setCourses(data?.courses || []);
          setPagination(data?.pagination || { total: 0, currentPage: 1, pageSize: 12, totalPages: 1 });
        } else {
          setError(data.message || "Failed to load courses");
          setCourses([]);
          setPagination({ total: 0, currentPage: 1, pageSize: 12, totalPages: 1 });
        }
      } catch (err) {
        setError("Unable to connect to the server.");
        setCourses([]);
        setPagination({ total: 0, currentPage: 1, pageSize: 12, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    };

    // If there is a slug, wait for categories to load so we don't fetch without activeCategory._id
    if (categories.length || !slug) {
      fetchCourses();
    }
  }, [activeCategory, searchParams, categories.length, slug]);

  // Update query parameters
  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // reset page on filter change
    if (key !== "page") {
      newParams.delete("page");
    }
    setSearchParams(newParams);
  };

  const applyPriceRange = () => {
    const newParams = new URLSearchParams(searchParams);
    if (minPriceInput) {
      newParams.set("minPrice", minPriceInput);
    } else {
      newParams.delete("minPrice");
    }
    if (maxPriceInput) {
      newParams.set("maxPrice", maxPriceInput);
    } else {
      newParams.delete("maxPrice");
    }
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) newParams.set("search", search);
    // Preserving category query parameter if not on category slug page
    const category = searchParams.get("category");
    if (category) newParams.set("category", category);
    setSearchParams(newParams);
  };

  const hasFiltersApplied = [
    "level",
    "language",
    "rating",
    "priceType",
    "minPrice",
    "maxPrice",
  ].some((key) => searchParams.has(key));

  const total = pagination.total || 0;
  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.currentPage || 1;

  const currentSort = searchParams.get("sort") || "relevance";
  const activeSortLabel = sortOptions.find(o => o.value === currentSort)?.label || "Relevance";

  return (
    <div className="min-h-screen bg-[#f7f9fa]">
      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-700 to-purple-500 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-3xl -ml-20 -mb-20"></div>

        <div className="max-w-[1340px] mx-auto px-6 py-5 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <HiOutlineChevronRight size={14} />
            <Link to="/courses" className="hover:text-white transition">Courses</Link>
            {activeCategory && (
              <>
                <HiOutlineChevronRight size={14} />
                <span className="text-white font-medium">{activeCategory.name}</span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-md bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/20 backdrop-blur-md">
              <HiOutlineAcademicCap size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-tight">
                {searchParams.get("search") ? (
                  <>
                    Search results for <span className="text-purple-400">"{searchParams.get("search")}"</span>
                    {activeCategory && ` in ${activeCategory.name}`}
                  </>
                ) : activeCategory ? (
                  activeCategory.name
                ) : (
                  "All Courses"
                )}
              </h1>
              <p className="text-gray-300 mt-1 text-xs max-w-2xl leading-relaxed">
                {activeCategory?.description ||
                  (searchParams.get("search")
                    ? `Found ${total} course${total !== 1 ? "s" : ""} matching your search criteria.`
                    : "Expand your career horizons with high-quality online courses and tutorials designed by top instructors.")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ CATEGORY CHIPS ═══════════════ */}
      <div className="bg-white border-b border-gray-400 shadow-sm shadow-gray-100/50">
        <div className="max-w-[1340px] mx-auto px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1" style={{ scrollbarWidth: "none" }}>
            <Link
              to="/courses"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("category");
                setSearchParams(newParams);
              }}
              className={`shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-200 ${!slug && !searchParams.get("category")
                ? "border-b border-purple-600 text-purple-600"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              All Courses
            </Link>
            {categories.map((cat) => {
              const catSlug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-");
              const isActive = catSlug === slug || searchParams.get("category") === cat._id;
              return (
                <Link
                  key={cat._id}
                  to={`/courses/${catSlug}`}
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("category");
                    setSearchParams(newParams);
                  }}
                  className={`shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-200 ${isActive
                    ? "border-b border-purple-600 text-purple-600"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="max-w-[1340px] mx-auto px-6 py-2">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4 p-2 relative z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${hasFiltersApplied
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
            >
              <HiOutlineFilter size={18} />
              Filter
              {hasFiltersApplied && (
                <span className="ml-1 w-5 h-5 bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>

            <span className="text-sm text-gray-800">
              Showing <strong className="text-gray-900">{courses.length}</strong> of{" "}
              <strong className="text-gray-900">{total}</strong> results
            </span>
          </div>

          {/* Sorted Dropdown Selector */}
          <div className="relative select-none" ref={sortDropdownRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 w-45 px-4 py-2.5 border text-sm font-semibold rounded-lg bg-white border-gray-200 hover:border-purple-300 transition-all cursor-pointer font-semibold text-gray-700 shadow-sm"
            >
              <HiOutlineSortDescending size={18} className="text-gray-700" />
              <span>{activeSortLabel}</span>
            </button>

            {sortOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateParam("sort", opt.value);
                      setSortOpen(false);
                    }}
                    className={`flex items-center justify-between w-full text-left px-4 py-2 text-xs font-bold leading-normal transition-colors cursor-pointer ${currentSort === opt.value
                      ? "bg-purple-50 text-purple-600 font-extrabold"
                      : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <span>{opt.label}</span>
                    {currentSort === opt.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8 items-start relative pb-10">
          {/* ── COURSE GRID / CONTENT ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm p-4 space-y-3">
                    <div className="aspect-video bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4 mt-4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-16 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Failed to load courses
                </h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-purple-200 cursor-pointer"
                >
                  Reset All Settings
                </button>
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12 pb-6">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => updateParam("page", currentPage - 1)}
                      className="px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white text-sm font-semibold text-gray-700 transition cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => updateParam("page", p)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition cursor-pointer ${currentPage === p
                          ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                          : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => updateParam("page", currentPage + 1)}
                      className="px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white text-sm font-semibold text-gray-700 transition cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto px-6">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-500 mb-6">
                  We couldn't find any courses matching your selection. Try clearing some filters or tweaking your search phrase.
                </p>
                {hasFiltersApplied ? (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-purple-200 cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <Link
                    to="/courses"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-purple-200 inline-block"
                  >
                    Browse All Courses
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FILTER POPUP MODAL ── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur Backdrop */}
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-xs transition-opacity"
            onClick={() => setShowFilters(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg hover:bg-gray-50 transition"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* Scrollable Filters Block */}
            <div className="p-5 space-y-6 overflow-y-auto flex-1 select-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Level Filter */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Course Level</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "", label: "All Levels" },
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ].map((lvl) => (
                    <label
                      key={lvl.value}
                      className={`flex items-center justify-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer text-xs font-semibold transition-all ${(searchParams.get("level") || "") === lvl.value
                        ? "border-purple-600 text-purple-700 font-extrabold"
                        : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="level"
                        checked={(searchParams.get("level") || "") === lvl.value}
                        onChange={() => updateParam("level", lvl.value)}
                        className="hidden"
                      />
                      <span>{lvl.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Type */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Pricing Type</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "", label: "All" },
                    { value: "free", label: "Free" },
                    { value: "paid", label: "Paid" },
                  ].map((prc) => (
                    <label
                      key={prc.value}
                      className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer text-xs font-semibold transition-all ${(searchParams.get("priceType") || "") === prc.value
                        ? "border-purple-600 text-purple-600 font-extrabold"
                        : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="priceType"
                        checked={(searchParams.get("priceType") || "") === prc.value}
                        onChange={() => updateParam("priceType", prc.value)}
                        className="hidden"
                      />
                      <span>{prc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Price Range (₹)</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-1/2 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-1/2 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>
                <button
                  onClick={applyPriceRange}
                  className="w-full text-xs font-bold bg-[#A259FF] hover:bg-[#8e45ec] text-white py-2 rounded-lg transition cursor-pointer"
                >
                  Apply range limits
                </button>
              </div>

              {/* Rating Filter */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Ratings</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={!searchParams.has("rating")}
                      onChange={() => updateParam("rating", "")}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 group-hover:text-purple-600 font-bold transition">
                      All Ratings
                    </span>
                  </label>
                  {["4.5", "4.0", "3.5", "3.0"].map((rt) => (
                    <label key={rt} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="rating"
                        checked={searchParams.get("rating") === rt}
                        onChange={() => updateParam("rating", rt)}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                      <span className="text-xs text-gray-750 group-hover:text-purple-600 transition font-bold flex items-center gap-1.5">
                        {rt} & up
                        <AiFillStar className="text-amber-400 inline" size={14} />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language Filter */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Language</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "", label: "All Languages" },
                    { value: "English", label: "English" },
                    { value: "Spanish", label: "Spanish" },
                    { value: "Hindi", label: "Hindi" },
                    { value: "French", label: "French" },
                  ].map((lang) => (
                    <label
                      key={lang.value}
                      className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer text-xs font-semibold transition-all ${(searchParams.get("language") || "") === lang.value
                        ? "border-purple-600 text-purple-600 font-extrabold"
                        : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="language"
                        checked={(searchParams.get("language") || "") === lang.value}
                        onChange={() => updateParam("language", lang.value)}
                        className="hidden"
                      />
                      <span>{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50">
              <button
                onClick={() => {
                  clearAllFilters();
                  setShowFilters(false);
                }}
                className="flex-1 py-2.5 border border-purple-200 text-purple-700 hover:bg-purple-100/50 bg-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCourses;
