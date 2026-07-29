import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ===========================================
   GET ALL SECTIONS
   GET /sections/course/:courseId
=========================================== */

export const getSections = async (courseId) => {
  const response = await authFetch(
    `${API_URL}/api/sections/course/${courseId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load sections");
  }

  return data.data;
};

/* ===========================================
   CREATE SECTION
   POST /sections/course/:courseId
=========================================== */

export const createSection = async (courseId, payload) => {
  const response = await authFetch(
    `${API_URL}/api/sections/course/${courseId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create section");
  }

  return data.data;
};

/* ===========================================
   UPDATE SECTION
   PATCH /sections/:id
=========================================== */

export const updateSection = async (sectionId, payload) => {
  const response = await authFetch(
    `${API_URL}/api/sections/${sectionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update section");
  }

  return data.data;
};

/* ===========================================
   DELETE SECTION
   DELETE /sections/:id
=========================================== */

export const deleteSection = async (sectionId) => {
  const response = await authFetch(
    `${API_URL}/api/sections/${sectionId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete section");
  }

  return data;
};

/* ===========================================
   REORDER SECTIONS
   PUT /sections/course/:courseId/reorder
=========================================== */

export const reorderSections = async (courseId, orderedIds) => {
  const response = await authFetch(
    `${API_URL}/api/sections/course/${courseId}/reorder`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderedIds }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reorder sections");
  }

  return data.data;
};