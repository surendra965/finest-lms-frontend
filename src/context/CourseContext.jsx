import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Course Services
import {
  createCourse,
  getCourse,
  updateCourse,
} from "../services/courseService";

// Section Services
import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
  reorderSections as reorderSectionsAPI,
} from "../services/sectionService";

// Lecture Services
import {
  createLecture,
  getLecturesBySection,
  updateLecture,
  deleteLecture,
  uploadLectureVideo,
  deleteLectureVideo,
  uploadLectureResource,
  deleteLectureResource,
  getLectureVideoStatus,
  reorderLectures as reorderLecturesAPI,
} from "../services/lectureSerivce";

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  /* ======================================
      STATE
  ====================================== */

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ======================================
      COURSE
  ====================================== */

  const handleCreateCourse = useCallback(async (payload) => {
    setLoading(true);

    try {
      const data = await createCourse(payload);
      setCourse(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourse = useCallback(async (courseId) => {
    setLoading(true);

    try {
      const data = await getCourse(courseId);
      setCourse(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateCourse = useCallback(async (courseId, payload) => {
    setLoading(true);

    try {
      const data = await updateCourse(courseId, payload);
      setCourse(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ======================================
      SECTIONS
  ====================================== */

  const loadSections = useCallback(async (courseId) => {
    setLoading(true);

    try {
      const data = await getSections(courseId);

      // initialize lectures array
      const formatted = data.map((section) => ({
        ...section,
        lectures: [],
      }));

      setSections(formatted);

      return formatted;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateSection = useCallback(async (courseId, payload) => {
    const section = await createSection(courseId, payload);

    setSections((prev) => [
      ...prev,
      {
        ...section,
        lectures: [],
      },
    ]);

    return section;
  }, []);

  const handleUpdateSection = useCallback(async (sectionId, payload) => {
    const updated = await updateSection(sectionId, payload);

    setSections((prev) =>
      prev.map((section) =>
        section._id === sectionId
          ? {
            ...section,
            ...updated,
          }
          : section
      )
    );

    return updated;
  }, []);

  const handleDeleteSection = useCallback(async (sectionId) => {
    await deleteSection(sectionId);

    setSections((prev) =>
      prev.filter((section) => section._id !== sectionId)
    );
  }, []);

  const handleReorderSections = useCallback(async (courseId, orderedIds) => {
    const reordered = await reorderSectionsAPI(courseId, orderedIds);

    const formatted = reordered.map((section) => {
      const existing = sections.find((s) => s._id === section._id);
      return {
        ...section,
        lectures: existing?.lectures || [],
      };
    });

    setSections(formatted);
    return formatted;
  }, [sections]);

  /* ======================================
      LECTURES
  ====================================== */

  const loadLectures = useCallback(async (sectionId) => {
    const lectures = await getLecturesBySection(sectionId);

    setSections((prev) =>
      prev.map((section) =>
        section._id === sectionId
          ? {
            ...section,
            lectures,
          }
          : section
      )
    );

    return lectures;
  }, []);

  const handleCreateLecture = useCallback(async (payload) => {
    const lecture = await createLecture(payload);

    setSections((prev) =>
      prev.map((section) =>
        section._id === lecture.sectionId
          ? {
            ...section,
            lectures: [...(section.lectures || []), lecture],
          }
          : section
      )
    );

    return lecture;
  }, []);

  const handleUpdateLecture = useCallback(async (lectureId, payload) => {
    const lecture = await updateLecture(lectureId, payload);

    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        lectures: (section.lectures || []).map((item) =>
          item._id === lectureId ? lecture : item
        ),
      }))
    );

    return lecture;
  }, []);

  const handleDeleteLecture = useCallback(async (lectureId) => {
    await deleteLecture(lectureId);

    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        lectures: (section.lectures || []).filter(
          (lecture) => lecture._id !== lectureId
        ),
      }))
    );
  }, []);

  const handleUploadLectureVideo = useCallback(
    async (lectureId, file) => {
      const lecture = await uploadLectureVideo(lectureId, file);

      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          lectures: (section.lectures || []).map((item) =>
            item._id === lectureId ? lecture : item
          ),
        }))
      );

      return lecture;
    },
    []
  );

  const handleDeleteLectureVideo = useCallback(async (lectureId) => {
    const lecture = await deleteLectureVideo(lectureId);

    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        lectures: (section.lectures || []).map((item) =>
          item._id === lectureId ? lecture : item
        ),
      }))
    );

    return lecture;
  }, []);

  const handleUploadLectureResource = useCallback(
    async (lectureId, file) => {
      const lecture = await uploadLectureResource(lectureId, file);

      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          lectures: (section.lectures || []).map((item) =>
            item._id === lectureId ? lecture : item
          ),
        }))
      );

      return lecture;
    },
    []
  );

  const handleDeleteLectureResource = useCallback(
    async (lectureId, resourceId) => {
      const lecture = await deleteLectureResource(
        lectureId,
        resourceId
      );

      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          lectures: (section.lectures || []).map((item) =>
            item._id === lectureId ? lecture : item
          ),
        }))
      );

      return lecture;
    },
    []
  );

  const handleGetLectureVideoStatus = useCallback(async (lectureId) => {
    return await getLectureVideoStatus(lectureId);
  }, []);

  const handleReorderLectures = useCallback(async (sectionId, orderedIds) => {
    const reordered = await reorderLecturesAPI(sectionId, orderedIds);

    setSections((prev) =>
      prev.map((section) =>
        section._id === sectionId
          ? { ...section, lectures: reordered }
          : section
      )
    );

    return reordered;
  }, []);

  /* ======================================
      CONTEXT
  ====================================== */

  const contextValue = useMemo(
    () => ({
      loading,

      // course
      course,
      setCourse,
      createCourse: handleCreateCourse,
      loadCourse,
      updateCourse: handleUpdateCourse,

      // sections
      sections,
      setSections,
      loadSections,
      createSection: handleCreateSection,
      updateSection: handleUpdateSection,
      deleteSection: handleDeleteSection,

      // lectures
      loadLectures,
      createLecture: handleCreateLecture,
      updateLecture: handleUpdateLecture,
      deleteLecture: handleDeleteLecture,
      uploadLectureVideo: handleUploadLectureVideo,
      deleteLectureVideo: handleDeleteLectureVideo,
      uploadLectureResource: handleUploadLectureResource,
      deleteLectureResource: handleDeleteLectureResource,
      getLectureVideoStatus: handleGetLectureVideoStatus,
      reorderSections: handleReorderSections,
      reorderLectures: handleReorderLectures,
    }),
    [
      loading,
      course,
      sections,
      handleCreateCourse,
      handleUpdateCourse,
      loadCourse,
      loadSections,
      handleCreateSection,
      handleUpdateSection,
      handleDeleteSection,
      handleReorderSections,
      loadLectures,
      handleCreateLecture,
      handleUpdateLecture,
      handleDeleteLecture,
      handleUploadLectureVideo,
      handleDeleteLectureVideo,
      handleUploadLectureResource,
      handleDeleteLectureResource,
      handleGetLectureVideoStatus,
      handleReorderLectures,
    ]
  );

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCourse = () => useContext(CourseContext);