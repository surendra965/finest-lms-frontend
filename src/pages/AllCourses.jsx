import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import { getApiErrorMessage, readJson } from "../utils/auth";
import { HiOutlineSparkles, HiOutlineAcademicCap, HiOutlineChevronRight } from "react-icons/hi";

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

const AllCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCourses, setTotalCourses] = useState(0);

    const fetchCourses = async (page = 1) => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/api/public/courses?limit=12&page=${page}`);
            const data = await res.json();
            if (res.ok) {
                setCourses(data?.courses || []);
                setTotalCourses(data?.pagination?.total || (data?.courses || []).length);
                setTotalPages(data?.pagination?.totalPages || 1);
                setCurrentPage(data?.pagination?.currentPage || page);
            } else {
                setError(data.message || "Failed to load courses catalogue.");
            }
        } catch (err) {
            console.error("An error occurred loading All Courses:", err);
            setError("Failed to retrieve course catalogue contents.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses(1);
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchCourses(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f9fa] pb-16">
            {/* Breadcrumb section */}
            <div className="max-w-[1180px] mx-auto px-6 pt-10">
                <nav className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-6">
                    <Link to="/" className="hover:text-purple-600 transition">Home</Link>
                    <HiOutlineChevronRight size={12} className="text-gray-400" />
                    <span className="text-gray-800">All Courses</span>
                </nav>
            </div>

            <div className="max-w-[1180px] mx-auto px-6 space-y-8">
                <SectionHeader
                    title="All Courses Catalog"
                    subtitle={`Explore all ${totalCourses} quality interactive courses available on the platform`}
                    icon={HiOutlineAcademicCap}
                    badge="Browse All"
                />

                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
                        <span className="text-5xl mb-4">⚠️</span>
                        <p className="font-bold text-gray-800 text-lg mb-2">Could not load content</p>
                        <p className="text-gray-500 text-sm mb-5">{error}</p>
                        <button
                            onClick={() => fetchCourses(currentPage)}
                            className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition text-sm cursor-pointer shadow-md shadow-purple-200"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {courses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-xs text-gray-500">
                                <span className="text-5xl mb-4">📚</span>
                                <p className="font-bold text-gray-800 text-lg">No courses available yet</p>
                                <p className="text-sm mt-1">Check back soon — new content is added regularly.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {courses.map((course) => (
                                    <CourseCard key={course._id} course={course} />
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-10">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-gray-700 transition cursor-pointer"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => handlePageChange(p)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${currentPage === p
                                            ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                            : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-gray-700 transition cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AllCourses;
