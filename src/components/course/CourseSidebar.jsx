import {
  LuBookOpen,
  LuGraduationCap,
  LuLayoutDashboard,
  LuDollarSign,
  LuCircleCheck,
  LuCircle,
} from "react-icons/lu";
import { toast } from "react-toastify";

const sidebarItems = [
  {
    id: "learners",
    title: "Intended Learners",
    description: "Requirements & objectives",
    icon: LuGraduationCap,
  },
  {
    id: "landing",
    title: "Course Landing Page",
    description: "Basic course information",
    icon: LuLayoutDashboard,
  },
  {
    id: "curriculum",
    title: "Curriculum",
    description: "Sections & lectures",
    icon: LuBookOpen,
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Price & discounts",
    icon: LuDollarSign,
  },
];

const CourseSidebar = ({
  activeTab,
  setActiveTab,
  completedSteps = [],
}) => {
  return (
    <aside className="w-80 bg-white border-r min-h-screen font-sans">
      <div className="px-6 py-6 border-b">
        <h2 className="text-lg font-bold text-gray-900">
          Course Builder
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete every step before publishing.
        </p>
      </div>

      <div className="py-3">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const completed = completedSteps.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => {
                const stepOrder = ["learners", "landing", "curriculum", "pricing"];
                const currentIndex = stepOrder.indexOf(item.id);

                // Enforce that all previous steps must be completed
                for (let i = 0; i < currentIndex; i++) {
                  const prevStepId = stepOrder[i];
                  if (!completedSteps.includes(prevStepId)) {
                    const prevStepName = sidebarItems.find(si => si.id === prevStepId)?.title || prevStepId;
                    toast.error(`Please complete the "${prevStepName}" section first.`);
                    return;
                  }
                }

                setActiveTab(item.id);
              }}
              className={`w-full flex items-start gap-4 px-6 py-4 text-left transition-all border-l-4
                ${
                  active
                    ? "border-purple-600 bg-purple-50"
                    : "border-transparent hover:bg-gray-50"
                }
              `}
            >
              <div
                className={`mt-1 ${
                  active
                    ? "text-purple-600"
                    : "text-gray-500"
                }`}
              >
                <Icon size={22} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`font-semibold text-sm ${
                      active
                        ? "text-purple-700"
                        : "text-gray-800"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {completed ? (
                    <LuCircleCheck
                      size={18}
                      className="text-green-600 shrink-0"
                    />
                  ) : (
                    <LuCircle
                      size={18}
                      className="text-gray-300 hover:text-gray-400 shrink-0"
                    />
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default CourseSidebar;
