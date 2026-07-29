import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import AdminLayout from "../../components/admin/AdminLayout";
import { authFetch } from "../../utils/auth";
import {
  LuBookOpen,
  LuArrowRight,
  LuShieldCheck,
  LuUsers,
  LuDollarSign,
  LuTrendingUp,
  LuActivity,
  LuClock,
  LuSearch,
  LuStar,
  LuCalendar,
  LuMail,
} from "react-icons/lu";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activePanelTab, setActivePanelTab] = useState("overview"); // "overview" | "students" | "instructors"

  const [studentSearch, setStudentSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API_URL}/api/admin/dashboard`);
        const result = await res.json();
        if (res.ok) {
          const rawData = result.data || {};
          const overview = rawData.overview || {};

          // Generate a combined, sorted list of activities from payments, enrollments, and users
          const combinedActivity = [];

          if (rawData.recentUsers) {
            rawData.recentUsers.forEach(u => {
              const uName = u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName;
              combinedActivity.push({
                type: "user",
                message: `New ${u.role === "instructor" ? "Instructor" : "Student"} registered: ${uName} (${u.email})`,
                timestamp: u.createdAt,
              });
            });
          }

          if (rawData.recentEnrollments) {
            rawData.recentEnrollments.forEach(e => {
              const studentName = e.studentId
                ? (e.studentId.lastName ? `${e.studentId.firstName} ${e.studentId.lastName}` : e.studentId.firstName)
                : "A student";
              const courseTitle = e.courseId ? e.courseId.title : "a course";
              combinedActivity.push({
                type: "enrollment",
                message: `${studentName} enrolled in "${courseTitle}"`,
                timestamp: e.createdAt || e.enrolledAt,
              });
            });
          }

          if (rawData.recentPayments) {
            rawData.recentPayments.forEach(p => {
              const userName = p.userId
                ? (p.userId.lastName ? `${p.userId.firstName} ${p.userId.lastName}` : p.userId.firstName)
                : "Instructor";
              const courseTitle = p.courseId ? p.courseId.title : "a course";
              combinedActivity.push({
                type: "payment",
                message: `${userName} purchased "${courseTitle}" for ₹${p.amount}`,
                timestamp: p.createdAt,
              });
            });
          }

          // Sort by timestamp descending
          combinedActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          const mappedStats = {
            revenue: {
              totalRevenue: overview.totalRevenue || 0,
            },
            users: {
              total: overview.totalUsers || 0,
              instructors: overview.totalInstructors || 0,
              students: overview.totalStudents || 0,
            },
            courses: {
              total: overview.totalCourses || 0,
              published: overview.publishedCourses || 0,
              pending: overview.pendingCourses || 0,
              rejected: overview.rejectedCourses || 0,
              draft: overview.draftCourses || 0,
            },
            enrollments: {
              total: overview.totalEnrollments || 0,
              completed: overview.totalCertificates || 0,
            },
            recentActivity: combinedActivity,
            recentUsers: rawData.recentUsers || [],
            topCourses: rawData.topCourses || [],
            students: rawData.students || [],
            instructors: rawData.instructors || [],
          };

          setStats(mappedStats);
        } else {
          toast.error(result.message || "Failed to load dashboard statistics.");
        }
      } catch (err) {
        toast.error("Network error: Failed to fetch dashboard stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [API_URL]);

  // Filtered lists
  const filteredStudents = (stats?.students || []).filter((s) => {
    const fullName = `${s.firstName || ""} ${s.lastName || ""}`.trim().toLowerCase();
    const email = (s.email || "").toLowerCase();
    const query = studentSearch.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const filteredInstructors = (stats?.instructors || []).filter((inst) => {
    const fullName = `${inst.firstName || ""} ${inst.lastName || ""}`.trim().toLowerCase();
    const email = (inst.email || "").toLowerCase();
    const query = instructorSearch.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-[#a435f0] to-[#6d28d9] rounded-3xl px-8 py-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-purple-400 opacity-20 blur-3xl" />
          <div className="flex items-center gap-3 mb-3">
            <LuShieldCheck size={28} className="text-purple-200" />
            <span className="text-sm font-bold text-purple-200 uppercase tracking-widest">
              Admin Platform Control Panel
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Welcome back, {user?.firstName || "Admin"}!
          </h1>
          <p className="text-purple-100 mt-2 text-base max-w-2xl">
            You have full system-level administrative access. Monitor enrollments, manage courses, track revenue, and audit categories.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-semibold text-sm">Aggregating platform metrics...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <LuDollarSign size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{stats.revenue?.totalRevenue || 0}</p>
                </div>
              </div>

              {/* Total Users */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <LuUsers size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Users</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.users?.total || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stats.users?.instructors} Instructors • {stats.users?.students} Students</p>
                </div>
              </div>

              {/* Total Courses */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <LuBookOpen size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Courses</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.courses?.total || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stats.courses?.published} Published • {stats.courses?.pending} Pending</p>
                </div>
              </div>

              {/* Total Enrollments */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <LuTrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Enrollments</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.enrollments?.total || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stats.enrollments?.completed} Completed certifications</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 mt-4 bg-white p-2 rounded-xl shadow-xs">
              {[
                { id: "overview", label: "Dashboard Overview" },
                { id: "students", label: "Student Side Details" },
                { id: "instructors", label: "Instructor Side Details" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanelTab(tab.id)}
                  className={`px-6 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer rounded-lg mr-2 ${activePanelTab === tab.id
                    ? "border-[#a435f0] text-white bg-[#a435f0]"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel Content Switching */}
            {activePanelTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Recent Activities */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                      <LuActivity className="text-purple-600" /> Recent Activities
                    </h2>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {stats.recentActivity && stats.recentActivity.length > 0 ? (
                        stats.recentActivity.slice(0, 10).map((act, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                            <LuClock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-slate-700">{act.message}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{new Date(act.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-sm">No platform activity logged yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Top Courses */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Top Performing Courses</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                            <th className="pb-3 pr-4">Course Name</th>
                            <th className="pb-3 px-4 text-right">Revenue</th>
                            <th className="pb-3 pl-4 text-right">Students</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {stats.topCourses && stats.topCourses.length > 0 ? (
                            stats.topCourses.map((c, i) => (
                              <tr key={i} className="text-slate-700">
                                <td className="py-3 font-semibold text-slate-900 truncate max-w-xs pr-4">{c.title}</td>
                                <td className="py-3 px-4 text-right font-semibold text-slate-950">₹{c.totalRevenue || 0}</td>
                                <td className="py-3 pl-4 text-right">{c.totalEnrollments || 0}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-slate-400">No courses listed yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Side Panels */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h2>
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate("/admin/courses/pending")}
                        className="w-full flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-sm hover:border-purple-300 transition cursor-pointer text-left group"
                      >
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                          <LuBookOpen size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-[#a435f0] text-sm transition">
                            Review Queue
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {stats.courses?.pending || 0} Pending approvals
                          </p>
                        </div>
                        <LuArrowRight size={16} className="text-slate-350 mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() => navigate("/admin/categories")}
                        className="w-full flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-sm hover:border-purple-300 transition cursor-pointer text-left group"
                      >
                        <div className="w-10 h-10 bg-purple-50 text-[#a435f0] rounded-xl flex items-center justify-center shrink-0">
                          <LuShieldCheck size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-[#a435f0] text-sm transition">
                            Manage Categories
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Audit, edit & create slugs
                          </p>
                        </div>
                        <LuArrowRight size={16} className="text-slate-350 mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <p className="font-bold text-blue-800 text-sm">📌 Review Workflow Info</p>
                    <p className="text-xs text-blue-700 mt-2 leading-relaxed">
                      Courses submitted by instructors require review before being published. When approved, courses become searchable across the marketplace immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activePanelTab === "students" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Student Directory</h2>
                    <p className="text-xs text-slate-500">View student info, enrollment statistics, and registration records.</p>
                  </div>
                  {/* Search Student */}
                  <div className="relative max-w-sm w-full">
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#a435f0] text-sm transition-all"
                    />
                    <LuSearch className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-152 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <th className="py-4 px-6">Name</th>
                        <th className="py-4 px-6"><span className="flex items-center gap-1"><LuMail size={12} /> Email</span></th>
                        <th className="py-4 px-6"><span className="flex items-center gap-1"><LuCalendar size={12} /> Joined</span></th>
                        <th className="py-4 px-6 text-center">Enrolled Courses</th>
                        <th className="py-4 px-6 text-center">Certifications</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student._id} className="hover:bg-slate-50/50 transition">
                            <td className="py-4 px-6 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                                  {student.avatar ? (
                                    <img
                                      src={student.avatar}
                                      alt={student.lastName ? `${student.firstName} ${student.lastName}` : student.firstName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    `${student.firstName?.charAt(0) || ""}${student.lastName?.charAt(0) || ""}`
                                  )}
                                </div>
                                <span>{student.lastName ? `${student.firstName} ${student.lastName}` : student.firstName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-mono text-xs">{student.email}</td>
                            <td className="py-4 px-6 text-slate-500 text-xs">
                              {student.createdAt ? new Date(student.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-purple-650">{student.totalEnrollments}</td>
                            <td className="py-4 px-6 text-center font-medium">
                              {student.completedCourses > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-green-50 text-green-700 text-xs">
                                  {student.completedCourses} Certified
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">0</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            No students found matching your query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePanelTab === "instructors" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Instructor Directory</h2>
                    <p className="text-xs text-slate-500">Track instructor profiles, performance, and earnings.</p>
                  </div>
                  {/* Search Instructor */}
                  <div className="relative max-w-sm w-full">
                    <input
                      type="text"
                      placeholder="Search instructors..."
                      value={instructorSearch}
                      onChange={(e) => setInstructorSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#a435f0] text-sm transition-all"
                    />
                    <LuSearch className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-152 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <th className="py-4 px-6">Instructor</th>
                        <th className="py-4 px-6"><span className="flex items-center gap-1"><LuMail size={12} /> Email</span></th>
                        <th className="py-4 px-6 text-center">Courses</th>
                        <th className="py-4 px-6 text-center">Total Students</th>
                        <th className="py-4 px-6 text-center">Average Rating</th>
                        <th className="py-4 px-6 text-right">Est. Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredInstructors.length > 0 ? (
                        filteredInstructors.map((inst) => (
                          <tr key={inst._id} className="hover:bg-slate-50/50 transition">
                            <td className="py-4 px-6 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                                  {inst.avatar ? (
                                    <img
                                      src={inst.avatar}
                                      alt={inst.lastName ? `${inst.firstName} ${inst.lastName}` : inst.firstName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    `${inst.firstName?.charAt(0) || ""}${inst.lastName?.charAt(0) || ""}`
                                  )}
                                </div>
                                <span>{inst.lastName ? `${inst.firstName} ${inst.lastName}` : inst.firstName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-mono text-xs">{inst.email}</td>
                            <td className="py-4 px-6 text-center font-bold">{inst.totalCourses}</td>
                            <td className="py-4 px-6 text-center font-bold text-slate-500">{inst.totalStudents}</td>
                            <td className="py-4 px-6 text-center font-medium">
                              {inst.averageRating > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[#f69c08] bg-[#f69c08]/10 px-2 py-0.5 rounded text-xs font-bold">
                                  <LuStar size={12} fill="#f69c08" />
                                  {inst.averageRating.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right font-extrabold text-emerald-600">
                              ₹{inst.totalRevenue?.toLocaleString() || 0}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            No instructors found matching your query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
