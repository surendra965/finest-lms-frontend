import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const getCart = async () => {
  const response = await authFetch(`${API_URL}/api/cart`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load cart");
  }

  return data.data;
};

export const addCourseToCart = async (courseId) => {
  const response = await authFetch(`${API_URL}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ courseId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to add course to cart");
  }

  return data.data;
};

export const removeCourseFromCart = async (courseId) => {
  const response = await authFetch(`${API_URL}/api/cart/${courseId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to remove course from cart");
  }

  return data.data;
};

export const clearCart = async () => {
  const response = await authFetch(`${API_URL}/api/cart`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to clear cart");
  }

  return data;
};
