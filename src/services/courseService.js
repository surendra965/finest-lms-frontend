import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ===========================
   CREATE COURSE
=========================== */

export const createCourse = async (courseData) => {
  const response = await authFetch(`${API_URL}/api/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create course");
  }

  return data.data;
};

/* ===========================
   GET COURSE
=========================== */

export const getCourse = async (courseId) => {
  const response = await authFetch(`${API_URL}/api/courses/${courseId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load course");
  }

  return data.data;
};

/* ===========================
   UPDATE COURSE
=========================== */

export const updateCourse = async (courseId, courseData) => {
  const response = await authFetch(`${API_URL}/api/courses/${courseId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update course");
  }

  return data.data;
};

/* ===========================
   SUBMIT COURSE FOR REVIEW
=========================== */
export const submitCourseForReview = async (courseId) => {
  const response = await authFetch(`${API_URL}/api/courses/${courseId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit course for review");
  }

  return data.data;
};

/* ===========================
   UPLOAD COURSE THUMBNAIL
=========================== */
export const uploadCourseThumbnail = async (courseId, file) => {
  const formData = new FormData();
  formData.append("thumbnail", file);

  const response = await authFetch(`${API_URL}/api/courses/${courseId}/thumbnail`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload thumbnail");
  }

  return data.data;
};

/* ===========================
   DELETE COURSE THUMBNAIL
=========================== */
export const deleteCourseThumbnail = async (courseId) => {
  const response = await authFetch(`${API_URL}/api/courses/${courseId}/thumbnail`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete thumbnail");
  }

  return data;
};

/* ===========================
   UPLOAD COURSE PREVIEW VIDEO
=========================== */
export const uploadCoursePreviewVideo = async (courseId, file) => {
  const formData = new FormData();
  formData.append("previewVideo", file);

  const response = await authFetch(`${API_URL}/api/courses/${courseId}/preview-video`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload preview video");
  }

  return data.data;
};

/* ===========================
   DELETE COURSE PREVIEW VIDEO
=========================== */
export const deleteCoursePreviewVideo = async (courseId) => {
  const response = await authFetch(`${API_URL}/api/courses/${courseId}/preview-video`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete preview video");
  }

  return data;
};