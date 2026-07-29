import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { AuthContext } from "./authContext";
import {
    getNotifications,
    getUnreadCount,
    markAsRead as apiMarkAsRead,
    markAllAsRead as apiMarkAllAsRead,
    deleteNotification as apiDeleteNotification
} from "../services/notificationService";
import { getAccessToken } from "../utils/auth";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);
    const socketRef = useRef(null);

    const fetchNotificationData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getNotifications({ page: 1, limit: 15 });
            setNotifications(data.notifications || []);
            setPagination(data.pagination || {});

            const unreadData = await getUnreadCount();
            setUnreadCount(unreadData.unreadCount || 0);
        } catch (err) {
            console.error("Failed to load notifications:", err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handle Mark AS Read
    const handleMarkAsRead = async (id) => {
        try {
            const updated = await apiMarkAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            return updated;
        } catch (err) {
            toast.error(err.message || "Failed to mark as read");
        }
    };

    // Handle Mark All AS Read
    const handleMarkAllAsRead = async () => {
        try {
            await apiMarkAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (err) {
            toast.error(err.message || "Failed to mark all as read");
        }
    };

    // Handle Delete Notification
    const handleDeleteNotification = async (id) => {
        try {
            const n = notifications.find((item) => item._id === id);
            await apiDeleteNotification(id);
            setNotifications((prev) => prev.filter((item) => item._id !== id));
            if (n && !n.isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            toast.success("Notification deleted");
        } catch (err) {
            toast.error(err.message || "Failed to delete notification");
        }
    };

    // Socket Connection setup
    useEffect(() => {
        if (!user) {
            // Disconnect socket if user signs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Load initial data
        fetchNotificationData();

        // Connect socket
        const token = getAccessToken();
        const API_URL = import.meta.env.VITE_API_URL || "";

        // Connect to backend Socket server
        const socket = io(API_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket.io notifications connected");
        });

        socket.on("notification", (newNotification) => {
            // Add incoming to notification list
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Trigger user-friendly Toast notification
            toast.info(newNotification.title || newNotification.message || "New notification received!");
        });

        socket.on("connect_error", (err) => {
            console.warn("Socket.io notifications authorization failed:", err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, fetchNotificationData]);

    const value = {
        notifications,
        unreadCount,
        loading,
        pagination,
        fetchNotifications: fetchNotificationData,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        deleteNotification: handleDeleteNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
