import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard";
import TopCategories from "../components/TopCategories";
import { getApiErrorMessage, readJson } from "../utils/auth";

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

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/public/courses`);
      const data = await readJson(res);
      if (res.ok) {
        setCourses(data?.courses || []);
      } else {
        setError(getApiErrorMessage(data, "Failed to load courses"));
      }
    } catch (err) {
      console.error(err);
      setError("Backend connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f9fa]">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-[#1c1d1f] to-[#2d2f31] text-white py-16 px-6">
        <div className="max-w-[1180px] mx-auto">
          <p className="text-purple-400 text-sm font-bold uppercase tracking-widest mb-3">
            CourseHub — Learn Without Limits
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight max-w-2xl">
            Build real skills,<br />
            <span className="text-[#a435f0]">land your dream career</span>
          </h1>
          <p className="text-gray-300 mt-4 max-w-xl text-base leading-relaxed">
            Explore thousands of courses taught by expert instructors. Start learning today and transform your future.
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-[1180px] mx-auto px-6 py-10">
        {/* Section heading */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Featured Courses</h2>
            <p className="text-sm text-gray-500 mt-1">Hand-picked by our editorial team</p>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⚠️</span>
            <p className="font-bold text-gray-800 text-lg mb-2">Could not load courses</p>
            <p className="text-gray-500 text-sm mb-5">{error}</p>
            <button
              onClick={fetchCourses}
              className="px-6 py-2.5 bg-[#a435f0] text-white font-bold rounded-xl hover:bg-[#8710d8] transition text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
            <span className="text-5xl mb-4">📚</span>
            <p className="font-bold text-gray-800 text-lg">No courses available yet</p>
            <p className="text-sm mt-1">Check back soon — new content is added regularly.</p>
          </div>
        )}

        {/* Course grid */}
        {!loading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}

        {/* Top Categories */}
        <div className="mt-14">
          <TopCategories />
        </div>
      </div>
    </div>
  );
};

export default Home;