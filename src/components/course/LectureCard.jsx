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
  LuVideoOff,
  LuGripVertical,
} from "react-icons/lu";
import { toast } from "react-toastify";

import { useCourse } from "../../context/CourseContext";
import LectureModal from "./LectureModel";
import HlsPlayer from "./HlsPlayer";
import ConfirmDialog from "../ConfirmDialog";

/* ── format duration from seconds to human-readable ── */
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0:00";
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const LectureCard = ({ lecture: initialLecture, sectionId, courseId, index, dragHandleProps }) => {
  const { deleteLecture, course, loadLectures } = useCourse();

  const [lecture, setLecture] = useState(initialLecture);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ── derive video status ── */
  const videoData = lecture?.video;
  const hasVideo = !!videoData?.masterPlaylist || !!videoData?.s3Prefix;
  const processingStatus = videoData?.processingStatus;
  const isCompleted = processingStatus === "completed";
  const masterPlaylist = videoData?.masterPlaylist;

  const getVideoBadge = () => {
    if (!hasVideo) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
          <LuVideoOff size={10} /> No Video
        </span>
      );
    }
    if (processingStatus === "completed") {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
          ✓ Ready
        </span>
      );
    }
    if (processingStatus === "failed") {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
          ✗ Failed
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full animate-pulse">
        ⏳ Processing
      </span>
    );
  };

  /* ── refresh & sync local lecture ── */
  const refreshLectures = async () => {
    try {
      const lectures = await loadLectures(sectionId);
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
    try {
      setDeleting(true);
      await deleteLecture(lecture._id);
      toast.success("Lecture deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete lecture");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  /* ── EDIT MODAL ── */
  const handleEdit = () => setEditing(true);
  const closeModal = async () => {
    setEditing(false);
    await refreshLectures();
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all duration-200 group">
        {/* ── TOP ROW ── */}
        <div className="flex items-start gap-3 p-4">
          {/* Drag handle */}
          {dragHandleProps && (
            <button
              type="button"
              className="mt-1 text-gray-600 hover:text-gray-800 cursor-grab active:cursor-grabbing shrink-0 touch-none"
              {...dragHandleProps}
            >
              <LuGripVertical size={14} />
            </button>
          )}

          {/* Icon */}
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
            <LuPlay size={15} className="text-purple-500" />
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                {index ? <span className="font-mono text-purple-500 mr-1 text-xs">{index}.</span> : null}
                {lecture.title}
              </h3>
              {lecture.isPreview && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                  <LuEye size={10} /> Free Preview
                </span>
              )}
              {getVideoBadge()}
            </div>

            {lecture.description && (
              <p className="text-gray-400 text-xs mt-1 line-clamp-1">{lecture.description}</p>
            )}

            {/* Video info row */}
            {hasVideo && (
              <div className="flex items-center gap-2 mt-2 bg-gray-50 rounded-lg px-2.5 py-1.5 text-xs">
                <LuVideo size={12} className="text-purple-400 shrink-0" />
                <span className="text-gray-500 font-medium truncate">{lecture.title}</span>
                {videoData?.metadata?.duration && (
                  <span className="text-gray-400 ml-auto shrink-0">{formatDuration(videoData.metadata.duration)}</span>
                )}
                {videoData?.resolutions?.length > 0 && (
                  <span className="text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0">
                    {videoData.resolutions.length} res
                  </span>
                )}
              </div>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <LuClock size={11} />
                {lecture.duration ? formatDuration(lecture.duration) : "0:00"}
              </span>
              <span>Order #{lecture.order}</span>
              {lecture.resources?.length > 0 && (
                <span className="flex items-center gap-1">
                  <LuFileText size={11} />
                  {lecture.resources.length} resource{lecture.resources.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasVideo && isCompleted && masterPlaylist && (
              <button
                onClick={() => setShowVideo((v) => !v)}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition"
                title={showVideo ? "Hide video" : "Preview video"}
              >
                <LuVideo size={14} />
              </button>
            )}
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition"
              title="Edit"
            >
              <LuPencil size={14} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition disabled:opacity-60"
              title="Delete"
            >
              <LuTrash2 size={14} />
            </button>
          </div>
        </div>

        {/* ── VIDEO PLAYER (collapsible) ── */}
        {showVideo && (
          <div className="border-t border-gray-100 bg-gray-900">
            <HlsPlayer lectureId={lecture._id} fallbackSrc={masterPlaylist} className="w-full max-h-72" />
          </div>
        )}

        {/* ── RESOURCES LIST ── */}
        {lecture.resources?.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Resources</p>
            <ul className="space-y-1">
              {lecture.resources.map((resource, idx) => (
                <li key={resource._id || idx} className="flex items-center gap-2 text-xs">
                  <LuFileText size={12} className="text-purple-400 shrink-0" />
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

      {/* ── EDIT MODAL ── */}
      <LectureModal
        key={`${lecture._id}-${editing}`}
        open={editing}
        onClose={closeModal}
        courseId={courseId || course?._id}
        sectionId={sectionId}
        lecture={lecture}
      />

      {/* ── DELETE CONFIRM ── */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Lecture?"
        message={`Are you sure you want to delete "${lecture.title}"? This will also remove any uploaded video and resources.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default LectureCard;