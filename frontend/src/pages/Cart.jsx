import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineShoppingCart, AiFillStar } from "react-icons/ai";
import { HiOutlineTicket } from "react-icons/hi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useCart } from "../context/CartContext";

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
    <div className="flex items-start gap-6 border-b border-gray-200 pb-6 pt-6 last:border-b-0 last:pb-0">
      <Link to={courseLink} className="w-40 h-24 overflow-hidden rounded-lg shrink-0 bg-gray-100">
        <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
      </Link>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
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

        <div className="flex items-center gap-6 mt-4 text-sm">
          <button onClick={() => onRemove(item.courseId)} className="text-purple-600 hover:underline">Remove</button>
          <button className="text-gray-600 hover:underline">Save for Later</button>
          <button className="text-gray-600 hover:underline">Move to Wishlist</button>
        </div>
      </div>
    </div>
  );
};

const PopularCourseCard = ({ course }) => {
  const hash = course._id ? course._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 100;
  const rating = course.averageRating || (4.0 + (hash % 10) / 10).toFixed(1);
  const reviewsCount = course.totalReviews || ((hash * 17) % 25000) + 120;
  const instructorName = course.instructorId?.fullName || course.instructor || "Instructor";
  const originalPrice = course.price ?? 0;
  const discountPrice = course.discountPrice ?? course.price ?? 0;

  return (
    <Link 
      to={`/api/public/courses/${course._id}`} 
      className="w-[280px] shrink-0 flex flex-col group text-left"
    >
      <div className="w-full h-[160px] overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
        <img 
          src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"} 
          alt={course.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="mt-3 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-700">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1 truncate">
          {instructorName}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-extrabold text-amber-700">{rating}</span>
          <div className="flex text-amber-500 text-xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <AiFillStar 
                key={i} 
                className={i < Math.floor(rating) ? "text-amber-500" : "text-gray-200"}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">({reviewsCount.toLocaleString()})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-950">₹{discountPrice}</span>
          {originalPrice > discountPrice && (
            <span className="text-xs text-gray-400 line-through">₹{originalPrice}</span>
          )}
        </div>
      </div>
    </Link>
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
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (items.length === 0) {
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
    }
  }, [items.length]);

  const handleRemove = async (courseId) => {
    await removeCourseFromCart(courseId);
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-295">
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
        ) : items.length === 0 ? (
          <div className="space-y-12 text-left">
            {/* Empty state box */}
            <div className="border border-gray-200 bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-600 text-base italic font-medium">
                Your cart is empty – let's change that. Time to learn some new skills!
              </p>
            </div>

            {/* Learners are viewing section */}
            {popularCourses.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-sans">Learners are viewing</h2>
                <div className="relative group/slider">
                  {/* Left Arrow */}
                  <button
                    onClick={scrollLeft}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md cursor-pointer hover:bg-gray-50 transition"
                    aria-label="Previous courses"
                  >
                    <LuChevronLeft size={20} className="text-gray-700" />
                  </button>
                  
                  {/* Slider Row */}
                  <div
                    ref={sliderRef}
                    className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <style>{`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    {popularCourses.map((course) => (
                      <PopularCourseCard key={course._id} course={course} />
                    ))}
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={scrollRight}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md cursor-pointer hover:bg-gray-50 transition"
                    aria-label="Next courses"
                  >
                    <LuChevronRight size={20} className="text-gray-700" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.85fr_1fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-[0.2em] mb-6">
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

                <button className="w-full rounded-2xl border border-purple-600 bg-white px-5 py-3 text-sm font-semibold text-purple-600 transition hover:bg-purple-50">
                  Apply Coupon
                </button>

                <div className="rounded-3xl bg-gray-50 p-5 text-sm text-gray-600 space-y-3">
                  <div className="flex items-center gap-2">
                    <HiOutlineTicket size={18} className="text-purple-600" />
                    <span className="font-semibold text-gray-900">Secure checkout</span>
                  </div>
                  <p>We do not charge your card until you confirm the order.</p>
                </div>
              </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
