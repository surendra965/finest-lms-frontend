import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  updateCourse,
  uploadCourseThumbnail,
  deleteCourseThumbnail,
  uploadCoursePreviewVideo,
  deleteCoursePreviewVideo,
} from "../../services/courseService";
import { getCategories } from "../../services/categoryService";
import { FiUploadCloud, FiTrash2, FiFilm, FiImage, FiLoader } from "react-icons/fi";
import HlsPlayer from "./HlsPlayer";

const CourseLandingPage = ({
  course,
  courseId,
  refreshCourse,
}) => {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailDeleting, setThumbnailDeleting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDeleting, setVideoDeleting] = useState(false);

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

  /* =============================
      LOAD CATEGORIES & COURSE
  ============================== */

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!course) return;

    setForm({
      categoryId:
        course.categoryId?._id || course.categoryId || "",
      title: course.title || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      language: course.language || "English",
      level: course.level || "beginner",
      tags: course.tags?.join(", ") || "",
    });
  }, [course]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* =============================
      INPUT CHANGE
  ============================== */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /* =============================
      THUMBNAIL ACTIONS
  ============================== */

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
      if (refreshCourse) {
        await refreshCourse();
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload thumbnail");
    } finally {
      setThumbnailUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!effectiveCourseId) return;

    const confirmed = window.confirm("Are you sure you want to remove the course thumbnail?");
    if (!confirmed) return;

    try {
      setThumbnailDeleting(true);
      await deleteCourseThumbnail(effectiveCourseId);
      toast.success("Thumbnail removed successfully");
      if (refreshCourse) {
        await refreshCourse();
      }
    } catch (err) {
      toast.error(err.message || "Failed to remove thumbnail");
    } finally {
      setThumbnailDeleting(false);
    }
  };

  /* =============================
      PREVIEW VIDEO ACTIONS
  ============================== */

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
      if (refreshCourse) {
        await refreshCourse();
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload preview video");
    } finally {
      setVideoUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const handleDeleteVideo = async () => {
    if (!effectiveCourseId) return;

    const confirmed = window.confirm("Are you sure you want to remove the course preview video?");
    if (!confirmed) return;

    try {
      setVideoDeleting(true);
      await deleteCoursePreviewVideo(effectiveCourseId);
      toast.success("Preview video removed successfully");
      if (refreshCourse) {
        await refreshCourse();
      }
    } catch (err) {
      toast.error(err.message || "Failed to remove preview video");
    } finally {
      setVideoDeleting(false);
    }
  };

  /* =============================
      VALIDATION
  ============================== */

  const validate = () => {
    if (!form.title.trim()) {
      toast.error("Course title is required");
      return false;
    }

    if (!form.subtitle.trim()) {
      toast.error("Subtitle is required");
      return false;
    }

    if (!form.description.trim()) {
      toast.error("Description is required");
      return false;
    }

    return true;
  };

  /* =============================
      SAVE COURSE
  ============================== */

  const handleSave = async () => {
    if (!validate()) return;
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
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      toast.success("Course updated successfully");

      if (refreshCourse) {
        await refreshCourse();
      }

    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">

      {/* Header */}
      <div className="border-b px-8 py-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Course Landing Page
        </h2>
        <p className="text-gray-500 mt-2">
          Your course landing page is important if you want to be successful on
          our marketplace. Spend time creating a compelling course landing page
          that demonstrates why someone would want to enroll.
        </p>
      </div>

      {/* Form */}
      <div className="p-8 space-y-8">

        {/* Course Title */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Course Title
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="Insert your course title"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your title should be clear, specific and attract students.
          </p>
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Subtitle
          </label>
          <textarea
            rows={3}
            name="subtitle"
            value={form.subtitle}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            placeholder="Write a compelling subtitle..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Students read this before buying your course.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Course Description
          </label>
          <textarea
            rows={10}
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            placeholder="Describe your course..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Explain what students will learn and why they should enroll.
          </p>
        </div>

        {/* Category, Language, Level */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <label className="block text-sm font-semibold mb-2">
              Category
            </label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Language
            </label>
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              className="w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Tamil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Course Level
            </label>
            <select
              name="level"
              value={form.level}
              onChange={handleChange}
              className="w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all_levels">All Levels</option>
            </select>
          </div>

        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Tags
          </label>
          <textarea
            rows={3}
            name="tags"
            value={form.tags}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            placeholder="React, JavaScript, Frontend"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas.
          </p>
        </div>

        {/* Course Image */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Course Image
          </label>
          <div className="flex flex-col md:flex-row gap-6 items-start border p-6 rounded-md bg-gray-50">
            <div className="w-full md:w-1/3 aspect-video bg-gray-200 border rounded-md overflow-hidden flex items-center justify-center relative group">
              {course?.thumbnail ? (
                <>
                  <img
                    src={course.thumbnail}
                    alt="Course Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={handleDeleteThumbnail}
                      disabled={thumbnailDeleting || thumbnailUploading}
                      className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full transition shadow-lg cursor-pointer"
                      title="Remove Image"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <FiImage size={40} />
                  <span className="text-xs">No image uploaded</span>
                </div>
              )}

              {(thumbnailUploading || thumbnailDeleting) && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
                    <span className="text-xs font-semibold text-gray-600">
                      {thumbnailUploading ? "Uploading..." : "Deleting..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Upload your course image here. It must meet our course image quality standards to be accepted. 
                Important guidelines: 750x422 pixels; .jpg, .jpeg, or .png. No text on the image.
              </p>
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md inline-flex items-center text-sm transition">
                  <FiUploadCloud className="mr-2" size={18} />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="sr-only"
                    disabled={thumbnailUploading || thumbnailDeleting}
                  />
                </label>
                {course?.thumbnail && (
                  <button
                    type="button"
                    onClick={handleDeleteThumbnail}
                    disabled={thumbnailDeleting || thumbnailUploading}
                    className="border border-red-200 text-red-600 hover:bg-red-50 py-2 px-4 rounded-md text-sm font-medium transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Promotional Video */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Promotional Video
          </label>
          <div className="flex flex-col md:flex-row gap-6 items-start border p-6 rounded-md bg-gray-50">
            <div className="w-full md:w-1/3 aspect-video bg-gray-200 border rounded-md overflow-hidden flex items-center justify-center relative group">
              {course?.previewVideo?.url ? (
                <HlsPlayer
                  fallbackSrc={course.previewVideo.url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <FiFilm size={40} />
                  <span className="text-xs">No preview video uploaded</span>
                </div>
              )}

              {(videoUploading || videoDeleting) && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
                    <span className="text-xs font-semibold text-gray-600">
                      {videoUploading ? "Uploading..." : "Deleting..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Your promo video is a quick and compelling way for students to preview what they will learn in your course. 
                Students who watch a well-made promo video are 5X more likely to enroll. Guidelines: .mp4, .mov, or .webm format.
              </p>
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md inline-flex items-center text-sm transition">
                  <FiUploadCloud className="mr-2" size={18} />
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="sr-only"
                    disabled={videoUploading || videoDeleting}
                  />
                </label>
                {course?.previewVideo?.url && (
                  <button
                    type="button"
                    onClick={handleDeleteVideo}
                    disabled={videoDeleting || videoUploading}
                    className="border border-red-200 text-red-600 hover:bg-red-50 py-2 px-4 rounded-md text-sm font-medium transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-md font-semibold disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

      </div>

    </div>
  );
};

export default CourseLandingPage;