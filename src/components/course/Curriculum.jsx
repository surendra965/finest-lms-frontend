
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LuPlus } from "react-icons/lu";

import { useCourse } from "../../context/CourseContext";
import SectionCard from "../../components/course/SectionCard";

const Curriculum = ({ course }) => {
  const {
    sections,
    loadSections,
    createSection,
    loading,
  } = useCourse();

  /* ===========================================
      LOCAL STATE
  =========================================== */

  const [showAddSection, setShowAddSection] = useState(false);

  const [saving, setSaving] = useState(false);

  const [sectionLoadCourseId, setSectionLoadCourseId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  /* ===========================================
      LOAD SECTIONS
  =========================================== */

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

  /* ===========================================
      INPUT CHANGE
  =========================================== */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ===========================================
      CREATE SECTION
  =========================================== */

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

      setForm({
        title: "",
        description: "",
      });

      setShowAddSection(false);

      await loadSections(course._id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-8">

      {/* ===========================================
          PAGE HEADER
      =========================================== */}

      <div className="bg-white rounded-xl border shadow-sm p-6">

        <div className="flex items-start justify-between">

          <div>

            <h2 className="text-2xl font-bold text-gray-900">
              Curriculum
            </h2>

            <p className="text-gray-500 mt-2 max-w-3xl">
              Start putting together your course by creating sections,
              lectures and practice activities. Organize your content
              exactly the way students will experience it.
            </p>

          </div>

          <button
            onClick={() => setShowAddSection(!showAddSection)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg transition"
          >
            <LuPlus size={18} />

            Add Section
          </button>

        </div>

      </div>

      {/* ===========================================
          ADD SECTION FORM
      =========================================== */}

      {showAddSection && (

        <div className="bg-white rounded-xl border shadow-sm p-6">

          <h3 className="text-lg font-semibold mb-5">
            Create New Section
          </h3>

          <div className="space-y-5">

            <div>

              <label className="block text-sm font-medium mb-2">
                Section Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: Introduction"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              />

            </div>

            <div>

              <label className="block text-sm font-medium mb-2">
                Description
              </label>

              <textarea
                rows={4}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of this section"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />

            </div>

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setShowAddSection(false)}
                className="px-5 py-2 rounded-lg border hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateSection}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Section"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ===========================================
          SECTION LIST
      =========================================== */}

      {loading ? (

        <div className="bg-white rounded-xl border p-16 text-center">

          <div className="text-lg font-medium">
            Loading curriculum...
          </div>

        </div>

      ) : sections.length === 0 ? (

        <div className="bg-white rounded-xl border shadow-sm">

          <div className="py-20 text-center">

            <div className="text-6xl mb-5">
              📚
            </div>

            <h3 className="text-2xl font-bold text-gray-800">
              No Sections Yet
            </h3>

            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Your course doesn't have any sections yet.
              Click <strong>Add Section</strong> to start
              building your curriculum.
            </p>

          </div>

        </div>

      ) : (

        <div className="space-y-6">

          {sections.map((section, index) => (

            <SectionCard
              key={section._id}
              section={section}
              index={index}
              courseId={course?._id}
            />

          ))}

        </div>

      )}
    </div>
  );
};

export default Curriculum;
