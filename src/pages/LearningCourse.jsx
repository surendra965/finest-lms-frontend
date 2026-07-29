import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import HlsPlayer from "../components/course/HlsPlayer";
import { CourseReviews } from "../components/course/CourseReviews";
import {
  getStudentCourse,
  getCourseLecture,
  getCourseCurriculum,
  getResumeLecture,
  updateLectureProgress,
  getCourseProgress,
  completeCourse,
} from "../services/studentService";
import {
  getCertificateByCourse as getCertificateByCourseApi,
  generateCertificate as generateCertificateApi,
  downloadCertificate as downloadCertificateApi,
} from "../services/certificateService";
import {
  LuChevronLeft,
  LuChevronDown,
  LuChevronRight,
  LuCheck,
  LuCircle,
  LuClock,
  LuBookOpen,
  LuList,
  LuX,
  LuTrophy,
  LuLoaderCircle,
  LuPlay,
} from "react-icons/lu";

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80";

// Helper: extract a string ID from any shape the API might return
const getLecId = (obj) =>
  obj?.lectureId?.toString?.() ||
  obj?._id?.toString?.() ||
  obj?.id?.toString?.() ||
  null;

const getSecId = (obj) =>
  obj?.sectionId?.toString?.() ||
  obj?._id?.toString?.() ||
  obj?.id?.toString?.() ||
  null;

// Normalize a curriculum section so every ID field is a string
const normalizeSection = (sec) => ({
  ...sec,
  sectionId: getSecId(sec) || String(Math.random()),
  lectures: (sec.lectures || []).map((lec) => ({
    ...lec,
    lectureId: getLecId(lec) || String(Math.random()),
  })),
});

// Build curriculum by grouping flat lectures into sections
const buildCurriculum = (sections, lectures, completedLecturesList = []) => {
  const completedSet = new Set(
    (completedLecturesList || []).map((id) => id?.toString?.())
  );

  return (sections || []).map((sec) => {
    const secId = getSecId(sec);
    const secLectures = (lectures || [])
      .filter((lec) => {
        const lecSecId = lec.sectionId?.toString?.() || lec.section?.toString?.();
        return lecSecId === secId;
      })
      .map((lec) => {
        const lecId = getLecId(lec);
        return {
          ...lec,
          lectureId: lecId,
          completed: completedSet.has(lecId),
        };
      });

    return {
      ...sec,
      sectionId: secId,
      lectures: secLectures,
    };
  });
};

/* ──────────────────────────────────────────────────────────
   CIRCULAR PROGRESS RING
────────────────────────────────────────────────────────── */
const ProgressRing = ({ pct, size = 56, stroke = 5 }) => {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#3f3f46" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="#a435f0" strokeWidth={stroke} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
};

