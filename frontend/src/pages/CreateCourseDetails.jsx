import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LuCircleCheck, LuLoader } from "react-icons/lu";
import { createCourse, submitCourseForReview } from "../services/courseService";
import { getCategories } from "../services/categoryService";
import { useCourse } from "../context/CourseContext";
import CourseHeader from "../components/course/CourseHeader";
import CourseSidebar from "../components/course/CourseSidebar";
import IntendedLearners from "../components/course/IntendedLearners";
import CourseLandingPage from "../components/course/CourseLandingPage";
import Curriculum from "../components/course/Curriculum";
import Pricing from "../components/course/Pricing";

const CreateCourseDetails = () => {
  const navigate = useNavigate();
  const { course, setCourse, loadCourse, sections, loadSections } = useCourse();
  const [activeTab, setActiveTab] = useState("learners");
  const [courseId, setCourseId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);

  const [localDraft] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("courseDraft")) || {};
    } catch {
      return {};
    }
  });

  // Load sections dynamically when courseId becomes available
  useEffect(() => {
    if (courseId) {
      loadSections(courseId).catch((err) => {
        console.error("Failed to load course sections:", err);
      });
    }
  }, [courseId, loadSections]);

  useEffect(() => {
    const draftId = localStorage.getItem("courseDraftId");

    if (draftId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCourseId(draftId);
      loadCourse(draftId)
        .catch(() => {
          localStorage.removeItem("courseDraftId");
        })
        .finally(() => {
          setIsLoadingCourse(false);
        });
      return;
    }

    if (!localDraft || Object.keys(localDraft).length === 0) {
      setIsLoadingCourse(false);
      return;
    }

    const createDraftCourse = async () => {
      if (localStorage.getItem("courseDraftCreating") === "true") {
        return;
      }

      localStorage.setItem("courseDraftCreating", "true");

      try {
        setSaving(true);

        const categoriesFromApi = await getCategories();

        const categoryMatch = categoriesFromApi.find(
          (category) =>
            category.name?.toLowerCase() ===
            (localDraft.category || "").toLowerCase()
        );

        const categoryId =
          categoryMatch?._id || categoriesFromApi[0]?._id;

        if (!categoryId) {
          throw new Error(
            "No active categories found. Please create a category before creating a course."
          );
        }

        const title =
          localDraft.title?.trim().length >= 5
            ? localDraft.title.trim()
            : "Untitled Course Draft";

        const created = await createCourse({
          categoryId,
          title,
          subtitle: localDraft.subtitle || "",
          description:
            localDraft.description?.trim() ||
            "Course description will be updated soon.",
          language: localDraft.language || "English",
          level: "beginner",
          price: 0,
          discountPrice: 0,
          requirements: [],
          learningObjectives: [],
          targetAudience: [],
          tags: localDraft.category ? [localDraft.category] : [],
        });

        setCourse(created);
        setCourseId(created._id);
        localStorage.setItem("courseDraftId", created._id);
        localStorage.removeItem("courseDraft");
      } catch (err) {
        toast.error(err.message || "Failed to create course draft.");
      } finally {
        localStorage.removeItem("courseDraftCreating");
        setSaving(false);
        setIsLoadingCourse(false);
      }
    };

    createDraftCourse();
  }, [localDraft, loadCourse, setCourse]);

  const completedSteps = useMemo(() => {
    if (!course) return [];

    const steps = [];

    // 1. learners
    const objectives = Array.isArray(course.learningObjectives)
      ? course.learningObjectives.filter((item) => item && item.trim())
      : [];
    const requirements = Array.isArray(course.requirements)
      ? course.requirements.filter((item) => item && item.trim())
      : [];
    const audience = Array.isArray(course.targetAudience)
      ? course.targetAudience.filter((item) => item && item.trim())
      : [];
    const isLearnersComplete =
      objectives.length >= 4 &&
      requirements.length >= 1 &&
      audience.length >= 1;
    if (isLearnersComplete) {
      steps.push("learners");
    }

    // 2. landing
    const isLandingComplete = !!(
      course.title &&
      course.title.trim().length >= 5 &&
      !/[0-9]/.test(course.title) &&
      course.subtitle &&
      course.subtitle.trim().length > 0 &&
      course.description &&
      course.description.trim().length > 0 &&
      course.categoryId &&
      course.thumbnail
    );
    if (isLandingComplete) {
      steps.push("landing");
    }

    // 3. curriculum
    const isCurriculumComplete =
      Array.isArray(sections) &&
      sections.length > 0 &&
      sections.every(
        (sec) =>
          (sec.totalLectures && sec.totalLectures > 0) ||
          (sec.lectures && sec.lectures.length > 0)
      );
    if (isCurriculumComplete) {
      steps.push("curriculum");
    }

    // 4. pricing
    const isPricingComplete =
      course.price !== undefined && course.price !== null;
    if (isPricingComplete) {
      steps.push("pricing");
    }

    return steps;
  }, [course, sections]);

  const allStepsComplete =
    completedSteps.includes("learners") &&
    completedSteps.includes("landing") &&
    completedSteps.includes("curriculum") &&
    completedSteps.includes("pricing");

  const handleSubmitForReview = async () => {
    if (!courseId) {
      toast.error("No course draft found.");
      return;
    }

    if (!allStepsComplete) {
      toast.error("Please complete all sections before submitting for review.");
      return;
    }

    setSubmitting(true);
    try {
      await submitCourseForReview(courseId);
      toast.success("Your course has been submitted for admin review! 🎉");
      // Clean up draft data from local storage
      localStorage.removeItem("courseDraftId");
      localStorage.removeItem("courseDraft");
      localStorage.removeItem("courseDraftCreating");
      navigate("/instructor/courses");
    } catch (err) {
      toast.error(err.message || "Failed to submit course for review.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoadingCourse) {
      return (
        <div className="py-24 text-center text-gray-500 font-medium">
          Loading course draft...
        </div>
      );
    }

    if (!courseId) {
      return (
        <div className="py-24 text-center text-gray-500 space-y-4 font-sans">
          <p className="text-lg font-semibold">No course draft found.</p>
          <p>Start from the course wizard so we can create your draft and enable the curriculum editor.</p>
          <button
            onClick={() => navigate("/instructor/create-course")}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-purple-600 px-5 py-3 text-white hover:bg-purple-700 font-semibold"
          >
            Back to wizard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "learners":
        return (
          <IntendedLearners
            course={course}
            courseId={courseId}
            refreshCourse={() => loadCourse(courseId)}
          />
        );
      case "landing":
        return (
          <CourseLandingPage
            course={course}
            courseId={courseId}
            refreshCourse={() => loadCourse(courseId)}
          />
        );
      case "curriculum":
        return <Curriculum course={course} />;
      case "pricing":
        return (
          <Pricing course={course} refreshCourse={() => loadCourse(courseId)} />
        );
      default:
        return null;
    }
  };

  const handleSave = async () => {
    if (!courseId) {
      toast.error("Please start from the wizard to create a course draft.");
      return;
    }

    setSaving(true);
    try {
      await loadCourse(courseId);
      toast.success("Course draft saved.");
    } catch (err) {
      toast.error(err.message || "Unable to refresh course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <CourseHeader course={course} />

      <div className="max-w-7xl mx-auto flex">
        <CourseSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          completedSteps={completedSteps}
        />

        <div className="flex-1 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Creation</h1>
              <p className="text-gray-500 mt-1">
                Build your course content, landing page, and curriculum.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || isLoadingCourse}
              className="inline-flex items-center justify-center rounded-md bg-purple-600 px-5 py-3 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300 font-semibold"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {/* All steps complete — show Submit for Review banner */}
          {allStepsComplete && courseId && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <LuCircleCheck size={24} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-800 text-base">
                    Your course is ready for review!
                  </p>
                  <p className="text-green-700 text-sm mt-0.5">
                    All sections are complete. Submit your course to the admin team for approval before publishing.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold px-6 py-3 transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <LuLoader size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-8">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseDetails;
