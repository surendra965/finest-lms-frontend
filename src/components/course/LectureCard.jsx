import { useState } from "react";
import {
  LuPlay,
  LuPencil,
  LuTrash2,
  LuClock,
  LuEye,
  LuVideo,
  LuChevronDown,
  LuChevronUp,
  LuFileText,
  LuCheck,
  LuLoader,
  LuVideoOff,
} from "react-icons/lu";
import { toast } from "react-toastify";

import { useCourse } from "../../context/CourseContext";
import LectureModal from "./LectureModel";
import HlsPlayer from "./HlsPlayer";

const LectureCard = ({ lecture: initialLecture, sectionId, courseId }) => {
  const { deleteLecture, course, loadLectures } = useCourse();

  /* The card keeps its own local copy of the lecture so that
     after the modal updates it (via refreshLectures), the card
     reflects the latest data immediately on next re-render.      */
  const [lecture, setLecture]     = useState(initialLecture);
  const [editing, setEditing]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  /* ── derive video status from the nested video object ── */
  const videoData        = lecture?.video;
  const hasVideo         = !!videoData?.masterPlaylist || !!videoData?.s3Prefix;
  const processingStatus = videoData?.processingStatus;  // "completed" | "processing" | null
  const isCompleted      = processingStatus === "completed";
  const isProcessing     = processingStatus === "processing";
  const masterPlaylist   = videoData?.masterPlaylist;

  /* ── format duration from seconds to mm:ss ── */
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /* ── refresh the section list AND update local lecture copy ── */
  const refreshLectures = async () => {
    try {
      const lectures = await loadLectures(sectionId);
      // find the updated copy of this lecture from the refreshed list
      if (Array.isArray(lectures)) {
        const updated = lectures.find((l) => l._id === lecture._id);
        if (updated) setLecture(updated);
      }
    } catch (err) {
      console.error("Failed to refresh lectures:", err);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) return;
    try {
      setDeleting(true);
      await deleteLecture(lecture._id);
      toast.success("Lecture deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete lecture");
    } finally {
      setDeleting(false);
    }
  };

  /* ── EDIT MODAL ── */
  const handleEdit  = ()           => setEditing(true);
  const closeModal  = async ()     => { setEditing(false); await refreshLectures(); };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">

        {/* ════ TOP ROW ════ */}
        <div className="flex items-start justify-between gap-4 p-5">

          {/* Left — icon + info */}
          <div className="flex gap-4 flex-1 min-w-0">

            {/* Icon */}
            <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
              <LuPlay size={18} className="text-purple-600" />
            </div>

            {/* Text block */}
            <div className="flex-1 min-w-0">

              {/* Title + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 leading-snug">
                  {lecture.title}
                </h3>

                {lecture.isPreview && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                    <LuEye size={11} /> Free Preview
                  </span>
                )}

                {/* ── Video Status Badge ── */}
                {hasVideo && isCompleted && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                    <LuCheck size={11} /> Video Uploaded
                  </span>
                )}

                {hasVideo && isProcessing && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full animate-pulse">
                    <LuLoader size={11} className="animate-spin" /> Processing
                  </span>
                )}

                {!hasVideo && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full">
                    <LuVideoOff size={11} /> No Video
                  </span>
                )}
              </div>

              {/* Description */}
              {lecture.description && (
                <p className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-2">
                  {lecture.description}
                </p>
              )}

              {/* ── Video Name / Info ── */}
              {hasVideo && (
                <div className="flex items-center gap-2 mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <LuVideo size={14} className="text-purple-500 shrink-0" />
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {lecture.title}
                  </span>
                  {videoData?.metadata?.duration && (
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {formatDuration(videoData.metadata.duration)}
                    </span>
                  )}
                  {videoData?.metadata?.width && videoData?.metadata?.height && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {videoData.metadata.width}×{videoData.metadata.height}
                    </span>
                  )}
                  {videoData?.resolutions?.length > 0 && (
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full shrink-0 font-medium">
                      {videoData.resolutions.length} qualities
                    </span>
                  )}
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <LuClock size={12} />
                  {lecture.duration
                    ? formatDuration(lecture.duration)
                    : "0:00"}
                </span>
                <span>Order #{lecture.order}</span>
                {lecture.resources?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <LuFileText size={12} />
                    {lecture.resources.length} resource{lecture.resources.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle video player */}
            {hasVideo && isCompleted && masterPlaylist && (
              <button
                onClick={() => setShowVideo((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition"
                title={showVideo ? "Hide video" : "Preview video"}
              >
                <LuVideo size={15} />
                {showVideo ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
              </button>
            )}

            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm font-medium transition"
            >
              <LuPencil size={14} /> Edit
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition disabled:opacity-60"
            >
              <LuTrash2 size={14} />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>

        {/* ════ VIDEO PLAYER (collapsible) ════ */}
        {showVideo && (
          <div className="border-t border-gray-100 bg-gray-900">
            <HlsPlayer
              lectureId={lecture._id}
              fallbackSrc={masterPlaylist}
              className="w-full max-h-72"
            />
          </div>
        )}

        {/* ════ RESOURCES LIST ════ */}
        {lecture.resources?.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Downloadable Resources
            </p>
            <ul className="space-y-1.5">
              {lecture.resources.map((resource, index) => (
                <li key={resource._id || index} className="flex items-center gap-2 text-sm">
                  <LuFileText size={14} className="text-purple-500 shrink-0" />
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline underline-offset-2 truncate"
                  >
                    {resource.title || resource.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* ════ EDIT MODAL ════ */}
      <LectureModal
        key={`${lecture._id}-${editing}`}
        open={editing}
        onClose={closeModal}
        courseId={courseId || course?._id}
        sectionId={sectionId}
        lecture={lecture}
      />
    </>
  );
};

export default LectureCard;