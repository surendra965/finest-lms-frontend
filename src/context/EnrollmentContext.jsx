/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import { getMyEnrollments } from "../services/enrollmentService";

export const EnrollmentContext = createContext({
  enrolledCourseIds: new Set(),
  enrollments: [],
  loading: false,
  isEnrolled: () => false,
  refreshEnrollments: async () => {},
});

export const EnrollmentProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshEnrollments = useCallback(async () => {
    if (!user || user.role !== "student") {
      setEnrollments([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getMyEnrollments();
      setEnrollments(data || []);
    } catch (err) {
      console.error("EnrollmentContext: failed to fetch enrollments", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshEnrollments();
  }, [refreshEnrollments]);

  // Build a Set of course IDs for O(1) lookup
  const enrolledCourseIds = new Set(
    enrollments.map((en) => {
      const courseObj =
        en.courseId && typeof en.courseId === "object"
          ? en.courseId
          : en.course && typeof en.course === "object"
          ? en.course
          : null;
      const id = courseObj?._id ?? en.courseId ?? en._id;
      return String(id);
    })
  );

  const isEnrolled = useCallback(
    (courseId) => enrolledCourseIds.has(String(courseId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enrollments]
  );

  // Get enrollment detail (with progress) for a course
  const getEnrollment = useCallback(
    (courseId) => {
      const id = String(courseId);
      return enrollments.find((en) => {
        const courseObj =
          en.courseId && typeof en.courseId === "object"
            ? en.courseId
            : en.course && typeof en.course === "object"
            ? en.course
            : null;
        const enId = String(courseObj?._id ?? en.courseId ?? en._id);
        return enId === id;
      });
    },
    [enrollments]
  );

  return (
    <EnrollmentContext.Provider
      value={{
        enrollments,
        enrolledCourseIds,
        loading,
        isEnrolled,
        getEnrollment,
        refreshEnrollments,
      }}
    >
      {children}
    </EnrollmentContext.Provider>
  );
};

export const useEnrollment = () => useContext(EnrollmentContext);
