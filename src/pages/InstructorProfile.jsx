import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { authFetch } from "../utils/auth";
import { toast } from "react-toastify";

const getResponsePayload = (data) => {
  const payload = data?.data || data;
  return payload?.profile || payload;
};

const getExpertiseValue = (expertise) => {
  if (Array.isArray(expertise)) return expertise.join(", ");
  return expertise || "";
};

const InstructorProfile = () => {
  const { user, syncAuthResponse, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    headline: "",
    biography: "",
    website: "",
    linkedin: "",
    twitter: "",
    youtube: "",
    expertise: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const setInstructorForm = (profile) => {
      if (!profile) return;

      setForm({
        headline: profile.headline || "",
        biography: profile.biography || "",
        website: profile.website || "",
        linkedin: profile.linkedin || "",
        twitter: profile.twitter || "",
        youtube: profile.youtube || "",
        expertise: getExpertiseValue(profile.expertise),
      });
    };

    const fetchInstructorProfile = async () => {
      if (user?.instructorProfile) {
        setInstructorForm(user.instructorProfile);
      }

      if (user?.role !== "instructor" && !user?.isInstructor) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const res = await authFetch(`${API_URL}/api/instructors/profile`);

        if (res.ok) {
          const data = await res.json();
          setInstructorForm(getResponsePayload(data));
          return;
        }

        if (res.status === 403) {
          return;
        }

        if (res.status === 401) {
          logout();
          navigate("/api/auth/login");
        }
      } catch (err) {
        console.error("Instructor profile fetch error:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchInstructorProfile();
  }, [
    API_URL,
    logout,
    navigate,
    user?.instructorProfile,
    user?.isInstructor,
    user?.role,
  ]);

  // ✅ handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.headline.trim()) {
      nextErrors.headline = "Headline is required";
    } else if (form.headline.trim().length < 3) {
      nextErrors.headline = "Headline must be at least 3 characters";
    }

    if (!form.biography.trim()) {
      nextErrors.biography = "Biography is required";
    } else if (form.biography.trim().length < 10) {
      nextErrors.biography = "Biography must be at least 10 characters";
    }

    if (!form.expertise.trim()) {
      nextErrors.expertise = "Expertise is required (comma separated values)";
    }

    // eslint-disable-next-line no-useless-escape
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;

    if (form.website && !urlRegex.test(form.website)) {
      nextErrors.website = "Invalid URL format";
    }
    if (form.linkedin && !urlRegex.test(form.linkedin)) {
      nextErrors.linkedin = "Invalid URL format";
    }
    if (form.twitter && !urlRegex.test(form.twitter)) {
      nextErrors.twitter = "Invalid URL format";
    }
    if (form.youtube && !urlRegex.test(form.youtube)) {
      nextErrors.youtube = "Invalid URL format";
    }

    return nextErrors;
  };

  // ✅ FINAL SUBMIT FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the validation errors.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await authFetch(
        `${API_URL}/api/instructors/become-instructor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            headline: form.headline.trim(),
            biography: form.biography.trim(),
            website: form.website.trim(),
            linkedin: form.linkedin.trim(),
            twitter: form.twitter.trim(),
            youtube: form.youtube.trim(),
            expertise: form.expertise
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean),
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // ✅ update auth context (role becomes instructor)
        syncAuthResponse && syncAuthResponse(data);

        toast.success(data.message || "Instructor profile saved successfully!");

        // ✅ NAVIGATE TO INSTRUCTOR HOME
        navigate("/instructor/home");
      } else {
        toast.error(data.message || "Failed to save instructor profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to save instructor profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto bg-white p-6 rounded shadow"
      >
        <h2 className="text-2xl font-semibold mb-6">
          Instructor Profile
        </h2>

        {isLoadingProfile && (
          <p className="mb-4 text-sm text-gray-500">
            Loading instructor details...
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT SIDE */}
          <div>
            {/* FIRST NAME */}
            <label className="text-sm font-medium">First Name</label>
            <input
              value={user?.firstName || ""}
              disabled
              className="w-full mt-1 mb-4 px-4 py-2 border rounded bg-gray-100"
            />

            {/* LAST NAME */}
            <label className="text-sm font-medium">Last Name</label>
            <input
              value={user?.lastName || ""}
              disabled
              className="w-full mt-1 mb-4 px-4 py-2 border rounded bg-gray-100"
            />

            {/* HEADLINE */}
            <label className="text-sm font-medium">Headline</label>
            <input
              name="headline"
              value={form.headline}
              placeholder="Instructor at CourseHub"
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded focus:outline-none ${errors.headline ? "border-red-500" : ""
                }`}
            />
            {errors.headline && (
              <p className="text-red-500 text-xs mt-1 mb-3">{errors.headline}</p>
            )}
            {!errors.headline && <div className="mb-4" />}

            {/* BIOGRAPHY */}
            <label className="text-sm font-medium">Biography</label>
            <textarea
              name="biography"
              value={form.biography}
              placeholder="Write about yourself..."
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded h-32 focus:outline-none ${errors.biography ? "border-red-500" : ""
                }`}
            />
            {errors.biography && (
              <p className="text-red-500 text-xs mt-1 mb-3">{errors.biography}</p>
            )}
            {!errors.biography && <div className="mb-4" />}
          </div>

          {/* RIGHT SIDE */}
          <div>
            {/* WEBSITE */}
            <label className="text-sm font-medium">Website</label>
            <input
              name="website"
              value={form.website}
              placeholder="https://yourwebsite.com"
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded focus:outline-none ${errors.website ? "border-red-500" : ""
                }`}
            />
            {errors.website && (
              <p className="text-red-500 text-xs mt-1 mb-3">{errors.website}</p>
            )}
            {!errors.website && <div className="mb-4" />}

            {/* LINKEDIN */}
            <label className="text-sm font-medium">LinkedIn</label>
            <input
              name="linkedin"
              value={form.linkedin}
              placeholder="linkedin profile"
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded focus:outline-none ${errors.linkedin ? "border-red-500" : ""
                }`}
            />
            {errors.linkedin && (
              <p className="text-red-500 text-xs mt-1 mb-3">{errors.linkedin}</p>
            )}
            {!errors.linkedin && <div className="mb-4" />}

            {/* TWITTER */}
            <label className="text-sm font-medium">Twitter</label>
            <input
              name="twitter"
              value={form.twitter}
              placeholder="twitter profile"
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded focus:outline-none ${errors.twitter ? "border-red-500" : ""
                }`}
            />
            {errors.twitter && (
              <p className="text-red-500 text-xs mt-1 mb-3">{errors.twitter}</p>
            )}
            {!errors.twitter && <div className="mb-4" />}

            {/* YOUTUBE */}
            <label className="text-sm font-medium">YouTube</label>
            <input
              name="youtube"
              value={form.youtube}
              placeholder="youtube channel"
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded focus:outline-none ${errors.youtube ? "border-red-500" : ""
                }`}
            />
            {errors.youtube && (
              <p className="text-red-500 text-xs mt-1 mb-3">{errors.youtube}</p>
            )}
            {!errors.youtube && <div className="mb-4" />}

            {/* EXPERTISE */}
            <label className="text-sm font-medium">Expertise</label>
            <input
              name="expertise"
              value={form.expertise}
              placeholder="React, Node, AI"
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded focus:outline-none ${errors.expertise ? "border-red-500" : ""
                }`}
            />
            {errors.expertise && (
              <p className="text-red-500 text-xs mt-1 mb-3">{errors.expertise}</p>
            )}
            {!errors.expertise && <div className="mb-4" />}
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting || isLoadingProfile}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-purple-400"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstructorProfile;
