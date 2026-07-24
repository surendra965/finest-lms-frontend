import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  updateCourse,
  uploadCourseThumbnail,
  deleteCourseThumbnail,
  uploadCoursePreviewVideo,
  deleteCoursePreviewVideo,
} from "../../services/courseService";
import { getCategories } from "../../services/categoryService";
import { LuCloudUpload, LuTrash2, LuFilm, LuImage, LuLoader, LuSave } from "react-icons/lu";
import HlsPlayer from "./HlsPlayer";
import ConfirmDialog from "../ConfirmDialog";

const CourseLandingPage = ({ course, courseId, refreshCourse, onNext }) => {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailDeleting, setThumbnailDeleting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDeleting, setVideoDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type, handler }

  const [form, setForm] = useState({
    categoryId: "",
    title: "",
    subtitle: "",
    description: "",
    language: "English",
    level: "beginner",
    tags: "",
  });

  const effectiveCourseId = courseId || course?._id;

  /* ── LOAD CATEGORIES & COURSE ── */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const initializedCourseId = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!course) return;
    if (initializedCourseId.current === (course._id || courseId)) return;

    setForm({
      categoryId: course.categoryId?._id || course.categoryId || "",
      title: course.title || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      language: course.language || "English",
      level: course.level || "beginner",
      tags: course.tags?.join(", ") || "",
    });
    initializedCourseId.current = course._id || courseId;
  }, [course, courseId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── INPUT CHANGE ── */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ── THUMBNAIL ACTIONS ── */
  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (!effectiveCourseId) {
      toast.error("Save your course details first before uploading thumbnail.");
      return;
    }
    try {
      setThumbnailUploading(true);
      await uploadCourseThumbnail(effectiveCourseId, file);
      toast.success("Thumbnail updated successfully");
      if (refreshCourse) await refreshCourse();
    } catch (err) {
      toast.error(err.message || "Failed to upload thumbnail");
    } finally {
      setThumbnailUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!effectiveCourseId) return;
    try {
      setThumbnailDeleting(true);
      await deleteCourseThumbnail(effectiveCourseId);
      toast.success("Thumbnail removed successfully");
      if (refreshCourse) await refreshCourse();
    } catch (err) {
      toast.error(err.message || "Failed to remove thumbnail");
    } finally {
      setThumbnailDeleting(false);
      setConfirmAction(null);
    }
  };

  /* ── PREVIEW VIDEO ACTIONS ── */
  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file.");
      return;
    }
    if (!effectiveCourseId) {
      toast.error("Save your course details first before uploading preview video.");
      return;
    }
    try {
      setVideoUploading(true);
      await uploadCoursePreviewVideo(effectiveCourseId, file);
      toast.success("Preview video updated successfully");
      if (refreshCourse) await refreshCourse();
    } catch (err) {
      toast.error(err.message || "Failed to upload preview video");
    } finally {
      setVideoUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteVideo = async () => {
    if (!effectiveCourseId) return;
    try {
      setVideoDeleting(true);
      await deleteCoursePreviewVideo(effectiveCourseId);
      toast.success("Preview video removed successfully");
      if (refreshCourse) await refreshCourse();
    } catch (err) {
      toast.error(err.message || "Failed to remove preview video");
    } finally {
      setVideoDeleting(false);
      setConfirmAction(null);
    }
  };

  /* ── VALIDATION ── */
  const validate = (isNextCheck = false) => {
    const titleVal = form.title.trim();
    if (!titleVal) {
      toast.error("Course title is required");
      return false;
    }
    if (isNextCheck) {
      if (titleVal.length < 5) {
        toast.error("Course title must be at least 5 characters long.");
        return false;
      }
      if (/[0-9]/.test(titleVal)) {
        toast.error("Course title must not contain numbers.");
        return false;
      }
      if (!form.subtitle.trim()) {
        toast.error("Subtitle is required to proceed.");
        return false;
      }
      if (!form.description.trim()) {
        toast.error("Description is required to proceed.");
        return false;
      }
      if (!form.categoryId) {
        toast.error("Please select a category.");
        return false;
      }
      if (!course?.thumbnail) {
        toast.error("Please upload a course thumbnail. A visual cover represents your course landing page.");
        return false;
      }
    }
    return true;
  };

  /* ── SAVE COURSE ── */
  const handleSave = async (shouldNavigateNext = false) => {
    if (!validate(shouldNavigateNext)) return;
    if (!effectiveCourseId) {
      toast.error("Unable to update course: missing course ID.");
      return;
    }
    try {
      setSaving(true);
      await updateCourse(effectiveCourseId, {
        categoryId: form.categoryId,
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        language: form.language,
        level: form.level,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      toast.success("Course updated successfully");
      if (refreshCourse) await refreshCourse();
      if (shouldNavigateNext && onNext) {
        onNext();
      }
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm transition";

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Course Landing Page</h1>
          <p className="text-gray-500 mt-1 text-sm leading-relaxed">
            Your course landing page is important for attracting students. Spend time creating a compelling page that demonstrates why someone would want to enroll.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving}
          className="text-sm font-semibold border border-[#a435f0] text-[#a435f0] hover:bg-[#a435f0] hover:text-white px-5 py-2 rounded-lg transition"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
      </div>

      {/* Form fields in consistent cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        {/* Course Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} className={inputClass} placeholder="Insert your course title" />
          <p className="text-xs text-gray-400 mt-1">Your title should be clear, specific and attract students.</p>
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
          <textarea rows={3} name="subtitle" value={form.subtitle} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Write a compelling subtitle..." />
          <p className="text-xs text-gray-400 mt-1">Students read this before buying your course.</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Course Description</label>
          <textarea rows={8} name="description" value={form.description} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Describe your course..." />
          <p className="text-xs text-gray-400 mt-1">Explain what students will learn and why they should enroll.</p>
        </div>

        {/* Category, Language, Level */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className={inputClass}>
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <select name="language" value={form.language} onChange={handleChange} className={inputClass}>
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Tamil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Level</label>
            <select name="level" value={form.level} onChange={handleChange} className={inputClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all_levels">All Levels</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
          <textarea rows={2} name="tags" value={form.tags} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="React, JavaScript, Frontend" />
          <p className="text-xs text-gray-400 mt-1">Separate tags with commas.</p>
        </div>
      </div>

      {/* Course Image */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <label className="block text-sm font-bold text-gray-700 mb-4">Course Image</label>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="w-full md:w-56 aspect-video bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center relative group shrink-0">
            {course?.thumbnail ? (
              <>
                <img src={course.thumbnail} alt="Course Thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={() => setConfirmAction({ type: "thumbnail", handler: handleDeleteThumbnail })}
                    disabled={thumbnailDeleting || thumbnailUploading}
                    className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full transition shadow-lg cursor-pointer"
                    title="Remove Image"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-300 gap-1.5">
                <LuImage size={32} />
                <span className="text-xs">No image</span>
              </div>
            )}
            {(thumbnailUploading || thumbnailDeleting) && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <LuLoader className="w-7 h-7 text-purple-600 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-500 leading-relaxed">
              Upload your course image here. Important guidelines: 750×422 pixels; .jpg, .jpeg, or .png.
            </p>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center text-sm transition">
                <LuCloudUpload className="mr-2" size={16} />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleThumbnailChange} className="sr-only" disabled={thumbnailUploading || thumbnailDeleting} />
              </label>
              {course?.thumbnail && (
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: "thumbnail", handler: handleDeleteThumbnail })}
                  disabled={thumbnailDeleting || thumbnailUploading}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                  title="Remove thumbnail"
                >
                  <LuTrash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Video */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <label className="block text-sm font-bold text-gray-700 mb-4">Promotional Video</label>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="w-full md:w-56 aspect-video bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center relative group shrink-0">
            {course?.previewVideo?.url ? (
              <HlsPlayer fallbackSrc={course.previewVideo.url} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-300 gap-1.5">
                <LuFilm size={32} />
                <span className="text-xs">No video</span>
              </div>
            )}
            {(videoUploading || videoDeleting) && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <LuLoader className="w-7 h-7 text-purple-600 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-500 leading-relaxed">
              Your promo video is a quick and compelling way for students to preview what they will learn. Guidelines: .mp4, .mov, or .webm format.
            </p>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center text-sm transition">
                <LuCloudUpload className="mr-2" size={16} />
                <span>Upload Video</span>
                <input type="file" accept="video/*" onChange={handleVideoChange} className="sr-only" disabled={videoUploading || videoDeleting} />
              </label>
              {course?.previewVideo?.url && (
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: "video", handler: handleDeleteVideo })}
                  disabled={videoDeleting || videoUploading}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                  title="Remove video"
                >
                  <LuTrash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex justify-end">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 transition cursor-pointer text-sm"
        >
          <LuSave size={16} />
          {saving ? "Saving..." : "Save & Next"}
        </button>
      </div>

      {/* Confirm dialog for deletions */}
      <ConfirmDialog
        open={!!confirmAction}
        onConfirm={() => confirmAction?.handler()}
        onCancel={() => setConfirmAction(null)}
        title={confirmAction?.type === "thumbnail" ? "Remove Thumbnail?" : "Remove Preview Video?"}
        message="This action will permanently remove the uploaded media. You can re-upload later."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default CourseLandingPage;