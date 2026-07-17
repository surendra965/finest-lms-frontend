import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LuPlus } from "react-icons/lu";
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
import SectionCard from "../../components/course/SectionCard";

/* ── Sortable Section Wrapper ── */
const SortableSection = ({ section, index, courseId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? "shadow-xl rounded-xl" : ""}`}>
      <SectionCard
        section={section}
        index={index}
        courseId={courseId}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const Curriculum = ({ course, onNext }) => {
  const {
    sections,
    loadSections,
    createSection,
    reorderSections,
    loading,
  } = useCourse();

  const [showAddSection, setShowAddSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionLoadCourseId, setSectionLoadCourseId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  /* ── LOAD SECTIONS ── */
  useEffect(() => {
    if (!course?._id) return;
    if (sectionLoadCourseId === course._id) return;

    const load = async () => {
      try {
        await loadSections(course._id);
        setSectionLoadCourseId(course._id);
      } catch (err) {
        toast.error(err.message);
      }
    };
    load();
  }, [course?._id, loadSections, sectionLoadCourseId]);

  /* ── INPUT CHANGE ── */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── CREATE SECTION ── */
  const handleCreateSection = async () => {
    if (!form.title.trim()) {
      toast.error("Section title is required");
      return;
    }
    try {
      setSaving(true);
      await createSection(course._id, {
        title: form.title,
        description: form.description,
        order: sections.length + 1,
        isPublished: false,
      });
      toast.success("Section created successfully");
      setForm({ title: "", description: "" });
      setShowAddSection(false);
      await loadSections(course._id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── DRAG & DROP ── */
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s._id === active.id);
    const newIndex = sections.findIndex((s) => s._id === over.id);
    const newOrder = arrayMove(sections, oldIndex, newIndex);

    try {
      await reorderSections(
        course._id,
        newOrder.map((s) => s._id)
      );
      toast.success("Sections reordered");
    } catch (err) {
      toast.error(err.message || "Failed to reorder sections");
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm transition";

  return (
    <div className="space-y-6 p-8">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Curriculum</h1>
          <p className="text-gray-500 mt-1 text-sm max-w-2xl leading-relaxed">
            Start putting together your course by creating sections, lectures and practice activities. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              toast.success("Curriculum draft is saved.");
            }}
            className="text-sm font-semibold border border-[#a435f0] text-[#a435f0] hover:bg-[#a435f0] hover:text-white px-5 py-2.5 rounded-lg transition cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            onClick={() => setShowAddSection(!showAddSection)}
            className="flex items-center gap-2 bg-[#a435f0] hover:bg-[#8710d8] text-white px-4 py-2.5 rounded-lg transition text-sm font-semibold cursor-pointer"
          >
            <LuPlus size={16} />
            Add Section
          </button>
        </div>
      </div>

      {/* ── VIDEO PROGRESS ── */}
      {(() => {
        const allLectures = (sections || []).flatMap((sec) => sec.lectures || []);
        const allVideos = allLectures.filter((lec) => !!lec.video?.s3Prefix || !!lec.video?.masterPlaylist);
        const totalVideosCount = allVideos.length;
        const readyVideosCount = allVideos.filter((lec) => lec.video?.processingStatus === "completed").length;
        const processingVideosCount = allVideos.filter((lec) => lec.video?.processingStatus !== "completed").length;
        const courseVideoPercent = totalVideosCount > 0 ? Math.round((readyVideosCount / totalVideosCount) * 100) : 0;

        if (totalVideosCount === 0) return null;

        return (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Video Progress</span>
              <span className="text-sm font-bold text-purple-600">{courseVideoPercent}% Ready</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${courseVideoPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-green-600">✓ {readyVideosCount} / {totalVideosCount} Ready</span>
              {processingVideosCount > 0 && (
                <span className="text-amber-600 animate-pulse">⏳ {processingVideosCount} Processing</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── ADD SECTION FORM ── */}
      {showAddSection && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Create New Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Example: Introduction" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea rows={3} name="description" value={form.description} onChange={handleChange} placeholder="Brief description of this section" className={`${inputClass} resize-none`} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddSection(false)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium cursor-pointer">
                Cancel
              </button>
              <button onClick={handleCreateSection} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition disabled:opacity-50 text-sm font-semibold cursor-pointer">
                {saving ? "Creating..." : "Create Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION LIST ── */}
      {loading ? (
        <div className="bg-white rounded-xl border p-16 text-center">
          <div className="text-sm font-medium text-gray-400">Loading curriculum...</div>
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-bold text-gray-800">No Sections Yet</h3>
            <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">
              Your course doesn't have any sections yet. Click <strong>Add Section</strong> to start building your curriculum.
            </p>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections.map((section, index) => (
                <SortableSection
                  key={section._id}
                  section={section}
                  index={index}
                  courseId={course?._id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ── FOOTER SAVE & NEXT ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex justify-end mt-6">
        <button
          onClick={() => {
            if (onNext) onNext();
          }}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold transition cursor-pointer text-sm"
        >
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default Curriculum;
