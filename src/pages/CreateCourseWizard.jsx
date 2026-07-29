import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../services/categoryService";
import ConfirmDialog from "../components/ConfirmDialog";

const CreateCourseWizard = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [titleError, setTitleError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  const [form, setForm] = useState({
    type: "",
    title: "",
    category: "",
    weeklyHours: "",
  });

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCats();
  }, []);

  const validateStep = (s) => {
    setValidationError("");
    if (s === 1) {
      if (!form.type) {
        setValidationError("Please select a course type to proceed.");
        return false;
      }
    }
    if (s === 2) {
      const trimmedTitle = form.title.trim();
      if (!trimmedTitle) {
        setValidationError("Please enter a course title.");
        return false;
      }
      if (/[0-9]/.test(form.title)) {
        setValidationError("Course title must not contain numbers.");
        return false;
      }
      if (trimmedTitle.length < 5) {
        setValidationError("Title must be at least 5 characters long.");
        return false;
      }
    }
    if (s === 3) {
      if (!form.category) {
        setValidationError("Please choose a category.");
        return false;
      }
    }
    if (s === 4) {
      if (!form.weeklyHours || parseInt(form.weeklyHours, 10) <= 0) {
        setValidationError("Please enter a valid weekly time commitment.");
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    } else {
      setShowValidationDialog(true);
    }
  };

  const back = () => {
    setValidationError("");
    setStep((s) => s - 1);
  };

  const handleFinish = () => {
    if (validateStep(4)) {
      localStorage.setItem("courseDraft", JSON.stringify(form));
      // Reset existing drafts so details page creates a fresh course
      localStorage.removeItem("courseDraftId");
      localStorage.removeItem("courseDraftCreating");
      navigate("/instructor/course/create");
    } else {
      setShowValidationDialog(true);
    }
  };

  const handleSaveDraft = () => {
    if (validateStep(step)) {
      localStorage.setItem("courseDraft", JSON.stringify(form));
      navigate("/instructor/home");
    } else {
      setShowValidationDialog(true);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 p-10 flex flex-col justify-between h-[520px]">
        <div>
          {/* TOP NAV & SAVING */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-bold text-gray-500">
              Step {step} of 4
            </span>
            <button
              onClick={handleSaveDraft}
              className="text-sm font-bold text-[#a435f0] hover:text-[#8710d8] border border-[#a435f0] hover:border-[#8710d8] px-4 py-1.5 rounded transition cursor-pointer"
            >
              Save as Draft
            </button>
          </div>

          {/* PROGRESS BAR */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= s ? "bg-[#a435f0]" : "bg-gray-200"
                  }`}
              />
            ))}
          </div>

          {/* ERROR MSG */}
          {validationError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {validationError}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                What type of course are you making?
              </h2>
              <div className="space-y-3">
                {["Course", "Practice Test"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setForm({ ...form, type });
                      setValidationError("");
                    }}
                    className={`w-full py-4 text-center border-2 font-semibold transition duration-200 ${form.type === type
                        ? "border-[#a435f0] bg-purple-50/30 text-[#a435f0]"
                        : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                What’s your working title?
              </h2>
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleaned = val.replace(/[0-9]/g, "");
                    setForm({ ...form, title: cleaned });
                    if (/[0-9]/.test(val)) {
                      setTitleError(
                        "Numbers are not allowed in the course title.",
                      );
                      setValidationError(
                        "Course title must not contain numbers.",
                      );
                    } else {
                      setTitleError("");
                      setValidationError("");
                    }
                  }}
                  className="w-full border-2 border-zinc-805 p-4 text-lg outline-none focus:border-[#a435f0] transition duration-200 rounded"
                  placeholder="e.g. Complete React Mastery"
                  maxLength={80}
                />
                {titleError ? (
                  <p className="text-xs text-red-500 font-semibold">
                    {titleError}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    It's ok if you can't think of a good title now. You can
                    change it later.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Choose category
              </h2>
              <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <button
                      key={cat._id || cat.name}
                      onClick={() => {
                        setForm({ ...form, category: cat.name });
                        setValidationError("");
                      }}
                      className={`w-full py-3.5 text-center border-2 font-semibold transition duration-200 ${form.category === cat.name
                          ? "border-[#a435f0] bg-purple-50/30 text-[#a435f0]"
                          : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    Loading categories from server...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Weekly time commitment?
              </h2>
              <div className="space-y-2">
                <input
                  type="number"
                  value={form.weeklyHours}
                  onChange={(e) => {
                    setForm({ ...form, weeklyHours: e.target.value });
                    setValidationError("");
                  }}
                  className="w-full border-2 border-zinc-805 p-4 text-lg outline-none focus:border-[#a435f0] transition duration-200 rounded"
                  placeholder="e.g. 5"
                  min="1"
                />
                <p className="text-xs text-gray-500">
                  Tell us how many hours per week you can dedicate to building
                  this course.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              if (step === 1) {
                navigate("/instructor/home");
              } else {
                back();
              }
            }}
            className="border border-zinc-800 text-zinc-800 font-bold px-6 py-3 rounded hover:bg-zinc-50 transition duration-150 cursor-pointer"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={next}
              className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-8 py-3 rounded transition duration-150 cursor-pointer"
            >
              Save & Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-8 py-3 rounded transition duration-150 cursor-pointer"
            >
              Save & Finish
            </button>
          )}
        </div>
      </div>

      {/* Validation Dialog */}
      <ConfirmDialog
        open={showValidationDialog}
        onConfirm={() => setShowValidationDialog(false)}
        onCancel={() => setShowValidationDialog(false)}
        title="Form Incomplete"
        message={validationError || "Please fill/select the required field before moving to the next step."}
        confirmText="OK"
        variant="info"
      />
    </div>
  );
};

export default CreateCourseWizard;
