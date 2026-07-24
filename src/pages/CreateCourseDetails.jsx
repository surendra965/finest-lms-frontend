import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/authContext";
import { LuCircleCheck, LuLoader, LuSave, LuSend } from "react-icons/lu";
import { createCourse, submitCourseForReview } from "../services/courseService";
import { getCategories } from "../services/categoryService";
import { useCourse } from "../context/CourseContext";
import CourseHeader from "../components/course/CourseHeader";
import CourseSidebar from "../components/course/CourseSidebar";
import IntendedLearners from "../components/course/IntendedLearners";
import CourseLandingPage from "../components/course/CourseLandingPage";
import Curriculum from "../components/course/Curriculum";
import Pricing from "../components/course/Pricing";
import ConfirmDialog from "../components/ConfirmDialog";

const CreateCourseDetails = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { course, setCourse, loadCourse, sections, loadSections, loadLectures } = useCourse();

  const [activeTab, setActiveTabState] = useState("learners");

  const validateLearners = (c) => {
    if (!c) return "Course data not loaded.";
    const objectives = Array.isArray(c.learningObjectives)
      ? c.learningObjectives.filter((item) => item && item.trim())
      : [];
    const requirements = Array.isArray(c.requirements)
      ? c.requirements.filter((item) => item && item.trim())
      : [];
    const audience = Array.isArray(c.targetAudience)
      ? c.targetAudience.filter((item) => item && item.trim())
      : [];

    if (objectives.length < 4) {
      return "Please add at least 4 learning objectives.";
    }
    if (requirements.length < 1) {
      return "Please add at least one requirement.";
    }
    if (audience.length < 1) {
      return "Please add at least one target audience description.";
    }
    return null;
  };

  const validateLanding = (c) => {
    if (!c) return "Course data not loaded.";
    if (!c.title || c.title.trim().length < 5) {
      return "Course title must be at least 5 characters.";
    }
    if (/[0-9]/.test(c.title)) {
      return "Course title must not contain numbers.";
    }
    if (!c.subtitle || c.subtitle.trim().length === 0) {
      return "Please add a course subtitle.";
    }
    if (!c.description || c.description.trim().length === 0) {
      return "Please add a course description.";
    }
    if (!c.categoryId) {
      return "Please select a category.";
    }
    if (!c.thumbnail) {
      return "Please upload a course thumbnail. A visual cover represents your course landing page.";
    }
    return null;
  };

  const validateCurriculum = (secs) => {
    if (!Array.isArray(secs) || secs.length === 0) {
      return "Please add at least one section to your curriculum.";
    }
    const hasEmptySection = secs.some(
      (sec) =>
        !(
          (sec.totalLectures && sec.totalLectures > 0) ||
          (sec.lectures && sec.lectures.length > 0)
        )
    );
    if (hasEmptySection) {
      return "Every section in your curriculum must contain at least one lecture.";
    }
    return null;
  };

  const validatePricing = (c) => {
    if (!c) return "Course data not loaded.";
    if (c.price === undefined || c.price === null || c.price === "") {
      return "Please specify a course price.";
    }
    if (Number(c.price) < 0) {
      return "Course price cannot be negative.";
    }
    if (c.discountPrice !== undefined && c.discountPrice !== null && c.discountPrice !== "") {
      if (Number(c.discountPrice) >= Number(c.price)) {
        return "Discount price must be less than the original price.";
      }
    }
    return null;
  };

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
  };

  const handleTabChange = (targetTab, skipValidation = false) => {
    if (targetTab === activeTab) return;

    const tabOrder = ["learners", "landing", "curriculum", "pricing"];
    const targetIdx = tabOrder.indexOf(targetTab);
    const activeIdx = tabOrder.indexOf(activeTab);

    // If navigating forward
    if (targetIdx > activeIdx && !skipValidation) {
      // Validate every tab from activeTab up to (but not including) targetTab
      for (let i = activeIdx; i < targetIdx; i++) {
        const stepToCheck = tabOrder[i];
        if (!completedSteps.includes(stepToCheck)) {
          let errorMsg = "";
          if (stepToCheck === "learners") {
            const err = validateLearners(course);
            errorMsg = err || "Please complete the Intended Learners section first.";
          } else if (stepToCheck === "landing") {
            const err = validateLanding(course);
            errorMsg = err || "Please complete the Landing Page section first.";
          } else if (stepToCheck === "curriculum") {
            const err = validateCurriculum(sections);
            errorMsg = err || "Please complete the Curriculum section first.";
          } else if (stepToCheck === "pricing") {
            const err = validatePricing(course);
            errorMsg = err || "Please complete the Pricing section first.";
          }
          toast.error(errorMsg);
          return; // Block navigation
        }
      }
    }

    // Go to target tab (backward or valid forward)
    setActiveTab(targetTab);
  };

  const handleNextTab = () => {
    const tabOrder = ["learners", "landing", "curriculum", "pricing"];
    const curIdx = tabOrder.indexOf(activeTab);
    if (curIdx !== -1 && curIdx < tabOrder.length - 1) {
      handleTabChange(tabOrder[curIdx + 1], true);
    } else {
      toast.success("Pricing step completed! Redirecting to course details...");
      navigate(`/instructor/course/${courseId}`);
    }
  };

  const [courseId, setCourseId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [lectures, setLectures] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

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

  // Load all lectures for each section to check for video preparation tracking/progress
  useEffect(() => {
    if (sections && sections.length > 0) {
      let isMounted = true;
      const fetchAllLectures = async () => {
        const list = [];
        for (const sec of sections) {
          try {
            const lecs = sec.lectures?.length > 0 ? sec.lectures : await loadLectures(sec._id);
            if (lecs) list.push(...lecs);
          } catch (e) {
            console.error("Failed to fetch lectures for section:", sec._id, e);
          }
        }
        if (isMounted) {
          setLectures(list);
        }
      };
      fetchAllLectures();
      return () => {
        isMounted = false;
      };
    }
  }, [sections, loadLectures]);

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

  const hasProcessingVideo = useMemo(() => {
    return lectures.some(lec => {
      const hasVid = !!lec.video?.s3Prefix || !!lec.video?.masterPlaylist;
      return hasVid && lec.video?.processingStatus !== "completed";
    });
  }, [lectures]);

  const handleSubmitForReview = async () => {
    if (!courseId) {
      toast.error("No course draft found.");
      return;
    }

    if (!allStepsComplete) {
      toast.error("Please complete all sections before submitting for review.");
      return;
    }

    if (hasProcessingVideo) {
      toast.error("Your course still has videos processing. Please wait until all videos are ready before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await submitCourseForReview(courseId);
      toast.success(
        user?.role === "admin"
          ? "Your course has been successfully published! 🎉"
          : "Your course has been submitted for admin review! 🎉"
      );
      // Clean up draft data from local storage
      localStorage.removeItem("courseDraftId");
      localStorage.removeItem("courseDraft");
      localStorage.removeItem("courseDraftCreating");
      navigate("/instructor/courses");
    } catch (err) {
      toast.error(
        err.message || (user?.role === "admin" ? "Failed to publish course." : "Failed to submit course for review.")
      );
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const renderContent = () => {
    if (isLoadingCourse) {
      return (
        <div className="py-24 text-center text-gray-500 font-medium flex flex-col items-center gap-3">
          <LuLoader size={32} className="animate-spin text-purple-500" />
          <span>Loading course draft...</span>
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
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-purple-600 px-5 py-3 text-white hover:bg-purple-700 font-semibold transition cursor-pointer"
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
            onNext={handleNextTab}
          />
        );
      case "landing":
        return (
          <CourseLandingPage
            course={course}
            courseId={courseId}
            refreshCourse={() => loadCourse(courseId)}
            onNext={handleNextTab}
          />
        );
      case "curriculum":
        return <Curriculum course={course} onNext={handleNextTab} />;
      case "pricing":
        return (
          <Pricing course={course} refreshCourse={() => loadCourse(courseId)} onNext={handleNextTab} />
        );
      default:
        return null;
    }
  };

  const handleSaveDraft = async () => {
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <CourseHeader course={course} />

      <div className="flex">
        <CourseSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          completedSteps={completedSteps}
        />

        <div className="flex-1 p-8 max-w-5xl">
          {/* Page header with action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Creation</h1>
              <p className="text-gray-400 mt-1 text-sm">
                Build your course content, landing page, and curriculum.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Save as Draft button — always visible */}
              <button
                onClick={handleSaveDraft}
                disabled={saving || isLoadingCourse}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 font-semibold text-sm transition cursor-pointer"
              >
                <LuSave size={16} />
                {saving ? "Saving..." : "Save as Draft"}
              </button>

              {/* Submit for Review button — only when ALL steps complete */}
              {allStepsComplete && courseId && !hasProcessingVideo && (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 transition text-sm cursor-pointer"
                >
                  <LuSend size={16} />
                  {submitting
                    ? user?.role === "admin"
                      ? "Publishing..."
                      : "Submitting..."
                    : user?.role === "admin"
                      ? "Publish Course"
                      : "Submit for Review"}
                </button>
              )}
            </div>
          </div>

          {/* All steps complete — show banner */}
          {allStepsComplete && courseId && (
            hasProcessingVideo ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
                <LuLoader size={20} className="text-amber-600 shrink-0 animate-spin" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">
                    Videos are still processing.
                  </p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    Wait until all videos are ready before submitting.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
                <LuCircleCheck size={20} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800 text-sm">
                    {user?.role === "admin" ? "Your course is ready to publish!" : "Your course is ready for review!"}
                  </p>
                  <p className="text-green-700 text-xs mt-0.5">
                    {user?.role === "admin"
                      ? "All sections are complete. Publish your course to make it visible to students."
                      : "All sections are complete. Submit to the admin team for approval."}
                  </p>
                </div>
              </div>
            )
          )}

          <div className="bg-white rounded-xl shadow-sm border">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Confirm submission dialog */}
      <ConfirmDialog
        open={showSubmitConfirm}
        onConfirm={handleSubmitForReview}
        onCancel={() => setShowSubmitConfirm(false)}
        title={user?.role === "admin" ? "Publish Course?" : "Submit for Review?"}
        message={
          user?.role === "admin"
            ? "Are you sure you want to publish this course? It will immediately become visible to learners."
            : "Once submitted, your course will be reviewed by the admin team. You won't be able to edit it until the review is complete."
        }
        confirmText={user?.role === "admin" ? "Yes, Publish" : "Yes, Submit"}
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
};

export default CreateCourseDetails;
