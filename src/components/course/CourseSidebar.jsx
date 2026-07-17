import {
  LuBookOpen,
  LuGraduationCap,
  LuLayoutDashboard,
  LuDollarSign,
  LuCircleCheck,
  LuCircle,
  LuLock,
} from "react-icons/lu";

const sidebarItems = [
  {
    id: "learners",
    title: "Intended Learners",
    description: "Requirements & objectives",
    icon: LuGraduationCap,
    step: 1,
  },
  {
    id: "landing",
    title: "Landing Page",
    description: "Basic course information",
    icon: LuLayoutDashboard,
    step: 2,
  },
  {
    id: "curriculum",
    title: "Curriculum",
    description: "Sections & lectures",
    icon: LuBookOpen,
    step: 3,
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Price & discounts",
    icon: LuDollarSign,
    step: 4,
  },
];

const CourseSidebar = ({
  activeTab,
  setActiveTab,
  completedSteps = [],
}) => {
  const stepOrder = ["learners", "landing", "curriculum", "pricing"];

  const isStepAccessible = (itemId) => {
    return true;
  };

  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  return (
    <aside className="w-72 bg-white border-r shrink-0 font-sans sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-5 py-5 border-b">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Course Builder
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Complete every step to publish
        </p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">
              {completedCount} / 4 completed
            </span>
            <span className="font-bold text-purple-600">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const completed = completedSteps.includes(item.id);
          const accessible = isStepAccessible(item.id);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (accessible) {
                  setActiveTab(item.id);
                }
              }}
              disabled={!accessible}
              className={`
                w-full flex items-center gap-3.5 px-5 py-4 text-left transition-all duration-200 border-l-[3px] group relative
                ${active
                  ? "border-purple-600 bg-purple-50/80"
                  : accessible
                    ? "border-transparent hover:bg-gray-50 hover:border-gray-200"
                    : "border-transparent opacity-40 cursor-not-allowed"
                }
              `}
            >
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${active
                    ? "bg-purple-100 text-purple-600"
                    : completed
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }
                `}
              >
                <Icon size={18} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`font-semibold text-sm truncate ${active
                      ? "text-purple-700"
                      : completed
                        ? "text-gray-800"
                        : "text-gray-600"
                      }`}
                  >
                    {item.title}
                  </h3>

                  {/* Status icon */}
                  {completed ? (
                    <LuCircleCheck
                      size={16}
                      className="text-green-500 shrink-0"
                    />
                  ) : !accessible ? (
                    <LuLock
                      size={14}
                      className="text-gray-300 shrink-0"
                    />
                  ) : (
                    <LuCircle
                      size={16}
                      className="text-gray-200 shrink-0"
                    />
                  )}
                </div>

                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {!accessible
                    ? "Complete previous steps"
                    : item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default CourseSidebar;
