import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ==========================================
   CREATE LECTURE
========================================== */

export const createLecture = async (lectureData) => {
  const response = await authFetch(`${API_URL}/api/lectures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lectureData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create lecture");
  }

  return data.data;
};

/* ==========================================
   GET LECTURES BY SECTION
========================================== */

export const getLecturesBySection = async (sectionId) => {
  const response = await authFetch(
    `${API_URL}/api/lectures/section/${sectionId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load lectures");
  }

  return data.data;
};

/* ==========================================
   UPDATE LECTURE
========================================== */

export const updateLecture = async (lectureId, lectureData) => {
  const response = await authFetch(
    `${API_URL}/api/lectures/${lectureId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lectureData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update lecture");
  }

  return data.data;
};

/* ==========================================
   DELETE LECTURE
========================================== */

export const deleteLecture = async (lectureId) => {
  const response = await authFetch(
    `${API_URL}/api/lectures/${lectureId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete lecture");
  }

  return data;
};

/* ==========================================
   UPLOAD LECTURE VIDEO
========================================== */

export const uploadLectureVideo = async (lectureId, file) => {
  const formData = new FormData();
  formData.append("video", file);

  const response = await authFetch(
    `${API_URL}/api/lectures/${lectureId}/video`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload lecture video");
  }

  return data.data;
};

/* ==========================================
   DELETE LECTURE VIDEO
========================================== */

export const deleteLectureVideo = async (lectureId) => {
  const response = await authFetch(
    `${API_URL}/api/lectures/${lectureId}/video`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete lecture video");
  }

  return data.data;
};

/* ==========================================
   UPLOAD LECTURE RESOURCE
========================================== */

export const uploadLectureResource = async (
  lectureId,
  file
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authFetch(
    `${API_URL}/api/lectures/${lectureId}/resource`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload lecture resource");
  }

  return data.data;
};

/* ==========================================
   DELETE LECTURE RESOURCE
========================================== */

export const deleteLectureResource = async (
  lectureId,
  resourceId
) => {
  const response = await authFetch(
    `${API_URL}/api/lectures/${lectureId}/resource/${resourceId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete lecture resource");
  }

  return data.data;
};

/* ==========================================
   GET LECTURE STREAM DETAILS (HLS)
========================================== */

export const getLectureStream = async (lectureId) => {
  const response = await authFetch(`${API_URL}/api/stream/lecture/${lectureId}`);

  // Parse response
  const data = await response.json();

  if (!response.ok) {
    // Return structured error detail so the player can display specific messages (400, 403, 404, etc.)
    const error = new Error(data.message || "Failed to load video stream");
    error.status = response.status;
    throw error;
  }

  return data.data; // contains streamUrl, resolutions, etc.
};

/* ==========================================
   GET LECTURE VIDEO STATUS
========================================== */

export const getLectureVideoStatus = async (lectureId) => {
  const response = await authFetch(`${API_URL}/api/lectures/${lectureId}/video/status`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load video status");
  }

  return data.data; // contains lectureId, status, error, streamUrl
};

/* ==========================================
   REORDER LECTURES
========================================== */

export const reorderLectures = async (sectionId, orderedIds) => {
  const response = await authFetch(
    `${API_URL}/api/lectures/section/${sectionId}/reorder`,
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
    throw new Error(data.message || "Failed to reorder lectures");
  }

  return data.data;
};