import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LuBookOpen,
  LuClock,
  LuUser,
  LuTag,
  LuSearch,
  LuChevronRight,
  LuLoader,
  LuInbox,
} from "react-icons/lu";
import AdminLayout from "../../components/admin/AdminLayout";
import { getPendingCourses } from "../../services/adminService";

const StatusBadge = () => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
    Pending Review
  </span>
);

const AdminPendingCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPendingCourses();
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        setFiltered(list);
      } catch (err) {
        toast.error(err.message || "Failed to load pending courses");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      setFiltered(courses);
    } else {
      setFiltered(
        courses.filter(
          (c) =>
            c.title?.toLowerCase().includes(q) ||
            c.instructorId?.userId?.email?.toLowerCase().includes(q) ||
            c.categoryId?.name?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, courses]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Course Review Queue</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review, approve, or reject instructor course submissions.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <LuClock size={16} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-700">
              {courses.length} Pending
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <LuSearch size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by course title, instructor, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-gray-400">
            <LuLoader size={32} className="animate-spin text-purple-500" />
            <p className="text-sm font-medium">Loading pending courses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <LuInbox size={36} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-700 text-lg">
                {search ? "No matching courses" : "Queue is empty"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? "Try a different search term." : "All course submissions have been reviewed."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((course) => (
              <div
                key={course._id}
                onClick={() => navigate(`/admin/courses/${course._id}/review`)}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-5">
                  {/* Thumbnail */}
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LuBookOpen size={28} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-bold text-gray-900 group-hover:text-purple-700 transition truncate">
                        {course.title || "Untitled Course"}
                      </h2>
                      <StatusBadge />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <LuUser size={13} className="text-gray-400" />
                        {course.instructorId?.userId
                          ? (course.instructorId.userId.lastName ? `${course.instructorId.userId.firstName} ${course.instructorId.userId.lastName}` : course.instructorId.userId.firstName)
                          : course.instructorId?.firstName
                            ? (course.instructorId.lastName ? `${course.instructorId.firstName} ${course.instructorId.lastName}` : course.instructorId.firstName)
                            : "Instructor"}
                      </span>
                      {course.categoryId?.name && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <LuTag size={13} className="text-gray-400" />
                          {course.categoryId.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <LuClock size={13} className="text-gray-400" />
                        Submitted {formatDate(course.createdAt)}
                      </span>
                      {course.studentCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {course.studentCount} student{course.studentCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <LuChevronRight
                    size={20}
                    className="text-gray-300 group-hover:text-purple-500 transition shrink-0 mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPendingCourses;
