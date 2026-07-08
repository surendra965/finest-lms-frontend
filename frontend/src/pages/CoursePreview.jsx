import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AiFillStar,
  AiOutlineBook,
  AiOutlineClockCircle,
  AiOutlineGlobal,
  AiOutlineBarChart,
  AiOutlineCheck,
  AiOutlineTablet,
  AiOutlineClose,
} from "react-icons/ai";
import { BsFillPlayFill, BsDot } from "react-icons/bs";
import { LuInfinity, LuShieldCheck } from "react-icons/lu";
import HlsPlayer from "../components/course/HlsPlayer";
import { CourseReviews } from "../components/course/CourseReviews";
import { AuthContext } from "../context/authContext";
import { useCart } from "../context/CartContext";
import { useEnrollment } from "../context/EnrollmentContext";

const CoursePreview = () => {
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cart, addCourseToCart, loading: cartLoading } = useCart();
  const { isEnrolled, enrolledCourseIds, refreshEnrollments } = useEnrollment();

  const [courseData, setCourseData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activePreviewLecture, setActivePreviewLecture] = useState(null);

  const handlePreviewClick = () => {
    if (courseData?.course?.previewVideo?.url) {
      setShowPreviewModal(true);
    } else {
      toast.info("No promotional preview video available for this course.");
    }
  };

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
    const sections = courseData?.sections || [];
    const lectures = courseData?.lectures || [];
    return sections.map((sec) => ({
      ...sec,
      lectures: lectures.filter((lec) => lec.sectionId === sec._id),
    }));
  }, [courseData]);

  const { items: cartItems = [] } = cart || {};
  const isStudent = user?.role === "student";
  const isInstructor = user?.role === "instructor";

  // Use global EnrollmentContext — no extra API call needed
  const alreadyEnrolled = course ? isEnrolled(course._id) : false;
  const alreadyInCart = cartItems.some((item) => {
    const savedCourseId = item.courseId?._id || item.courseId;
    return savedCourseId === course?._id;
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!courseData || !course) return null;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <section className="relative overflow-hidden bg-linear-to-b from-slate-50 via-slate-50 to-white pb-16 pt-10">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-purple-100 opacity-40 blur-3xl" />
        <div className="mx-auto relative z-10 max-w-7xl px-6">
          <div className="grid gap-10 xl:grid-cols-[1.8fr_1fr] items-start">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">{course.categoryId?.name || "Development"}</span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">{course.level}</span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">{course.language}</span>
              </div>

              <div className="max-w-3xl space-y-5">
                <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                  {course.title}
                </h1>
                <p className="text-lg leading-8 text-slate-600">{course.subtitle || course.description}</p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-950 shadow-sm">
                  Bestseller
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700">Created by {instructor?.fullName || "Instructor"}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Rating</div>
                  <div className="mt-3 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                    <AiFillStar className="text-amber-400" /> {course.averageRating || "4.6"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{course.totalReviews || 0} reviews</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Students</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-900">{course.totalEnrollments || 0}</div>
                  <div className="mt-2 text-sm text-slate-500">learners enrolled</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Last updated</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-900">{new Date(course.updatedAt).toLocaleDateString()}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Language</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-900">{course.language}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl">
                <div className="relative h-96">
                  <img src={previewImage} alt={course.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/25" />
                  <button
                    onClick={handlePreviewClick}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-purple-600 shadow-2xl transition hover:scale-105"
                  >
                    <BsFillPlayFill size={28} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 grid gap-8 lg:grid-cols-[1.7fr_0.95fr]">
        <div className="space-y-8">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">About this course</h2>
                <p className="mt-2 text-sm text-slate-600">Learn exactly what this course covers and what you'll be able to do afterward.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-purple-600">
                <span className="rounded-full bg-purple-50 px-3 py-1">{course.categoryId?.name || 'General'}</span>
                <span className="rounded-full bg-purple-50 px-3 py-1">{course.level}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">{course.averageRating || '0.0'}</div>
                Avg. rating
              </div>
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">{course.totalReviews || 0}</div>
                Reviews
              </div>
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">{course.totalEnrollments || 0}</div>
                Students
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
              {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <p className="text-base leading-8 text-slate-700">{course.description}</p>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">What you'll learn</h3>
                      <ul className="space-y-3 text-sm text-slate-600">
                        {learningObjectives.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <AiOutlineCheck size={18} className="mt-1 text-purple-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Who this course is for</h3>
                      <ul className="space-y-3 text-sm text-slate-600">
                        {targetAudience.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <BsDot size={22} className="mt-1 text-purple-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="space-y-6">
                  {grouped.map((sec) => (
                    <div key={sec._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="font-semibold text-slate-900 mb-4">{sec.title}</div>
                      <div className="space-y-3">
                        {sec.lectures.map((lec) => (
                          <button
                            key={lec._id}
                            onClick={() => lec.isPreview && setActivePreviewLecture(lec)}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                              lec.isPreview
                                ? 'bg-white text-purple-900 shadow-sm hover:bg-purple-50'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <BsFillPlayFill size={16} className="text-purple-600" />
                              <span>{lec.title}</span>
                            </span>
                            <span className="text-slate-500">{lec.duration} min</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'instructor' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img src={instructor?.avatar || 'https://via.placeholder.com/80'} alt={instructor?.fullName} className="h-20 w-20 rounded-full object-cover" />
                    <div>
                      <div className="text-xl font-semibold text-slate-900">{instructor?.fullName}</div>
                      <p className="text-sm text-slate-600">{course.instructorId?.headline}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{course.instructorId?.biography}</p>
                  <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-100 p-4">Rating: {course.instructorId?.averageRating}</div>
                    <div className="rounded-2xl bg-slate-100 p-4">Courses: {course.instructorId?.totalCourses}</div>
                    <div className="rounded-2xl bg-slate-100 p-4">Students: {course.instructorId?.totalStudents}</div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <CourseReviews courseId={course._id} theme="light" isEnrolled={alreadyEnrolled} />
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {/* ── ALREADY ENROLLED: Lifetime Access Card ── */}
          {alreadyEnrolled ? (
            <div className="rounded-4xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <LuShieldCheck size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700">You Own This Course</p>
                  <p className="text-xs text-green-500">Lifetime Free Access</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 border border-green-100 mb-4">
                <LuInfinity size={18} className="text-green-600 shrink-0" />
                <p className="text-sm text-green-700 font-semibold">
                  Unlimited lifetime access — no additional purchase required.
                </p>
              </div>

              <button
                onClick={() => navigate(`/learning/${course._id}`)}
                className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 flex items-center justify-center gap-2"
              >
                Go to My Course →
              </button>

              <p className="mt-3 text-xs text-green-500 text-center">
                Find this in <strong>My Learning</strong> anytime.
              </p>
            </div>
          ) : (
            /* ── NOT ENROLLED: Price + Buy/Cart Buttons ── */
            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Course price</div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-slate-900">
                  ₹{course.discountPrice || course.price || 0}
                </span>
                {course.price && course.discountPrice ? (
                  <span className="text-sm text-slate-500 line-through">₹{course.price}</span>
                ) : null}
              </div>
              {course.price && course.discountPrice ? (
                <div className="mt-2 text-sm font-semibold text-emerald-700">Save {discountPercent}%</div>
              ) : null}

              {isStudent && (
                <button
                  className="mt-6 w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                  onClick={() => {
                    if (alreadyEnrolled) {
                      toast.info("You already own this course! Access it in My Learning.");
                      return;
                    }
                    navigate("/cart");
                  }}
                >
                  Buy Now
                </button>
              )}

              {!user && (
                <button
                  onClick={() => navigate("/api/auth/login")}
                  className="mt-6 w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Login to Purchase
                </button>
              )}

              {isInstructor && (
                <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center text-sm text-slate-500">
                  Enrollment is available for student accounts only.
                </div>
              )}

              {isStudent && (
                <button
                  onClick={async () => {
                    if (alreadyEnrolled) {
                      toast.info("You already own this course! Access it in My Learning.");
                      return;
                    }
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
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {alreadyInCart ? "Go to cart" : "Add to cart"}
                </button>
              )}

              {!user && (
                <button
                  onClick={() => navigate("/api/auth/login")}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Login to save for later
                </button>
              )}

              <p className="mt-4 text-xs text-slate-500 text-center">30-Day Money Back Guarantee.</p>
            </div>
          )}

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">What this course includes</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2"><AiOutlineClockCircle size={18} className="text-purple-600" /> {course.totalDuration} minutes on demand video</li>
              <li className="flex items-center gap-2"><AiOutlineBook size={18} className="text-purple-600" /> {course.totalLectures} lectures</li>
              <li className="flex items-center gap-2"><AiOutlineGlobal size={18} className="text-purple-600" /> {course.language}</li>
              <li className="flex items-center gap-2"><AiOutlineBarChart size={18} className="text-purple-600" /> {course.level}</li>
              <li className="flex items-center gap-2"><LuInfinity size={18} className="text-purple-600" /> Lifetime access</li>
            </ul>
          </div>
        </aside>
      </section>

      {showPreviewModal && course.previewVideo?.url && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1d1f] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">Course Preview: {course.title}</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <HlsPlayer fallbackSrc={course.previewVideo.url} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      {activePreviewLecture && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1d1f] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">Lecture Preview: {activePreviewLecture.title}</h3>
              <button
                onClick={() => setActivePreviewLecture(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <HlsPlayer
                lectureId={activePreviewLecture._id}
                fallbackSrc={activePreviewLecture.video?.masterPlaylist}
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
