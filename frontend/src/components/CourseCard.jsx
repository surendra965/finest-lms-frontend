import { Link } from "react-router-dom";

const CourseCard = ({ course }) => {
  return (
    <Link to={`api/public/courses/${course.id}`}>
      <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition bg-white">

        <img
          src={course.image}
          alt={course.title}
          className="w-full h-40 object-cover"
        />

        <div className="p-3 space-y-1">

          <h2 className="font-semibold text-lg line-clamp-2">
            {course.title}
          </h2>

          <p className="text-sm text-gray-600">
            {course.instructor}
          </p>

          <div className="flex items-center justify-between mt-2">
            <p className="font-bold">
              ₹{course.price}
            </p>

            <span className="text-xs text-gray-500">
              {course.level}
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
};

export default CourseCard;