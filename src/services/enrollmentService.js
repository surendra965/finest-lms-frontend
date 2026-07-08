import { authFetch, readJson } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const enrollCourse = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/enrollments/${courseId}`, {
    method: "POST",
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to enroll");
  return data.data;
};

export const getMyEnrollments = async () => {
  const res = await authFetch(`${API_URL}/api/enrollments/my-courses`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to load enrollments");
  return data.data || [];
};

export const checkEnrollment = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/enrollments/check/${courseId}`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || "Failed to check enrollment");
  return data.data?.isEnrolled || false;
};



export default {
  enrollCourse,
  getMyEnrollments,
  checkEnrollment,
};
