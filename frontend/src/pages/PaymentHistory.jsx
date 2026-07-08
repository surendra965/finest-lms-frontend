import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getPayments } from "../services/paymentService";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPayments();
        setPayments(data);
      } catch (error) {
        toast.error(error.message || "Unable to load payment history.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f9fa] px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-[1080px] space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-[0.24em]">Payment history</p>
              <h1 className="mt-3 text-3xl font-extrabold text-gray-900">Your purchases</h1>
            </div>
            <Link
              to="/"
              className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Continue browsing
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500">Loading your payments…</div>
        ) : payments.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-gray-900">No purchases yet</p>
            <p className="mt-2 text-sm text-gray-500">Buy courses to see them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Link
                key={payment._id}
                to={`/payments/${payment._id}`}
                className="block rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="mt-2 font-semibold text-gray-900">{payment.razorpayOrderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="mt-2 font-semibold text-gray-900">₹{(payment.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`mt-2 font-semibold ${payment.status === "paid" ? "text-emerald-600" : "text-orange-600"}`}>
                      {payment.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paid at</p>
                    <p className="mt-2 font-semibold text-gray-900">
                      {new Date(payment.paidAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
