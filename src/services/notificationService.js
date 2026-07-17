import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const getNotifications = async (query = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page);
    if (query.limit) params.append("limit", query.limit);
    if (query.isRead !== undefined) params.append("isRead", query.isRead);

    const url = `${API_URL}/api/notifications?${params.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch notifications");
    }

    return data.data; // contains { notifications, pagination }
};

export const getUnreadCount = async () => {
    const url = `${API_URL}/api/notifications/unread-count`;
    const response = await authFetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch unread count");
    }

    return data.data; // contains { unreadCount }
};

export const markAsRead = async (id) => {
    const url = `${API_URL}/api/notifications/${id}/read`;
    const response = await authFetch(url, {
        method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to mark notification as read");
    }

    return data.data; // contains the updated notification
};

export const markAllAsRead = async () => {
    const url = `${API_URL}/api/notifications/read-all`;
    const response = await authFetch(url, {
        method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to mark all notifications as read");
    }

    return data.data; // contains { modifiedCount }
};

export const deleteNotification = async (id) => {
    const url = `${API_URL}/api/notifications/${id}`;
    const response = await authFetch(url, {
        method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete notification");
    }

    return data.data;
};
