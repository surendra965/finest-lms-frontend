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
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem("courseActiveTab") || "learners";
  });

  const [pendingTab, setPendingTab] = useState(null);
  const [showNavWarning, setShowNavWarning] = useState(false);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    localStorage.setItem("courseActiveTab", tabId);
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
    const isCurrentTabComplete = completedSteps.includes(activeTab);
    if (!isCurrentTabComplete) {
      setPendingTab(targetTab);
      setShowNavWarning(true);
    } else {
      setActiveTab(targetTab);
    }
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

      {/* Navigation warning dialog */}
      <ConfirmDialog
        open={showNavWarning}
        onConfirm={() => {
          if (pendingTab) setActiveTab(pendingTab);
          setShowNavWarning(false);
          setPendingTab(null);
        }}
        onCancel={() => {
          setShowNavWarning(false);
          setPendingTab(null);
        }}
        title="Form Incomplete"
        message="The current section has not been marked as complete. If you navigate away, this step will remain incomplete. Would you like to proceed anyway?"
        confirmText="Proceed Anyway"
        cancelText="Stay & Complete"
        variant="warning"
      />
    </div>
  );
};

export default EditCourse;