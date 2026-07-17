import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { LuGripVertical, LuPlus, LuTrash2, LuSave } from "react-icons/lu";
import { updateCourse } from "../../services/courseService";
import ConfirmDialog from "../ConfirmDialog";
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

const MAX_ITEMS = 20;

const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  value: "",
});

const normalizeArray = (arr = []) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [createEmptyItem()];
  }
  return arr.map((item) => ({
    id: Date.now() + Math.random(),
    value: item,
  }));
};

/* ────── SORTABLE ITEM ────── */
const SortableItem = ({ item, index, list, setter, updateItem, onRemove, placeholder }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 group ${isDragging ? "shadow-lg rounded-lg bg-purple-50" : ""}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="mt-3.5 text-gray-600 hover:text-gray-800 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <LuGripVertical size={16} />
      </button>

      {/* Number */}
      <div className="w-6 pt-3.5 text-gray-600 text-sm font-medium text-right shrink-0">
        {index + 1}.
      </div>

      {/* Input */}
      <div className="flex-1">
        <input
          type="text"
          value={item.value}
          maxLength={160}
          placeholder={placeholder}
          onChange={(e) =>
            updateItem(list, setter, item.id, e.target.value)
          }
          className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm transition"
        />
        <div className="text-right text-[10px] text-gray-600 mt-0.5">
          {item.value.length}/160
        </div>
      </div>

      {/* Delete icon */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="mt-3 p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 transition shrink-0"
        title="Remove"
      >
        <LuTrash2 size={15} />
      </button>
    </div>
  );
};

const IntendedLearners = ({ course, courseId, refreshCourse, onNext }) => {
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // { list, setter, id }

  const [requirements, setRequirements] = useState([createEmptyItem()]);
  const [objectives, setObjectives] = useState([createEmptyItem()]);
  const [audience, setAudience] = useState([createEmptyItem()]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* ── LOAD COURSE DATA ── */
  useEffect(() => {
    if (!course) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setRequirements(normalizeArray(course.requirements));
    setObjectives(normalizeArray(course.learningObjectives));
    setAudience(normalizeArray(course.targetAudience));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [course]);

  /* ── COMMON FUNCTIONS ── */
  const updateItem = (list, setter, id, value) => {
    setter(list.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const addItem = (list, setter) => {
    if (list.length >= MAX_ITEMS) {
      toast.warning(`Maximum ${MAX_ITEMS} items allowed`);
      return;
    }
    setter([...list, createEmptyItem()]);
  };

  const removeItem = (list, setter, id) => {
    if (list.length === 1) {
      setter([createEmptyItem()]);
      return;
    }
    setter(list.filter((item) => item.id !== id));
  };

  const handleDragEnd = (event, list, setter) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((i) => i.id === active.id);
    const newIndex = list.findIndex((i) => i.id === over.id);
    setter(arrayMove(list, oldIndex, newIndex));
  };

  /* ── FORMAT DATA ── */
  const payload = useMemo(
    () => ({
      requirements: requirements.map((i) => i.value.trim()).filter(Boolean),
      learningObjectives: objectives.map((i) => i.value.trim()).filter(Boolean),
      targetAudience: audience.map((i) => i.value.trim()).filter(Boolean),
    }),
    [requirements, objectives, audience]
  );

  /* ── VALIDATION ── */
  const validate = () => {
    if (payload.learningObjectives.length < 4) {
      toast.error("Add at least 4 learning objectives.");
      return false;
    }
    if (payload.requirements.length === 0) {
      toast.error("Please add at least one requirement.");
      return false;
    }
    if (payload.targetAudience.length === 0) {
      toast.error("Please add at least one target audience.");
      return false;
    }
    return true;
  };

  /* ── SAVE ── */
  const effectiveCourseId = courseId || course?._id;

  const handleSave = async (shouldNavigateNext = false) => {
    if (!validate()) return;
    if (!effectiveCourseId) {
      toast.error("Unable to update course: missing course ID.");
      return;
    }
    try {
      setSaving(true);
      await updateCourse(effectiveCourseId, payload);
      toast.success("Intended learners updated.");
      if (refreshCourse) await refreshCourse();
      if (shouldNavigateNext && onNext) {
        onNext();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update course.");
    } finally {
      setSaving(false);
    }
  };

  /* ── REUSABLE SECTION ── */
  const renderSection = (title, description, list, setter, placeholder) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5 bg-white">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-gray-500 mt-1 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Body */}
      <div className="p-6 space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e, list, setter)}
        >
          <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {list.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                list={list}
                setter={setter}
                updateItem={updateItem}
                onRemove={(id) =>
                  setRemoveTarget({ list, setter, id })
                }
                placeholder={placeholder}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add button */}
        <button
          type="button"
          onClick={() => addItem(list, setter)}
          className="inline-flex items-center gap-1.5 mt-2 text-purple-600 font-semibold hover:text-purple-800 text-sm transition"
        >
          <LuPlus size={14} />
          Add more
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Intended Learners</h1>
          <p className="text-gray-500 mt-1 text-sm leading-relaxed">
            The following descriptions will publicly appear on your course landing page and will help learners decide if your course is right for them.
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

      {/* Requirements */}
      {renderSection(
        "What are the requirements or prerequisites for taking your course?",
        "List the skills, experience, tools or equipment learners should have before starting this course.",
        requirements,
        setRequirements,
        "Example: Basic HTML & CSS knowledge"
      )}

      {/* Objectives */}
      {renderSection(
        "What will students learn in your course?",
        "You must enter at least 4 learning objectives or outcomes that learners can expect after completing the course.",
        objectives,
        setObjectives,
        "Example: Build full stack React applications"
      )}

      {/* Audience */}
      {renderSection(
        "Who is this course for?",
        "Write the intended learners who will benefit the most from taking this course.",
        audience,
        setAudience,
        "Example: Beginner web developers"
      )}

      {/* Footer */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex justify-end">
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className={`
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition cursor-pointer
            ${saving
              ? "bg-gray-300 cursor-not-allowed text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
            }
          `}
        >
          <LuSave size={16} />
          {saving ? "Saving..." : "Save & Next"}
        </button>
      </div>

      {/* Remove confirmation */}
      <ConfirmDialog
        open={!!removeTarget}
        onConfirm={() => {
          if (removeTarget) {
            removeItem(removeTarget.list, removeTarget.setter, removeTarget.id);
          }
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
        title="Remove Item?"
        message="Are you sure you want to remove this item?"
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default IntendedLearners;