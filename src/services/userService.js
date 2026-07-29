import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await authFetch(`${API_URL}/api/users/avatar`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload avatar");
  }

  return data.data;
};

export const deleteAvatar = async () => {
  const response = await authFetch(`${API_URL}/api/users/avatar`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove avatar");
  }

  return data.data;
};
