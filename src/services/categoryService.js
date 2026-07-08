import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const getCategories = async () => {
  const response = await authFetch(`${API_URL}/api/categories`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load categories");
  }

  return data.data;
};
