import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { authFetch } from "../utils/auth";
import { toast } from "react-toastify";
import { AiOutlineBook, AiFillCheckCircle, AiOutlineTeam, AiFillDollarCircle, AiOutlineSearch, AiOutlinePlus } from "react-icons/ai";
import { BsFillPlayFill } from "react-icons/bs";

/* ── Stat Card ── */
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/10 border border-white/10 rounded-lg px-5 py-4">
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[#cec0fc] text-sm">{icon}</span>
      <span className="text-[#cec0fc] text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-white text-2xl font-extrabold">{value}</p>
  </div>
);

/* ── Course Status Badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    published: "bg-[#ecfdf5] text-[#065f46]",
    draft:     "bg-[#fef9c3] text-[#854d0e]",
    archived:  "bg-[#f3f4f6] text-[#374151]",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${map[status] || map.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "published" ? "bg-emerald-500" : "bg-amber-400"}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

/* ── Course Card ── */
const CourseCard = ({ course, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white border border-[#d1d7dc] rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow duration-200"
  >
    {/* Thumbnail */}
    <div className="relative aspect-video overflow-hidden bg-[#f7f9fa]">
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#6a6f73]">
          <BsFillPlayFill size={40} className="text-[#6a6f73]" />
        </div>
      )}
      <div className="absolute top-2 left-2">
        <StatusBadge status={course.status} />
      </div>
    </div>

    {/* Body */}
    <div className="p-4">
      <h3 className="text-[14px] font-bold text-[#1c1d1f] leading-snug line-clamp-2 mb-1 group-hover:text-[#a435f0] transition-colors">
        {course.title}
      </h3>
      {course.subtitle && (
        <p className="text-[12px] text-[#6a6f73] line-clamp-1 mb-3">{course.subtitle}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between text-[12px] text-[#6a6f73] pt-3 border-t border-[#e8e8e8]">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {(course.totalEnrollments ?? 0).toLocaleString()} students
        </span>
        {course.price !== undefined && (
          <span className="font-bold text-[#1c1d1f]">₹{course.price}</span>
        )}
      </div>
    </div>
  </div>
);

/* ── Loading Skeleton ── */
const SkeletonCard = () => (
  <div className="bg-white border border-[#d1d7dc] rounded-lg overflow-hidden animate-pulse">
    <div className="aspect-video bg-[#e8e8e8]" />
    <div className="p-4 space-y-2.5">
      <div className="h-3.5 bg-[#e8e8e8] rounded w-3/4" />
      <div className="h-3 bg-[#e8e8e8] rounded w-1/2" />
      <div className="h-3 bg-[#e8e8e8] rounded w-1/3 mt-4" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
const InstructorHome = () => {
  const { user } = useContext(AuthContext);
  const navigate  = useNavigate();
  const API_URL   = import.meta.env.VITE_API_URL;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all"); // all | published | draft

  useEffect(() => {
    (async () => {
      try {
        const res  = await authFetch(`${API_URL}/api/courses/my-courses`);
        const data = await res.json();
        if (!res.ok) { toast.error(data.message || "Failed to load courses"); return; }
        setCourses(data.data || []);
      } catch { toast.error("Server error while fetching courses"); }
      finally  { setLoading(false); }
    })();
  }, [API_URL]);

  /* Derived stats */
  const totalStudents = courses.reduce((acc, c) => acc + (c.totalEnrollments ?? 0), 0);
  const totalRevenue  = courses.reduce((acc, c) => acc + ((c.price ?? 0) * (c.totalEnrollments ?? 0)), 0);
  const published     = courses.filter((c) => c.status === "published").length;

  /* Filtered list */
  const filtered = filter === "all" ? courses : courses.filter((c) => c.status === filter);

  const initials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f9fa] font-sans">

      {/* ════════════════════════════
          DARK HERO — Udemy #1c1d1f
      ════════════════════════════ */}
      <div className="bg-[#1c1d1f]">
        <div className="max-w-[1180px] mx-auto px-6 py-8">

          {/* Top row: avatar + name + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#a435f0] flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0 ring-2 ring-[#a435f0]/40">
                {user?.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="avatar" />
                  : initials}
              </div>
              <div>
                <p className="text-[#cec0fc] text-xs font-medium uppercase tracking-widest mb-0.5">Instructor Dashboard</p>
                <h1 className="text-white text-xl font-extrabold leading-tight">
                  {user?.firstName} {user?.lastName}
                </h1>
                {user?.email && (
                  <p className="text-[#6a6f73] text-xs mt-0.5">{user.email}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate("/instructor/create-course")}
              className="flex items-center gap-2 bg-[#a435f0] hover:bg-[#8710d8] text-white px-5 py-2.5 rounded font-bold text-sm transition self-start sm:self-auto"
            >
              <AiOutlinePlus size={18} className="font-bold" />
              New Course
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<AiOutlineBook size={20} className="font-bold" />} label="Total Courses"    value={courses.length} />
            <StatCard icon={<AiFillCheckCircle size={20} className="font-bold" />} label="Published"        value={published} />
            <StatCard icon={<AiOutlineTeam size={20} className="font-bold" />} label="Total Students"   value={totalStudents.toLocaleString()} />
            <StatCard icon={<AiFillDollarCircle size={20} className="font-bold" />} label="Est. Revenue"     value={`₹${totalRevenue.toLocaleString()}`} />
          </div>

        </div>
      </div>

      {/* ════════════════════════════
          BODY
      ════════════════════════════ */}
      <div className="max-w-[1180px] mx-auto px-6 py-10">

        {/* Section header + filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <h2 className="text-[20px] font-extrabold text-[#1c1d1f]">Your Courses</h2>

          {/* Filter tabs */}
          {!loading && courses.length > 0 && (
            <div className="flex items-center bg-white border border-[#d1d7dc] rounded-lg overflow-hidden text-[13px] font-semibold">
              {[
                { key: "all",       label: "All" },
                { key: "published", label: "Published" },
                { key: "draft",     label: "Draft" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 transition ${
                    filter === key
                      ? "bg-[#a435f0] text-white"
                      : "text-[#6a6f73] hover:bg-[#f7f9fa]"
                  }`}
                >
                  {label}
                  {key !== "all" && (
                    <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                      filter === key ? "bg-white/20 text-white" : "bg-[#e8e8e8] text-[#6a6f73]"
                    }`}>
                      {courses.filter((c) => c.status === key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && courses.length === 0 && (
          <div
            onClick={() => navigate("/instructor/create-course")}
            className="border-2 border-dashed border-[#d1d7dc] hover:border-[#a435f0] rounded-lg p-16 text-center cursor-pointer hover:bg-[#f7f0ff] transition group"
          >
            <div className="w-16 h-16 rounded-full bg-[#f7f0ff] group-hover:bg-[#ede1ff] flex items-center justify-center mx-auto mb-4 transition">
              <AiOutlineBook size={36} className="text-[#a435f0]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1c1d1f] mb-1">Create your first course</h3>
            <p className="text-[13px] text-[#6a6f73] mb-5">Share your knowledge and start earning</p>
            <span className="inline-flex items-center gap-2 bg-[#a435f0] hover:bg-[#8710d8] text-white px-5 py-2.5 rounded font-bold text-sm transition">
              <AiOutlinePlus size={18} className="font-bold" />
              New Course
            </span>
          </div>
        )}

        {/* Filtered empty state */}
        {!loading && courses.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-[#6a6f73]">
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-[#f7f0ff] text-[#a435f0] flex items-center justify-center">
              <AiOutlineSearch size={28} />
            </div>
            <p className="font-semibold text-[#1c1d1f]">No {filter} courses</p>
            <p className="text-sm mt-1">Switch the filter above to see other courses.</p>
          </div>
        )}

        {/* Course grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onClick={() => navigate(`/instructor/course/${course._id}`)}
              />
            ))}

            {/* "+ New Course" ghost card */}
            <div
              onClick={() => navigate("/instructor/create-course")}
              className="border-2 border-dashed border-[#d1d7dc] hover:border-[#a435f0] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#f7f0ff] transition group min-h-[220px]"
            >
              <div className="w-10 h-10 rounded-full bg-[#f7f0ff] group-hover:bg-[#ede1ff] flex items-center justify-center transition">
                <AiOutlinePlus size={20} className="text-[#a435f0]" />
              </div>
              <span className="text-[13px] font-bold text-[#a435f0]">New Course</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InstructorHome;