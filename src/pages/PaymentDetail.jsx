import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getPaymentById } from "../services/paymentService";

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPaymentById(id);
        setPayment(data);
      } catch (error) {
        toast.error(error.message || "Unable to load payment details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#f7f9fa] px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-[900px] space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-purple-600 hover:text-purple-800"
        >
          ← Back to payments
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          {loading ? (
            <div className="text-gray-500">Loading payment details…</div>
          ) : !payment ? (
            <div className="text-gray-500">Payment not found.</div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-[0.24em]">Payment receipt</p>
                <h1 className="mt-4 text-3xl font-extrabold text-gray-900">Payment details</h1>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`mt-2 text-xl font-semibold ${payment.status === "paid" ? "text-emerald-600" : "text-orange-600"}`}>
                    {payment.status}
                  </p>
                </div>
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
                  <p className="text-sm text-gray-500">Amount paid</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">₹{(payment.amount).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-sm text-gray-500">Razorpay order ID</p>
                  <p className="mt-2 text-sm text-gray-900 break-all">{payment.razorpayOrderId}</p>
                </div>
                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-sm text-gray-500">Razorpay payment ID</p>
                  <p className="mt-2 text-sm text-gray-900 break-all">{payment.razorpayPaymentId}</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-sm text-gray-500">Payment date</p>
                  <p className="mt-2 text-sm text-gray-900">{new Date(payment.paidAt).toLocaleString()}</p>
                </div>
                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="mt-2 text-sm text-gray-900">{payment.currency}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
