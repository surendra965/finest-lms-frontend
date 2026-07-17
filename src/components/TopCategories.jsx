import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineCode,
  HiOutlineDesktopComputer,
  HiOutlineTrendingUp,
  HiOutlineCurrencyDollar,
  HiOutlinePencilAlt,
  HiOutlineCamera,
  HiOutlineMusicNote,
  HiOutlineHeart,
  HiOutlineGlobe,
  HiOutlineLightBulb,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineColorSwatch,
  HiOutlineCog,
  HiOutlineClipboardList,
  HiOutlineCloud,
} from "react-icons/hi";

const API_URL = import.meta.env.VITE_API_URL;

/* ── Icon + gradient mapping by category name keyword ── */
const CATEGORY_STYLES = {
  development:    { Icon: HiOutlineCode,             gradient: "from-violet-500 to-purple-600",   bg: "bg-violet-50",   text: "text-violet-600" },
  programming:    { Icon: HiOutlineCode,             gradient: "from-violet-500 to-purple-600",   bg: "bg-violet-50",   text: "text-violet-600" },
  web:            { Icon: HiOutlineGlobe,            gradient: "from-blue-500 to-cyan-500",       bg: "bg-blue-50",     text: "text-blue-600" },
  business:       { Icon: HiOutlineTrendingUp,       gradient: "from-emerald-500 to-teal-600",    bg: "bg-emerald-50",  text: "text-emerald-600" },
  finance:        { Icon: HiOutlineCurrencyDollar,   gradient: "from-green-500 to-emerald-600",   bg: "bg-green-50",    text: "text-green-600" },
  accounting:     { Icon: HiOutlineCurrencyDollar,   gradient: "from-green-500 to-emerald-600",   bg: "bg-green-50",    text: "text-green-600" },
  it:             { Icon: HiOutlineDesktopComputer,  gradient: "from-slate-500 to-gray-700",      bg: "bg-slate-50",    text: "text-slate-600" },
  software:       { Icon: HiOutlineCog,              gradient: "from-slate-500 to-gray-700",      bg: "bg-slate-50",    text: "text-slate-600" },
  design:         { Icon: HiOutlineColorSwatch,      gradient: "from-pink-500 to-rose-600",       bg: "bg-pink-50",     text: "text-pink-600" },
  marketing:      { Icon: HiOutlineChartBar,         gradient: "from-orange-500 to-amber-600",    bg: "bg-orange-50",   text: "text-orange-600" },
  lifestyle:      { Icon: HiOutlineHeart,            gradient: "from-rose-400 to-pink-500",       bg: "bg-rose-50",     text: "text-rose-500" },
  photography:    { Icon: HiOutlineCamera,           gradient: "from-amber-500 to-orange-600",    bg: "bg-amber-50",    text: "text-amber-600" },
  health:         { Icon: HiOutlineHeart,            gradient: "from-red-400 to-rose-500",        bg: "bg-red-50",      text: "text-red-500" },
  fitness:        { Icon: HiOutlineHeart,            gradient: "from-red-400 to-rose-500",        bg: "bg-red-50",      text: "text-red-500" },
  music:          { Icon: HiOutlineMusicNote,        gradient: "from-indigo-500 to-violet-600",   bg: "bg-indigo-50",   text: "text-indigo-600" },
  teaching:       { Icon: HiOutlineAcademicCap,      gradient: "from-cyan-500 to-blue-600",       bg: "bg-cyan-50",     text: "text-cyan-600" },
  academics:      { Icon: HiOutlineAcademicCap,      gradient: "from-cyan-500 to-blue-600",       bg: "bg-cyan-50",     text: "text-cyan-600" },
  productivity:   { Icon: HiOutlineClipboardList,    gradient: "from-teal-500 to-cyan-600",       bg: "bg-teal-50",     text: "text-teal-600" },
  data:           { Icon: HiOutlineChartBar,         gradient: "from-sky-500 to-blue-600",        bg: "bg-sky-50",      text: "text-sky-600" },
  ai:             { Icon: HiOutlineLightBulb,        gradient: "from-fuchsia-500 to-purple-600",  bg: "bg-fuchsia-50",  text: "text-fuchsia-600" },
  cloud:          { Icon: HiOutlineCloud,            gradient: "from-sky-400 to-indigo-500",      bg: "bg-sky-50",      text: "text-sky-600" },
  writing:        { Icon: HiOutlinePencilAlt,        gradient: "from-amber-400 to-yellow-600",    bg: "bg-amber-50",    text: "text-amber-600" },
};

const DEFAULT_STYLE = { Icon: HiOutlineAcademicCap, gradient: "from-gray-500 to-gray-700", bg: "bg-gray-50", text: "text-gray-600" };

const getStyleForCategory = (name) => {
  const lower = (name || "").toLowerCase();
  for (const [keyword, style] of Object.entries(CATEGORY_STYLES)) {
    if (lower.includes(keyword)) return style;
  }
  return DEFAULT_STYLE;
};

const TopCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        if (res.ok) {
          setCategories(data.data || []);
        }
      } catch {
        /* silent fail */
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-6 max-w-335 mx-auto">
        <div className="mb-10">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-5 w-96 bg-gray-100 rounded-lg animate-pulse mt-3" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section className="py-5 px-6 max-w-335 mx-auto">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-3xl font-bold text-gray-900">
          Top Categories
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {categories.map((cat) => {
          const { Icon, text } = getStyleForCategory(cat.name);
          const slug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-");

          return (
            <Link
              key={cat._id}
              to={`/courses/${slug}`}
              className="group relative overflow-hidden border border-gray-300 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-2 flex items-center text-left gap-4">
                {/* Icon circle */}
                <div className={`w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={28} className={text} />
                </div>

                {/* Name */}
                <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-purple-700 transition-colors">
                  {cat.name}
                </h3>

                {/* Course count (if available) */}
                {cat.courseCount !== undefined && (
                  <span className="text-xs text-gray-400 -mt-2">
                    {cat.courseCount} {cat.courseCount === 1 ? "course" : "courses"}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default TopCategories;
