import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AiFillStar,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineGlobal,
} from "react-icons/ai";
import { BsFillPlayFill, BsDot } from "react-icons/bs";
import {
  LuInfinity,
  LuShieldCheck,
  LuChevronDown,
  LuChevronUp,
  LuPlay,
  LuFileText,
  LuAward,
  LuClock,
  LuInfo,
  LuSmartphone,
} from "react-icons/lu";
import HlsPlayer from "../components/course/HlsPlayer";
import { CourseReviews } from "../components/course/CourseReviews";
import { AuthContext } from "../context/authContext";
import { useCart } from "../context/CartContext";
import { useEnrollment } from "../context/EnrollmentContext";
import { enrollCourse } from "../services/enrollmentService";

const CoursePreview = () => {
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cart, addCourseToCart, loading: cartLoading } = useCart();
  const { isEnrolled, enrolledCourseIds, refreshEnrollments } = useEnrollment();

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activePreviewLecture, setActivePreviewLecture] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const handlePreviewClick = () => {
    if (courseData?.course?.previewVideo?.url) {
      setShowPreviewModal(true);
    } else {
      toast.info("No promotional preview video available for this course.");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/courses/${id}`);
        const data = await res.json();
        if (res.ok) {
          setCourseData(data.data);
        } else {
          toast.error("Failed to load course");
        }
      } catch {
        toast.error("Server error");
      }
      setLoading(false);
    };
    fetchCourse();
  }, [API_URL, id]);

  const course = courseData?.course;
  const instructor = course?.instructorId?.userId;
  const learningObjectives = course?.learningObjectives || [];
  const requirements = course?.requirements || [];
  const targetAudience = course?.targetAudience || [];

  const previewImage =
    course?.thumbnail ||
    course?.coverImage ||
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80";

  const discountPercent =
    course?.price && course?.discountPrice
      ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
      : 0;

  const grouped = useMemo(() => {
    const sections = [...(courseData?.sections || [])].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const lectures = courseData?.lectures || [];
    return sections.map((sec) => ({
      ...sec,
      lectures: lectures.filter((lec) => lec.sectionId === sec._id),
    }));
  }, [courseData]);

  // Set first section expanded by default if expandedSections is empty
  useEffect(() => {
    if (grouped.length > 0 && Object.keys(expandedSections).length === 0) {
      setExpandedSections({ [grouped[0]._id]: true });
    }
  }, [grouped, expandedSections]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const all = {};
    grouped.forEach((sec) => {
      all[sec._id] = true;
    });
    setExpandedSections(all);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (clean === "WELCOME50" || clean === "FINEST50") {
      setCouponApplied(true);
      setCouponError("");
      toast.success("Coupon code applied successfully! 50% discount active.");
    } else {
      setCouponError("Invalid coupon code");
      setCouponApplied(false);
    }
  };

  const { items: cartItems = [] } = cart || {};
  const isStudent = user?.role === "student";
  const isInstructor = user?.role === "instructor";
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  const instructorName = instructor
    ? `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim()
    : "Instructor";
  const instructorInitials = instructor
    ? `${instructor.firstName?.[0] || ""}${instructor.lastName?.[0] || ""}`.toUpperCase()
    : "TR";
  const alreadyEnrolled = course ? isEnrolled(course._id) : false;
  const alreadyInCart = cartItems.some((item) => {
    const savedCourseId = item.courseId?._id || item.courseId;
    return savedCourseId === course?._id;
  });

  const rawPrice = course?.discountPrice || course?.price || 0;
  const currentPrice = couponApplied ? Math.round(rawPrice * 0.5) : rawPrice;

  const handleBuyNow = async () => {
    if (alreadyEnrolled) {
      toast.info("You already own this course! Access it in My Learning.");
      return;
    }
    if (!alreadyInCart) {
      try {
        await addCourseToCart(course._id, enrolledCourseIds);
      } catch (err) {
        console.error(err);
        return;
      }
    }
    navigate("/checkout");
  };

  const handleEnrollNow = async () => {
    if (!user) {
      toast.info("Please log in to enroll in this course.");
      navigate("/api/auth/login");
      return;
    }
    if (alreadyEnrolled) {
      navigate(`/learning/${course._id}`);
      return;
    }
    setEnrolling(true);
    try {
      await enrollCourse(course._id);
      toast.success("Successfully enrolled in the course!");
      await refreshEnrollments();
      navigate(`/learning/${course._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to enroll in the course.");
    } finally {
      setEnrolling(false);
    }
  };

  const formatTotalDuration = (mins) => {
    const num = Math.round(Number(mins) || 0);
    if (num <= 0) return "0 min";
    const hours = Math.floor(num / 60);
    const minutes = num % 60;
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${num} min`;
  };

  const totalLecturesCount = grouped.reduce(
    (sum, s) => sum + (s.lectures?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#a435f0] rounded-full animate-spin" />
      </div>
    );
  }

  if (!courseData || !course) return null;

  return (
    <div className="bg-white min-h-screen text-[#2d2f31]">

      {/* ── COURSE PUBLIC BANNER (Udemy charcoal colors) ── */}
      <section className="bg-[#1c1d1f] text-white py-8 md:py-8 select-none relative z-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-center">
          <div className="space-y-6">
            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs text-[#c0c4fc] font-bold font-sans tracking-wide uppercase">
              <span>{course.categoryId?.name || "Development"}</span>
            </div>

            {/* Mobile preview card placeholder inside header */}
            <div className="lg:hidden w-full relative aspect-video bg-[#1c1d1f] border border-slate-800 overflow-hidden group shadow-md shadow-black/45">
              <img
                src={previewImage}
                alt={course.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <button
                  onClick={handlePreviewClick}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-purple-650 shadow-2xl transition hover:scale-105"
                >
                  <BsFillPlayFill size={28} className="translate-x-0.5" />
                </button>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-bold text-sm bg-black/75 px-4 py-1.5 rounded-full select-none">
                Preview this course
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold font-sans text-white">
              {course.title}
            </h1>

            {/* Subtitle */}
            <p className="md:text-md font-light text-white">
              {course.subtitle || course.description}
            </p>

            {/* Ratings, Enrolled Learners */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm font-sans">
              <span className="bg-[#ecebfa] border border-[#d1d7dc] text-[#2d2f31] text-[10px] font-bold px-2 py-1 uppercase tracking-wider select-none h-fit">
                {course.level}
              </span>
              <span className="text-[#f3c057] font-bold flex items-center gap-1 select-none">
                {course.averageRating || "4.6"}
                <span className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <AiFillStar
                      key={i}
                      className={
                        i < Math.round(course.averageRating || 4.6)
                          ? "text-[#f3c057]"
                          : "text-slate-655"
                      }
                    />
                  ))}
                </span>
              </span>
              <span className="text-[#c0c4fc] underline cursor-pointer select-none">
                ({course.totalReviews || 0} ratings)
              </span>
              <span className="text-white font-medium select-none">
                {course.totalEnrollments || 0} students
              </span>
            </div>
            {/* Instructor */}
            <div className="text-xs md:text-sm text-slate-200 font-semibold font-sans select-none">
              Created by{" "}
              <span className="text-[#c0c4fc] underline cursor-pointer hover:text-white transition">
                {instructorName}
              </span>
            </div>

            {/* Metas (Updated time, Language) */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300 select-none font-sans">
              <span className="flex items-center gap-2">
                <LuInfo size={14} className="text-slate-400" />
                <span>
                  Last updated {new Date(course.updatedAt).toLocaleDateString()}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <AiOutlineGlobal size={14} className="text-slate-400" />
                <span className="capitalize">{course.language}</span>
              </span>
            </div>
          </div>

          {/* Right Area (Desktop Card Empty Space Anchor) */}
          <div className="hidden lg:block w-full h-[150px]" />
        </div>
      </section>

      {/* ── MAIN CONTENT CONTAINER (What you'll learn, Curriculum, Requirements, Description, Instructor, Reviews) ── */}
      <section className="bg-white min-h-screen pb-16">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10 items-start relative select-none">

          <div className="space-y-8 select-text">

            {/* ── MOBILE PRICE SECTION (Visible on mobile/tablet) ── */}
            <div className="lg:hidden bg-white border border-[#d1d7dc] p-6 shadow-md select-none mt-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#1c1d1f] font-sans">
                  {currentPrice > 0 ? `₹${currentPrice}` : "Free"}
                </span>
                {course.price > currentPrice ? (
                  <span className="text-sm text-slate-500 line-through font-sans">
                    ₹{course.price}
                  </span>
                ) : null}
                {discountPercent > 0 && (
                  <span className="text-emerald-700 text-sm font-bold font-sans">
                    {discountPercent}% Off
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-3.5">
                {alreadyEnrolled ? (
                  <button
                    onClick={() => navigate(`/learning/${course._id}`)}
                    className="w-full bg-purple-550 hover:bg-purple-655 border border-[#d1d7dc] text-white font-bold py-3 text-sm text-center transition"
                  >
                    Go to My Course
                  </button>
                ) : rawPrice === 0 ? (
                  <>
                    {(isStudent || user?.role === "admin") && (
                      <button
                        onClick={handleEnrollNow}
                        disabled={enrolling}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 text-sm text-center transition disabled:opacity-60"
                      >
                        {enrolling ? "Enrolling..." : "Enroll Now"}
                      </button>
                    )}
                    {!user && (
                      <button
                        onClick={() => navigate("/api/auth/login")}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 text-sm text-center transition"
                      >
                        Login to Enroll
                      </button>
                    )}
                    {isInstructor && (
                      <div className="rounded border border-[#ecc94b] bg-yellow-50/50 p-3 text-center text-xs text-amber-800 font-sans leading-relaxed">
                        You are registered as Instructor. Student login required to enroll.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {isStudent && (
                      <>
                        <button
                          onClick={handleBuyNow}
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 text-sm transition"
                        >
                          Buy Now
                        </button>
                        <button
                          onClick={async () => {
                            if (alreadyInCart) {
                              navigate("/cart");
                              return;
                            }
                            try {
                              await addCourseToCart(course._id, enrolledCourseIds);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          disabled={cartLoading}
                          className="w-full border border-purple-500 text-purple-500 font-bold py-3 text-sm hover:bg-purple-600 hover:text-white transition"
                        >
                          {alreadyInCart ? "Go to Cart" : "Add to Cart"}
                        </button>
                      </>
                    )}
                    {!user && (
                      <button
                        onClick={() => navigate("/api/auth/login")}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 text-sm text-center transition"
                      >
                        Login to Purchase
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── WHAT YOU'LL LEARN (Objectives) ── */}
            <div className="border border-[#d1d7dc] p-6 bg-white rounded-none">
              <h2 className="text-xl font-bold text-[#1c1d1f] mb-4 font-sans tracking-wide">
                What you'll learn
              </h2>
              {learningObjectives.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs md:text-sm text-slate-800 font-sans">
                  {learningObjectives.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <AiOutlineCheck size={16} className="text-slate-800 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-xs italic">
                  No learning objectives specified for this course.
                </p>
              )}
            </div>

            {/* ── COURSE CONTENT (Curriculum Accordion) ── */}
            <div>
              <h2 className="text-xl font-bold text-[#1c1d1f] mb-2 font-sans tracking-wide">
                Course content
              </h2>
              <div className="flex flex-wrap items-center justify-between text-xs md:text-sm text-gray-700 mb-3 select-none">
                <span className="font-medium">
                  {grouped.length} sections • {totalLecturesCount} lectures •{" "}
                  {formatTotalDuration(course.totalDuration)} total length
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleExpandAll}
                    className="text-purple-650 font-bold hover:text-purple-800 transition cursor-pointer"
                  >
                    Expand all sections
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleCollapseAll}
                    className="text-purple-650 font-bold hover:text-purple-800 transition cursor-pointer"
                  >
                    Collapse all sections
                  </button>
                </div>
              </div>

              {/* Accordion Panels */}
              <div className="border border-[#d1d7dc] rounded-none overflow-hidden select-none">
                {grouped.length > 0 ? (
                  grouped.map((sec) => {
                    const isExpanded = !!expandedSections[sec._id];
                    const activeLect = sec.lectures || [];

                    return (
                      <div
                        key={sec._id}
                        className="border-b last:border-b-0 border-[#d1d7dc]"
                      >
                        {/* Section Header */}
                        <div
                          onClick={() => toggleSection(sec._id)}
                          className="flex items-center justify-between px-6 py-4 bg-[#f7f9fa] hover:bg-slate-100 cursor-pointer transition select-none"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <LuChevronUp className="text-slate-800" size={16} />
                            ) : (
                              <LuChevronDown className="text-slate-800" size={16} />
                            )}
                            <span className="font-bold text-sm text-[#2d2f31]">
                              {sec.title}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600 font-sans">
                            {activeLect.length} lectures •{" "}
                            {formatTotalDuration(
                              activeLect.reduce(
                                (tot, l) => tot + (Number(l.duration) || 0),
                                0
                              )
                            )}
                          </span>
                        </div>

                        {/* Section Lectures Body */}
                        {isExpanded && (
                          <div className="bg-white border-t border-[#d1d7dc]">
                            {activeLect.length > 0 ? (
                              activeLect.map((lec) => (
                                <div
                                  key={lec._id}
                                  onClick={() => {
                                    if (lec.isPreview) {
                                      setActivePreviewLecture(lec);
                                    }
                                  }}
                                  className={`flex items-center justify-between px-8 py-3.5 border-b last:border-b-0 border-[#d1d7dc] text-xs md:text-sm transition ${lec.isPreview
                                    ? "cursor-pointer hover:bg-purple-50/20"
                                    : ""
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {lec.isPreview ? (
                                      <LuPlay
                                        size={14}
                                        className="text-[#a435f0] shrink-0"
                                      />
                                    ) : (
                                      <LuFileText
                                        size={14}
                                        className="text-slate-400 shrink-0"
                                      />
                                    )}
                                    <span
                                      className={`text-[#2d2f31] ${lec.isPreview
                                        ? "text-purple-750 font-medium hover:underline"
                                        : ""
                                        }`}
                                    >
                                      {lec.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3.5 select-none font-sans text-xs">
                                    {lec.isPreview && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActivePreviewLecture(lec);
                                        }}
                                        className="text-purple-650 font-bold hover:text-purple-800 hover:underline cursor-pointer"
                                      >
                                        Preview
                                      </button>
                                    )}
                                    <span className="text-slate-500 font-sans">
                                      {Math.round(Number(lec.duration) || 0)} min
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-8 py-3 text-slate-400 text-xs italic">
                                No lectures available in this section.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs select-none">
                    No curriculum data available for this course.
                  </div>
                )}
              </div>
            </div>

            {/* ── REQUIREMENTS ── */}
            <div>
              <h2 className="text-xl font-bold text-[#1c1d1f] mb-3 font-sans tracking-wide">
                Requirements
              </h2>
              {requirements.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-slate-800 font-sans">
                  {requirements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-slate-800 font-sans">
                  <li>No prior coding experience is required. We take you from absolute beginner to master!</li>
                  <li>A desktop or laptop computer with Windows, Mac, or Linux operating system.</li>
                </ul>
              )}
            </div>

            {/* ── DESCRIPTION ── */}
            <div>
              <h2 className="text-xl font-bold text-[#1c1d1f] mb-3 font-sans tracking-wide">
                Description
              </h2>
              <div className="relative">
                <div
                  className={`text-[#2d2f31] text-xs md:text-sm leading-relaxed space-y-3 font-normal font-sans whitespace-pre-line ${!showFullDescription ? "max-h-[170px] overflow-hidden" : ""
                    }`}
                >
                  {course.description}
                </div>
                {!showFullDescription && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-3 text-purple-650 hover:text-purple-800 font-bold text-xs md:text-sm tracking-wide cursor-pointer flex items-center gap-1 font-sans"
              >
                {showFullDescription ? "Show less" : "Show more"}
              </button>
            </div>

            {/* ── INSTRUCTOR PROFILE BIOGRAPHY ── */}
            <div className="pt-6 border-t border-gray-150">
              <h2 className="text-xl font-bold text-[#1c1d1f] mb-4 font-sans tracking-wide">
                Instructor
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-purple-650 hover:underline cursor-pointer">
                    {instructorName}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium font-sans mt-0.5">
                    {course.instructorId?.headline || "Senior Developer & Educator"}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {instructor?.avatar ? (
                    <img
                      src={instructor.avatar}
                      alt={instructorName}
                      className="w-20 h-20 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      {instructorInitials}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs md:text-sm text-slate-700 font-sans font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-[#b4690e] font-bold">★</span>
                      <span>
                        {course.instructorId?.averageRating || "4.6"}{" "}
                        Instructor Rating
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">💬</span>
                      <span>
                        {course.instructorId?.totalReviews || (Math.round((course.instructorId?.totalStudents || 0) * 0.12) || "42")} Reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">👥</span>
                      <span>
                        {course.instructorId?.totalStudents || 0} Students
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">📚</span>
                      <span>
                        {course.instructorId?.totalCourses || 0} Courses
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-normal font-sans whitespace-pre-line">
                  {course.instructorId?.biography || "Biography description not provided."}
                </p>
              </div>
            </div>

            {/* ── REVIEWS FEEDBACK ── */}
            <div className="pt-6 border-t border-gray-150">
              <CourseReviews
                courseId={course._id}
                theme="light"
                isEnrolled={alreadyEnrolled}
              />
            </div>
          </div>

          {/* ── RIGHT COLUMN: Desktop Floating Widget (Udemy premium overlays) ── */}
          <aside className="relative hidden lg:block select-none z-20 self-stretch">
            <div className="lg:sticky lg:top-[75px] lg:mt-[-360px] w-full bg-white border border-[#d1d7dc] shadow-2xl rounded-none overflow-hidden transition-all duration-300">
              {/* Image Preview container */}
              <div
                onClick={handlePreviewClick}
                className="relative aspect-video bg-[#1c1d1f] cursor-pointer group select-none text-white border-b border-slate-200"
              >
                <img
                  src={previewImage}
                  alt={course.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:opacity-75"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-white text-slate-900 group-hover:scale-105 transition flex items-center justify-center shadow-lg">
                    <BsFillPlayFill size={28} className="translate-x-0.5" />
                  </div>
                  <span className="text-sm font-bold tracking-wide">
                    Preview this course
                  </span>
                </div>
              </div>

              {/* Pricing & Add to Cart info */}
              <div className="p-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
                    {currentPrice > 0 ? `₹${currentPrice}` : "Free"}
                  </span>
                  {course.price > currentPrice ? (
                    <span className="text-sm text-slate-500 line-through font-sans">
                      ₹{course.price}
                    </span>
                  ) : null}
                  {discountPercent > 0 && (
                    <span className="text-emerald-700 text-sm font-bold font-sans">
                      {discountPercent}% Off
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-5 space-y-3.5">
                  {alreadyEnrolled ? (
                    <>
                      <button
                        onClick={() => navigate(`/learning/${course._id}`)}
                        className="w-full bg-purple-600 hover:bg-purple-700 border border-[#d1d7dc] text-white font-bold py-3 text-sm transition h-[48px] cursor-pointer"
                      >
                        Go to My Course
                      </button>
                      <p className="text-[11px] text-slate-400 text-center font-sans tracking-tight mt-1.5">
                        You own this course.
                      </p>
                    </>
                  ) : rawPrice === 0 ? (
                    <>
                      {(isStudent || user?.role === "admin") && (
                        <button
                          onClick={handleEnrollNow}
                          disabled={enrolling}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 text-sm transition h-[48px] cursor-pointer disabled:opacity-60"
                        >
                          {enrolling ? "Enrolling..." : "Enroll Now"}
                        </button>
                      )}
                      {!user && (
                        <button
                          onClick={() => navigate("/api/auth/login")}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 text-sm text-center transition h-[48px] cursor-pointer"
                        >
                          Login to Enroll
                        </button>
                      )}
                      {isInstructor && (
                        <div className="rounded border border-[#ecc94b] bg-yellow-50/50 p-3 text-center text-xs text-amber-800 font-sans leading-relaxed">
                          You are registered as Instructor. Student login required to enroll.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {isStudent && (
                        <>
                          <button
                            onClick={handleBuyNow}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 text-sm transition h-[48px] cursor-pointer"
                          >
                            Buy Now
                          </button>
                          <button
                            onClick={async () => {
                              if (alreadyInCart) {
                                navigate("/cart");
                                return;
                              }
                              try {
                                await addCourseToCart(course._id, enrolledCourseIds);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            disabled={cartLoading}
                            className="w-full border border-[#d1d7dc] text-slate-900 hover:bg-gray-200 font-bold py-3 text-sm transition h-[48px] cursor-pointer"
                          >
                            {alreadyInCart ? "Go to Cart" : "Add to Cart"}
                          </button>
                        </>
                      )}
                      {!user && (
                        <button
                          onClick={() => navigate("/api/auth/login")}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 text-sm text-center transition h-[48px] cursor-pointer"
                        >
                          Login to Purchase
                        </button>
                      )}
                      {isInstructor && (
                        <div className="rounded border border-[#ecc94b] bg-yellow-50/50 p-3 text-center text-xs text-amber-800 font-sans leading-relaxed">
                          You are registered as Instructor. Student login required to enroll.
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Features block */}
                <div className="mt-6 pt-5 border-t border-gray-150">
                  <h4 className="font-bold text-xs uppercase text-slate-900 font-sans tracking-wide mb-3">
                    This course includes:
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-sans">
                    <li className="flex items-center gap-3">
                      <LuPlay size={14} className="text-slate-655 shrink-0" />
                      <span>
                        {formatTotalDuration(course.totalDuration)} on-demand video
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <LuFileText size={15} className="text-slate-655 shrink-0" />
                      <span>{course.totalLectures} lectures</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <LuInfinity size={15} className="text-slate-655 shrink-0" />
                      <span>Full lifetime access</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <LuSmartphone size={15} className="text-slate-655 shrink-0" />
                      <span>Access on mobile and TV</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <LuAward size={15} className="text-slate-655 shrink-0" />
                      <span>Certificate of completion</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ── PROMOTIONAL PREVIEW MODAL ── */}
      {showPreviewModal && course.previewVideo?.url && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1d1f] w-full max-w-4xl rounded-none overflow-hidden shadow-2xl relative border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-sm tracking-wide">
                Course Preview: {course.title}
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <HlsPlayer
                fallbackSrc={course.previewVideo.url}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePreview;
