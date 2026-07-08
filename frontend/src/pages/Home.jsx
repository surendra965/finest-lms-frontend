import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard";
import TopCategories from "../components/TopCategories";
import { getApiErrorMessage, readJson } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     FETCH COURSES
  ========================= */
  const fetchCourses = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/public/courses`);
      const data = await readJson(res);

      if (res.ok) {
        // backend structure: data.courses
        setCourses(data?.courses || []);
      } else {
        const msg = getApiErrorMessage(data, "Failed to load courses");
        setError(msg);
      }
    } catch (err) {
      console.error(err);
      setError("Backend connection error");
    } finally {
      setLoading(false);
    }
  };

  // loading courses on mount (fetch triggers local state updates)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchCourses();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* =========================
     LOADING UI
  ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  /* =========================
     ERROR UI
  ========================= */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  /* =========================
     EMPTY STATE
  ========================= */
  if (!courses.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No courses available
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 px-10 bg-black/5">

      {/* HEADER */}
      <h2 className="text-2xl font-bold mb-6">
        Top Courses
      </h2>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {courses.map((course) => (
          <CourseCard
            key={course._id}
            course={{
              id: course._id,
              title: course.title,
              instructor:
                course.instructorId?.firstName ||
                course.instructorId?.name ||
                "Instructor",
              price: course.price,
              image: course.thumbnail,
            }}
          />
        ))}
      </div>

      {/* TOP CATEGORIES SECTION */}
      <TopCategories />
    </div>
  );
};

export default Home;