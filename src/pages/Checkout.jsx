import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AiOutlineCreditCard, AiOutlineShoppingCart, AiFillStar } from "react-icons/ai";
import { useCart } from "../context/CartContext";
import { useEnrollment } from "../context/EnrollmentContext";
import { createCheckout, verifyPayment } from "../services/paymentService";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, loading, clearCart, loadCart } = useCart();
  const { refreshEnrollments } = useEnrollment();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const items = cart?.items || [];
  const originalTotal = items.reduce((sum, item) => {
    const course = typeof item.courseId === "object" ? item.courseId : null;
    const originalPrice = course?.price ?? item.price ?? 0;
    return sum + originalPrice;
  }, 0);

  const discountedTotal = items.reduce((sum, item) => {
    const course = typeof item.courseId === "object" ? item.courseId : null;
    const price = course?.discountPrice ?? course?.price ?? item.price ?? 0;
    return sum + price;
  }, 0);

  const totalAmount = discountedTotal;
  const totalItems = items.length;

  const openRazorpay = async () => {
    if (!items.length) {
      toast.info("Your cart is empty. Add a course before proceeding.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const order = await createCheckout();
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Unable to load Razorpay checkout. Please try again.");
        setCheckoutLoading(false);
        return;
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "CourseHub",
        description: "Complete your course purchase",
        order_id: order.orderId,
        handler: async (response) => {
          setPaymentLoading(true);
          try {
            await verifyPayment(response);
            // Refresh enrollments so My Learning shows the new course immediately
            await refreshEnrollments();
            // Clear cart since courses are now enrolled
            try { await clearCart(); } catch (_) { /* silent */ }
            toast.success("Payment successful! Your courses are now available in My Learning.");
            navigate("/learning");
          } catch (error) {
            toast.error(error.message || "Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(false);
          },
        },
        prefill: {
          name: "",
          email: "",
        },
        notes: {
          paymentId: order.paymentId,
        },
        theme: {
          color: "#7c3aed",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.message || "Unable to start checkout.");
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 mt-2 max-w-sm">
          Please add courses to your cart before trying to checkout.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-7 sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        {/* Title Section */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-50 px-3.5 py-1.5 text-purple-700 text-xs font-semibold">
              <AiOutlineCreditCard size={16} /> Secure Payment Checkout
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-[#111827] tracking-tight">Checkout</h1>
            <p className="text-sm text-gray-500 mt-2">
              Please review your course choices and order details below.
            </p>
          </div>
          <Link
            to="/cart"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 text-center shrink-0"
          >
            Back to Cart
          </Link>
        </div>

        {/* Outer Split Layout */}
        <div className="grid gap-8 xl:grid-cols-[1.85fr_1fr]">
          <div className="space-y-6">

            {/* Cart Items (styled like cart page orders) */}
            <div className="h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-[0.2em] mb-6">
                Order Items
              </div>
              <div className="divide-y divide-gray-200">
                {items.map((item) => {
                  const course = typeof item.courseId === "object" ? item.courseId : null;
                  const title = course?.title || item.title || "Untitled course";
                  const instructor = course?.instructorId?.fullName || item.instructor || "Instructor";
                  const thumbnail = course?.thumbnail || item.thumbnail || "https://via.placeholder.com/320x180?text=Course";
                  const courseLink = course?._id ? `/api/public/courses/${course._id}` : `/api/public/courses/${item.courseId}`;
                  const original = course?.price ?? item.price ?? 0;
                  const price = course?.discountPrice ?? course?.price ?? item.price ?? 0;

                  const rating = course?.averageRating ?? item.rating;
                  const reviews = course?.totalReviews ?? item.reviews ?? 0;
                  const lectures = course?.totalLectures ?? item.totalLectures ?? 0;
                  const duration = course?.totalDuration ?? item.totalDuration ?? 0;

                  return (
                    <div key={item.courseId?._id || item.courseId || item._id} className="flex sm:flex-row flex-col items-start gap-6 py-5 first:pt-0 last:pb-0">
                      {/* Image */}
                      <Link to={courseLink} className="w-full sm:w-40 h-full sm:h-24 overflow-hidden rounded-lg shrink-0 bg-gray-100 border border-gray-150">
                        <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex sm:flex-row flex-col items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link to={courseLink} className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-purple-600">
                              {title}
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">By {instructor}</p>
                          </div>

                          {/* Price details right aligned */}
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-gray-900">₹{price.toFixed(2)}</div>
                            {original > price && (
                              <div className="text-xs text-gray-400 line-through">₹{original.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar summary card */}
          <aside className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                <p className="text-sm font-semibold text-gray-700">Order Summary</p>
                <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </div>
              </div>

              {/* Price Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-650">
                  <span>Original Price:</span>
                  <span className="font-semibold text-gray-900">₹{originalTotal.toFixed(2)}</span>
                </div>
                {originalTotal > totalAmount && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount Amount:</span>
                    <span>- ₹{(originalTotal - totalAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="border-t border-gray-150 pt-3 flex items-baseline justify-between">
                <span className="text-base font-bold text-gray-900">Total:</span>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-gray-950">₹{totalAmount.toFixed(2)}</div>
                  {originalTotal > totalAmount && (
                    <div className="text-xs text-emerald-600 font-semibold mt-1">
                      You saved ₹{(originalTotal - totalAmount).toFixed(2)}!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pay Button / Process triggers */}
            <button
              onClick={openRazorpay}
              disabled={checkoutLoading || paymentLoading}
              className="w-full rounded-lg bg-purple-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs flex items-center justify-center gap-2"
            >
              {checkoutLoading || paymentLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-purple-650 rounded-full animate-spin" />
                  Processing payment...
                </>
              ) : (
                `Complete Secure Payment`
              )}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
