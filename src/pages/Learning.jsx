import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEnrollment } from "../context/EnrollmentContext";
import { authFetch } from "../utils/auth";
import {
  LuBookOpen,
  LuTrendingUp,
  LuCircleCheck,
  LuClock,
  LuSearch,
  LuLoaderCircle,
  LuGraduationCap,
  LuArrowRight,
  LuLayoutGrid,
  LuTimer,
} from "react-icons/lu";

/* ──────────────────────────────────────────────────────────
   PROGRESS BAR
────────────────────────────────────────────────────────── */
const ProgressBar = ({ pct, className = "" }) => (
  <div className={`h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{
        width: `${Math.min(Math.max(pct || 0, 0), 100)}%`,
        background:
          pct >= 100
            ? "linear-gradient(90deg,#16a34a,#22c55e)"
            : "linear-gradient(90deg,#a435f0,#c084fc)",
      }}
    />
  </div>
);

/* ──────────────────────────────────────────────────────────
   COURSE CARD
────────────────────────────────────────────────────────── */
const CourseCard = ({ courseId, title, thumbnail, pct, isCompleted }) => {
  const navigate = useNavigate();
  const remaining = Math.max(0, 100 - (pct || 0));
  const thumb =
    thumbnail ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

  return (
    <div
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex flex-col"
      onClick={() => navigate(`/learning/${courseId}`)}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video bg-gray-100 shrink-0">
        <img
          src={thumb}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
          }}
        />
        {/* Status badge */}
        <div
          className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${isCompleted
            ? "bg-green-600/90 text-white"
            : pct > 0
              ? "bg-[#a435f0]/90 text-white"
              : "bg-gray-800/80 text-white"
            }`}
        >
          {isCompleted ? (
            <><LuCircleCheck size={11} /> Completed</>
          ) : pct > 0 ? (
            <><LuTrendingUp size={11} /> In Progress</>
          ) : (
            <><LuBookOpen size={11} /> Not Started</>
          )}
        </div>

        {/* Completion badge on thumbnail */}
        {isCompleted && (
          <div className="absolute inset-0 bg-green-600/10 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center">
              <LuCircleCheck size={28} className="text-green-600" />
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
          {title}
        </h3>

        {/* Progress section */}
        <div className="mt-auto space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className={isCompleted ? "text-green-600" : "text-gray-500"}>
              {isCompleted ? "✓ Completed" : `${pct}% complete`}
            </span>
            {!isCompleted && (
              <span className="text-orange-500 font-semibold flex items-center gap-1">
                <LuTimer size={11} />
                {remaining}% left
              </span>
            )}
          </div>
          <ProgressBar pct={pct} />
        </div>

        {/* CTA button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/learning/${courseId}`);
          }}
          className={`w-full py-2 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition ${isCompleted
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-[#a435f0] text-white hover:bg-[#8710d8]"
            }`}
        >
          {isCompleted ? "Review Course" : pct > 0 ? "Continue Learning" : "Start Learning"}
          <LuArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   STAT CARD
────────────────────────────────────────────────────────── */
const StatCard = ({ icon, value, label, color, sub }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex flex-col items-start">
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────
   TAB BUTTON
────────────────────────────────────────────────────────── */
const TabBtn = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${active
      ? "bg-[#a435f0] text-white border-[#a435f0] shadow-sm"
      : "bg-white text-gray-600 border-gray-200 hover:border-[#a435f0] hover:text-[#a435f0]"
      }`}
  >
    {icon}
    {label}
    <span
      className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}
    >
      {count}
    </span>
  </button>
);

/* ──────────────────────────────────────────────────────────
   MAIN LEARNING PAGE
────────────────────────────────────────────────────────── */
const Learning = () => {
  const { enrollments, loading, refreshEnrollments } = useEnrollment();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [dashboardData, setDashboardData] = useState(null);

  // Refresh enrollments when this page mounts to get latest progress data
  useEffect(() => {
    refreshEnrollments();
    const fetchDashboard = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await authFetch(`${API_URL}/api/dashboard/student`);
        const result = await res.json();
        if (res.ok) {
          setDashboardData(result.data);
        }
      } catch (err) {
        console.warn("Failed to fetch student dashboard info:", err);
      }
    };
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize enrollments
  const courses = enrollments
    .map((en) => {
      const courseObj =
        en.courseId && typeof en.courseId === "object"
          ? en.courseId
          : en.course && typeof en.course === "object"
            ? en.course
            : null;

      const idRaw = courseObj?._id ?? courseObj?.id ?? en.courseId ?? en._id;
      const courseId = idRaw?.toString?.() ?? String(idRaw ?? "");
      const pct = Math.round(en.progressPercentage ?? 0);

      return {
        courseId,
        title: courseObj?.title ?? en.title ?? "Untitled Course",
        thumbnail: courseObj?.thumbnail ?? en.thumbnail ?? null,
        pct,
        nextLectureId: en.nextLectureId ?? null,
        updatedAt: en.updatedAt ?? en.enrolledAt,
        isCompleted: pct >= 100,
      };
    })
    .filter(
      (c) => c.courseId && c.courseId !== "undefined" && c.courseId !== "null"
    );

  const completedCourses = courses.filter((c) => c.isCompleted);
  const pendingCourses = courses.filter((c) => !c.isCompleted);
  const avgProgress =
    courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + c.pct, 0) / courses.length)
      : 0;
  const avgPending =
    pendingCourses.length > 0
      ? Math.round(
        pendingCourses.reduce((acc, c) => acc + (100 - c.pct), 0) /
        pendingCourses.length
      )
      : 0;

  // Filter by tab then search
  const tabFiltered =
    tab === "pending"
      ? pendingCourses
      : tab === "completed"
        ? completedCourses
        : courses;

  const filtered = tabFiltered.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LuLoaderCircle size={40} className="animate-spin text-[#a435f0]" />
          <p className="text-gray-500 text-sm">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HERO HEADER ── */}
      <div className="bg-gradient-to-br from-[#1c1c1c] via-[#2d1b4e] to-[#1c1c1c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#c084fc] text-sm font-semibold mb-3">
                <LuGraduationCap size={18} />
                My Learning
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Your Learning Journey
              </h1>
              <p className="text-zinc-400 mt-2 text-sm">
                {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
                {pendingCourses.length > 0 && (
                  <span className="ml-2 text-orange-400">
                    · {pendingCourses.length} pending
                  </span>
                )}
                {completedCourses.length > 0 && (
                  <span className="ml-2 text-green-400">
                    · {completedCourses.length} completed
                  </span>
                )}
              </p>
            </div>
            <Link
              to="/"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#a435f0] hover:bg-[#8710d8] text-white text-sm font-bold rounded-xl transition"
            >
              <LuBookOpen size={16} />
              Browse More Courses
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── STAT CARDS ── */}
        {courses.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={<LuLayoutGrid size={22} className="text-[#a435f0]" />}
              value={dashboardData?.statistics?.enrolledCourses ?? courses.length}
              label="Total Courses Enrolled"
              color="bg-[#a435f0]/10"
            />
            <StatCard
              icon={<LuTrendingUp size={22} className="text-orange-500" />}
              value={dashboardData?.statistics?.inProgressCourses ?? pendingCourses.length}
              label="Pending Courses"
              sub={pendingCourses.length > 0 ? `${avgPending}% remaining` : undefined}
              color="bg-orange-50"
            />
            <StatCard
              icon={<LuCircleCheck size={22} className="text-green-600" />}
              value={dashboardData?.statistics?.completedCourses ?? completedCourses.length}
              label="Completed"
              color="bg-green-50"
            />
            <StatCard
              icon={<LuClock size={22} className="text-blue-500" />}
              value={dashboardData ? `${dashboardData.statistics?.learningHours || 0} hrs` : `${avgProgress}%`}
              label={dashboardData ? "Learning Hours" : "Avg. Progress"}
              color="bg-blue-50"
            />
            <StatCard
              icon={<LuTrendingUp size={22} className="text-red-500" />}
              value={`${avgPending}%`}
              label="Avg. Remaining"
              color="bg-red-50"
            />
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {courses.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl">
            <div className="w-24 h-24 rounded-full bg-[#a435f0]/10 flex items-center justify-center mx-auto mb-5">
              <LuGraduationCap size={44} className="text-[#a435f0]" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No courses yet</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
              Enroll in a course to start your learning journey.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold rounded-xl transition"
            >
              <LuBookOpen size={18} />
              Browse Courses
            </Link>
          </div>
        ) : (
          <>
            {/* ── TABS + SEARCH ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Tabs */}
              <div className="flex gap-2 shrink-0 flex-wrap">
                <TabBtn
                  active={tab === "all"}
                  onClick={() => setTab("all")}
                  icon={<LuLayoutGrid size={14} />}
                  label="All Courses"
                  count={courses.length}
                />
                <TabBtn
                  active={tab === "pending"}
                  onClick={() => setTab("pending")}
                  icon={<LuTrendingUp size={14} />}
                  label="Pending"
                  count={pendingCourses.length}
                />
                <TabBtn
                  active={tab === "completed"}
                  onClick={() => setTab("completed")}
                  icon={<LuCircleCheck size={14} />}
                  label="Completed"
                  count={completedCourses.length}
                />
                <TabBtn
                  active={tab === "certificates"}
                  onClick={() => setTab("certificates")}
                  icon={<LuGraduationCap size={14} />}
                  label="Certificates"
                  count={dashboardData?.statistics?.certificates ?? 0}
                />
              </div>

              {/* Search */}
              <div className="relative flex-1 w-full sm:w-auto">
                <LuSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search your courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a435f0]/30 focus:border-[#a435f0] bg-white shadow-sm"
                />
              </div>
            </div>

            {/* ── PENDING SUMMARY BANNER ── */}
            {tab === "pending" && pendingCourses.length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <LuTimer size={22} className="text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-orange-700">
                    {pendingCourses.length} course{pendingCourses.length !== 1 ? "s" : ""} in progress
                  </p>
                  <p className="text-xs text-orange-500 mt-0.5">
                    Average <strong>{avgPending}%</strong> remaining to complete. Keep going!
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-2xl font-extrabold text-orange-600">{avgPending}%</p>
                  <p className="text-xs text-orange-400">avg. remaining</p>
                </div>
              </div>
            )}

            {/* ── COMPLETED SUMMARY BANNER ── */}
            {tab === "completed" && completedCourses.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <LuCircleCheck size={22} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700">
                    🎉 You've completed {completedCourses.length} course{completedCourses.length !== 1 ? "s" : ""}!
                  </p>
                  <p className="text-xs text-green-500 mt-0.5">
                    Great work. You can review them anytime.
                  </p>
                </div>
              </div>
            )}

            {/* ── COURSE GRID OR CERTIFICATE GRID ── */}
            {tab === "certificates" ? (
              (!dashboardData?.recentCertificates || dashboardData.recentCertificates.length === 0) ? (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                  <LuGraduationCap size={44} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No badges or verified certifications earned yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Complete a course to 100% to generate credentials!</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {dashboardData.recentCertificates.map((cert) => (
                    <div
                      key={cert._id}
                      className="group bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col p-5 gap-3"
                    >
                      <div className="relative overflow-hidden aspect-video bg-gray-100 shrink-0 rounded-2xl">
                        <img
                          src={cert.courseId?.thumbnail || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80"}
                          alt={cert.courseId?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col flex-1 gap-2">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                          {cert.courseId?.title || "Course Completed"}
                        </h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                          ID: {cert.certificateNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                        <div className="mt-auto space-y-2 pt-2">
                          <button
                            onClick={() => window.open(cert.certificateUrl, "_blank")}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border-none cursor-pointer"
                          >
                            Download PDF
                          </button>
                          <a
                            href={`${window.location.origin}/verify-certificate/${cert.verificationCode}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 border border-slate-200 text-center"
                          >
                            Verify Credential
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                <LuSearch size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No courses match your search.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((c) => (
                  <CourseCard key={c.courseId} {...c} />
                ))}
              </div>
            )}

            {/* ── CONTINUE LEARNING BANNER (all tab) ── */}
            {tab === "all" && !searchQuery && pendingCourses.length > 0 && (
              <div className="bg-gradient-to-r from-[#a435f0]/10 via-white to-white border border-[#a435f0]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#a435f0] flex items-center justify-center shrink-0">
                  <LuClock size={26} className="text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-[#a435f0] uppercase tracking-wider mb-0.5">
                    Pick up where you left off
                  </p>
                  <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                    {pendingCourses[0].title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 justify-center sm:justify-start">
                    <ProgressBar pct={pendingCourses[0].pct} className="w-32" />
                    <span className="text-xs text-gray-500">{pendingCourses[0].pct}% done</span>
                    <span className="text-xs text-orange-500 font-semibold">
                      {100 - pendingCourses[0].pct}% remaining
                    </span>
                  </div>
                </div>
                <Link
                  to={`/learning/${pendingCourses[0].courseId}`}
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#a435f0] hover:bg-[#8710d8] text-white text-sm font-bold rounded-xl transition"
                >
                  Continue <LuArrowRight size={16} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Learning;
