const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

const ACCESS_TOKEN_MAX_AGE = 60 * 60; // 1 hour
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const API_URL = import.meta.env.VITE_API_URL || "";

let refreshTokenRequest = null;

/* =========================
   COOKIE HELPERS
========================= */

const getCookie = (name) => {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const setCookie = (name, value, maxAge) => {
  const isSecure = window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

/* =========================
   TOKEN MANAGEMENT
========================= */

export const saveAuthTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    setCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE);
  }
  if (refreshToken) {
    setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE);
  }
};

export const clearAuthTokens = () => {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
};

export const getAccessToken = () => getCookie(ACCESS_TOKEN_COOKIE);
export const getRefreshToken = () => getCookie(REFRESH_TOKEN_COOKIE);

export const isAuthenticated = () => !!getAccessToken();

/* =========================
   RESPONSE HELPERS
========================= */

export const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const getApiErrorMessage = (data, fallback = "Something went wrong") => {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (data.message) return data.message;
  if (data.error) return data.error;

  const extractMessages = (arr) =>
    arr
      .map((err) => err.message || err.msg || err)
      .filter(Boolean)
      .join(", ");

  if (Array.isArray(data.errors) && data.errors.length) {
    return extractMessages(data.errors);
  }

  if (Array.isArray(data.details) && data.details.length) {
    return extractMessages(data.details);
  }

  return fallback;
};

/* =========================
   TOKEN REFRESH LOGIC
========================= */

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // Prevent multiple refresh calls
  if (!refreshTokenRequest) {
    refreshTokenRequest = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const data = await readJson(res);

        if (!res.ok) {
          throw new Error(getApiErrorMessage(data, "Session expired"));
        }

        const accessToken =
          data?.accessToken ||
          data?.data?.accessToken ||
          data?.token ||
          data?.data?.token;

        if (!accessToken) {
          throw new Error("No access token in refresh response");
        }

        saveAuthTokens({ accessToken });
        return accessToken;
      })
      .catch((err) => {
        clearAuthTokens();
        throw err;
      })
      .finally(() => {
        refreshTokenRequest = null;
      });
  }

  return refreshTokenRequest;
};

/* =========================
   AUTH FETCH (MAIN API HELPER)
========================= */

export const authFetch = async (url, options = {}) => {
  const token = getAccessToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If not unauthorized → return directly
  if (response.status !== 401) return response;

  // Try refreshing token
  try {
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) return response;

    const retryHeaders = new Headers(options.headers || {});
    retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

    return fetch(url, {
      ...options,
      headers: retryHeaders,
    });
  } catch (err) {
    console.error("Token refresh failed:", err);
    return response;
  }
};