import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineShoppingCart, AiFillStar } from "react-icons/ai";
import { HiOutlineTicket } from "react-icons/hi";
import { LuChevronLeft, LuChevronRight, LuTrash } from "react-icons/lu";
import { useCart } from "../context/CartContext";
import CourseCard from "../components/CourseCard";

const CartItem = ({ item, onRemove }) => {
  const course = typeof item.courseId === "object" ? item.courseId : null;
  const title = course?.title || item.title || "Untitled course";
  const instructor = course?.instructorId?.fullName || item.instructor || "Instructor";
  const thumbnail = course?.thumbnail || item.thumbnail || "https://via.placeholder.com/320x180?text=Course";
  const courseLink = course?._id ? `/api/public/courses/${course._id}` : `/api/public/courses/${item.courseId}`;
  const original =
    course?.price ?? item.price ?? 0;

  const price =
    course?.discountPrice ??
    course?.price ??
    item.price ??
    0;

  return (
    <div className="flex sm:flex-row flex-col items-start gap-6 border-b border-gray-200 pb-5 pt-5 last:border-b-0 last:pb-0">
      <Link to={courseLink} className="w-full sm:w-40 h-full sm:h-24 overflow-hidden rounded-lg shrink-0 bg-gray-100">
        <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
      </Link>

      <div className="flex-1">
        <div className="flex sm:flex-row flex-col items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to={courseLink} className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-purple-600">
              {title}
            </Link>
            <p className="text-sm text-gray-500 mt-1">By {instructor}</p>

            <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
              {item.badge && <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">{item.badge}</span>}
              {item.rating && (
                <span className="flex items-center gap-1">
                  <strong className="text-amber-600">{item.rating}</strong>
                  <span className="text-gray-400">({item.reviews ?? 0})</span>
                </span>
              )}
              {item.totalLectures > 0 && <span>{item.totalLectures} lectures</span>}
              {item.totalDuration > 0 && <span>{Math.round(item.totalDuration / 60)}h</span>}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-gray-900">₹{price?.toFixed?.(2)}</div>
            {original > price && (
              <div className="text-xs text-gray-400 line-through">₹{original?.toFixed?.(2)}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mt-2 text-sm cursor-pointer text-red-600 hover:underline">
          <LuTrash onClick={() => onRemove(item.courseId?._id || item.courseId)} />
          <button onClick={() => onRemove(item.courseId?._id || item.courseId)}>Remove</button>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, removeCourseFromCart, clearCart, loadCart } = useCart();
  const items = useMemo(() => cart?.items ?? [], [cart]);
  const originalTotal = useMemo(
    () => items.reduce((sum, item) => {
      const course = typeof item.courseId === "object" ? item.courseId : null;
      const originalPrice = course?.price ?? item.price ?? 0;
      return sum + originalPrice;
    }, 0),
    [items]
  );

  const discountedTotal = useMemo(
    () => items.reduce((sum, item) => {
      const course = typeof item.courseId === "object" ? item.courseId : null;
      const price = course?.discountPrice ?? course?.price ?? item.price ?? 0;
      return sum + price;
    }, 0),
    [items]
  );

  const totalAmount = discountedTotal;
  const totalItems = cart?.totalItems ?? items.length;
  const discountAmount = originalTotal - discountedTotal;
  const discountPercentage = originalTotal > 0 ? Math.round((discountAmount / originalTotal) * 100) : 0;

  const [popularCourses, setPopularCourses] = useState([]);
  const sliderRef = useRef(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      const scrollAmt = sliderRef.current.clientWidth * 0.8;
      sliderRef.current.scrollBy({ left: -scrollAmt, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      const scrollAmt = sliderRef.current.clientWidth * 0.8;
      sliderRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/courses`);
        const data = await res.json();
        if (res.ok) {
          setPopularCourses(data?.courses || data?.data?.courses || []);
        }
      } catch (err) {
        console.error("Failed to fetch popular courses", err);
      }
    };
    fetchPopularCourses();
  }, []);

  const handleRemove = async (courseId) => {
    await removeCourseFromCart(courseId);
  };

  return (
    <div className="bg-white px-6 py-7 sm:px-8">
      <div className="mx-auto">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-4xl font-extrabold text-[#111827]">Shopping Cart</h1>
              {totalItems > 0 && (
                <p className="text-sm text-gray-500 mt-3">
                  {totalItems} course{totalItems === 1 ? "" : "s"} in your cart
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Browse Courses
            </Link>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <div className="space-y-12 text-left">
                {/* Empty state box */}
                <div className="border border-gray-200 bg-white p-6 rounded-lg shadow-sm">
                  <p className="text-gray-600 text-base italic font-medium">
                    Your cart is empty – let's change that. Time to learn some new skills!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 xl:grid-cols-[1.85fr_1fr]">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-[0.2em]">
                    Cart Items
                  </div>
                  {items.map((item) => (
                    <CartItem key={item.courseId?._id || item.courseId} item={item} onRemove={handleRemove} />
                  ))}
                </div>

                <aside className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="rounded-3xl bg-white p-5 border space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <p className="text-sm font-semibold text-gray-700">Summary</p>
                      <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">{totalItems} item{totalItems === 1 ? "" : "s"}</div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Original Price:</span>
                        <span className="font-semibold text-gray-900">₹{originalTotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount Amount:</span>
                          <span className="font-semibold">- ₹{discountAmount.toFixed(2)} ({discountPercentage}% off)</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between">
                      <span className="text-base font-bold text-gray-900">Total:</span>
                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-gray-950">₹{totalAmount.toFixed(2)}</div>
                        {discountAmount > 0 && (
                          <div className="text-xs text-emerald-600 font-semibold mt-1">
                            You saved ₹{discountAmount.toFixed(2)}!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/checkout")}
                    className="w-full rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                  >
                    Proceed to Checkout
                  </button>
                </aside>
              </div>
            )}

            {/* Learners are viewing section */}
            {popularCourses.length > 0 && (
              <div className="mt-16 pt-8 border-t border-gray-150">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Learners are viewing
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="relative group/slider">
                  {/* Left Arrow */}
                  {popularCourses.length > 1 && (
                    <button
                      onClick={scrollLeft}
                      className="absolute left-[-16px] top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200"
                      title="Scroll Left"
                    >
                      <LuChevronLeft size={16} />
                    </button>
                  )}

                  {/* Slider Row */}
                  <div
                    ref={sliderRef}
                    className="flex overflow-x-auto gap-5 pb-4 pl-1 cursor-grab active:cursor-grabbing scrollbar-hide py-1 scroll-smooth"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <style>{`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    {popularCourses.map((course) => (
                      <div key={course._id} className="w-[280px] shrink-0">
                        <CourseCard course={course} />
                      </div>
                    ))}
                  </div>

                  {/* Right Arrow */}
                  {popularCourses.length > 1 && (
                    <button
                      onClick={scrollRight}
                      className="absolute right-[-16px] top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200"
                      title="Scroll Right"
                    >
                      <LuChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
