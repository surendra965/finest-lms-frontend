import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { LuSave } from "react-icons/lu";
import { useCourse } from "../../context/CourseContext";

const Pricing = ({ course, refreshCourse, onNext }) => {
  const { updateCourse } = useCourse();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    price: "",
    discountPrice: "",
  });

  /* ── INITIALIZE FORM ── */
  useEffect(() => {
    if (!course) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      price: course.price ?? "",
      discountPrice: course.discountPrice ?? "",
    });
  }, [course]);

  /* ── INPUT CHANGE ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;

    const numValue = Number(value);

    // Limit to 100,000 (1 Lakh)
    if (numValue > 100000) {
      toast.warning("Price cannot exceed ₹100,000 (1 Lakh)");
      return;
    }

    // Force discount price < original price
    if (name === "discountPrice" && value !== "") {
      const origPrice = Number(form.price) || 0;
      if (numValue >= origPrice && origPrice > 0) {
        toast.warning("Discount price must be less than the original price");
        return;
      }
    }

    // Reset discount price if original price falls below it
    if (name === "price" && value !== "") {
      const discPrice = Number(form.discountPrice) || 0;
      if (discPrice > 0 && numValue <= discPrice) {
        setForm((prev) => ({
          ...prev,
          price: value,
          discountPrice: "",
        }));
        toast.warning("Original price must be greater than discount price. Discount has been reset.");
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── PRICE PREVIEW ── */
  const originalPrice = Number(form.price) || 0;
  const discountedPrice = Number(form.discountPrice) || 0;

  const discountPercentage = useMemo(() => {
    if (originalPrice <= 0 || discountedPrice <= 0 || discountedPrice >= originalPrice) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }, [originalPrice, discountedPrice]);

  /* ── VALIDATION ── */
  const validate = () => {
    if (originalPrice < 0) { toast.error("Price cannot be negative"); return false; }
    if (discountedPrice < 0) { toast.error("Discount price cannot be negative"); return false; }
    if (discountedPrice > 0 && discountedPrice >= originalPrice) {
      toast.error("Discount price must be less than the original price");
      return false;
    }
    return true;
  };

  /* ── SAVE PRICING ── */
  const handleSave = async (shouldNavigateNext = false) => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        price: originalPrice,
        discountPrice: discountedPrice,
      };
      await updateCourse(course._id, payload);
      toast.success("Pricing updated successfully");
      if (refreshCourse) await refreshCourse();
      if (shouldNavigateNext && onNext) {
        onNext();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm transition";

  return (
    <div className="space-y-6 p-8">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pricing</h1>
          <p className="text-gray-500 mt-1 text-sm leading-relaxed">
            Set a price for your course. Students are more likely to enroll when courses have a reasonable discount.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving}
          className="text-sm font-semibold border border-[#a435f0] text-[#a435f0] hover:bg-[#a435f0] hover:text-white px-5 py-2.5 rounded-lg transition"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
      </div>

      {/* ── PRICING FORM ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Inputs */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Price (₹)</label>
            <input type="number" min="0" name="price" value={form.price} onChange={handleChange} placeholder="4999" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1.5">This is the original selling price of your course.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Price (₹)</label>
            <input type="number" min="0" name="discountPrice" value={form.discountPrice} onChange={handleChange} placeholder="999" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1.5">Leave empty if you don't want to offer a discount.</p>
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit">
          <h3 className="text-sm font-bold text-gray-700 mb-5">Price Preview</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-medium">Student Pays</p>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="text-3xl font-bold text-purple-600">
                  ₹{discountedPrice > 0 ? discountedPrice.toLocaleString() : originalPrice.toLocaleString()}
                </span>
                {discountedPrice > 0 && (
                  <span className="text-sm text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
                )}
              </div>
            </div>

            {discountPercentage > 0 && (
              <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5">
                <span className="text-xs font-bold text-green-600">{discountPercentage}% OFF</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400 font-medium">Estimated Revenue</p>
              <p className="text-xl font-bold mt-1 text-gray-900">
                ₹{(discountedPrice || originalPrice).toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5">
                This preview updates automatically while you type.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex justify-end">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#a435f0] hover:bg-[#8710d8] disabled:bg-purple-300 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm cursor-pointer"
        >
          <LuSave size={16} />
          {saving ? "Saving..." : "Save & Next"}
        </button>
      </div>
    </div>
  );
};

export default Pricing;
