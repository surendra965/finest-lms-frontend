import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const createCheckout = async () => {
  const response = await authFetch(`${API_URL}/api/payments/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to create checkout order");
  }

  return data.data;
};

export const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const response = await authFetch(`${API_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to verify payment");
  }

  return data.data;
};

export const getPayments = async () => {
  const response = await authFetch(`${API_URL}/api/payments`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to load payments");
  }

  return data.data;
};

export const getPaymentById = async (id) => {
  const response = await authFetch(`${API_URL}/api/payments/${id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to load payment details");
  }

  return data.data;
};
