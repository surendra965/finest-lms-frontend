import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LuArrowLeft,
  LuLoader,
  LuCircleCheck,
  LuCircleX,
  LuUser,
  LuTag,
  LuGlobe,
  LuChartBar,
  LuBookOpen,
  LuTarget,
  LuUsers,
  LuDollarSign,
  LuStar,
  LuVideo,
  LuTriangleAlert,
  LuPlay,
} from "react-icons/lu";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminCourse, approveCourse, rejectCourse } from "../../services/adminService";
import HlsPlayer from "../../components/course/HlsPlayer";

/* ── helpers ── */
const formatDuration = (mins) => {
  if (!mins) return "0 min";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const InfoChip = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-3">
    <Icon size={16} className="text-purple-500 shrink-0" />
    <div>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value || "—"}</p>
    </div>
  </div>
);

const SectionBlock = ({ title, icon: Icon, children, accent = "purple" }) => {
  const colors = {
    purple: "border-purple-200 bg-purple-50",
    green: "border-green-200 bg-green-50",
    blue: "border-blue-200 bg-blue-50",
  };
  return (
    <div className={`rounded-2xl border p-6 ${colors[accent]}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className={`text-${accent}-600`} />
        <h3 className={`font-bold text-${accent}-900 text-base`}>{title}</h3>
      </div>
      {children}
    </div>
  );
};

/* ── main component ── */
const AdminCourseReview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null); // 'approve' | 'reject' | null
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewingLectureId, setReviewingLectureId] = useState(null);
  const [reviewedLectures, setReviewedLectures] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getAdminCourse(courseId);
        setData(result);
      } catch (err) {
        toast.error(err.message || "Failed to load course details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleApprove = async () => {
    setActing("approve");
    try {
      await approveCourse(courseId);
      toast.success("Course approved and published!");
      navigate("/admin/courses/pending");
    } catch (err) {
      toast.error(err.message || "Approval failed");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActing("reject");
    try {
      await rejectCourse(courseId, rejectReason.trim());
      toast.success("Course has been rejected.");
      setShowRejectModal(false);
      navigate("/admin/courses/pending");
    } catch (err) {
      toast.error(err.message || "Rejection failed");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
          <LuLoader size={36} className="animate-spin text-purple-500" />
          <p className="text-sm font-medium">Loading course details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-400">
          <LuTriangleAlert size={36} className="text-red-300" />
          <p className="font-bold text-gray-700">Course not found</p>
          <button
            onClick={() => navigate("/admin/courses/pending")}
            className="text-sm font-semibold text-purple-600 hover:underline cursor-pointer"
          >
            ← Back to queue
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { course, sections = [], lectures = [], studentCount = 0 } = data;

  const hasLectureVideo = (lec) => {
    return !!(lec?.video?.masterPlaylist || lec?.video?.s3Prefix || lec?.videoUrl || lec?.video);
  };

  const lecturesWithVideos = lectures.filter(hasLectureVideo);
  const allVideosReviewed = lecturesWithVideos.every((lec) => reviewedLectures[lec._id]);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* ── Top Bar ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <button
            onClick={() => navigate("/admin/courses/pending")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-700 transition cursor-pointer"
          >
            <LuArrowLeft size={16} />
            Back to Queue
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Awaiting Review
          </span>
        </div>

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#1c1d1f] px-8 py-6 flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-gray-800">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <LuBookOpen size={36} className="text-gray-600" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-white leading-snug">{course.title}</h1>
              {course.subtitle && (
                <p className="text-gray-300 text-sm mt-1.5 line-clamp-2">{course.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <LuUser size={13} />
                  {course.instructorId?.userId
                    ? (course.instructorId.userId.lastName ? `${course.instructorId.userId.firstName} ${course.instructorId.userId.lastName}` : course.instructorId.userId.firstName)
                    : course.instructorId?.firstName
                      ? (course.instructorId.lastName ? `${course.instructorId.firstName} ${course.instructorId.lastName}` : course.instructorId.firstName)
                      : "Instructor"}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <LuTag size={13} />
                  {course.categoryId?.name || "—"}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <LuGlobe size={13} />
                  {course.language}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <LuChartBar size={13} />
                  {course.level}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <LuStar size={13} />
                  {course.averageRating?.toFixed(1) || "0.0"} rating
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
            {[
              { label: "Sections", value: sections.length },
              { label: "Lectures", value: course.totalLectures || lectures.length },
              { label: "Duration", value: formatDuration(course.totalDuration) },
              { label: "Students", value: studentCount },
            ].map((m) => (
              <div key={m.label} className="px-6 py-4 text-center">
                <p className="text-xl font-extrabold text-gray-900">{m.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoChip icon={LuDollarSign} label="Original Price" value={`₹${course.price ?? 0}`} />
          <InfoChip icon={LuDollarSign} label="Discount Price" value={`₹${course.discountPrice ?? 0}`} />
          <InfoChip icon={LuUsers} label="Enrollments" value={course.totalEnrollments ?? 0} />
          <InfoChip icon={LuVideo} label="Total Lectures" value={course.totalLectures ?? 0} />
        </div>

        {/* ── Description ── */}
        {course.description && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <LuBookOpen size={16} className="text-purple-500" />
              Course Description
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>
        )}

        {/* ── Learning Objectives / Requirements / Audience ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SectionBlock title="What students will learn" icon={LuTarget} accent="purple">
            <ul className="space-y-2">
              {(course.learningObjectives || []).map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-purple-800">
                  <LuCircleCheck size={15} className="text-purple-500 mt-0.5 shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </SectionBlock>

          <SectionBlock title="Requirements" icon={LuBookOpen} accent="blue">
            <ul className="space-y-2">
              {(course.requirements || []).map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </SectionBlock>

          <SectionBlock title="Target Audience" icon={LuUsers} accent="green">
            <ul className="space-y-2">
              {(course.targetAudience || []).map((aud, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  {aud}
                </li>
              ))}
            </ul>
          </SectionBlock>
        </div>

        {/* ── Curriculum ── */}
        {sections.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <LuBookOpen size={16} className="text-purple-500" />
              <h3 className="font-bold text-gray-900">Curriculum ({sections.length} sections)</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {sections.map((sec, i) => {
                const sectionLectures = lectures.filter((lec) => lec.sectionId === sec._id);
                return (
                  <div key={sec._id || i} className="px-6 py-5 space-y-3 bg-gray-50/30">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Section {i + 1}: {sec.title}
                      </p>
                      {sec.description && (
                        <p className="text-xs text-gray-400 mt-1">{sec.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {sectionLectures.length || 0} lecture{(sectionLectures.length) !== 1 ? "s" : ""}{" "}
                        {sec.totalDuration ? `• ${formatDuration(sec.totalDuration)}` : ""}
                      </p>
                    </div>

                    {/* Lectures under this section */}
                    {sectionLectures.length > 0 && (
                      <div className="pl-4 space-y-2 mt-2">
                        {sectionLectures.map((lec, idx) => {
                          const isReviewing = reviewingLectureId === lec._id;
                          const isReviewed = !!reviewedLectures[lec._id];
                          const hasVideo = hasLectureVideo(lec);
                          const masterPlaylist = lec.video?.masterPlaylist || lec.videoUrl;

                          return (
                            <div key={lec._id || idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <LuVideo size={16} className="text-purple-500" />
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-850">
                                      {idx + 1}. {lec.title}
                                    </h4>
                                    {lec.description && (
                                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{lec.description}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {hasVideo ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setReviewingLectureId(isReviewing ? null : lec._id);
                                          // Automatically mark as reviewed if they open it
                                          setReviewedLectures((prev) => ({ ...prev, [lec._id]: true }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border-none ${isReviewing
                                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                          : "bg-purple-600 text-white hover:bg-purple-700"
                                          }`}
                                      >
                                        <LuPlay size={12} />
                                        {isReviewing ? "Hide Video" : "Review Video"}
                                      </button>

                                      <button
                                        onClick={() => {
                                          setReviewedLectures((prev) => ({
                                            ...prev,
                                            [lec._id]: !prev[lec._id]
                                          }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${isReviewed
                                          ? "bg-green-100 text-green-700 border-green-200"
                                          : "bg-gray-150 text-gray-600 hover:bg-gray-200 border-gray-300"
                                          }`}
                                      >
                                        {isReviewed ? "✓ Reviewed" : "Mark Reviewed"}
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">No video lecture</span>
                                  )}
                                </div>
                              </div>

                              {/* HLS Video Player */}
                              {isReviewing && hasVideo && (
                                <div className="rounded-lg overflow-hidden border border-gray-300 shadow-md bg-gray-900">
                                  <HlsPlayer
                                    lectureId={lec._id}
                                    fallbackSrc={masterPlaylist}
                                    className="w-full max-h-80"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Action Bar ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">Ready to make a decision?</p>
            <p className="text-sm text-gray-500 mt-1">
              Approving will publish this course. Rejecting will notify the instructor.
            </p>
            {!allVideosReviewed && (
              <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                <LuTriangleAlert size={14} className="shrink-0" />
                <span>Please review all lecture videos before approving. ({Object.values(reviewedLectures).filter(Boolean).length} / {lecturesWithVideos.length} reviewed)</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={!!acting}
              className="flex items-center gap-2 border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <LuCircleX size={18} />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={!!acting || !allVideosReviewed}
              className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed ${allVideosReviewed ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
                }`}
              title={!allVideosReviewed ? "All videos must be reviewed first" : ""}
            >
              {acting === "approve" ? (
                <LuLoader size={18} className="animate-spin" />
              ) : (
                <LuCircleCheck size={18} />
              )}
              {acting === "approve" ? "Approving..." : "Approve & Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <LuTriangleAlert size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-extrabold text-gray-900">Reject Course</h2>
                <p className="text-xs text-gray-500">This will notify the instructor.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Course thumbnail quality is poor. Please upload a high-resolution 750×422px image..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 resize-none transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">{rejectReason.length}/500 characters</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={acting === "reject"}
                className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={acting === "reject" || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {acting === "reject" ? (
                  <>
                    <LuLoader size={16} className="animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCourseReview;
