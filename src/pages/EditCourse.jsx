
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourse } from "../services/courseService";

import CourseHeader from "../components/course/CourseHeader";
import CourseSidebar from "../components/course/CourseSidebar";

// Pages (moved to components)
import IntendedLearners from "../components/course/IntendedLearners";
import CourseLandingPage from "../components/course/CourseLandingPage";
import Curriculum from "../components/course/Curriculum";
import Pricing from "../components/course/Pricing";


const EditCourse = () => {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("learners");
  const completedSteps = [
    "learners",
    "landing",
    "curriculum",
    "pricing",
  ];

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourse();
  }, [fetchCourse]);

  const renderContent = () => {
    switch (activeTab) {
      case "learners":
        return (
          <IntendedLearners
            course={course}
            refreshCourse={fetchCourse}
          />
        );

      case "landing":
        return (
          <CourseLandingPage
            course={course}
            refreshCourse={fetchCourse}
          />
        );

      case "curriculum":
        return (
          <Curriculum
            course={course}
            refreshCourse={fetchCourse}
          />
        );

      case "pricing":
        return (
          <Pricing
            course={course}
            refreshCourse={fetchCourse}
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
          setActiveTab={setActiveTab}
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