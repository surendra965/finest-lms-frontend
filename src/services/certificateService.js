import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ==========================================
   GENERATE CERTIFICATE
   POST /api/certificates/course/:courseId
========================================== */
export const generateCertificate = async (courseId) => {
    const res = await authFetch(`${API_URL}/api/certificates/course/${courseId}`, {
        method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to generate certificate");
    }
    return data.data;
};

/* ==========================================
   GET MY CERTIFICATES
   GET /api/certificates
========================================== */
export const getMyCertificates = async () => {
    const res = await authFetch(`${API_URL}/api/certificates`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch certificates");
    }
    return data.data || [];
};

/* ==========================================
   GET CERTIFICATE BY COURSE
   GET /api/certificates/course/:courseId
========================================== */
export const getCertificateByCourse = async (courseId) => {
    const res = await authFetch(`${API_URL}/api/certificates/course/${courseId}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch certificate");
    }
    return data.data;
};

/* ==========================================
   DOWNLOAD CERTIFICATE
   GET /api/certificates/course/:courseId/download
========================================== */
export const downloadCertificate = async (courseId) => {
    const res = await authFetch(`${API_URL}/api/certificates/course/${courseId}/download`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to download certificate");
    }
    return data.data;
};

/* ==========================================
   VERIFY CERTIFICATE (Public)
   GET /api/certificates/verify/:verificationCode
========================================== */
export const verifyCertificate = async (verificationCode) => {
    const res = await fetch(`${API_URL}/api/certificates/verify/${verificationCode}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to verify certificate");
    }
    return data.data;
};
