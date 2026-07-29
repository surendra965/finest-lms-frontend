import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ============================================
   GET ALL PENDING COURSES
   GET /admin/courses/pending
============================================ */
export const getPendingCourses = async () => {
  const res = await authFetch(`${API_URL}/api/admin/courses/pending`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch pending courses");
  return data.data;
};

/* ============================================
   GET SINGLE COURSE FOR REVIEW
   GET /admin/courses/:courseId
============================================ */
export const getAdminCourse = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/admin/courses/${courseId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch course details");
  return data.data;
};

/* ============================================
   APPROVE COURSE
   PATCH /admin/courses/:courseId/approve
============================================ */
export const approveCourse = async (courseId) => {
  const res = await authFetch(`${API_URL}/api/admin/courses/${courseId}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve course");
  return data.data;
};

/* ============================================
   REJECT COURSE
   PATCH /admin/courses/:courseId/reject
============================================ */
export const rejectCourse = async (courseId, reason) => {
  const res = await authFetch(`${API_URL}/api/admin/courses/${courseId}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reject course");
  return data.data;
};

export const createCategory = async (categoryData) => {
  const res = await authFetch(`${API_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(categoryData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create category");
  return data.data;
};

export const getCategoriesAdmin = async () => {
  const res = await authFetch(`${API_URL}/api/categories`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch categories");
  return data.data;
};

export const updateCategory = async (id, categoryData) => {
  const res = await authFetch(`${API_URL}/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(categoryData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update category");
  return data.data;
};

export const deleteCategory = async (id) => {
  const res = await authFetch(`${API_URL}/api/categories/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete category");
  return data;
};
