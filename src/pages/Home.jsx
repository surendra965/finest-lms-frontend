import { useEffect, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import TopCategories from "../components/TopCategories";
import { getApiErrorMessage, readJson } from "../utils/auth";
import {
  HiOutlineSparkles,
  HiOutlineFire,
  HiOutlineTrendingUp,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { AuthContext } from "../context/authContext";
import Landing from "./Landing";

const API_URL = import.meta.env.VITE_API_URL;

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
    <div className="aspect-video bg-gray-200" />
    <div className="p-4 space-y-2.5">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-2/5 mt-3" />
      <div className="h-5 bg-gray-200 rounded w-1/4 mt-4" />
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon, badge }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-purple-600 text-2xl shrink-0" />}
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-linear-to-r from-purple-300 to-purple-600 text-white tracking-wider">
              {badge}
            </span>
          )}
        </h2>
      </div>
      {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
    </div>
  </div>
);

const HorizontalCourseSlider = ({ courses }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmt = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmt : scrollAmt,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group/slider">
      {/* Scroll controls */}
      {courses.length > 1 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-[-16px] top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200"
            title="Scroll Left"
          >
            <HiOutlineChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-[-16px] top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200"
            title="Scroll Right"
          >
            <HiOutlineChevronRight size={16} />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-5 pb-4 pl-1 cursor-grab active:cursor-grabbing scrollbar-hide py-1 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {courses.map((course) => (
          <div key={course._id} className="w-[280px] shrink-0">
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Landing />;
  }

  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recentSearchCourses, setRecentSearchCourses] = useState([]);
  const [recentSearchTerm, setRecentSearchTerm] = useState("");
  const [categorySections, setCategorySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const readResponse = async (res) => {
    try {
      return await readJson(res);
    } catch {
      return await res.json();
    }
  };

  const fetchHomeContent = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch categories list to identify top categories
      let cats = [];
      try {
        const catRes = await fetch(`${API_URL}/api/categories`);
        const catData = await catRes.json();
        if (catRes.ok) {
          cats = catData.data || [];
        }
      } catch (e) {
        console.error("Failed to load categories list:", e);
      }

      // 2. Identify recent searches keyword
      let searchToFetch = "";
      try {
        const stored = localStorage.getItem("recentSearches");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            searchToFetch = parsed[0];
            setRecentSearchTerm(searchToFetch);
          }
        }
      } catch (e) {
        console.error("Failed to read recent searches from localstorage:", e);
      }

      // 3. URLs
      const recommendedUrl = `${API_URL}/api/public/courses?sort=relevance&limit=8`;
      const popularUrl = `${API_URL}/api/public/courses?sort=popular&limit=8`;
      const trendingUrl = `${API_URL}/api/public/courses?sort=rating&limit=8`;
      const recentUrl = searchToFetch ? `${API_URL}/api/public/courses?search=${encodeURIComponent(searchToFetch)}&limit=8` : null;

      // 4. Parallel fetch core segments
      const [recRes, popRes, trRes, recSearchRes] = await Promise.all([
        fetch(recommendedUrl),
        fetch(popularUrl),
        fetch(trendingUrl),
        recentUrl ? fetch(recentUrl) : Promise.resolve(null),
      ]);

      const [recData, popData, trData, recSearchData] = await Promise.all([
        recRes.ok ? readResponse(recRes) : Promise.resolve(null),
        popRes.ok ? readResponse(popRes) : Promise.resolve(null),
        trRes.ok ? readResponse(trRes) : Promise.resolve(null),
        recSearchRes && recSearchRes.ok ? readResponse(recSearchRes) : Promise.resolve(null),
      ]);

      setRecommended(recData?.courses || []);
      setPopular(popData?.courses || []);
      setTrending(trData?.courses || []);

      if (recSearchData) {
        setRecentSearchCourses(recSearchData?.courses || []);
      } else {
        setRecentSearchCourses([]);
      }

      // 5. Parallel fetch first 2 categories courses
      if (cats.length > 0) {
        const targetCats = cats.slice(0, 2);
        const catCoursePromises = targetCats.map(c =>
          fetch(`${API_URL}/api/public/courses?category=${c._id}&limit=8`)
            .then(res => res.ok ? readResponse(res) : Promise.resolve(null))
            .catch(() => null)
        );
        const catResults = await Promise.all(catCoursePromises);

        const sectionsData = targetCats.map((c, idx) => ({
          categoryName: c.name,
          categorySlug: c.slug || c.name?.toLowerCase().replace(/\s+/g, "-"),
          courses: catResults[idx]?.courses || []
        })).filter(s => s.courses.length > 0);

        setCategorySections(sectionsData);
      }

    } catch (err) {
      console.error("An error occurred loading the Home Page segments:", err);
      setError("Failed to retrieve top course catalogue contents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeContent();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f9fa] pb-16">
      <div className="max-w-[1180px] mx-auto px-6 mt-12 space-y-16">
        {loading && (
          <div className="space-y-12">
            {[1, 2, 3].map((sectionIndex) => (
              <div key={sectionIndex} className="space-y-5">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error placeholder */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⚠️</span>
            <p className="font-bold text-gray-800 text-lg mb-2">Could not load dashboard content</p>
            <p className="text-gray-500 text-sm mb-5">{error}</p>
            <button
              onClick={fetchHomeContent}
              className="px-6 py-2.5 bg-[#a435f0] text-white font-bold rounded-xl hover:bg-[#8710d8] transition text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Layout successfully loaded */}
        {!loading && !error && (
          <>
            {/* 2. Recommended Courses Section */}
            {recommended.length > 0 && (
              <section>
                <SectionHeader
                  title="Recommended for You"
                  subtitle="Courses chosen specially for your profiles and ratings"
                  icon={HiOutlineSparkles}
                  badge="Recommended"
                />
                <HorizontalCourseSlider courses={recommended} />
              </section>
            )}

            {/* 1. Recent Search Personalization */}
            {recentSearchTerm && recentSearchCourses.length > 0 && (
              <section className="animate-in fade-in transition duration-300">
                <SectionHeader
                  title={`Based on your search for "${recentSearchTerm}"`}
                  subtitle="Picked directly matching your request patterns"
                  icon={HiOutlineSearch}
                  badge="Personalized"
                />
                <HorizontalCourseSlider courses={recentSearchCourses} />
              </section>
            )}

            {/* 3. Popular Courses Section */}
            {popular.length > 0 && (
              <section>
                <SectionHeader
                  title="Most Popular Classes"
                  subtitle="The most sought-after skill tutorials by student enrollments"
                  icon={HiOutlineFire}
                  badge="Hot"
                />
                <HorizontalCourseSlider courses={popular} />
              </section>
            )}

            {/* 4. Trending Courses Section */}
            {trending.length > 0 && (
              <section>
                <SectionHeader
                  title="Trending This Week"
                  subtitle="Highly rated courses receiving high reviews lately"
                  icon={HiOutlineTrendingUp}
                  badge="Trending"
                />
                <HorizontalCourseSlider courses={trending} />
              </section>
            )}

            {/* 5. Dynamic top-level Category Rows */}
            {categorySections.map((sect) => (
              <section key={sect.categoryName}>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                  <SectionHeader
                    title={`Top in ${sect.categoryName}`}
                    subtitle={`Leading resources under the ${sect.categoryName} category`}
                  />
                  <Link
                    to={`/courses/${sect.categorySlug}`}
                    className="text-xs font-bold text-purple-650 hover:text-purple-750 transition"
                  >
                    View All &rarr;
                  </Link>
                </div>
                <HorizontalCourseSlider courses={sect.courses} />
              </section>
            ))}

            {/* Fallback when absolutely no courses are fetched */}
            {recommended.length === 0 && popular.length === 0 && trending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                <span className="text-5xl mb-4">📚</span>
                <p className="font-bold text-gray-800 text-lg">No courses available yet</p>
                <p className="text-sm mt-1">Check back soon — new content is added regularly.</p>
              </div>
            )}
          </>
        )}

        {/* ── TOP CATEGORIES MATRIX ── */}
        <div className="pt-8 border-t border-gray-150">
          <TopCategories />
        </div>
      </div>
    </div>
  );
};

export default Home;