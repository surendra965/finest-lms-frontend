import { useEffect, useState } from "react";
import {
  LuChevronDown,
  LuChevronRight,
  LuPencil,
  LuTrash2,
  LuSave,
  LuPlus,
  LuGripVertical,
  LuX,
} from "react-icons/lu";
import { toast } from "react-toastify";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useCourse } from "../../context/CourseContext";
import LectureCard from "./LectureCard";
import LectureModal from "./LectureModel";
import ConfirmDialog from "../ConfirmDialog";

/* ── Format seconds to human readable ── */
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0m 0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

/* ── Sortable Lecture Wrapper ── */
const SortableLecture = ({ lecture, sectionId, courseId, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lecture._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "shadow-lg rounded-xl" : ""}>
      <LectureCard
        lecture={lecture}
        sectionId={sectionId}
        courseId={courseId}
        index={index}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const SectionCard = ({ section, index, courseId, dragHandleProps }) => {
  const {
    course,
    updateSection,
    deleteSection,
    loadLectures,
    reorderLectures,
  } = useCourse();

  const isSectionPublished = section.isPublished || course?.status === 'published';

  const refreshLectures = async () => {
    try {
      await loadLectures(section._id);
    } catch (err) {
      console.error("Failed to refresh lectures:", err);
    }
  };

  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    title: section.title || "",
    description: section.description || "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  const handleDelete = async () => {
    try {
      await deleteSection(section._id);
      toast.success("Section deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete section");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

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

  const openLectureModal = () => setShowLectureModal(true);
  const closeLectureModal = async () => {
    setShowLectureModal(false);
    await refreshLectures();
  };

  /* ── Lecture drag & drop ── */
  const handleLectureDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const lectures = section.lectures || [];
    const oldIndex = lectures.findIndex((l) => l._id === active.id);
    const newIndex = lectures.findIndex((l) => l._id === over.id);
    const newOrder = arrayMove(lectures, oldIndex, newIndex);

    try {
      await reorderLectures(section._id, newOrder.map((l) => l._id));
      toast.success("Lectures reordered");
    } catch (err) {
      toast.error(err.message || "Failed to reorder lectures");
    }
  };

  /* ── Compute stats ── */
  const lectures = section.lectures || [];
  const computedLecturesCount = lectures.length || section.totalLectures || 0;
  const computedDuration =
    lectures.reduce((sum, lec) => sum + (Number(lec.duration) || 0), 0) ||
    section.totalDuration ||
    0;

  const inputClass = "w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm transition";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── SECTION HEADER ── */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          {dragHandleProps && (
            <button
              type="button"
              className="text-gray-600 hover:text-gray-800 cursor-grab active:cursor-grabbing shrink-0 touch-none"
              {...dragHandleProps}
            >
              <LuGripVertical size={16} />
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-700 transition shrink-0"
          >
            {expanded ? <LuChevronDown size={18} /> : <LuChevronRight size={18} />}
          </button>

          <div>
            <h2 className="font-semibold text-sm text-gray-900">
              Section {index + 1}: {section.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span>{formatDuration(computedDuration)}</span>
              <span>•</span>
              <span>{computedLecturesCount} lecture{computedLecturesCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${isSectionPublished
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
              }`}
          >
            {isSectionPublished ? "Published" : "Draft"}
          </span>

          <button
            onClick={() => setEditing(!editing)}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-400 hover:text-gray-700"
            title="Edit section"
          >
            <LuPencil size={14} />
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
            title="Delete section"
          >
            <LuTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── SECTION BODY ── */}
      {expanded && (
        <div className="p-5">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Enter section title" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea rows={3} name="description" value={form.description} onChange={handleChange} placeholder="Enter section description" className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium cursor-pointer">
                  <LuX size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm font-semibold cursor-pointer">
                  <LuSave size={14} /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {section.description && (
                <p className="text-gray-500 text-sm mb-4">{section.description}</p>
              )}

              {/* ── LECTURES ── */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-700">Lectures</h3>
                  <button
                    onClick={openLectureModal}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition text-xs font-semibold cursor-pointer"
                  >
                    <LuPlus size={13} /> Add Lecture
                  </button>
                </div>

                <div className="p-4">
                  {lectures.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLectureDragEnd}>
                      <SortableContext items={lectures.map((l) => l._id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2.5">
                          {lectures.map((lecture, lIdx) => (
                            <SortableLecture
                              key={lecture._id}
                              lecture={lecture}
                              sectionId={section._id}
                              courseId={courseId}
                              index={`${index + 1}.${lIdx + 1}`}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="text-4xl mb-3">📚</div>
                      <h4 className="text-sm font-semibold text-gray-700">No lectures yet</h4>
                      <p className="text-gray-400 mt-1 text-xs">
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

      {/* ── ADD / EDIT LECTURE MODAL ── */}
      <LectureModal
        key={`${section._id}-add-${showLectureModal}`}
        open={showLectureModal}
        onClose={closeLectureModal}
        courseId={courseId || course?._id}
        sectionId={section._id}
        lecture={null}
      />

      {/* ── DELETE CONFIRM ── */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Section?"
        message={`Are you sure you want to delete "${section.title}"? This will also delete all lectures in this section. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SectionCard;
