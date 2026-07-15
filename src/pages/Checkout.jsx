import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AiOutlineCreditCard, AiOutlineShoppingCart } from "react-icons/ai";
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
  const { cart, loading, clearCart } = useCart();
  const { refreshEnrollments } = useEnrollment();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#f7f9fa] px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-[1080px] space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-purple-50 px-4 py-2 text-purple-700 text-sm font-semibold">
                <AiOutlineCreditCard size={20} /> Secure payment
              </div>
              <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Checkout</h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600">
                Complete your order with Razorpay. You will not be charged until you finish the payment process.
              </p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 shrink-0 text-right sm:text-left min-w-[160px]">
              <p className="text-gray-500 font-medium">Order total</p>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                {originalTotal > totalAmount && (
                  <p className="text-sm text-gray-400 line-through mt-1">₹{originalTotal.toFixed(2)}</p>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 font-medium">{totalItems} course{totalItems === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <p className="font-semibold text-gray-900">Payment details</p>
                <p className="mt-2 text-sm text-gray-600">Your purchase will be processed securely through Razorpay.</p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
                <div className="mt-6 space-y-4">
                  {items.map((item) => {
                    const course = typeof item.courseId === "object" ? item.courseId : null;
                    const originalPrice = course?.price ?? item.price ?? 0;
                    const price = course?.discountPrice ?? course?.price ?? item.price ?? 0;
                    return (
                      <div key={item.courseId || item._id} className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 line-clamp-1">
                            {course?.title || item.title || "Course"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">By {course?.instructorId?.fullName || item.instructor || "Instructor"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900">₹{price.toFixed(2)}</p>
                          {originalPrice > price && (
                            <p className="text-xs text-gray-400 line-through">₹{originalPrice.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Checkout</p>
                  <p className="text-2xl font-bold text-gray-900">Pay now</p>
                </div>
                <button
                  onClick={openRazorpay}
                  disabled={checkoutLoading || paymentLoading}
                  className="w-full rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkoutLoading || paymentLoading ? "Opening payment..." : "Pay securely"}
                </button>
                <div className="rounded-3xl bg-white p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">Why pay with Razorpay?</p>
                  <ul className="mt-3 space-y-2 list-disc list-inside">
                    <li>Safe and reliable checkout</li>
                    <li>Multiple payment options</li>
                    <li>30-day refund policy</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
