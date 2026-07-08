import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

const API_URL = import.meta.env.VITE_API_URL;

const CategoryBar = () => {
  const [categories, setCategories] = useState([]);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        if (res.ok) {
          setCategories(data.data || []);
        }
      } catch {
        /* silent fail — bar just won't appear */
      }
    };
    fetchCategories();
  }, []);

  /* ── track scroll position for arrow visibility ── */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 280, behavior: "smooth" });
  };

  if (!categories.length) return null;

  return (
    <div className="relative bg-white border-b border-gray-200">
      <div className="max-w-[1340px] mx-auto px-4 relative">

        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition"
          >
            <HiOutlineChevronLeft size={18} className="text-gray-700" />
          </button>
        )}

        {/* Scrollable categories */}
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 px-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/courses/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-")}`}
              className="shrink-0 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 rounded-full hover:bg-purple-50 transition-all duration-200 whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition"
          >
            <HiOutlineChevronRight size={18} className="text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryBar;
