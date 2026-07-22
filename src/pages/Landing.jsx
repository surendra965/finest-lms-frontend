import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    HiOutlineSparkles,
    HiOutlineChevronRight,
    HiOutlineChevronLeft,
    HiOutlineBookOpen,
    HiOutlineUserGroup,
    HiOutlineClock,
    HiOutlineBadgeCheck,
    HiOutlineDesktopComputer,
    HiOutlineShieldCheck,
    HiOutlineStar,
    HiOutlineArrowRight,
} from "react-icons/hi";
import {
    LuGraduationCap,
    LuBriefcase,
    LuPlay,
    LuAward,
    LuCompass,
    LuCpu,
    LuDatabase,
    LuServer,
    LuInfinity,
    LuPalette,
    LuMegaphone,
} from "react-icons/lu";
import { AiFillStar } from "react-icons/ai";
import CourseCard from "../components/CourseCard";

const API_URL = import.meta.env.VITE_API_URL;

const AnimatedCounter = ({ end, duration = 3000, suffix = "" }) => {
    const [count, setCount] = useState(0);
    const elementRef = useRef(null);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.1 }
        );
        if (elementRef.current) observer.observe(elementRef.current);
        return () => {
            if (elementRef.current) observer.unobserve(elementRef.current);
        };
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [hasStarted, end, duration]);

    return <span ref={elementRef}>{count.toLocaleString()}{suffix}</span>;
};

