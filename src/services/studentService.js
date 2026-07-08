import { authFetch, readJson } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ==========================================
   GET MY LEARNING — /student/my-learning
========================================== */
export const getMyLearning = async () => {
  const res = await authFetch(`${API_URL}/api/student/my-learning`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to load learning courses");
  return data.data || [];
};

/* ==========================================
   GET STUDENT COURSE — /student/course/:courseId
========================================== */
export const getStudentCourse = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/student/course/${courseId}`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to load course");
  return data.data;
};

/* ==========================================
   GET CURRICULUM — /student/course/:courseId/curriculum
========================================== */
export const getCourseCurriculum = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/student/course/${courseId}/curriculum`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to load curriculum");
  return data.data || [];
};

/* ==========================================
   GET SINGLE LECTURE — /student/course/:courseId/lecture/:lectureId
========================================== */
export const getCourseLecture = async (courseId, lectureId) => {
  const res = await authFetch(`${API_URL}/api/student/course/${courseId}/lecture/${lectureId}`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to load lecture");
  return data.data;
};

/* ==========================================
   UPDATE LECTURE PROGRESS — PATCH /student/course/:courseId/lecture/:lectureId/progress
========================================== */
export const updateLectureProgress = async (courseId, lectureId) => {
  const res = await authFetch(
    `${API_URL}/api/student/course/${courseId}/lecture/${lectureId}/progress`,
    { method: "PATCH" }
  );
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to update progress");
  return data.data;
};

/* ==========================================
   GET COURSE PROGRESS — /student/course/:courseId/progress
========================================== */
export const getCourseProgress = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/student/course/${courseId}/progress`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to load progress");
  return data.data;
};

/* ==========================================
   GET RESUME LECTURE — /student/course/:courseId/resume
========================================== */
export const getResumeLecture = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/student/course/${courseId}/resume`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to load resume lecture");
  return data.data;
};

/* ==========================================
   COMPLETE COURSE — POST /student/course/:courseId/complete
========================================== */
export const completeCourse = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/student/course/${courseId}/complete`, {
    method: "POST",
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to complete course");
  return data;
};

export default {
  getMyLearning,
  getStudentCourse,
  getCourseCurriculum,
  getCourseLecture,
  updateLectureProgress,
  getCourseProgress,
  getResumeLecture,
  completeCourse,
};
