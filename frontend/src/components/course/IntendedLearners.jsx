import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { updateCourse } from "../../services/courseService";

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

const IntendedLearners = ({
  course,
  courseId,
  refreshCourse,
}) => {

  const [saving, setSaving] = useState(false);

  const [requirements, setRequirements] = useState([
    createEmptyItem(),
  ]);

  const [objectives, setObjectives] = useState([
    createEmptyItem(),
  ]);

  const [audience, setAudience] = useState([
    createEmptyItem(),
  ]);

  /* ===========================
      LOAD COURSE DATA
  =========================== */

  useEffect(() => {
    if (!course) return;

    /*
      Updating local state from incoming `course` prop is intentional here.
      Disabling the eslint rule for set-state-in-effect to avoid false-positive.
    */
    /* eslint-disable react-hooks/set-state-in-effect */
    setRequirements(normalizeArray(course.requirements));

    setObjectives(normalizeArray(course.learningObjectives));

    setAudience(normalizeArray(course.targetAudience));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [course]);

  /* ===========================
      COMMON FUNCTIONS
  =========================== */

  const updateItem = (
    list,
    setter,
    id,
    value
  ) => {
    setter(
      list.map((item) =>
        item.id === id
          ? { ...item, value }
          : item
      )
    );
  };

  const addItem = (
    list,
    setter
  ) => {
    if (list.length >= MAX_ITEMS) {
      toast.warning(
        `Maximum ${MAX_ITEMS} items allowed`
      );
      return;
    }

    setter([
      ...list,
      createEmptyItem(),
    ]);
  };

  const removeItem = (
    list,
    setter,
    id
  ) => {
    if (list.length === 1) {
      setter([createEmptyItem()]);
      return;
    }

    setter(
      list.filter((item) => item.id !== id)
    );
  };

  /* ===========================
      FORMAT DATA
  =========================== */

  const payload = useMemo(() => {

    return {

      requirements: requirements
        .map((i) => i.value.trim())
        .filter(Boolean),

      learningObjectives: objectives
        .map((i) => i.value.trim())
        .filter(Boolean),

      targetAudience: audience
        .map((i) => i.value.trim())
        .filter(Boolean),

    };

  }, [
    requirements,
    objectives,
    audience,
  ]);

  /* ===========================
      VALIDATION
  =========================== */

  const validate = () => {

    if (
      payload.learningObjectives.length < 4
    ) {
      toast.error(
        "Add at least 4 learning objectives."
      );
      return false;
    }

    if (
      payload.requirements.length === 0
    ) {
      toast.error(
        "Please add at least one requirement."
      );
      return false;
    }

    if (
      payload.targetAudience.length === 0
    ) {
      toast.error(
        "Please add at least one target audience."
      );
      return false;
    }

    return true;
  };

  /* ===========================
      SAVE
  =========================== */

  const effectiveCourseId = courseId || course?._id;

  const handleSave = async () => {

    if (!validate()) return;
    if (!effectiveCourseId) {
      toast.error("Unable to update course: missing course ID.");
      return;
    }

    try {

      setSaving(true);

      await updateCourse(
        effectiveCourseId,
        payload
      );

      toast.success(
        "Intended learners updated."
      );

      if (refreshCourse) {
        await refreshCourse();
      }

    } catch (err) {

      toast.error(
        err.message ||
          "Failed to update course."
      );

    } finally {

      setSaving(false);

    }
  };
    /* ==========================================
      REUSABLE SECTION
  =========================================== */

  const renderSection = (
    title,
    description,
    list,
    setter,
    placeholder
  ) => (
    <div className="bg-white border rounded-lg shadow-sm mb-8">

      {/* Header */}

      <div className="border-b px-8 py-6">

        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>

        <p className="text-gray-600 mt-2 leading-7">
          {description}
        </p>

      </div>

      {/* Body */}

      <div className="p-8 space-y-5">

        {list.map((item, index) => (

          <div
            key={item.id}
            className="flex items-start gap-3"
          >

            {/* Number */}

            <div className="w-8 pt-3 text-gray-500 font-semibold">

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
                  updateItem(
                    list,
                    setter,
                    item.id,
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-md
                  border
                  border-gray-300
                  px-4
                  py-3
                  outline-none
                  focus:border-purple-600
                  focus:ring-2
                  focus:ring-purple-200
                "
              />

              <div className="text-right text-xs text-gray-400 mt-1">

                {item.value.length}/160

              </div>

            </div>

            {/* Delete */}

            <button
              type="button"
              onClick={() =>
                removeItem(
                  list,
                  setter,
                  item.id
                )
              }
              className="
                mt-2
                text-red-500
                hover:text-red-700
                font-semibold
              "
            >

              Remove

            </button>

          </div>

        ))}

        {/* Add */}

        <button
          type="button"
          onClick={() =>
            addItem(
              list,
              setter
            )
          }
          className="
            mt-2
            text-purple-700
            font-semibold
            hover:text-purple-900
          "
        >

          + Add more to your response

        </button>

      </div>

    </div>
  );

  return (

    <div className="space-y-8 max-w-5xl mx-auto px-4">

      {/* Header */}

      <div className="mb-10">

        <h1 className="text-3xl font-bold text-gray-900">

          Intended Learners

        </h1>

        <p className="text-gray-600 mt-3 leading-7">

          The following descriptions will publicly appear on your course landing page and will help learners decide if your course is right for them.

        </p>

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

      <div className="bottom-0 bg-white border rounded-xl px-5 py-5 mt-10 flex justify-end">

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`
            px-8
            py-3
            rounded-md
            font-semibold
            transition
            ${
              saving
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-purple-700 hover:bg-purple-800 text-white"
            }
          `}
        >
          {saving ? (
            <div className="flex items-center gap-2">

              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>

              Saving...

            </div>
          ) : (
            "Save"
          )}
        </button>

      </div>

    </div>

  );

};

export default IntendedLearners;