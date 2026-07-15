import { useEffect, useRef, useState } from "react";
import { LuX, LuUpload, LuTrash2, LuFilm, LuPlus, LuFileText, LuCheck, LuLoader, LuCircleAlert } from "react-icons/lu";
import { toast } from "react-toastify";
import { useCourse } from "../../context/CourseContext";
import HlsPlayer from "./HlsPlayer";
import ConfirmDialog from "../ConfirmDialog";

/* ─────────────────────────────────────────
   Spinner helper
───────────────────────────────────────── */
const Spinner = ({ size = 16 }) => (
  <LuLoader size={size} className="animate-spin" />
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const LectureModal = ({
  open,
  onClose,
  courseId,
  sectionId,
  lecture = null,
}) => {
  const {
    course,
    createLecture,
    updateLecture,
    loadLectures,
    uploadLectureVideo,
    deleteLectureVideo,
    uploadLectureResource,
    deleteLectureResource,
    getLectureVideoStatus,
  } = useCourse();

  const effectiveCourseId = courseId || course?._id;

  /* ──────────────────── STATE ──────────────────── */
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!lecture);         // true when lecture already exists
  const [currentLecture, setCurrentLecture] = useState(lecture);           // holds the live lecture (after create/update)
  const [step, setStep] = useState(1);                 // step 1 (details) or step 2 (video/resources)
  const [lastCompletedVideo, setLastCompletedVideo] = useState(() => {
    if (lecture?.video?.processingStatus === "completed") {
      return lecture.video;
    }
    return null;
  });

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDeleting, setVideoDeleting] = useState(false);

  const [resourceFile, setResourceFile] = useState(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const videoInputRef = useRef(null);
  const resourceInputRef = useRef(null);

  const [form, setForm] = useState(() => ({
    title: lecture?.title || "",
    description: lecture?.description || "",
    duration: lecture?.duration || "",
    order: lecture?.order || 1,
    isPreview: lecture?.isPreview || false,
  }));

  /* eslint-disable react-hooks/set-state-in-effect */
  /* sync when lecture prop changes (edit mode re-open) */
  useEffect(() => {
    setCurrentLecture(lecture);
    setSaved(!!lecture);
    setStep(1); // Default to Step 1 on edit or re-open
    setLastCompletedVideo(lecture?.video?.processingStatus === "completed" ? lecture.video : null);
    setForm({
      title: lecture?.title || "",
      description: lecture?.description || "",
      duration: lecture?.duration || "",
      order: lecture?.order || 1,
      isPreview: lecture?.isPreview || false,
    });
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setResourceFile(null);
  }, [lecture]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* revoke object URL on unmount / change */
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  // Keep track of last completed video in case polling finishes or it updates
  useEffect(() => {
    if (currentLecture?.video?.processingStatus === "completed") {
      setLastCompletedVideo(currentLecture.video);
    }
  }, [currentLecture?.video]);

  const lectureId = currentLecture?._id || lecture?._id;

  // Polling for video transcoding status
  useEffect(() => {
    if (!open || !saved || !lectureId) return;

    const videoStatus = currentLecture?.video?.processingStatus;
    const hasVideo = !!currentLecture?.video?.s3Prefix || !!currentLecture?.video?.masterPlaylist;

    if (!hasVideo || videoStatus === "completed" || videoStatus === "failed") {
      return;
    }

    let isMounted = true;
    let timerId;

    const checkStatus = async () => {
      try {
        const data = await getLectureVideoStatus(lectureId);
        if (!isMounted) return;

        if (data.status === "completed" || data.status === "failed") {
          setCurrentLecture((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              video: {
                ...prev.video,
                processingStatus: data.status,
                masterPlaylist: data.streamUrl,
                processingError: data.error,
              },
            };
          });

          if (sectionId) {
            await loadLectures(sectionId);
          }
        } else {
          // Poll again in 6 seconds
          timerId = setTimeout(checkStatus, 6000);
        }
      } catch (err) {
        console.error("Error fetching transcoding status:", err);
        // Poll again in 10 seconds in case of intermittent network issues
        timerId = setTimeout(checkStatus, 10000);
      }
    };

    timerId = setTimeout(checkStatus, 5000);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [
    open,
    saved,
    currentLecture?.video?.processingStatus,
    currentLecture?.video?.masterPlaylist,
    currentLecture?.video?.s3Prefix,
    lectureId,
    getLectureVideoStatus,
    loadLectures,
    sectionId,
  ]);

  /* ──────────────────── HELPERS ──────────────────── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ──────────────────── VIDEO FILE PICKER ──────────────────── */
  const handleVideoFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      return;
    }
    setVideoFile(file);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const clearVideoFile = () => {
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  /* ──────────────────── VIDEO UPLOAD ──────────────────── */
  const handleUploadVideo = async () => {
    if (!lectureId) {
      toast.error("Please save the lecture details first before uploading a video.");
      return;
    }
    if (!videoFile) {
      toast.error("Please choose a video file first.");
      return;
    }

    try {
      setVideoUploading(true);
      const updated = await uploadLectureVideo(lectureId, videoFile);
      setCurrentLecture(updated);
      clearVideoFile();
      toast.success("Video uploaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to upload video");
    } finally {
      setVideoUploading(false);
    }
  };

  /* ──────────────────── VIDEO DELETE ──────────────────── */
  const handleDeleteVideo = () => {
    if (!lectureId) return;
    setConfirmDialog({
      title: "Remove Video?",
      message: "Are you sure you want to remove the video from this lecture? This action cannot be undone.",
      variant: "danger",
      confirmText: "Remove",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setVideoDeleting(true);
          const updated = await deleteLectureVideo(lectureId);
          setCurrentLecture(updated);
          toast.success("Video removed.");
        } catch (err) {
          toast.error(err.message || "Failed to remove video");
        } finally {
          setVideoDeleting(false);
        }
      },
    });
  };

  /* ──────────────────── RESOURCE UPLOAD ──────────────────── */
  const handleResourceFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResourceFile(file);
  };

  const clearResourceFile = () => {
    setResourceFile(null);
    if (resourceInputRef.current) resourceInputRef.current.value = "";
  };

  const handleUploadResource = async () => {
    if (!lectureId) {
      toast.error("Please save the lecture details first.");
      return;
    }
    if (!resourceFile) {
      toast.error("Please choose a file first.");
      return;
    }

    try {
      setResourceUploading(true);
      const updated = await uploadLectureResource(lectureId, resourceFile);
      setCurrentLecture(updated);
      clearResourceFile();
      toast.success("Resource uploaded!");
    } catch (err) {
      toast.error(err.message || "Failed to upload resource");
    } finally {
      setResourceUploading(false);
    }
  };

  const handleDeleteResource = (resourceId) => {
    if (!lectureId) return;
    setConfirmDialog({
      title: "Remove Resource?",
      message: "Are you sure you want to remove this downloadable resource?",
      variant: "danger",
      confirmText: "Remove",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setResourceUploading(true);
          const updated = await deleteLectureResource(lectureId, resourceId);
          setCurrentLecture(updated);
          toast.success("Resource removed.");
        } catch (err) {
          toast.error(err.message || "Failed to remove resource");
        } finally {
          setResourceUploading(false);
        }
      },
    });
  };

  /* ──────────────────── VALIDATE ──────────────────── */
  const validate = () => {
    if (!form.title.trim()) {
      toast.error("Lecture title is required");
      return false;
    }
    if (!form.duration || Number(form.duration) <= 0) {
      toast.error("Please enter a valid duration in minutes");
      return false;
    }
    return true;
  };

  /* ──────────────────── SAVE / UPDATE ──────────────────── */
  const handleSave = async () => {
    if (!validate()) return;

    if (!effectiveCourseId) {
      toast.error("Unable to create lecture: missing course ID.");
      return;
    }

    const payload = {
      courseId: effectiveCourseId,
      sectionId,
      title: form.title.trim(),
      description: form.description.trim(),
      duration: Number(form.duration),
      order: Number(form.order),
      isPreview: form.isPreview,
    };

    try {
      setSaving(true);

      if (lecture) {
        // EDIT existing lecture
        const updated = await updateLecture(lecture._id, payload);
        setCurrentLecture(updated);
        setSaved(true);
        toast.success("Lecture details saved!");
        setStep(2);
      } else {
        // CREATE new lecture
        const created = await createLecture(payload);
        setCurrentLecture(created);
        setSaved(true);
        toast.success("Lecture created! Move to upload video.");
        // Refresh the section lecture list so the new card appears
        if (sectionId) await loadLectures(sectionId);
        setStep(2);
      }
    } catch (err) {
      toast.error(err.message || "Failed to save lecture");
    } finally {
      setSaving(false);
    }
  };

  /* ──────────────────── CLOSE ──────────────────── */
  const handleClose = () => {
    onClose();
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === 2 && !saved) {
      toast.error("Please save the lecture details first before moving to Step 2.");
      return;
    }
    setStep(targetStep);
  };

  if (!open) return null;

  const hasVideo = !!currentLecture?.video?.masterPlaylist || !!currentLecture?.video?.s3Prefix;
  const isVideoProcessing = currentLecture?.video?.processingStatus === "processing" || currentLecture?.video?.processingStatus === "uploading";
  const isNewLecture = !lecture;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* ══════════════ HEADER ══════════════ */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isNewLecture ? "Add New Lecture" : "Edit Lecture"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5 font-medium">
              {isNewLecture
                ? "Fill in the details, save, then upload a video."
                : "Update lecture details, video, or resources."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-gray-800"
          >
            <LuX size={22} />
          </button>
        </div>

        {/* ══════════════ SCROLLABLE BODY ══════════════ */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-7">

          {/* ─── STEP INDICATOR ─── */}
          <div className="flex items-center gap-3 text-sm font-semibold select-none bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
            <button
              type="button"
              onClick={() => handleStepClick(1)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${step === 1 ? "bg-purple-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"}`}
            >
              {saved ? <LuCheck size={14} className="text-current font-bold" /> : <span className="font-bold">1</span>}
              Lecture Details
            </button>
            <div className="flex-1 h-0.5 bg-gray-200" />
            <button
              type="button"
              onClick={() => handleStepClick(2)}
              disabled={!saved}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${step === 2 ? "bg-purple-600 text-white shadow-sm" : saved ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100"}`}
            >
              <span className="font-bold">2</span>
              Upload Video & Resources
            </button>
          </div>

          {/* ─── STEP 1: LECTURE DETAILS ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Step 1: Lecture Details
              </h3>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Lecture Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Introduction to React Hooks"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition placeholder-gray-400 font-sans"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Explain what students will learn in this lecture..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition placeholder-gray-400 font-sans"
                />
              </div>

              {/* Duration + Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition placeholder-gray-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="order"
                    value={form.order}
                    onChange={handleChange}
                    placeholder="1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition placeholder-gray-400 font-sans"
                  />
                </div>
              </div>

              {/* Free Preview Toggle */}
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl px-5 py-4">
                <div>
                  <p className="font-bold text-gray-800 text-sm">Free Preview</p>
                  <p className="text-xs text-gray-500 mt-0.5">Students can watch this before purchasing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPreview"
                    checked={form.isPreview}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-600 transition-colors zoom-in" />
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-5 shadow" />
                </label>
              </div>

              {/* Save & Continue Details Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-2 cursor-pointer"
              >
                {saving ? (
                  <><Spinner size={16} /> Saving Details...</>
                ) : (
                  "Save & Continue"
                )}
              </button>
            </div>
          )}

          {/* ─── STEP 2: MOVIE UPLOAD & RESOURCES ─── */}
          {step === 2 && (
            <div className="space-y-6">

              {/* Lecture Video Area */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Step 2: Upload Lecture Video
                  </h3>
                </div>

                {/* Display movie or processing UI card */}
                {hasVideo && (
                  <div className="space-y-4">
                    {currentLecture.video?.processingStatus === "completed" ? (
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shadow">
                        <HlsPlayer
                          lectureId={lectureId}
                          fallbackSrc={currentLecture.video.masterPlaylist}
                          className="w-full max-h-52"
                        />
                      </div>
                    ) : currentLecture.video?.processingStatus === "failed" ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-red-500 bg-red-50/50 rounded-xl border border-red-200">
                        <LuCircleAlert size={28} className="text-red-500 animate-bounce" />
                        <span className="text-sm font-semibold text-red-600">Transcoding Failed</span>
                        <span className="text-xs text-red-400 max-w-md text-center px-4">
                          {currentLecture.video?.processingError || "An error occurred during transcoding. Please try re-uploading."}
                        </span>
                      </div>
                    ) : (
                      /* Better Processing UI with checklist and status steps */
                      <div className="bg-purple-50/35 border border-purple-100 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-emerald-600">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-sm">✓</span>
                          <span className="font-bold text-gray-900">Video Uploaded</span>
                        </div>
                        <p className="text-sm text-gray-600 pl-8 font-medium">
                          Your video has been uploaded successfully. We are processing your video now.
                        </p>

                        <div className="bg-white rounded-xl p-4 pl-8 space-y-2 border border-purple-100/50 max-w-xl shadow-2xs">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">During processing:</p>
                          <div className="space-y-1.5 text-sm text-gray-600">
                            <div className="flex items-center gap-2 text-gray-700">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>You can continue editing the course</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>Students cannot watch this lecture</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>Processing usually takes 2–10 minutes</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-purple-100 pt-4 pl-8">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Status</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold font-mono">
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <span>Uploading</span>
                              <span className="font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">✔</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-600">
                              <span>Transcoding</span>
                              <LuLoader size={12} className="animate-spin text-amber-500" />
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <span>Generating HLS...</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <span>Preparing Streaming...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replacement flow: display old video player below so active version stays visible */}
                    {isVideoProcessing && lastCompletedVideo && (
                      <div className="border border-purple-100 rounded-xl p-4 bg-purple-50/15 space-y-2">
                        <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                          Currently Live / Active Version
                        </p>
                        <p className="text-slate-500 text-xs font-medium">
                          Students see the previous version below while the new video is processing.
                        </p>
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900 mt-2 shadow">
                          <HlsPlayer
                            lectureId={`${lectureId}-old`}
                            fallbackSrc={lastCompletedVideo.masterPlaylist}
                            className="w-full max-h-48"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-xl shadow-2xs">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <LuFilm size={16} className="text-purple-600" />
                        <span className="truncate max-w-xs font-semibold">
                          {currentLecture.video?.processingStatus === "completed"
                            ? `✓ Video uploaded — ${currentLecture.title}`
                            : currentLecture.video?.processingStatus === "failed"
                              ? "⚠ Transcoding failed"
                              : "⏳ Video processing…"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteVideo}
                        disabled={videoDeleting}
                        className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-semibold transition cursor-pointer"
                      >
                        {videoDeleting ? <Spinner size={14} /> : <LuTrash2 size={14} />}
                        {videoDeleting ? "Removing..." : "Remove video"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Zone (If no video uploaded yet) */}
                {!hasVideo && (
                  <div>
                    {videoPreviewUrl ? (
                      /* Preview pending video upload */
                      <div className="rounded-xl overflow-hidden border-2 border-purple-300 bg-gray-900 shadow">
                        <video
                          src={videoPreviewUrl}
                          controls
                          className="w-full max-h-52 object-contain"
                        />
                        <div className="px-4 py-3 bg-gray-800 flex items-center justify-between">
                          <span className="text-sm text-gray-300 truncate max-w-xs font-semibold">
                            {videoFile?.name}
                          </span>
                          <button
                            type="button"
                            onClick={clearVideoFile}
                            className="text-gray-400 hover:text-red-400 text-sm ml-2 transition cursor-pointer"
                          >
                            <LuX size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload drop zone */
                      <label className="block w-full cursor-pointer">
                        <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl py-10 px-6 text-center transition group bg-gray-50/50">
                          <div className="w-14 h-14 rounded-full bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition">
                            <LuFilm size={26} className="text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700">
                              Click to choose a video file
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              MP4, WebM, MOV, AVI supported
                            </p>
                          </div>
                        </div>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFilePick}
                          className="sr-only"
                        />
                      </label>
                    )}

                    {/* Upload Video Button */}
                    {videoFile && (
                      <button
                        type="button"
                        onClick={handleUploadVideo}
                        disabled={videoUploading}
                        className="mt-3 flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow cursor-pointer"
                      >
                        {videoUploading ? (
                          <><Spinner size={16} /> Uploading video... (this may take a moment)</>
                        ) : (
                          <><LuUpload size={16} /> Upload Video</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Upload replacement input (if video present and is NOT actively processing/uploading) */}
                {hasVideo && !isVideoProcessing && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40">
                    <p className="text-xs text-gray-500 mb-2.5 font-bold uppercase tracking-wider">Replace Video</p>
                    {videoPreviewUrl ? (
                      <div className="flex items-center gap-3 bg-white border rounded-xl p-3 shadow-2xs">
                        <LuFilm size={16} className="text-purple-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate flex-1 font-semibold">{videoFile?.name}</span>
                        <button type="button" onClick={clearVideoFile} className="text-gray-400 hover:text-red-500 transition cursor-pointer">
                          <LuX size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 cursor-pointer bg-white hover:bg-gray-50 border rounded-xl p-3.5 shadow-2xs transition border-dashed hover:border-purple-400">
                        <LuUpload size={16} className="text-purple-500 shrink-0" />
                        <span className="text-sm text-gray-600 font-semibold">Choose new video file to replace...</span>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFilePick}
                          className="sr-only"
                        />
                      </label>
                    )}
                    {videoFile && (
                      <button
                        type="button"
                        onClick={handleUploadVideo}
                        disabled={videoUploading}
                        className="mt-3 flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 shadow cursor-pointer"
                      >
                        {videoUploading ? <><Spinner size={16} /> Uploading...</> : <><LuUpload size={16} /> Upload & Replace Video</>}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── DOWNLOADABLE RESOURCES ── */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Downloadable Resources
                  </h3>
                </div>

                {/* Existing resources */}
                {currentLecture?.resources?.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Attached Files ({currentLecture.resources.length})
                    </p>
                    {currentLecture.resources.map((resource) => (
                      <div
                        key={resource._id || resource.url}
                        className="flex items-center justify-between gap-3 bg-white rounded-lg px-4 py-3 border border-gray-100 shadow-2xs animate-fade-in"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <LuFileText size={16} className="text-purple-500 shrink-0" />
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-800 underline truncate font-medium"
                          >
                            {resource.title || resource.url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(resource._id)}
                          disabled={resourceUploading}
                          className="text-red-400 hover:text-red-650 transition shrink-0 cursor-pointer"
                        >
                          {resourceUploading ? <Spinner size={14} /> : <LuTrash2 size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload new resource */}
                <div className="space-y-3">
                  {resourceFile ? (
                    <div className="flex items-center gap-3 bg-gray-50 border rounded-xl p-3">
                      <LuFileText size={16} className="text-purple-500 shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1 font-semibold">{resourceFile.name}</span>
                      <button type="button" onClick={clearResourceFile} className="text-gray-400 hover:text-red-500 transition cursor-pointer">
                        <LuX size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 hover:border-purple-400 rounded-xl p-4 transition">
                      <LuPlus size={18} className="text-purple-500 shrink-0" />
                      <span className="text-sm text-gray-600 font-medium">Attach a downloadable file (PDF, ZIP, etc.)</span>
                      <input
                        ref={resourceInputRef}
                        type="file"
                        onChange={handleResourceFilePick}
                        className="sr-only"
                      />
                    </label>
                  )}

                  {resourceFile && (
                    <button
                      type="button"
                      onClick={handleUploadResource}
                      disabled={resourceUploading}
                      className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 cursor-pointer"
                    >
                      {resourceUploading ? (
                        <><Spinner size={16} /> Uploading resource...</>
                      ) : (
                        <><LuUpload size={16} /> Upload Resource</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2 Finish Actions */}
              <div className="flex items-center gap-3 pt-6 border-t font-semibold">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm transition cursor-pointer"
                >
                  Back to Details
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl text-center text-sm transition cursor-pointer"
                >
                  Finish
                </button>
              </div>

            </div>
          )}

        </div>

        {/* ══════════════ FOOTER ══════════════ */}
        <div className="flex items-center justify-between gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0 font-medium text-xs">
          <p className="text-gray-400">
            {saved
              ? "✓ Lecture is saved. Manage content using the steps above."
              : "Fill in the lecture details and click Save & Continue."}
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      <ConfirmDialog
        open={!!confirmDialog}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmText={confirmDialog?.confirmText}
        variant={confirmDialog?.variant}
      />
    </div>
  );
};

export default LectureModal;