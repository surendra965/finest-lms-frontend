import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../utils/auth";
import { toast } from "react-toastify";
import { AuthContext } from "../context/authContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { AiFillStar, AiOutlineTeam, AiOutlineGlobal, AiOutlineClockCircle, AiOutlineBook, AiOutlineEdit, AiOutlineFileText, AiOutlineDelete, AiOutlinePlusCircle, AiOutlinePauseCircle, AiFillCheckCircle, AiFillDollarCircle, AiOutlineBarChart, AiOutlineClose } from "react-icons/ai";
import { BsFillPlayFill } from "react-icons/bs";
import HlsPlayer from "../components/course/HlsPlayer";
const Stars = ({ rating = 0 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <AiFillStar
        key={s}
        size={18}
        className={s <= Math.round(rating) ? "text-[#f69c08]" : "text-[#6a6f73]"}
      />
    ))}
  </div>
);

/* ── Info Row (sidebar) ── */
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-[#e8e8e8] last:border-0">
    <span className="text-[#6a6f73] text-base w-5 flex-shrink-0">{icon}</span>
    <span className="text-sm text-[#1c1d1f] flex-1">{label}</span>
    <span className="text-sm font-semibold text-[#1c1d1f]">{value || "—"}</span>
  </div>
);

const InstructorCourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const formatTotalDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handlePreviewClick = () => {
    if (course.previewVideo?.url) {
      setShowPreviewModal(true);
    } else {
      toast.info("No promotional preview video uploaded for this course.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${API_URL}/api/courses/${id}`);
        const data = await res.json();
        if (!res.ok) { toast.error(data.message || "Failed to load course"); return; }
        setCourse(data.data);
      } catch { toast.error("Server error"); }
      finally { setLoading(false); }
    })();
  }, [API_URL, id]);

  const proceedDelete = async () => {
    try {
      setDeleting(true);
      const res = await authFetch(
        `${API_URL}/api/courses/${id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Course deleted successfully");
        navigate("/instructor/home");
      } else {
        toast.error(data.message || "Failed to delete course");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      title: "Delete Course?",
      message: `Are you sure you want to delete "${course.title || "this course"}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: () => {
        setConfirmDialog(null);
        proceedDelete();
      },
    });
  };

  const proceedPublishToggle = async () => {
    try {
      setPublishing(true);
      const endpoint =
        course.status === "published"
          ? `${API_URL}/api/courses/${id}/unpublish`
          : `${API_URL}/api/courses/${id}/publish`;

      const res = await authFetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update course status");
        return;
      }
      setCourse(data.data);
      toast.success(data.message);
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToggle = () => {
    if (course.status === "published") {
      setConfirmDialog({
        title: "Unpublish Course?",
        message: `Are you sure you want to unpublish "${course.title || "this course"}"? It will no longer be visible to new students.`,
        confirmText: "Unpublish",
        variant: "danger",
        onConfirm: () => {
          setConfirmDialog(null);
          proceedPublishToggle();
        },
      });
    } else {
      proceedPublishToggle();
    }
  };

  if (loading)
    return (
      <div className="h-[60vh] flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#e8e8e8] border-t-[#a435f0] rounded-full animate-spin" />
      </div>
    );

  if (!course) return null;

  const isPublished = course?.status?.toLowerCase() === "published";

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ════════════════════════════════════════════
          HERO  —  exact Udemy dark (#1c1d1f)
      ════════════════════════════════════════════ */}
      <div className="bg-[#1c1d1f]">
        <div className="max-w-[1180px] mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-0 items-start">

            {/* ── Left block ── */}
            <div className="flex-1 min-w-0 lg:pr-8">

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-[13px] text-[#a435f0] mb-4 flex-wrap">
                <button onClick={() => navigate("/instructor/home")} className="hover:underline font-medium">
                  My Courses
                </button>
                {course.category && (
                  <>
                    <span className="text-[#6a6f73] mx-1">›</span>
                    <span className="text-[#cec0fc]">{course.category}</span>
                  </>
                )}
                <span className="text-[#6a6f73] mx-1">›</span>
                <span className="text-[#cec0fc] truncate">{course.title}</span>
              </nav>

              {/* Title */}
              <h1 className="text-white text-[28px] font-extrabold leading-snug tracking-tight mb-3 max-w-2xl">
                {course.title}
              </h1>

              {/* Subtitle */}
              {course.subtitle && (
                <p className="text-[#cec0fc] text-[15px] leading-relaxed mb-4 max-w-2xl">
                  {course.subtitle}
                </p>
              )}

              {/* Status badge  */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {isPublished ? (
                  <span className="inline-flex items-center gap-1.5 bg-[#ecfdf5] text-[#065f46] text-[11px] font-bold px-2.5 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-[#fef9c3] text-[#854d0e] text-[11px] font-bold px-2.5 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Draft
                  </span>
                )}
                {course.level && (
                  <span className="text-[12px] text-[#cec0fc] border border-[#3e4143] px-2.5 py-1 rounded">
                    {course.level}
                  </span>
                )}
              </div>

              {/* Rating + enrollment row — Udemy style */}
              <div className="flex items-center gap-4 text-[14px] mb-6 flex-wrap">
                {course.averageRating ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#f69c08] font-bold">{course.averageRating}</span>
                    <Stars rating={course.averageRating} />
                    <span className="text-[#cec0fc] text-[13px]">
                      ({course.totalRatings?.toLocaleString() ?? 0} ratings)
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center gap-1.5 text-[#cec0fc]">
                  <AiOutlineTeam size={18} className="text-[#cec0fc]" />
                  <span className="font-semibold text-white">{(course.totalStudents ?? 0).toLocaleString()}</span>
                  <span>students</span>
                </div>

                {course.language && (
                  <div className="flex items-center gap-1 text-[#cec0fc]">
                    <AiOutlineGlobal size={18} className="text-[#cec0fc]" />
                    {course.language}
                  </div>
                )}

                <div className="flex items-center gap-3 text-[#cec0fc] text-[13px]">
                  <span className="inline-flex items-center gap-1"><AiOutlineBook size={16} className="text-[#cec0fc]" /> {course.totalLectures ?? 0} lectures</span>
                  <span className="inline-flex items-center gap-1"><AiOutlineClockCircle size={16} className="text-[#cec0fc]" /> {course.totalDuration ? formatTotalDuration(course.totalDuration) : null}</span>
                </div>
              </div>

              {/* ── Action Buttons — instructor controls ── */}
              <div className="flex flex-wrap gap-3 pt-5 border-t border-[#3e4143]">
                <button
                  onClick={() => {
                    localStorage.setItem("courseActiveTab", "landing");
                    navigate(`/instructor/course/${course._id}/edit`);
                  }}
                  className="flex items-center gap-2 bg-white text-[#1c1d1f] px-5 py-2.5 text-sm font-bold rounded hover:bg-[#f7f9fa] transition border border-[#d1d7dc]"
                >
                  <AiOutlineEdit size={18} className="font-bold" /> Edit Course
                </button>

                <button
                  onClick={handlePublishToggle}
                  disabled={publishing || course.status === "pending"}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded transition disabled:opacity-60
                    ${isPublished
                      ? "bg-[#f69c08] hover:bg-[#d98c07] text-white"
                      : course.status === "pending"
                        ? "bg-[#6a6f73]/50 text-white cursor-not-allowed"
                        : "bg-[#a435f0] hover:bg-[#8710d8] text-white"
                    }`}
                >
                  {publishing ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPublished ? (
                    <>
                      <AiOutlinePauseCircle size={18} /> Unpublish
                    </>
                  ) : course.status === "pending" ? (
                    "Pending Review"
                  ) : (
                    <>
                      <AiOutlinePlusCircle size={18} /> {user?.role === "admin" ? "Publish Course" : "Submit for Review"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    localStorage.setItem("courseActiveTab", "curriculum");
                    navigate(`/instructor/course/${id}/edit`);
                  }}
                  className="flex items-center gap-2 border border-[#6a6f73] text-[#cec0fc] hover:border-[#cec0fc] px-5 py-2.5 text-sm font-bold rounded transition"
                >
                  <AiOutlineBook size={18} className="font-bold" /> Curriculum
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="
                  flex items-center gap-2
                  border border-[#c0392b]/60
                  text-[#e74c3c]
                  hover:bg-[#e74c3c]/10
                  px-5 py-2.5
                  text-sm
                  font-bold
                  rounded
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  "
                >
                  {deleting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <AiOutlineDelete size={18} className="font-bold" /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Right: Thumbnail card — floats into white body ── */}
            <div className="w-full lg:w-[340px] flex-shrink-0 lg:sticky lg:top-4 mt-8 lg:mt-0 lg:-mb-16 z-10">
              <div className="border border-[#3e4143] lg:border-[#d1d7dc] rounded-lg overflow-hidden shadow-2xl bg-white">
                {/* Thumbnail */}
                {course.thumbnail ? (
                  <div className="relative group cursor-pointer" onClick={handlePreviewClick}>
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full aspect-video object-cover"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-[#1c1d1f]/50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                        <BsFillPlayFill size={26} className="text-[#1c1d1f]" />
                      </div>
                      <span className="text-white text-sm font-semibold">Preview this course</span>
                    </div>
                    {/* Bottom label always visible */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent py-3 px-4">
                      <p className="text-white text-xs font-bold text-center tracking-wide">Preview this course</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-[#2d2f31] flex flex-col items-center justify-center text-[#6a6f73] gap-2">
                    <BsFillPlayFill size={40} className="text-[#6a6f73]" />
                    <span className="text-xs">No thumbnail uploaded</span>
                  </div>
                )}

                {/* Price & CTA panel */}
                <div className="bg-white px-5 py-5 space-y-4">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {typeof course.discountPrice === 'number' && course.discountPrice < course.price ? (
                      <>
                        <span className="text-2xl font-extrabold text-[#1c1d1f]">
                          {course.discountPrice > 0 ? `₹${course.discountPrice}` : "Free"}
                        </span>
                        <span className="text-sm line-through text-[#6a6f73]">₹{course.price}</span>
                        <span className="text-xs text-green-600 font-bold">
                          {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% off
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-extrabold text-[#1c1d1f]">
                        {course.price > 0 ? `₹${course.price}` : "Free"}
                      </span>
                    )}
                    <span className="text-xs text-[#6a6f73] block w-full">course price</span>
                  </div>

                  {/* Publish / Unpublish CTA */}
                  <button
                    onClick={handlePublishToggle}
                    disabled={publishing || course.status === "pending"}
                    className={`w-full py-3 text-sm font-bold rounded transition disabled:opacity-60
                      ${isPublished
                        ? "bg-[#f69c08] hover:bg-[#d98c07] text-white"
                        : course.status === "pending"
                          ? "bg-[#6a6f73]/50 text-white cursor-not-allowed"
                          : "bg-[#a435f0] hover:bg-[#8710d8] text-white"
                      }`}
                  >
                    {publishing ? (
                      "Updating..."
                    ) : isPublished ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <AiOutlinePauseCircle size={18} /> Unpublish
                      </span>
                    ) : course.status === "pending" ? (
                      "Pending Review"
                    ) : (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <AiOutlinePlusCircle size={18} /> {user?.role === "admin" ? "Publish Course" : "Submit for Review"}
                      </span>
                    )}
                  </button>

                  {/* Status info */}
                  <div className={`flex items-start gap-2.5 rounded px-3 py-2.5 text-xs
                    ${isPublished
                      ? "bg-[#ecfdf5] text-[#065f46]"
                      : course.status === "pending"
                        ? "bg-[#eff6ff] text-[#1e40af]"
                        : "bg-[#fef9c3] text-[#854d0e]"}`}
                  >
                    <span className="text-base leading-none mt-0.5">
                      {isPublished ? (
                        <AiFillCheckCircle size={18} />
                      ) : course.status === "pending" ? (
                        <AiOutlineClockCircle size={18} className="text-blue-600" />
                      ) : (
                        <AiOutlineFileText size={18} />
                      )}
                    </span>
                    <p>
                      {isPublished
                        ? "Your course is live. Students can discover and enroll."
                        : course.status === "pending"
                          ? "Your course has been submitted for review. It will be live once approved."
                          : course.status === "rejected"
                            ? "This course was rejected. Please review issues and submit again."
                            : user?.role === "admin"
                              ? "This course is a draft. Publish it to make it visible to students."
                              : "This course is a draft. Submit it for review to make it visible to students."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          WHITE BODY — below the dark hero
      ════════════════════════════════════════════ */}
      <div className="bg-white">
        <div className="max-w-[1180px] mx-auto px-6 pt-20 pb-12 grid lg:grid-cols-3 gap-10">

          {/* ── Main 2/3 ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* What you'll learn */}
            {course.learningObjectives?.length > 0 && (
              <div className="border border-[#d1d7dc] rounded-lg p-6">
                <h2 className="text-[20px] font-bold text-[#1c1d1f] mb-5">What you'll learn</h2>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                  {course.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[14px] text-[#1c1d1f]">
                      <svg className="w-4 h-4 text-[#1c1d1f] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {obj}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1c1d1f] mb-4">Requirements</h2>
                <ul className="space-y-2.5">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#1c1d1f]">
                      <span className="text-[#6a6f73] flex-shrink-0 mt-1 text-xs">●</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {course.description && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1c1d1f] mb-4">Description</h2>
                <p className="text-[14px] text-[#1c1d1f] leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            )}

          </div>

          {/* ── Sidebar 1/3 ── */}
          <div className="space-y-5">

            {/* Course details card */}
            <div className="border border-[#d1d7dc] rounded-lg p-5">
              <h3 className="text-[15px] font-bold text-[#1c1d1f] mb-1 pb-3 border-b border-[#e8e8e8]">
                Course Details
              </h3>
              <InfoRow
                icon={<AiFillDollarCircle size={18} className="text-[#6a6f73]" />}
                label="Price"
                value={
                  typeof course.discountPrice === 'number' && course.discountPrice < course.price ? (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[#1c1d1f]">
                        {course.discountPrice > 0 ? `₹${course.discountPrice}` : "Free"}
                      </span>
                      <span className="line-through text-xs text-[#6a6f73]">₹{course.price}</span>
                    </span>
                  ) : (
                    course.price > 0 ? `₹${course.price}` : "Free"
                  )
                }
              />
              <InfoRow icon={<AiOutlineBarChart size={18} className="text-[#6a6f73]" />} label="Level" value={course.level} />
              <InfoRow icon={<AiOutlineGlobal size={18} className="text-[#6a6f73]" />} label="Language" value={course.language} />
              <InfoRow icon={<AiOutlineBook size={18} className="text-[#6a6f73]" />} label="Total Lectures" value={course.totalLectures} />
              <InfoRow icon={<AiOutlineClockCircle size={18} className="text-[#6a6f73]" />} label="Duration" value={course.totalDuration ? formatTotalDuration(course.totalDuration) : null} />
              <InfoRow icon={<AiOutlineTeam size={18} className="text-[#6a6f73]" />} label="Students" value={(course.totalStudents ?? 0).toLocaleString()} />
              {course.category && <InfoRow icon={<AiOutlineBook size={18} className="text-[#6a6f73]" />} label="Category" value={course.category} />}
            </div>

            {/* Quick actions */}
            <div className="border border-[#d1d7dc] rounded-lg p-5">
              <h3 className="text-[15px] font-bold text-[#1c1d1f] mb-3">Quick Actions</h3>
              <div className="space-y-0.5">
                {[
                  { label: "Edit course details", icon: <AiOutlineEdit size={18} className="font-bold" />, onClick: () => { localStorage.setItem("courseActiveTab", "landing"); navigate(`/instructor/course/${course._id}/edit`); }, style: "text-[#a435f0] hover:bg-[#f7f0ff]" },
                  { label: "Manage curriculum", icon: <AiOutlineBook size={18} className="font-bold" />, onClick: () => { localStorage.setItem("courseActiveTab", "curriculum"); navigate(`/instructor/course/${id}/edit`); }, style: "text-[#1c1d1f] hover:bg-[#f7f9fa]" },
                  { label: "View enrolled students", icon: <AiOutlineTeam size={18} className="font-bold" />, onClick: () => navigate(`/instructor/courses/${id}/students`), style: "text-[#1c1d1f] hover:bg-[#f7f9fa]" },
                  { label: deleting ? "Deleting..." : "Delete course", icon: deleting ? <AiOutlineFileText size={18} className="font-bold" /> : <AiOutlineDelete size={18} className="font-bold" />, onClick: handleDelete, style: "text-[#c0392b] hover:bg-[#fef2f2]" },
                ].map(({ label, icon, onClick, style }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className={`w-full text-left text-[13px] font-medium px-3 py-2.5 rounded flex items-center gap-2.5 transition ${style}`}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Preview Video Modal ── */}
      {showPreviewModal && course.previewVideo?.url && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1d1f] w-full max-w-3xl rounded-lg overflow-hidden shadow-2xl relative border border-[#3e4143]">
            <div className="flex items-center justify-between p-4 border-b border-[#3e4143]">
              <h3 className="text-white font-bold text-lg">Course Preview: {course.title}</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <HlsPlayer
                fallbackSrc={course.previewVideo.url}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reusable dialog */}
      {confirmDialog && (
        <ConfirmDialog
          open={!!confirmDialog}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText="Cancel"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          variant={confirmDialog.variant}
        />
      )}
    </div>
  );
};

export default InstructorCourseDetails;