import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import AdminLayout from "../../components/admin/AdminLayout";
import { LuBookOpen, LuArrowRight, LuShieldCheck } from "react-icons/lu";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Welcome */}
        <div className="bg-gradient-to-br from-[#a435f0] to-[#6d28d9] rounded-2xl px-8 py-10 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <LuShieldCheck size={28} className="text-purple-200" />
            <span className="text-sm font-bold text-purple-200 uppercase tracking-widest">
              Admin Control Panel
            </span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-purple-200 mt-2 text-base">
            You have full administrative access. Review courses, manage instructors, and keep the platform healthy.
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/admin/courses/pending")}
              className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <LuBookOpen size={22} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 group-hover:text-purple-700 transition">
                  Review Pending Courses
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Approve or reject instructor course submissions.
                </p>
              </div>
              <LuArrowRight size={18} className="text-gray-300 group-hover:text-purple-500 transition mt-1 shrink-0" />
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5">
          <p className="text-sm font-bold text-blue-800">📌 Admin Workflow</p>
          <p className="text-sm text-blue-700 mt-1.5 leading-relaxed">
            When instructors complete all course sections and submit for review, they appear in the{" "}
            <strong>Course Review Queue</strong>. You can view the full course details, curriculum, and
            pricing before approving (which publishes the course) or rejecting (which notifies the instructor with your reason).
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
