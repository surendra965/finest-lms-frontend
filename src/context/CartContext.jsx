/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "./authContext";
import {
  addCourseToCart as addCourseToCartApi,
  clearCart as clearCartApi,
  getCart as getCartApi,
  removeCourseFromCart as removeCourseFromCartApi,
} from "../services/cartService";

const CartContext = createContext({
  cart: null,
  loading: false,
  cartCount: 0,
  loadCart: async () => {},
  addCourseToCart: async () => {},
  removeCourseFromCart: async () => {},
  clearCart: async () => {},
});

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);

  const emptyCart = useMemo(() => ({ items: [], totalItems: 0, totalAmount: 0 }), []);

  // Helper to compute cart totals from filtered items
  const buildCartState = useCallback((data, filteredItems) => ({
    ...data,
    items: filteredItems,
    totalItems: filteredItems.length,
    totalAmount: filteredItems.reduce((sum, item) => {
      const course = typeof item.courseId === "object" ? item.courseId : null;
      const price = course?.discountPrice ?? course?.price ?? item.price ?? 0;
      return sum + price;
    }, 0),
  }), []);

  const loadCart = useCallback(async (enrolledIds = null) => {
    if (!user || user.role === "instructor") {
      setCart(emptyCart);
      return;
    }

    setLoading(true);
    try {
      const data = await getCartApi();
      const allItems = data?.items || [];

      // Filter out courses already enrolled using the provided set (from EnrollmentContext)
      const enrolledSet = enrolledIds instanceof Set ? enrolledIds : new Set();
      const filteredItems = allItems.filter((item) => {
        const courseIdStr = String(item.courseId?._id ?? item.courseId ?? "");
        return !enrolledSet.has(courseIdStr);
      });

      // Silently remove already-enrolled items from the backend cart
      const stalItems = allItems.filter((item) => {
        const courseIdStr = String(item.courseId?._id ?? item.courseId ?? "");
        return enrolledSet.has(courseIdStr);
      });
      for (const item of stalItems) {
        const cid = item.courseId?._id ?? item.courseId;
        if (cid) {
          try { await removeCourseFromCartApi(cid); } catch (_) { /* silent */ }
        }
      }

      setCart(buildCartState(data, filteredItems));
    } catch (error) {
      console.error("Cart load error:", error);
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [user, emptyCart, buildCartState]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadCart();
  }, [loadCart]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const addCourseToCart = useCallback(
    async (courseId, enrolledIds = null) => {
      // Block if already enrolled
      const enrolledSet = enrolledIds instanceof Set ? enrolledIds : new Set();
      if (enrolledSet.has(String(courseId))) {
        toast.info("You already own this course! Access it from My Learning.");
        return null;
      }

      setLoading(true);
      try {
        const data = await addCourseToCartApi(courseId);
        setCart(data);
        toast.success("Course added to cart successfully.");
        return data;
      } catch (error) {
        toast.error(error.message || "Unable to add course to cart.");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeCourseFromCart = useCallback(
    async (courseId) => {
      setLoading(true);
      try {
        const data = await removeCourseFromCartApi(courseId);
        setCart(data);
        toast.success("Course removed from cart successfully.");
        return data;
      } catch (error) {
        toast.error(error.message || "Unable to remove course from cart.");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await clearCartApi();
      setCart({ items: [], totalItems: 0, totalAmount: 0 });
      toast.success("Cart cleared successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to clear cart.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount: cart?.items?.length || 0,
        loadCart,
        addCourseToCart,
        removeCourseFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
