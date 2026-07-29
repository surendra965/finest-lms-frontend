import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourse } from "../services/courseService";
import { useCourse } from "../context/CourseContext";

import CourseHeader from "../components/course/CourseHeader";
import CourseSidebar from "../components/course/CourseSidebar";
import ConfirmDialog from "../components/ConfirmDialog";

// Pages (moved to components)
import IntendedLearners from "../components/course/IntendedLearners";
import CourseLandingPage from "../components/course/CourseLandingPage";
import Curriculum from "../components/course/Curriculum";
import Pricing from "../components/course/Pricing";

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sections, loadSections } = useCourse();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
  };

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCourse(id);
      setCourse(data);
    } catch (err) {
      toast.error(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Load sections dynamically for checklist state validation
  useEffect(() => {
    if (id) {
      loadSections(id).catch((err) => {
        console.error("Failed to load sections in Editor:", err);
      });
    }
  }, [id, loadSections]);

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

  const handleTabChange = (targetTab) => {
    if (targetTab === activeTab) return;

    const tabOrder = ["learners", "landing", "curriculum", "pricing"];
    const targetIdx = tabOrder.indexOf(targetTab);
    const activeIdx = tabOrder.indexOf(activeTab);

    // If navigating forward
    if (targetIdx > activeIdx) {
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
      handleTabChange(tabOrder[curIdx + 1]);
    } else {
      toast.success("Pricing step completed! Redirecting to course details...");
      navigate(`/instructor/course/${id}`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "learners":
        return (
          <IntendedLearners
            course={course}
            refreshCourse={fetchCourse}
            onNext={handleNextTab}
          />
        );

      case "landing":
        return (
          <CourseLandingPage
            course={course}
            refreshCourse={fetchCourse}
            onNext={handleNextTab}
          />
        );

      case "curriculum":
        return (
          <Curriculum
            course={course}
            refreshCourse={fetchCourse}
            onNext={handleNextTab}
          />
        );

      case "pricing":
        return (
          <Pricing
            course={course}
            refreshCourse={fetchCourse}
            onNext={handleNextTab}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium">
        Loading course...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <CourseHeader course={course} />

      {/* Body */}
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <CourseSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          completedSteps={completedSteps}
        />

        {/* Content */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EditCourse;