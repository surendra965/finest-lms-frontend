
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useCourse } from "../../context/CourseContext";

const Pricing = ({ course, refreshCourse }) => {
  const { updateCourse } = useCourse();

  /* ===========================================
      STATE
  =========================================== */

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    price: "",
    discountPrice: "",
  });

  /* ===========================================
      INITIALIZE FORM
  =========================================== */

  useEffect(() => {
    if (!course) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      price: course.price ?? "",
      discountPrice: course.discountPrice ?? "",
    });
  }, [course]);

  /* ===========================================
      INPUT CHANGE
  =========================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only numbers and decimal values
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ===========================================
      PRICE PREVIEW
  =========================================== */

  const originalPrice = Number(form.price) || 0;
  const discountedPrice = Number(form.discountPrice) || 0;

  const discountPercentage = useMemo(() => {
    if (
      originalPrice <= 0 ||
      discountedPrice <= 0 ||
      discountedPrice >= originalPrice
    ) {
      return 0;
    }

    return Math.round(
      ((originalPrice - discountedPrice) / originalPrice) * 100
    );
  }, [originalPrice, discountedPrice]);

  /* ===========================================
      VALIDATION
  =========================================== */

  const validate = () => {
    if (originalPrice < 0) {
      toast.error("Price cannot be negative");
      return false;
    }

    if (discountedPrice < 0) {
      toast.error("Discount price cannot be negative");
      return false;
    }

    if (
      discountedPrice > 0 &&
      discountedPrice >= originalPrice
    ) {
      toast.error(
        "Discount price must be less than the original price"
      );
      return false;
    }

    return true;
  };

  /* ===========================================
      SAVE PRICING
  =========================================== */

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      // Only send price fields — spreading the full `course` object passes
      // populated sub-documents (e.g. categoryId as an object) which
      // fails backend schema validation with "expected string, received object".
      const payload = {
        price: originalPrice,
        discountPrice: discountedPrice,
      };

      await updateCourse(course._id, payload);

      toast.success("Pricing updated successfully");

      if (refreshCourse) {
        await refreshCourse();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-8">

      {/* ===========================================
          HEADER
      =========================================== */}

      <div className="bg-white rounded-xl border shadow-sm p-8">

        <h2 className="text-2xl font-bold text-gray-900">
          Pricing
        </h2>

        <p className="text-gray-500 mt-2 max-w-3xl">
          Set a price for your course. Students are more likely to enroll
          when courses have a reasonable discount.
        </p>

      </div>

      {/* ===========================================
          PRICING FORM
      =========================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}

        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-8">

          <div className="space-y-6">

            {/* Course Price */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Price (₹)
              </label>

              <input
                type="number"
                min="0"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="4999"
                className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-purple-600 outline-none"
              />

              <p className="text-sm text-gray-500 mt-2">
                This is the original selling price of your course.
              </p>

            </div>

            {/* Discount */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Price (₹)
              </label>

              <input
                type="number"
                min="0"
                name="discountPrice"
                value={form.discountPrice}
                onChange={handleChange}
                placeholder="999"
                className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-purple-600 outline-none"
              />

              <p className="text-sm text-gray-500 mt-2">
                Leave empty if you don't want to offer a discount.
              </p>

            </div>

            {/* Save */}

            <div className="pt-4">

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold px-8 py-3 rounded-lg transition"
              >
                {saving ? "Saving..." : "Save Pricing"}
              </button>

            </div>

          </div>

        </div>

        {/* RIGHT PREVIEW */}

        <div className="bg-white rounded-xl border shadow-sm p-8 h-fit">

          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Price Preview
          </h3>

          <div className="space-y-5">

            {/* Current Price */}

            <div>

              <p className="text-sm text-gray-500">
                Student Pays
              </p>

              <div className="flex items-center gap-3 mt-2">

                <span className="text-4xl font-bold text-purple-700">

                  ₹
                  {discountedPrice > 0
                    ? discountedPrice.toLocaleString()
                    : originalPrice.toLocaleString()}

                </span>

                {discountedPrice > 0 && (

                  <span className="text-lg text-gray-400 line-through">

                    ₹{originalPrice.toLocaleString()}

                  </span>

                )}

              </div>

            </div>

            {/* Discount */}

            {discountPercentage > 0 && (

              <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2">

                <span className="text-sm font-semibold text-green-700">

                  {discountPercentage}% OFF

                </span>

              </div>

            )}

            {/* Earnings */}

            <div className="border-t pt-5">

              <p className="text-sm text-gray-500">
                Estimated Revenue
              </p>

              <p className="text-2xl font-bold mt-2 text-gray-900">

                ₹
                {(discountedPrice || originalPrice).toLocaleString()}

              </p>

              <p className="text-sm text-gray-500 mt-2">
                This preview updates automatically while you type.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Pricing;
