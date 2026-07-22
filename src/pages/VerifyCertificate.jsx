import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyCertificate } from "../services/certificateService";
import { LuShieldCheck, LuShieldAlert, LuUser, LuAward, LuBookOpen, LuCalendar, LuExternalLink } from "react-icons/lu";

const VerifyCertificate = () => {
    const { code } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cert, setCert] = useState(null);

    useEffect(() => {
        const runVerify = async () => {
            if (!code) {
                setError("Invalid verification code.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await verifyCertificate(code);
                setCert(data);
            } catch (err) {
                setError(err.message || "Failed to verify certificate. Please check the code and try again.");
            } finally {
                setLoading(false);
            }
        };
        runVerify();
    }, [code]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-50 opacity-60 blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-50 opacity-40 blur-3xl -z-10" />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <span className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
                        <p className="text-slate-600 font-semibold text-sm">Verifying credential against blockchain system...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-650 mx-auto mb-4 border border-red-200">
                            <LuShieldAlert size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h2>
                        <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
                            {error}
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition"
                        >
                            Back to Home
                        </Link>
                    </div>
                ) : cert ? (
                    <div>
                        {/* Header */}
                        <div className="text-center border-b border-slate-100 pb-8 mb-8">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-100 shadow-sm">
                                <LuShieldCheck size={36} />
                            </div>
                            <span className="text-xs font-bold text-[#10b981] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                Verified Credential
                            </span>
                            <h1 className="text-3xl font-extrabold text-slate-900 mt-4">Certificate Verified Successfully</h1>
                            <p className="text-slate-500 text-xs mt-2 uppercase tracking-wide">ID: {cert.certificateNumber}</p>
                        </div>

                        {/* Information Grid */}
                        <div className="grid gap-6 md:grid-cols-2 text-sm text-slate-700">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3">
                                <LuUser className="text-purple-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Enrolled Graduate/Student</p>
                                    <p className="text-base font-bold text-slate-900">
                                        {cert.studentId?.lastName ? `${cert.studentId.firstName} ${cert.studentId.lastName}` : cert.studentId?.firstName}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3">
                                <LuAward className="text-purple-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Credential Name</p>
                                    <p className="text-base font-bold text-slate-900">Certificate of Course Completion</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3 md:col-span-2">
                                <LuBookOpen className="text-purple-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Course Completed</p>
                                    <p className="text-base font-bold text-slate-900">{cert.courseId?.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Offered by CourseHub Admin & Instructors
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3">
                                <LuCalendar className="text-purple-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Date Issued</p>
                                    <p className="text-base font-bold text-slate-900">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3">
                                <LuShieldCheck className="text-purple-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Verification Code</p>
                                    <p className="text-base font-bold text-slate-900">{cert.verificationCode}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <a
                                href={cert.certificateUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-purple-50"
                            >
                                View PDF File <LuExternalLink size={16} />
                            </a>
                            <Link
                                to="/"
                                className="w-full sm:w-auto text-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default VerifyCertificate;
