import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ===========================
   CREATE REVIEW
   POST /reviews
=========================== */
export const createReview = async (courseId, rating, reviewText) => {
  const response = await authFetch(`${API_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      courseId,
      rating,
      review: reviewText,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit review");
  }

  return data;
};

/* ===========================
   UPDATE REVIEW
   PATCH /reviews/{id}
=========================== */
export const updateReview = async (reviewId, rating, reviewText) => {
  const response = await authFetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rating,
      review: reviewText,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update review");
  }

  return data;
};

/* ===========================
   DELETE REVIEW
   DELETE /reviews/{id}
=========================== */
export const deleteReview = async (reviewId) => {
  const response = await authFetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete review");
  }

  return data;
};

/* ===========================
   GET CURRENT USER'S REVIEW
   GET /reviews/my/{courseId}
=========================== */
export const getMyReview = async (courseId) => {
  const response = await authFetch(`${API_URL}/api/reviews/my/${courseId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get your review");
  }

  return data.data; // data.data contains review or null
};

/* ===========================
   GET ALL COURSE REVIEWS
   GET /reviews/course/{courseId}
=========================== */
export const getCourseReviews = async (courseId, page = 1, limit = 10) => {
  const response = await authFetch(
    `${API_URL}/api/reviews/course/${courseId}?page=${page}&limit=${limit}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load course reviews");
  }

  return data; // returns { success: true, data: [...], pagination?: {...} }
};
