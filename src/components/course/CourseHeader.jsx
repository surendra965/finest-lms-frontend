
import { LuArrowLeft } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

const CourseHeader = ({ course }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <div className="flex items-center gap-5">

          <button
            onClick={() => navigate("/instructor/home")}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <LuArrowLeft size={22} />
          </button>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Course Setup
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {course?.title}
            </p>
          </div>

        </div>

        <div className="flex items-center gap-3">

          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              course?.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {course?.status === "published"
              ? "Published"
              : "Draft"}
          </span>

        </div>

      </div>
    </header>
  );
};

export default CourseHeader;