/* ──────────────────────────────────────────────────────────
   LECTURE ROW
────────────────────────────────────────────────────────── */
const LectureRow = ({ lecture, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 group ${isActive
        ? "bg-[#2d2d2d] border-l-4 border-[#a435f0]"
        : "hover:bg-[#2d2d2d]/60 border-l-4 border-transparent"
      }`}
  >
    {/* Status icon */}
    <span className="mt-0.5 shrink-0">
      {lecture.completed ? (
        <span className="w-5 h-5 rounded-full bg-[#a435f0] flex items-center justify-center">
          <LuCheck size={11} className="text-white" />
        </span>
      ) : (
        <LuCircle size={18} className={isActive ? "text-[#a435f0]" : "text-zinc-500"} />
      )}
    </span>
    <div className="flex-1 min-w-0">
      <p className={`text-sm leading-snug font-medium ${isActive ? "text-white" : "text-zinc-300 group-hover:text-white"}`}>
        {lecture.title}
      </p>
      {lecture.duration != null && (
        <span className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
          <LuClock size={10} /> {lecture.duration} min
        </span>
      )}
    </div>
  </button>
);

/* ──────────────────────────────────────────────────────────
   SECTION ACCORDION
────────────────────────────────────────────────────────── */
const SectionAccordion = ({ section, selectedLecture, onLectureClick }) => {
  const [open, setOpen] = useState(true);
  const completedCount = (section.lectures || []).filter((l) => l.completed).length;
  const total = (section.lectures || []).length;

  return (
    <div className="border-b border-zinc-700/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#1c1c1c] hover:bg-[#252525] transition"
      >
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white leading-snug">{section.title}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{completedCount}/{total} completed</p>
        </div>
        {open ? <LuChevronDown size={16} className="text-zinc-400 shrink-0" /> : <LuChevronRight size={16} className="text-zinc-400 shrink-0" />}
      </button>

      {open && (
        <div className="bg-[#161616]">
          {(section.lectures || []).map((lec) => (
            <LectureRow
              key={lec.lectureId}
              lecture={lec}
              isActive={selectedLecture === lec.lectureId}
              onClick={() => onLectureClick(lec.lectureId, !lec.completed)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   MAIN LEARNING COURSE PAGE
────────────────────────────────────────────────────────── */
const LearningCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [progress, setProgress] = useState(0);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [lectureDetail, setLectureDetail] = useState(null);
  const [lectureLoading, setLectureLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [certificate, setCertificate] = useState(null);
  const [certActionLoading, setCertActionLoading] = useState(false);

  const sidebarRef = useRef(null);

  /* ── Derived course meta ── */
  const course = useMemo(() => {
    if (!courseData) return null;
    const totalLectures = curriculum.reduce(
      (sum, sec) => sum + (sec.lectures?.length || 0),
      0
    );
    const completedLectures = curriculum.reduce(
      (sum, sec) => sum + (sec.lectures || []).filter((l) => l.completed).length,
      0
    );
    // Handle every possible field name the API might use
    const nested = courseData.course || courseData.courseDetails || {};
    return {
      id: courseData.courseId || courseData._id || id,
      title:
        courseData.title ||
        nested.title ||
        courseData.name ||
        nested.name ||
        "Untitled Course",
      description:
        courseData.description ||
        nested.description ||
        courseData.about ||
        "",
      thumbnail:
        courseData.thumbnail ||
        nested.thumbnail ||
        courseData.image ||
        DEFAULT_THUMBNAIL,
      totalLectures,
      completedLectures,
      progressPercentage: progress,
    };
  }, [courseData, curriculum, id, progress]);

  /* ── Load a lecture ── */
  const loadLecture = async (lectureId, markProgress = false) => {
    if (!lectureId || lectureLoading) return;
    setLectureLoading(true);
    try {
      const raw = await getCourseLecture(id, lectureId);
      const lecObj = raw?.lecture || {};
      // Guarantee lectureId is always a string — API may return _id instead
      const detail = {
        ...raw,
        lectureId: getLecId(raw) || getLecId(lecObj) || lectureId,
        title: raw.title || lecObj.title || "Untitled Lecture",
        content: raw.content || raw.description || lecObj.description || lecObj.content || "",
        video: raw.video || lecObj.video || null,
      };
      console.log("[loadLecture] detail:", detail);
      setSelectedLecture(lectureId);
      setLectureDetail(detail);

      if (markProgress) {
        await updateLectureProgress(id, lectureId);
        setCurriculum((prev) =>
          prev.map((sec) => ({
            ...sec,
            lectures: (sec.lectures || []).map((l) =>
              l.lectureId === lectureId ? { ...l, completed: true } : l
            ),
          }))
        );
        const progressData = await getCourseProgress(id);
        setProgress(progressData?.progressPercentage ?? progress);
      }
    } catch (err) {
      console.error("[loadLecture] error:", err);
      toast.error(err.message || "Unable to load lecture");
    } finally {
      setLectureLoading(false);
    }
  };

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      try {
        // Fetch course data AND curriculum in parallel
        const [courseResult, curriculumResult] = await Promise.allSettled([
          getStudentCourse(id),
          getCourseCurriculum(id),
        ]);

        let rawSections = [];
        let rawLectures = [];
        let completedLecturesList = [];
        let progressVal = 0;

        // -- Course data --
        if (courseResult.status === "fulfilled") {
          const data = courseResult.value;
          console.log("[LearningCourse] course data:", JSON.stringify(data));
          setCourseData(data);

          progressVal = data?.progressPercentage ?? data?.enrollment?.progressPercentage ?? 0;
          setProgress(progressVal);

          rawSections = data.sections || data.curriculum || [];
          rawLectures = data.lectures || [];
          completedLecturesList = data.enrollment?.completedLectures || [];
        } else {
          console.warn("[LearningCourse] getStudentCourse failed:", courseResult.reason);
          setCourseData({ _fallback: true });
        }

        // -- Curriculum: group flat sections and lectures --
        let curriculumData = [];
        if (curriculumResult.status === "fulfilled" && Array.isArray(curriculumResult.value) && curriculumResult.value.length) {
          const firstItem = curriculumResult.value[0];
          // Check if the curriculum API returned nested lectures
          if (firstItem.lectures && Array.isArray(firstItem.lectures)) {
            curriculumData = curriculumResult.value.map(normalizeSection);
          } else {
            // It returned flat sections, so build it using flat lectures
            curriculumData = buildCurriculum(curriculumResult.value, rawLectures, completedLecturesList);
          }
        } else {
          // Fallback to inline sections and lectures
          curriculumData = buildCurriculum(rawSections, rawLectures, completedLecturesList);
        }

        console.log("[LearningCourse] built curriculum:", JSON.stringify(curriculumData));
        setCurriculum(curriculumData);

        // -- Auto-resume --
        let resumeId = null;
        try {
          const resume = await getResumeLecture(id);
          console.log("[LearningCourse] resume:", resume);
          resumeId = getLecId(resume) || getLecId(resume?.data);
        } catch {
          // ignore resume errors
        }
        const firstLecture = curriculumData?.[0]?.lectures?.[0]?.lectureId;
        const lectureToLoad = resumeId || firstLecture;
        console.log("[LearningCourse] will load lecture:", lectureToLoad);
        if (lectureToLoad) {
          await loadLecture(lectureToLoad, false);
        }

        // Fetch certificate if course is completed
        if (courseResult.status === "fulfilled" && courseResult.value?.enrollment?.status === "completed") {
          try {
            const cert = await getCertificateByCourseApi(id);
            setCertificate(cert);
          } catch (cErr) {
            console.warn("Certificate not claimed yet:", cErr.message);
          }
        }
      } catch (err) {
        console.error("[LearningCourse] fatal error:", err);
        toast.error(err.message || "Unable to load course");
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── Navigate to next lecture after current ends ── */
  const handleVideoEnd = () => {
    const allLectures = curriculum.flatMap((sec) => sec.lectures || []);
    const currentIdx = allLectures.findIndex((l) => l.lectureId === selectedLecture);
    if (currentIdx !== -1 && currentIdx < allLectures.length - 1) {
      const next = allLectures[currentIdx + 1];
      loadLecture(next.lectureId, true);
    }
  };

  /* ── Mark course complete ── */
  const handleCompleteCourse = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await completeCourse(id);
      toast.success("🎉 Course completed! Congratulations!");
      setProgress(100);
      setCourseData(prev => prev ? {
        ...prev,
        enrollment: prev.enrollment ? { ...prev.enrollment, status: "completed" } : prev.enrollment
      } : prev);
      try {
        const cert = await generateCertificateApi(id);
        setCertificate(cert);
        toast.info("A verified completion certificate has been generated for you!");
      } catch (certErr) {
        console.warn("Auto cert creation failed:", certErr.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to mark course complete");
    } finally {
      setCompleting(false);
    }
  };

  const handleClaimCertificate = async () => {
    if (certActionLoading) return;
    setCertActionLoading(true);
    try {
      const data = await generateCertificateApi(id);
      setCertificate(data);
      toast.success("Certificate claimed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to claim certificate");
    } finally {
      setCertActionLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (certActionLoading) return;
    setCertActionLoading(true);
    try {
      const result = await downloadCertificateApi(id);
      if (result?.url) {
        window.open(result.url, "_blank");
      } else if (certificate?.certificateUrl) {
        window.open(certificate.certificateUrl, "_blank");
      } else {
        throw new Error("Download URL not found");
      }
    } catch (err) {
      toast.error(err.message || "Failed to download certificate");
    } finally {
      setCertActionLoading(false);
    }
  };

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div className="h-screen bg-[#1c1c1c] flex flex-col items-center justify-center gap-4">
        <LuLoaderCircle size={40} className="animate-spin text-[#a435f0]" />
        <p className="text-zinc-400 text-sm">Loading your course...</p>
      </div>
    );
  }

  /* ── Error state ── */
  if (!courseData) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <LuBookOpen size={36} className="text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Course not found</h2>
          <p className="text-zinc-400 text-sm mb-6">This course is unavailable or you don't have access.</p>
          <button
            onClick={() => navigate("/learning")}
            className="px-6 py-2.5 bg-[#a435f0] hover:bg-[#8710d8] text-white rounded-md text-sm font-semibold transition"
          >
            Back to My Learning
          </button>
        </div>
      </div>
    );
  }

  const allLectures = curriculum.flatMap((sec) => sec.lectures || []);
  const currentIdx = allLectures.findIndex((l) => l.lectureId === selectedLecture);
  const prevLecture = currentIdx > 0 ? allLectures[currentIdx - 1] : null;
  const nextLecture = currentIdx < allLectures.length - 1 ? allLectures[currentIdx + 1] : null;
  const isAllComplete = course.completedLectures === course.totalLectures && course.totalLectures > 0;

  return (
    <div className="flex flex-col h-screen bg-[#1c1c1c] text-white overflow-hidden">
      {/* ── TOP BAR ── */}
      <header className="shrink-0 h-14 bg-[#1c1c1c] border-b border-zinc-700 flex items-center px-4 gap-4 z-30">
        <Link
          to="/learning"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition text-sm font-medium"
        >
          <LuChevronLeft size={18} />
          My Learning
        </Link>
        <div className="w-px h-5 bg-zinc-700" />
        <h1 className="text-sm font-semibold text-white truncate flex-1">{course.title}</h1>

        {/* Progress pill */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <div className="relative" style={{ width: 36, height: 36 }}>
            <ProgressRing pct={course.progressPercentage} size={36} stroke={3.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#a435f0]">
              {course.progressPercentage}%
            </span>
          </div>
          <span className="text-xs text-zinc-400">
            {course.completedLectures}/{course.totalLectures} completed
          </span>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="ml-auto shrink-0 p-2 rounded hover:bg-zinc-700 transition text-zinc-300 hover:text-white"
          title="Toggle curriculum"
        >
          <LuList size={18} />
        </button>
      </header>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── VIDEO + CONTENT AREA ── */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Player */}
          <div className="w-full bg-black shrink-0">
            {lectureLoading ? (
              <div className="aspect-video flex flex-col items-center justify-center bg-black gap-3">
                <LuLoaderCircle size={40} className="animate-spin text-[#a435f0]" />
                <p className="text-zinc-400 text-sm">Loading lecture...</p>
              </div>
            ) : lectureDetail ? (
              <HlsPlayer
                key={lectureDetail.lectureId}
                lectureId={lectureDetail.lectureId}
                fallbackSrc={lectureDetail.video?.masterPlaylist || lectureDetail.video?.url}
                className="w-full"
                onVideoEnd={handleVideoEnd}
              />
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center bg-[#0d0d0d] gap-4">
                <LuPlay size={64} className="text-zinc-600" />
                <p className="text-zinc-400 text-sm">Select a lecture to start watching</p>
              </div>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-700/50 bg-[#1c1c1c] shrink-0">
            <button
              onClick={() => prevLecture && loadLecture(prevLecture.lectureId, false)}
              disabled={!prevLecture}
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <LuChevronLeft size={16} />
              Previous
            </button>

            {lectureDetail && (
              <button
                onClick={() => loadLecture(selectedLecture, true)}
                className="flex items-center gap-2 text-sm px-4 py-1.5 rounded border border-[#a435f0] text-[#a435f0] hover:bg-[#a435f0] hover:text-white transition font-semibold"
              >
                <LuCheck size={14} />
                Mark Complete
              </button>
            )}

            <button
              onClick={() => nextLecture && loadLecture(nextLecture.lectureId, true)}
              disabled={!nextLecture}
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next
              <LuChevronRight size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-zinc-700/50 bg-[#1c1c1c] shrink-0">
            <div className="flex gap-0">
              {["overview", "curriculum", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 text-sm font-semibold capitalize border-b-2 transition ${activeTab === tab
                      ? "border-[#a435f0] text-[#a435f0]"
                      : "border-transparent text-zinc-400 hover:text-white"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 px-6 py-6 max-w-4xl">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {lectureDetail?.title || course.title}
                  </h2>
                  {lectureDetail?.content && (
                    <p className="text-zinc-400 text-sm leading-relaxed">{lectureDetail.content}</p>
                  )}
                  {!lectureDetail?.content && course.description && (
                    <p className="text-zinc-400 text-sm leading-relaxed">{course.description}</p>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Total Lectures", value: course.totalLectures, icon: <LuBookOpen size={18} /> },
                    { label: "Completed", value: course.completedLectures, icon: <LuCheck size={18} /> },
                    {
                      label: "Progress",
                      value: `${course.progressPercentage}%`,
                      icon: (
                        <span className="text-xs font-bold">{course.progressPercentage}%</span>
                      ),
                    },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-[#2d2d2d] rounded-lg p-4 flex items-center gap-3">
                      <div className="text-[#a435f0]">{icon}</div>
                      <div>
                        <p className="text-xs text-zinc-400">{label}</p>
                        <p className="text-lg font-bold text-white">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-2">
                    <span>Your progress</span>
                    <span>{course.progressPercentage}%</span>
                  </div>
                  <div className="h-2.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#a435f0] rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(course.progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Complete course CTA */}
                {isAllComplete && courseData?.enrollment?.status !== "completed" && (
                  <div className="bg-gradient-to-br from-[#a435f0]/20 to-[#6d28d9]/10 border border-[#a435f0]/30 rounded-xl p-6 text-center mt-6">
                    <LuTrophy size={40} className="text-[#a435f0] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">You've completed all lectures!</h3>
                    <p className="text-zinc-400 text-sm mb-4">Mark the course as complete to celebrate your achievement.</p>
                    <button
                      onClick={handleCompleteCourse}
                      disabled={completing}
                      className="px-6 py-2.5 bg-[#a435f0] hover:bg-[#8710d8] text-white rounded-md text-sm font-bold transition disabled:opacity-60 flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      {completing ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuTrophy size={16} />}
                      {completing ? "Completing..." : "Complete Course"}
                    </button>
                  </div>
                )}

                {/* Course Completed & Certificate panel */}
                {courseData?.enrollment?.status === "completed" && (
                  <div className="bg-gradient-to-br from-[#16a34a]/10 to-[#10b981]/5 border border-[#10b981]/20 rounded-2xl p-6 text-center mt-6">
                    <LuTrophy size={40} className="text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">Congratulations on completing the course!</h3>
                    <p className="text-zinc-400 text-sm mb-5">Click below to generate and download your verified certificate of completion.</p>

                    {certActionLoading ? (
                      <button disabled className="px-6 py-2.5 bg-zinc-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 mx-auto">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading certificate...
                      </button>
                    ) : certificate ? (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          onClick={handleDownloadCertificate}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-md shadow-emerald-950"
                        >
                          Download Certificate PDF
                        </button>
                        <a
                          href={`${window.location.origin}/verify-certificate/${certificate.verificationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition border border-zinc-700"
                        >
                          Verify Certificate
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={handleClaimCertificate}
                        className="px-6 py-2.5 bg-[#a435f0] hover:bg-[#8710d8] text-white rounded-xl text-sm font-bold transition flex items-center gap-2 mx-auto cursor-pointer border-none shadow-md shadow-purple-950"
                      >
                        Claim My Certificate
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "curriculum" && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">Course Curriculum</h2>
                <p className="text-zinc-400 text-sm">
                  {curriculum.length} section{curriculum.length !== 1 ? "s" : ""} • {course.totalLectures} lecture{course.totalLectures !== 1 ? "s" : ""}
                </p>
                <div className="space-y-3 mt-4">
                  {curriculum.map((section) => {
                    const done = (section.lectures || []).filter((l) => l.completed).length;
                    const total = (section.lectures || []).length;
                    return (
                      <div key={section.sectionId} className="rounded-lg border border-zinc-700 overflow-hidden">
                        <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{section.title}</p>
                            <p className="text-xs text-zinc-400">{done}/{total} completed</p>
                          </div>
                          <div className="w-16 h-1.5 bg-zinc-600 rounded-full overflow-hidden">
                            <div className="h-full bg-[#a435f0] rounded-full" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="divide-y divide-zinc-700/50">
                          {(section.lectures || []).map((lec) => (
                            <button
                              key={lec.lectureId}
                              onClick={() => loadLecture(lec.lectureId, !lec.completed)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${selectedLecture === lec.lectureId ? "bg-[#a435f0]/10" : "hover:bg-[#2d2d2d]"
                                }`}
                            >
                              {lec.completed ? (
                                <span className="w-5 h-5 rounded-full bg-[#a435f0] flex items-center justify-center shrink-0">
                                  <LuCheck size={11} className="text-white" />
                                </span>
                              ) : (
                                <LuCircle size={18} className="text-zinc-500 shrink-0" />
                              )}
                              <span className={`text-sm ${selectedLecture === lec.lectureId ? "text-[#a435f0] font-semibold" : "text-zinc-300"}`}>
                                {lec.title}
                              </span>
                              {lec.duration != null && (
                                <span className="ml-auto text-xs text-zinc-500 shrink-0 flex items-center gap-1">
                                  <LuClock size={10} /> {lec.duration}m
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                <CourseReviews courseId={id} theme="dark" isEnrolled={true} />
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside
          ref={sidebarRef}
          className={`
            shrink-0 w-[340px] bg-[#161616] border-l border-zinc-700
            flex flex-col overflow-hidden transition-all duration-300
            ${sidebarOpen ? "translate-x-0 w-[340px]" : "w-0 overflow-hidden"}
          `}
          style={{ transition: "width 0.3s ease" }}
        >
          {sidebarOpen && (
            <>
              {/* Sidebar header */}
              <div className="shrink-0 h-12 px-4 flex items-center justify-between border-b border-zinc-700">
                <span className="text-sm font-bold text-white">Course Content</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                >
                  <LuX size={16} />
                </button>
              </div>

              {/* Sidebar progress */}
              <div className="shrink-0 px-4 py-3 border-b border-zinc-700/50 bg-[#1a1a1a]">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span>{course.completedLectures} / {course.totalLectures} lectures</span>
                  <span className="text-[#a435f0] font-semibold">{course.progressPercentage}%</span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#a435f0] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(course.progressPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Curriculum */}
              <div className="flex-1 overflow-y-auto">
                {curriculum.map((section) => (
                  <SectionAccordion
                    key={section.sectionId}
                    section={section}
                    selectedLecture={selectedLecture}
                    onLectureClick={loadLecture}
                  />
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default LearningCourse;
