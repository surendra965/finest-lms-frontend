
import { useEffect, useState } from "react";
import {
  LuChevronDown,
  LuChevronRight,
  LuPencil,
  LuTrash2,
  LuSave,
  LuPlus,
} from "react-icons/lu";
import { toast } from "react-toastify";

import { useCourse } from "../../context/CourseContext";
import LectureCard from "./LectureCard";
import LectureModal from "./LectureModel";

const SectionCard = ({ section, index, courseId }) => {
  const {
    course,
    updateSection,
    deleteSection,
    loadLectures,
  } = useCourse();

  const refreshLectures = async () => {
    try {
      await loadLectures(section._id);
    } catch (err) {
      console.error("Failed to refresh lectures:", err);
    }
  };

  /* ==========================================
      STATE
  ========================================== */

  const [expanded, setExpanded] = useState(true);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [showLectureModal, setShowLectureModal] = useState(false);

  const [form, setForm] = useState({
    title: section.title || "",
    description: section.description || "",
  });

  /* ==========================================
      INPUT CHANGE
  ========================================== */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ==========================================
      UPDATE SECTION
  ========================================== */

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Section title is required");
      return;
    }

    try {
      setSaving(true);

      await updateSection(section._id, {
        title: form.title,
        description: form.description,
        order: section.order,
        isPublished: section.isPublished,
      });

      toast.success("Section updated successfully");

      setEditing(false);
    } catch (err) {
      toast.error(err.message || "Failed to update section");
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================
      DELETE SECTION
  ========================================== */

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this section?"
    );

    if (!confirmDelete) return;

    try {
      await deleteSection(section._id);

      toast.success("Section deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete section");
    }
  };

  /* ==========================================
      LECTURE MODAL
  ========================================== */

  useEffect(() => {
    if (!expanded || section.lectures?.length > 0) return;

    const load = async () => {
      try {
        await loadLectures(section._id);
      } catch (err) {
        toast.error(err.message || "Failed to load lectures");
      }
    };

    load();
  }, [expanded, section.lectures?.length, section._id, loadLectures]);

  const openLectureModal = () => {
    setShowLectureModal(true);
  };

  const closeLectureModal = async () => {
    setShowLectureModal(false);
    await refreshLectures();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">

      {/* ==========================================
          SECTION HEADER
      ========================================== */}

      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">

        <div className="flex items-center gap-4">

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-black transition"
          >
            {expanded ? (
              <LuChevronDown size={20} />
            ) : (
              <LuChevronRight size={20} />
            )}
          </button>

          <div>

            <h2 className="font-semibold text-lg text-gray-900">
              Section {index + 1}: {section.title}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {section.totalLectures || 0} lectures •{" "}
              {section.totalDuration || 0} mins
            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              section.isPublished
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {section.isPublished ? "Published" : "Draft"}
          </span>

          <button
            onClick={() => setEditing(!editing)}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
          >
            <LuPencil size={18} />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
          >
            <LuTrash2 size={18} />
          </button>

        </div>

      </div>

      {/* ==========================================
          SECTION BODY
      ========================================== */}

      {expanded && (

        <div className="p-6">

          {editing ? (

            <div className="space-y-5">

              {/* Section Title */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Section Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter section title"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                />

              </div>

              {/* Description */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Description
                </label>

                <textarea
                  rows={4}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter section description"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />

              </div>

              {/* Save */}

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition disabled:opacity-50"
              >
                <LuSave size={18} />

                {saving ? "Saving..." : "Save Section"}
              </button>

            </div>

          ) : (

            <div>

              <p className="text-gray-600 mb-6">
                {section.description || "No description available."}
              </p>

              {/* ==========================================
                  LECTURES
              ========================================== */}

              <div className="border rounded-lg overflow-hidden">

                <div className="flex items-center justify-between bg-gray-100 px-5 py-3">

                  <h3 className="font-semibold text-gray-800">
                    Lectures
                  </h3>

                  <button
                    onClick={openLectureModal}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <LuPlus size={16} />

                    Add Lecture
                  </button>

                </div>

                <div className="p-5">

                  {section.lectures?.length > 0 ? (

                    <div className="space-y-3">

                      {section.lectures.map((lecture) => (

                        <LectureCard
                          key={lecture._id}
                          lecture={lecture}
                          sectionId={section._id}
                          courseId={courseId}
                        />

                      ))}

                    </div>

                  ) : (

                    <div className="py-12 text-center">

                      <div className="text-5xl mb-4">
                        📚
                      </div>

                      <h4 className="text-lg font-semibold text-gray-800">
                        No lectures yet
                      </h4>

                      <p className="text-gray-500 mt-2">
                        Add your first lecture to start building this section.
                      </p>

                    </div>

                  )}

                </div>

              </div>

            </div>

          )}

        </div>

      )}

      {/* ==========================
          ADD / EDIT LECTURE MODAL
      =========================== */}

      <LectureModal
        key={`${section._id}-add-${showLectureModal}`}
        open={showLectureModal}
        onClose={closeLectureModal}
        courseId={courseId || course?._id}
        sectionId={section._id}
        lecture={null}
      />

    </div>
  );
};

export default SectionCard;