const Landing = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const carouselRef = useRef(null);

    // 1. Fetch real courses from API
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch(`${API_URL}/api/public/courses?limit=12`);
                const data = await res.json();
                if (res.ok) {
                    setCourses(data?.courses || []);
                }
            } catch (err) {
                console.error("Failed to load courses:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // 2. Extract unique instructors dynamically from fetched courses
    useEffect(() => {
        if (courses.length > 0) {
            const instructorMap = {};
            courses.forEach((c) => {
                const instObj = c.instructorId;
                if (instObj && instObj._id) {
                    const userObj = instObj.userId || {};
                    const firstName = userObj.firstName || instObj.firstName || "Instructor";
                    const lastName = userObj.lastName || instObj.lastName || "";
                    const name = `${firstName} ${lastName}`.trim();
                    const avatar = userObj.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                    const bioStr = instObj.bio || userObj.about || "Industry Mentoring Educator";

                    if (!instructorMap[instObj._id]) {
                        instructorMap[instObj._id] = {
                            name,
                            role: bioStr.split(".")[0] || "Expert Mentorship",
                            experience: "Expert",
                            students: "Active",
                            rating: "4.9",
                            bio: bioStr,
                            image: avatar,
                            courses: [c.title]
                        };
                    } else {
                        if (!instructorMap[instObj._id].courses.includes(c.title)) {
                            instructorMap[instObj._id].courses.push(c.title);
                        }
                    }
                }
            });
            setInstructors(Object.values(instructorMap));
        } else {
            setInstructors([]);
        }
    }, [courses]);

    // 3. Fetch real reviews for dynamic courses to use as testimonials
    useEffect(() => {
        const loadTestimonials = async () => {
            if (courses.length > 0) {
                try {
                    const allReviews = [];
                    for (const course of courses) {
                        const res = await fetch(`${API_URL}/api/reviews/course/${course._id}?page=1&limit=3`);
                        const dat = await res.json();
                        if (res.ok && dat.data?.length > 0) {
                            dat.data.forEach((rev) => {
                                const userObj = rev.userId || {};
                                const name = `${userObj.firstName || "Learner"} ${userObj.lastName || ""}`.trim();
                                allReviews.push({
                                    name,
                                    avatar: userObj.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
                                    course: course.title,
                                    role: "Student",
                                    rating: rev.rating || 5,
                                    review: rev.review || "Excellent content, highly recommended!",
                                    company: "Fine Student"
                                });
                            });
                        }
                    }
                    setTestimonials(allReviews);
                } catch (err) {
                    console.error("Failed to load reviews:", err);
                    setTestimonials([]);
                }
            }
        };
        loadTestimonials();
    }, [courses]);

    // Carousel controllers
    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmt = carouselRef.current.clientWidth * 0.8;
            carouselRef.current.scrollBy({
                left: direction === "left" ? -scrollAmt : scrollAmt,
                behavior: "smooth"
            });
        }
    };

    // Testimonial loops
    useEffect(() => {
        if (testimonials.length <= 1) return;
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [testimonials]);

    // Hash link scroll effect
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.substring(1);
            const el = document.getElementById(id);
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: "smooth" });
                }, 150);
            }
        }
    }, []);

    return (
        <div className="font-sans antialiased text-gray-900 bg-white">
            {/* ── HERO SECTION (Padding Reduced) ── */}
            <section className="relative overflow-hidden pt-12 pb-5 bg-linear-to-b from-gray-50/50 to-white">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Left Side */}
                        <div className="lg:col-span-7 space-y-5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-650 text-xs font-bold leading-none select-none">
                                <HiOutlineSparkles size={12} className="text-[#A259FF] animate-pulse" />
                                Empowering Tech Careers Online
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                                Learn Job-Ready Skills from <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A259FF] to-[#6C4DFF]">Industry Experts</span>
                            </h1>
                            <p className="text-gray-550 text-base font-medium leading-relaxed max-w-xl">
                                Master in-demand technologies through practical courses, real-world projects, and expert mentorship designed to help you build your career faster.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                <Link
                                    to="/api/auth/register"
                                    className="px-6 py-3 bg-[#A259FF] hover:bg-[#8e45ec] text-white font-extrabold rounded-xl transition duration-150 text-center flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
                                >
                                    Explore Courses
                                    <HiOutlineArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/api/auth/login"
                                    className="px-6 py-3 bg-white border border-gray-250/20 text-gray-700 font-extrabold rounded-xl hover:bg-gray-50 transition duration-150 text-center cursor-pointer text-sm active:scale-98"
                                >
                                    Become an Instructor
                                </Link>
                            </div>

                            {/* Stat Counters */}
                            <div className="grid grid-cols-4 gap-4 pt-6 border-t border-gray-100 max-w-md">
                                <div>
                                    <p className="text-xl md:text-2xl font-black text-gray-900">
                                        <AnimatedCounter end={1000} suffix="+" />
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Students</p>
                                </div>
                                <div>
                                    <p className="text-xl md:text-2xl font-black text-gray-900">
                                        <AnimatedCounter end={300} suffix="+" />
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Courses</p>
                                </div>
                                <div>
                                    <p className="text-xl md:text-2xl font-black text-gray-900">
                                        <AnimatedCounter end={100} suffix="+" />
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mentors</p>
                                </div>
                                <div>
                                    <p className="text-xl md:text-2xl font-black text-amber-500">4.9</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Rating</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="lg:col-span-5 relative flex items-center justify-center">
                            <div className="absolute w-[360px] h-[360px] bg-purple-200/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                            <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-lg relative border border-gray-50 bg-white">
                                <img
                                    src="/hero_illustration.png"
                                    alt="Learning Illustration"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRUSTED BY SECTION (Padding Reduced) ── */}
            <section className="py-6 bg-white border-y border-gray-50 select-none">
                <div className="max-w-[1240px] mx-auto px-6">
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Trusted by learners preparing for careers at
                    </p>
                    <div className="flex flex-wrap items-center justify-around gap-6 opacity-50">
                        <span className="text-xs font-black text-gray-400 tracking-wider">TECH COMPANY</span>
                        <span className="text-xs font-black text-gray-400 tracking-wider">STARTUP INC</span>
                        <span className="text-xs font-black text-gray-400 tracking-wider">SOFTWARE FIRM</span>
                        <span className="text-xs font-black text-gray-400 tracking-wider">DIGITAL AGENCY</span>
                    </div>
                </div>
            </section>

            {/* ── WHY CHOOSE US SECTION (Spacing tightened) ── */}
            <section id="why-choose-us" className="py-8 bg-gray-50/40">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="text-center max-w-xl mx-auto space-y-1.5 mb-8">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Why Learn With Fine Course Mart?
                        </h2>
                        <p className="text-gray-500 text-xs font-medium">
                            We design structured learning journeys tailored to take you from absolute novice to secure engineering placement.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-200 group">
                            <div className="w-10 h-10 bg-purple-50 group-hover:bg-[#A259FF] text-[#A259FF] group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors duration-150">
                                <LuGraduationCap size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Industry Designed Curriculum</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Courses structured by professional Tech Leads covering modern application builds and frameworks required by organizations today.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-200 group">
                            <div className="w-10 h-10 bg-purple-50 group-hover:bg-[#A259FF] text-[#A259FF] group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors duration-150">
                                <HiOutlineDesktopComputer size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Hands-on Projects</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Apply learned topics immediately on fully functioning products, deploying API connections and user databases.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-200 group">
                            <div className="w-10 h-10 bg-purple-50 group-hover:bg-[#A259FF] text-[#A259FF] group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors duration-150">
                                <HiOutlineClock size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Lifetime Course Access</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Study in your spare hours. Your course purchases do not expire, providing reliable references whenever you refresh patterns.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-200 group">
                            <div className="w-10 h-10 bg-purple-50 group-hover:bg-[#A259FF] text-[#A259FF] group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors duration-150">
                                <HiOutlineUserGroup size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Expert Mentorship</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Connect directly with instructors via community support channels to troubleshoot code anomalies and resolve blockers.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-200 group">
                            <div className="w-10 h-10 bg-purple-50 group-hover:bg-[#A259FF] text-[#A259FF] group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors duration-150">
                                <HiOutlineBadgeCheck size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Certificates of Completion</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Authenticate your competencies with verifiably secure completions that stand out effectively on curriculum vitae layouts.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-200 group">
                            <div className="w-10 h-10 bg-purple-50 group-hover:bg-[#A259FF] text-[#A259FF] group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors duration-150">
                                <LuBriefcase size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Placement Preparation</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Optimize interview strategies with resume deep dives, standard behavior questions, and industry networking resources.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRENDING COURSES CAROUSEL (Real data only, no static fallbacks) ── */}
            {!loading && courses.length > 0 && (
                <section id="trending-courses" className="py-8 bg-white">
                    <div className="max-w-[1240px] mx-auto px-6">
                        <div className="flex items-end justify-between mb-6">
                            <div className="space-y-1">
                                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Trending Courses
                                </h2>
                                <p className="text-gray-500 text-xs font-medium">
                                    Learn the skills most demanded by the software industry.
                                </p>
                            </div>
                            {/* Navigation buttons */}
                            {courses.length > 1 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => scrollCarousel("left")}
                                        className="w-10 h-10 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                                        title="Scroll Left"
                                    >
                                        <HiOutlineChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => scrollCarousel("right")}
                                        className="w-10 h-10 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                                        title="Scroll Right"
                                    >
                                        <HiOutlineChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div
                            ref={carouselRef}
                            className="flex overflow-x-auto gap-5 pb-4 cursor-grab active:cursor-grabbing scrollbar-hide py-1 scroll-smooth"
                            style={{ scrollbarWidth: "none" }}
                        >
                            {courses.map((c) => (
                                <div key={c._id} className="w-[280px] shrink-0">
                                    <CourseCard course={c} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── LEARNING CATEGORIES GRID (Spacing reduced) ── */}
            <section id="learning-categories" className="py-8 bg-gray-50/40">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="text-center max-w-xl mx-auto space-y-1.5 mb-8">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Top Learning Categories
                        </h2>
                        <p className="text-gray-500 text-xs font-medium">
                            Explore specialized career branches with curated pathway progressions.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { label: "Web Development", count: `${courses.filter(c => c.categoryId?.slug?.includes("web") || c.categoryId?.name?.toLowerCase().includes("web")).length || 1} Courses`, icon: LuInfinity },
                            { label: "Mobile Development", icon: HiOutlineDesktopComputer, count: "0 Courses" },
                            { label: "AI & Machine Learning", icon: LuCpu, count: "0 Courses" },
                            { label: "Data Science", icon: LuDatabase, count: "0 Courses" },
                            { label: "Cloud Computing", icon: LuServer, count: "0 Courses" },
                            { label: "DevOps", icon: LuPlay, count: "0 Courses" },
                            { label: "Cyber Security", icon: HiOutlineShieldCheck, count: "0 Courses" },
                            { label: "UI/UX Design", icon: LuPalette, count: "0 Courses" },
                            { label: "Digital Marketing", icon: LuMegaphone, count: "0 Courses" },
                            { label: "Programming Languages", icon: LuGraduationCap, count: "0 Courses" }
                        ].map((cat, i) => {
                            const Icon = cat.icon;
                            return (
                                <div
                                    key={i}
                                    className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col justify-between hover:shadow-sm hover:border-purple-200 hover:-translate-y-1 transition duration-200 group cursor-pointer"
                                    onClick={() => navigate(`/courses?category=${cat.label.toLowerCase().replace(/\s+/g, "-")}`)}
                                >
                                    <div className="w-8 h-8 bg-purple-50 group-hover:bg-[#A259FF] text-[#A259FF] group-hover:text-white rounded-lg flex items-center justify-center mb-3 transition-colors duration-150">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-[#A259FF] text-xs leading-tight transition-colors mb-0.5 duration-100">
                                            {cat.label}
                                        </h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{cat.count}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── LEARNING JOURNEY 3-STEP (Padding Reduced) ── */}
            <section className="py-10 bg-white border-b border-gray-50">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="text-center max-w-xl mx-auto space-y-1.5 mb-10">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Your Path to Success
                        </h2>
                        <p className="text-gray-500 text-xs font-medium">
                            We guide you step-by-step through our optimized developmental learning path.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
                        <div className="space-y-3 text-center flex flex-col items-center relative group">
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#A259FF] border border-purple-100 flex items-center justify-center text-base font-bold font-mono">
                                01
                            </div>
                            <h3 className="text-base font-extrabold text-gray-950">Choose Your Course</h3>
                            <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                                Pick a course centered around specific frameworks, frontend pipelines, or database technologies.
                            </p>
                        </div>

                        <div className="space-y-3 text-center flex flex-col items-center relative group">
                            <div className="hidden lg:block absolute -left-6 top-5 text-gray-300 font-extrabold pointer-events-none">&rarr;</div>
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#A259FF] border border-purple-100 flex items-center justify-center text-base font-bold font-mono">
                                02
                            </div>
                            <h3 className="text-base font-extrabold text-gray-950">Learn from Experts</h3>
                            <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                                Progress through concise modules and live programming tutorials built by experienced software trainers.
                            </p>
                        </div>

                        <div className="space-y-3 text-center flex flex-col items-center relative group">
                            <div className="hidden lg:block absolute -left-6 top-5 text-gray-300 font-extrabold pointer-events-none">&rarr;</div>
                            <div className="w-12 h-12 rounded-full bg-[#A259FF] text-white border border-[#A259FF] flex items-center justify-center text-base font-bold font-mono shadow-sm">
                                03
                            </div>
                            <h3 className="text-base font-extrabold text-gray-950">Build & Get Certified</h3>
                            <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                                Submit production tasks, generate a secure digital certificate, and prepare for placement interviews.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURED INSTRUCTORS (Real dynamic data, only shows if instructors present) ── */}
            {!loading && instructors.length > 0 && (
                <section id="featured-instructors" className="py-8 bg-gray-50/40">
                    <div className="max-w-[1240px] mx-auto px-6">
                        <div className="text-center max-w-xl mx-auto space-y-1.5 mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                Featured Instructors
                            </h2>
                            <p className="text-gray-500 text-xs font-medium">
                                Study under experienced researchers, tech founders, and principal engineers who share actual workflow methodologies.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {instructors.map((ins, i) => (
                                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs flex flex-col h-full hover:shadow-md hover:-translate-y-0.5 transition duration-150 group">
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <img
                                                src={ins.image}
                                                alt={ins.name}
                                                className="w-12 h-12 rounded-full object-cover border border-purple-100 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <h3 className="font-extrabold text-gray-900 text-xs truncate px-0">{ins.name}</h3>
                                                <p className="text-[10px] text-purple-600 font-semibold">{ins.role}</p>
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-gray-400 line-clamp-2 mb-3 leading-relaxed flex-1">
                                            {ins.bio}
                                        </p>

                                        <div className="grid grid-cols-3 gap-1 py-2 px-2 rounded-xl bg-gray-50 border border-gray-100 text-center mb-4 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-800 tracking-normal mb-0.5">{ins.experience}</span>
                                                Exp
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-800 tracking-normal mb-0.5">{ins.students}</span>
                                                Students
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-black text-amber-500 tracking-normal mb-0.5 flex items-center justify-center gap-0.5">
                                                    {ins.rating}
                                                </span>
                                                Rating
                                            </div>
                                        </div>

                                        {/* Classes */}
                                        <div className="space-y-1.5 border-t border-gray-100 pt-3">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Core Classes</p>
                                            {ins.courses.map((courseTitle, cIdx) => (
                                                <div key={cIdx} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                                    <span className="truncate">{courseTitle}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 bg-gray-50/50 p-3 grid grid-cols-2 gap-2 text-center select-none text-[11px]">
                                        <Link
                                            to="/api/auth/register"
                                            className="py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition cursor-pointer"
                                        >
                                            View Profile
                                        </Link>
                                        <Link
                                            to="/api/auth/register"
                                            className="py-2 bg-[#A259FF] text-white font-bold rounded-lg hover:bg-[#8e45ec] transition cursor-pointer"
                                        >
                                            Explore Courses
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── STUDENT TESTIMONIALS (Only shows if real reviews exist) ── */}
            {!loading && testimonials.length > 0 && (
                <section className="py-8 bg-white">
                    <div className="max-w-[1240px] mx-auto px-6">
                        <div className="text-center max-w-xl mx-auto space-y-1.5 mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                Student Success Stories
                            </h2>
                            <p className="text-gray-500 text-xs font-medium">
                                See how our courses helped tech professionals advance their engineering positions.
                            </p>
                        </div>

                        <div className="max-w-xl mx-auto relative px-6 bg-linear-to-tr from-purple-500/5 to-purple-600/5 py-8 rounded-2xl border border-purple-100/30">
                            <div className="space-y-4 text-center animate-in fade-in transition duration-300">
                                <div className="flex justify-center text-amber-500 gap-0.5 select-none">
                                    {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                                        <AiFillStar key={i} size={16} className="text-amber-400" />
                                    ))}
                                </div>
                                <blockquote className="text-sm font-medium italic text-gray-700 leading-relaxed">
                                    "{testimonials[activeTestimonial].review}"
                                </blockquote>
                                <div className="flex flex-col items-center pt-2">
                                    <img
                                        src={testimonials[activeTestimonial].avatar}
                                        alt={testimonials[activeTestimonial].name}
                                        className="w-10 h-10 rounded-full object-cover border border-purple-200 mb-2 shadow-xs"
                                    />
                                    <h4 className="font-extrabold text-gray-900 text-xs leading-none mb-0.5">
                                        {testimonials[activeTestimonial].name}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        {testimonials[activeTestimonial].role} at <span className="text-[#A259FF] font-semibold">{testimonials[activeTestimonial].company}</span>
                                    </p>
                                </div>
                            </div>

                            {testimonials.length > 1 && (
                                <div className="flex justify-center gap-1.5 mt-5 select-none">
                                    {testimonials.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveTestimonial(i)}
                                            className={`h-1.5 rounded-full cursor-pointer transition-all duration-200 ${i === activeTestimonial ? "w-6 bg-[#A259FF]" : "w-1.5 bg-gray-200"
                                                }`}
                                            aria-label={`Go to slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── PLATFORM HIGHLIGHTS (Padding Reduced) ── */}
            <section className="py-8 bg-[#A259FF] text-white shadow-inner">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center items-center justify-center">
                        <div className="space-y-1">
                            <span className="block text-2xl md:text-4xl font-black tracking-tight">
                                <AnimatedCounter end={15000} suffix="+" />
                            </span>
                            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest leading-none">Active Learners</p>
                        </div>

                        <div className="space-y-1">
                            <span className="block text-2xl md:text-4xl font-black tracking-tight">
                                <AnimatedCounter end={500} suffix="+" />
                            </span>
                            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest leading-none">Hours of Content</p>
                        </div>

                        <div className="space-y-1">
                            <span className="block text-2xl md:text-4xl font-black tracking-tight">
                                <AnimatedCounter end={95} suffix="%" />
                            </span>
                            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest leading-none">Course Completion</p>
                        </div>

                        <div className="space-y-1">
                            <span className="block text-2xl md:text-4xl font-black tracking-tight">
                                4.9
                            </span>
                            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest leading-none">Average Rating</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ABOUT FINE COURSE MART (Padding Reduced) ── */}
            <section id="about" className="py-10 bg-white">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Left Image */}
                        <div className="lg:col-span-5 flex items-center justify-center">
                            <div className="w-full max-w-[360px] rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white">
                                <img
                                    src="/about_illustration.png"
                                    alt="Who We Are Fine Course Mart"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>

                        {/* Right content */}
                        <div className="lg:col-span-7 space-y-4">
                            <p className="text-[10px] font-bold text-[#A259FF] uppercase tracking-widest">Who We Are</p>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                We Build Educational Pipelines for Dynamic Careers
                            </h2>
                            <p className="text-gray-500 leading-relaxed text-xs md:text-sm font-medium">
                                Fine Course Mart is a modern online learning platform dedicated to helping students and tech professionals gain practical, industry-relevant skills. We focus on high-quality content, expert instructors, hands-on projects, and career-oriented education designed to support continuous growth and professional success.
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-purple-50 text-[#A259FF] rounded-lg flex items-center justify-center shrink-0">
                                        <LuAward size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-gray-950 text-xs mb-0.5">High Quality Content</h4>
                                        <p className="text-[10px] text-gray-400">Strict lecture vetting parameters.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-purple-50 text-[#A259FF] rounded-lg flex items-center justify-center shrink-0">
                                        <LuCompass size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-gray-950 text-xs mb-0.5">Continuous Growth</h4>
                                        <p className="text-[10px] text-gray-400">Curriculums updated alongside industry changes.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CALL TO ACTION (Padding and margins reduced) ── */}
            <section className="py-6 bg-white">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#A259FF] via-[#6C4DFF] to-purple-900 rounded-2xl p-8 md:p-10 text-center text-white shadow-md">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-lg -ml-8 -mt-8 pointer-events-none animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl -mr-10 -mb-10 pointer-events-none"></div>

                        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Start Learning Today</h2>
                            <p className="text-purple-100 text-xs md:text-sm leading-relaxed">
                                Upgrade your skills with practical, industry-focused courses and learn at your own pace from experienced professionals.
                            </p>
                            <div className="flex justify-center gap-3 pt-2">
                                <Link
                                    to="/api/auth/register"
                                    className="px-6 py-2.5 bg-white text-[#A259FF] hover:bg-purple-50 font-bold rounded-lg transition duration-100 shadow-xs text-[11px] uppercase tracking-wider"
                                >
                                    Explore Courses
                                </Link>
                                <Link
                                    to="/api/auth/register"
                                    className="px-6 py-2.5 bg-transparent border border-white/50 text-white font-bold rounded-lg hover:bg-white/10 hover:border-white transition duration-100 text-[11px] uppercase tracking-wider"
                                >
                                    Get Started Free
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER (Padding and margin Reduced) ── */}
            <footer className="bg-gray-900 text-gray-400 pt-10 pb-6 border-t border-gray-800">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
                        <div className="col-span-2 space-y-2">
                            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-[#A259FF] flex items-center justify-center text-white text-xs"><LuGraduationCap /></span>
                                Fine Course Mart
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                                Empowering individuals around India to learn modern tech capabilities, design principles, and placement routines.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-white text-[10px] font-bold uppercase tracking-wider">Company</h4>
                            <ul className="space-y-1.5 text-xs font-semibold">
                                <li><Link to="/api/auth/register" className="hover:text-white transition">About</Link></li>
                                <li><Link to="/api/auth/register" className="hover:text-white transition">Careers</Link></li>
                                <li><Link to="/api/auth/register" className="hover:text-white transition">Contact</Link></li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-white text-[10px] font-bold uppercase tracking-wider">Courses</h4>
                            <ul className="space-y-1.5 text-xs font-semibold">
                                <li><Link to="/api/auth/register" className="hover:text-white transition">All Courses</Link></li>
                                <li><Link to="/api/auth/register" className="hover:text-white transition">Categories</Link></li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-white text-[10px] font-bold uppercase tracking-wider">Support</h4>
                            <ul className="space-y-1.5 text-xs font-semibold">
                                <li><Link to="/api/auth/register" className="hover:text-white transition">Help Center</Link></li>
                                <li><Link to="/api/auth/register" className="hover:text-white transition">FAQs</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800/80 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-semibold text-gray-500">
                        <p>&copy; {new Date().getFullYear()} Fine Course Mart. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition">Facebook</a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition">LinkedIn</a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition">Instagram</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
