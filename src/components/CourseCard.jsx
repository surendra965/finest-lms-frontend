import { Link } from "react-router-dom";
import { AiFillStar } from "react-icons/ai";
import { LuClock, LuPlay, LuUsers } from "react-icons/lu";
import { BsFillPlayFill } from "react-icons/bs";

/**
 * Unified CourseCard — used on every public page (Home, CategoryCourses, Cart, Navbar Suggestions).
 *
 * Props are intentionally flexible:
 *   course.id / course._id        — MongoDB ID for the link
 *   course.title                  — displayed title
 *   course.thumbnail / image      — cover image
 *   course.instructor             — plain name string (fallback)
 *   course.instructorId           — nested object from API
 *   course.price                  — original price
 *   course.discountPrice          — sale price
 *   course.averageRating          — 0–5 float
 *   course.totalReviews           — count
 *   course.totalStudents / totalEnrollments
 *   course.totalLectures
 *   course.totalDuration          — in minutes
 *   course.level                  — "beginner" | "intermediate" | "advanced"
 *   course.category / categoryId  — category name string / object
 *   variant                       — "grid" (default) | "horizontal" | "compact"
 */
const CourseCard = ({ course = {}, variant = "grid", href: customHref }) => {
  const id = course._id || course.id;
  const href = customHref || (id ? `/api/public/courses/${id}` : "/courses");

  // ── Instructor name ────────────────────────────────────
  const instructor =
    course.instructorId?.userId?.firstName
      ? `${course.instructorId.userId.firstName} ${course.instructorId.userId.lastName || ""}`.trim()
      : course.instructorId?.firstName || course.instructor || "Instructor";

  // ── Pricing ────────────────────────────────────────────
  const originalPrice = course.price ?? 0;
  const salePrice =
    course.discountPrice != null && course.discountPrice < originalPrice
      ? course.discountPrice
      : originalPrice;
  const hasDiscount = originalPrice > 0 && salePrice < originalPrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  // ── Rating ─────────────────────────────────────────────
  const rating = course.averageRating ? Number(course.averageRating).toFixed(1) : null;
  const reviews = course.totalReviews ?? 0;
  const starCount = Math.round(course.averageRating || 0);

  // ── Meta ───────────────────────────────────────────────
  const lectures = course.totalLectures ?? 0;
  const durationMins = course.totalDuration ?? 0;
  const durationLabel =
    durationMins > 0
      ? durationMins >= 60
        ? `${Math.floor(durationMins / 60)}h ${Math.round(durationMins % 60) > 0 ? `${Math.round(durationMins % 60)}m` : ""}`.trim()
        : `${Math.round(durationMins)}m`
      : null;
  const students = course.totalStudents ?? course.totalEnrollments ?? 0;
  const level = course.level
    ? course.level.charAt(0).toUpperCase() + course.level.slice(1)
    : null;

  // ── Category ───────────────────────────────────────────
  const category =
    course.categoryId?.name || course.category || null;

  if (variant === "horizontal") {
    return <HorizontalCard href={href} course={course} instructor={instructor} rating={rating} reviews={reviews} starCount={starCount} salePrice={salePrice} originalPrice={originalPrice} hasDiscount={hasDiscount} lectures={lectures} durationLabel={durationLabel} level={level} />;
  }

  if (variant === "compact") {
    return <CompactCard href={href} course={course} instructor={instructor} rating={rating} salePrice={salePrice} originalPrice={originalPrice} hasDiscount={hasDiscount} discountPct={discountPct} />;
  }

  // ── Default: GRID variant (Udemy-style) ────────────────
  return (
    <Link
      to={href}
      className="group bg-white overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm"
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-video overflow-hidden bg-gray-50 border-b border-gray-100/50 shrink-0">
        {course.thumbnail || course.image ? (
          <img
            src={course.thumbnail || course.image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-50 flex items-center justify-center">
            <BsFillPlayFill size={40} className="text-purple-300" />
          </div>
        )}

        {/* Overlay play button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300">
            <BsFillPlayFill size={22} className="text-gray-900 ml-0.5" />
          </div>
        </div>

        {/* Level badge */}
        {level && (
          <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase bg-white/95 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-full shadow-sm">
            {level}
          </span>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-500 text-white px-2.5 py-1 rounded-full shadow-sm">
            {discountPct}% OFF
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category (subtle) */}
        {category && (
          <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-1">{category}</p>
        )}

        {/* Title */}
        <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors mb-1 text-sm">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-xs text-gray-500 mb-2 font-medium truncate">By {instructor}</p>

        {/* Rating row */}
        {rating && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-extrabold text-amber-700">{rating}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <AiFillStar
                  key={i}
                  size={12}
                  className={i < starCount ? "text-amber-400" : "text-gray-200"}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-400">({reviews.toLocaleString()})</span>
          </div>
        )}

        {/* Meta row (lectures, duration, students) */}
        {(lectures > 0 || durationLabel || students > 0) && (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400 mb-3">
            {lectures > 0 && (
              <span className="flex items-center gap-1">
                <LuPlay size={11} className="text-purple-400" />
                {lectures} lectures
              </span>
            )}
            {durationLabel && (
              <span className="flex items-center gap-1">
                <LuClock size={11} className="text-purple-400" />
                {durationLabel}
              </span>
            )}
            {students > 0 && (
              <span className="flex items-center gap-1">
                <LuUsers size={11} className="text-purple-400" />
                {students.toLocaleString()} students
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-extrabold text-gray-900">
            {salePrice > 0 ? `₹${salePrice}` : "Free"}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through font-normal">₹{originalPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ─────────────────────────────────────────────────────────
   HORIZONTAL variant  (used for Instructor Home etc.)
───────────────────────────────────────────────────────── */
const HorizontalCard = ({ href, course, instructor, rating, reviews, starCount, salePrice, originalPrice, hasDiscount, lectures, durationLabel, level }) => (
  <Link
    to={href}
    className="group flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:border-purple-200 transition-all duration-200"
  >
    {/* Thumbnail */}
    <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
      {course.thumbnail ? (
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-50 flex items-center justify-center">
          <BsFillPlayFill size={24} className="text-purple-300" />
        </div>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      {level && <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">{level}</p>}
      <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors">{course.title}</h3>
      <p className="text-xs text-gray-500 mt-0.5 truncate">By {instructor}</p>
      {rating && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-bold text-amber-700">{rating}</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <AiFillStar key={i} size={10} className={i < starCount ? "text-amber-400" : "text-gray-200"} />
          ))}
          <span className="text-[10px] text-gray-400">({reviews})</span>
        </div>
      )}
      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
        {lectures > 0 && <span>{lectures} lectures</span>}
        {durationLabel && <span>{durationLabel}</span>}
      </div>
    </div>

    {/* Price */}
    <div className="shrink-0 text-right">
      <p className="text-sm font-extrabold text-gray-900">{salePrice > 0 ? `₹${salePrice}` : "Free"}</p>
      {hasDiscount && <p className="text-xs text-gray-400 line-through">₹{originalPrice}</p>}
    </div>
  </Link>
);

/* ─────────────────────────────────────────────────────────
   COMPACT variant  (Cart "you may also like" slider)
───────────────────────────────────────────────────────── */
const CompactCard = ({ href, course, instructor, rating, salePrice, originalPrice, hasDiscount, discountPct }) => {
  const starCount = Math.round(course.averageRating || 0);
  return (
    <Link to={href} className="w-[260px] shrink-0 flex flex-col group text-left">
      <div className="w-full h-[150px] overflow-hidden rounded-xl bg-gray-100 border border-gray-200 relative">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-50 flex items-center justify-center">
            <BsFillPlayFill size={28} className="text-purple-300" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 text-[9px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">{discountPct}% OFF</span>
        )}
      </div>
      <div className="mt-3 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-700 transition-colors">{course.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">By {instructor}</p>
        {course.averageRating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs font-extrabold text-amber-700">{Number(course.averageRating).toFixed(1)}</span>
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <AiFillStar key={i} size={10} className={i < starCount ? "text-amber-400" : "text-gray-200"} />
              ))}
            </div>
            <span className="text-[10px] text-gray-400">({(course.totalReviews || 0).toLocaleString()})</span>
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold text-gray-900">{salePrice > 0 ? `₹${salePrice}` : "Free"}</span>
          {hasDiscount && <span className="text-xs text-gray-400 line-through">₹{originalPrice}</span>}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;