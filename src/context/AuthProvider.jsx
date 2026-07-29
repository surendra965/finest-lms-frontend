import { useEffect, useState, useCallback } from "react";
import { AuthContext } from "./authContext";
import {
  authFetch,
  clearAuthTokens,
  getApiErrorMessage,
  getAccessToken,
  getRefreshToken,
  readJson,
  saveAuthTokens,
  refreshAccessToken,
} from "../utils/auth";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     HELPERS
  ========================= */

  const extractPayload = useCallback((data) => data?.data || data, []);

  const extractTokens = useCallback((data) => {
    const payload = extractPayload(data);

    return {
      accessToken:
        payload?.accessToken ||
        payload?.access_token ||
        payload?.token,
      refreshToken:
        payload?.refreshToken ||
        payload?.refresh_token,
    };
  }, [extractPayload]);

  const extractUser = useCallback((data) => {
    const payload = extractPayload(data);

    if (payload?.user) return payload.user;

    if (
      payload?.email ||
      payload?.firstName ||
      payload?.lastName ||
      payload?.role
    ) {
      return payload;
    }

    return null;
  }, [extractPayload]);

  const extractProfile = useCallback((data) => {
    const payload = extractPayload(data);
    return payload?.profile || null;
  }, [extractPayload]);

  /* =========================
     SYNC AUTH RESPONSE
  ========================= */

  const syncAuthResponse = useCallback((data) => {
    const tokens = extractTokens(data);
    const responseUser = extractUser(data);
    const profile = extractProfile(data);

    if (tokens.accessToken || tokens.refreshToken) {
      saveAuthTokens(tokens);
    }

    if (responseUser || profile) {
      setUser((prev) => ({
        ...(prev || {}),
        ...(responseUser || {}),
        ...(profile
          ? {
              instructorProfile: profile,
              instructorProfileId: profile.id,
              isInstructor: true,
            }
          : {}),
      }));
    }

    return { tokens, user: responseUser, profile };
  }, [extractTokens, extractUser, extractProfile]);

  /* =========================
     FETCH CURRENT USER
  ========================= */

  const fetchCurrentUser = useCallback(async () => {
    let token = getAccessToken();

    // Try refresh if no access token
    if (!token) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          token = await refreshAccessToken();
        } catch (err) {
          console.error("Auto refresh failed:", err);
          toast.error("Session expired. Please log in again.");
          clearAuthTokens();
          setUser(null);
          return null;
        }
      }
    }

    if (!token) return null;

    try {
      const res = await authFetch(`${API_URL}/api/users/profile`);
      const data = await readJson(res);

      if (res.ok) {
        const payload = extractPayload(data);
        const profile = payload?.user || payload?.profile || payload;

        setUser(profile);
        return profile;
      }

      if (res.status === 401 || res.status === 403) {
        clearAuthTokens();
        setUser(null);
      }
    } catch (err) {
      console.error("Fetch user error:", err);
    }

    return null;
  }, [extractPayload]);

  /* =========================
     INIT LOAD
  ========================= */

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      setLoading(false);
    };

    init();
  }, [fetchCurrentUser]);

  /* =========================
     AUTH METHODS
  ========================= */

  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await readJson(res);

      if (res.ok) {
        return {
          success: true,
          message: data?.message || "Registration successful",
        };
      }

      return {
        success: false,
        message: getApiErrorMessage(data, "Registration failed"),
      };
    } catch (err) {
      console.error("Register Error:", err);
      return { success: false, message: "Backend connection error" };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await readJson(res);
      const tokens = extractTokens(data);

      if (res.ok && tokens.accessToken) {
        const { user: loggedUser } = syncAuthResponse(data);

        // fallback if user not in login response
        if (!loggedUser) {
          await fetchCurrentUser();
        }

        const currentUser = loggedUser || (await fetchCurrentUser());
        return { success: true, role: currentUser?.role };
      }

      return {
        success: false,
        message: getApiErrorMessage(data, "Invalid credentials"),
      };
    } catch (err) {
      console.error("Login Error:", err);
      return { success: false, message: "Backend connection error" };
    }
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
  };

  /* =========================
     CONTEXT VALUE
  ========================= */

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    syncAuthResponse,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};