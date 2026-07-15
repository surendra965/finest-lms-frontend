import { useEffect, useMemo, useState } from "react";
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
import { AiFillStar, AiOutlineClockCircle, AiOutlineBook, AiOutlineBarChart, AiOutlineGlobal } from "react-icons/ai";
import { BsFillPlayFill } from "react-icons/bs";

const API_URL = import.meta.env.VITE_API_URL;

const CategoryCourses = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ total: 0, currentPage: 1, pageSize: 10, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(true);

  // Local state for price inputs
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  // Sync inputs with URL params
  useEffect(() => {
    setMinPriceInput(searchParams.get("minPrice") || "");
    setMaxPriceInput(searchParams.get("maxPrice") || "");
  }, [searchParams]);

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
        const limit = searchParams.get("limit") || "10";
        queryParams.set("limit", limit);

        const url = `${API_URL}/api/public/courses?${queryParams.toString()}`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setCourses(data?.courses || []);
          setPagination(data?.pagination || { total: 0, currentPage: 1, pageSize: 10, totalPages: 1 });
        } else {
          setError(data.message || "Failed to load courses");
          setCourses([]);
          setPagination({ total: 0, currentPage: 1, pageSize: 10, totalPages: 1 });
        }
      } catch (err) {
        setError("Unable to connect to the server.");
        setCourses([]);
        setPagination({ total: 0, currentPage: 1, pageSize: 10, totalPages: 1 });
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
    // Preserving category slug or category parameter
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
    "category",
  ].some((key) => {
    if (key === "category" && slug) return false; // slug route doesn't count as query filter
    return searchParams.has(key);
  });

  const total = pagination.total || 0;
  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.currentPage || 1;

  return (
    <div className="min-h-screen">
      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-purple-950 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="max-w-[1340px] mx-auto px-6 py-12 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
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
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/20 backdrop-blur-md">
              <HiOutlineAcademicCap size={32} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
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
              <p className="text-gray-300 mt-2 text-base md:text-lg max-w-2xl leading-relaxed">
                {activeCategory?.description ||
                  (searchParams.get("search")
                    ? `Found ${total} course${total !== 1 ? "s" : ""} matching your search criteria.`
                    : "Expand your career horizons with high-quality online courses and tutorials designed by top instructors.")}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-gray-300 border-t border-white/10 pt-6">
            <span className="flex items-center gap-2">
              <AiOutlineBook size={18} className="text-purple-400" />
              <strong className="text-white">{total}</strong> total courses
            </span>
            <span className="flex items-center gap-2">
              <AiOutlineBarChart size={18} className="text-purple-400" />
              All experience levels
            </span>
            <span className="flex items-center gap-2">
              <AiOutlineGlobal size={18} className="text-purple-400" />
              Subtitled & multilingual options
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════ CATEGORY CHIPS ═══════════════ */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm shadow-gray-100/50">
        <div className="max-w-[1340px] mx-auto px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1" style={{ scrollbarWidth: "none" }}>
            <Link
              to="/courses"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("category");
                setSearchParams(newParams);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !slug && !searchParams.get("category")
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : "text-gray-600 bg-gray-50 hover:bg-gray-100"
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
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : "text-gray-600 bg-gray-50 hover:bg-gray-100"
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
      <div className="max-w-[1340px] mx-auto px-6 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((f) => !f)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                showFilters
                  ? "bg-purple-50 border-purple-200 text-purple-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <HiOutlineFilter size={18} />
              Filter
              {hasFiltersApplied && (
                <span className="ml-1 w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>

            <span className="text-sm text-gray-500">
              Showing <strong className="text-gray-900">{courses.length}</strong> of{" "}
              <strong className="text-gray-900">{total}</strong> results
            </span>
          </div>

          <div className="flex items-center gap-3">
            <HiOutlineSortDescending size={18} className="text-gray-400" />
            <select
              value={searchParams.get("sort") || "relevance"}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer font-semibold text-gray-700 shadow-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8 items-start relative">
          {/* ── FILTER SIDEBAR ── */}
          {showFilters && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={() => setShowFilters(false)}
              />

              <aside className="
                fixed inset-y-0 right-0 z-50 w-80 bg-white p-6 shadow-2xl overflow-y-auto transition-transform duration-300
                lg:static lg:block lg:w-72 lg:shrink-0 lg:space-y-6 lg:sticky lg:top-20 lg:max-h-[85vh] lg:p-0 lg:bg-transparent lg:shadow-none lg:z-auto lg:overflow-y-visible lg:pr-2 lg:scrollbar-thin
              ">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-6 lg:hidden border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
                  >
                    <HiOutlineX size={24} />
                  </button>
                </div>
              {/* Category Filter (only visible on general search) */}
              {!slug && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h4 className="font-bold text-gray-900 text-sm mb-4">Category</h4>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="categoryFilter"
                        checked={!searchParams.has("category")}
                        onChange={() => updateParam("category", "")}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-purple-600 transition font-medium">
                        All Categories
                      </span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="categoryFilter"
                          checked={searchParams.get("category") === cat._id}
                          onChange={() => updateParam("category", cat._id)}
                          className="w-4 h-4 accent-purple-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-purple-600 transition font-medium">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Level Filter */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-4">Course Level</h4>
                <div className="space-y-2.5">
                  {[
                    { value: "", label: "All Levels" },
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ].map((lvl) => (
                    <label key={lvl.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="level"
                        checked={(searchParams.get("level") || "") === lvl.value}
                        onChange={() => updateParam("level", lvl.value)}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-purple-600 transition font-medium capitalize">
                        {lvl.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Type */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-4">Pricing Options</h4>
                <div className="space-y-2.5">
                  {[
                    { value: "", label: "All Prices" },
                    { value: "free", label: "Free" },
                    { value: "paid", label: "Paid" },
                  ].map((prc) => (
                    <label key={prc.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="priceType"
                        checked={(searchParams.get("priceType") || "") === prc.value}
                        onChange={() => updateParam("priceType", prc.value)}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-purple-600 transition font-medium">
                        {prc.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-4">Price Range (₹)</h4>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-1/2 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-1/2 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <button
                  onClick={applyPriceRange}
                  className="w-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl transition cursor-pointer"
                >
                  Apply Range
                </button>
              </div>

              {/* Rating Filter */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-4">Ratings</h4>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={!searchParams.has("rating")}
                      onChange={() => updateParam("rating", "")}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-purple-600 font-medium">
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
                      <span className="text-sm text-gray-600 group-hover:text-purple-600 transition font-medium flex items-center gap-1.5">
                        {rt} & up
                        <AiFillStar className="text-amber-400 inline" size={14} />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language Filter */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-4">Language</h4>
                <div className="space-y-2.5">
                  {[
                    { value: "", label: "All Languages" },
                    { value: "English", label: "English" },
                    { value: "Spanish", label: "Spanish" },
                    { value: "Hindi", label: "Hindi" },
                    { value: "French", label: "French" },
                  ].map((lang) => (
                    <label key={lang.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="language"
                        checked={(searchParams.get("language") || "") === lang.value}
                        onChange={() => updateParam("language", lang.value)}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-purple-600 transition font-medium">
                        {lang.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear All Filters */}
              {hasFiltersApplied && (
                <button
                  onClick={clearAllFilters}
                  className="w-full py-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <HiOutlineRefresh />
                  Clear all filters
                </button>
              )}
            </aside>
          </>
        )}

          {/* ── COURSE GRID / CONTENT ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="aspect-video bg-gray-200 animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                    </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseListCard key={course._id} course={course} />
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
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition cursor-pointer ${
                          currentPage === p
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
    </div>
  );
};

/* ── Udemy-style Course Card ── */
const CourseListCard = ({ course }) => {
  const instructor =
    course.instructorId?.userId?.fullName ||
    course.instructorId?.firstName ||
    course.instructorId?.name ||
    "Instructor";

  return (
    <Link
      to={`/api/public/courses/${course._id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-50 border-b border-gray-100/50">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
            <HiOutlineAcademicCap size={44} className="text-purple-300" />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300 text-gray-900">
            <BsFillPlayFill size={24} className="ml-0.5" />
          </div>
        </div>

        {/* Level badge */}
        {course.level && (
          <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase bg-white/95 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-full shadow-sm">
            {course.level}
          </span>
        )}

        {/* Discount badge */}
        {course.discountPrice && course.price && course.discountPrice < course.price && (
          <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-500 text-white px-2.5 py-1 rounded-full">
            {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors mb-1.5 text-base">
          {course.title}
        </h3>

        <p className="text-xs text-gray-500 mb-3 font-medium">{instructor}</p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-bold text-amber-700">
            {course.averageRating ? course.averageRating.toFixed(1) : "0.0"}
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <AiFillStar
                key={i}
                size={14}
                className={
                  i < Math.round(course.averageRating || 0)
                    ? "text-amber-400"
                    : "text-gray-200"
                }
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            ({course.totalReviews || 0})
          </span>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-5 mt-auto pt-4 border-t border-gray-50">
          {course.totalLectures > 0 && (
            <span className="flex items-center gap-1">
              <AiOutlineBook size={14} className="text-purple-500" />
              {course.totalLectures} lectures
            </span>
          )}
          {course.totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <AiOutlineClockCircle size={14} className="text-purple-500" />
              {Math.round(course.totalDuration / 60)}h
            </span>
          )}
        </div>

        {/* Price Tag */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-950">
            {course.discountPrice
              ? `₹${course.discountPrice}`
              : course.price
                ? `₹${course.price}`
                : "Free"}
          </span>
          {course.discountPrice && course.price && course.discountPrice < course.price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{course.price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCourses;
