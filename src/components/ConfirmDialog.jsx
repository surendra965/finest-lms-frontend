import { useEffect, useRef } from "react";
import { LuTriangleAlert } from "react-icons/lu";

const ConfirmDialog = ({
    open,
    onConfirm,
    onCancel,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger", // "danger" | "warning" | "info"
}) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (open) {
            dialogRef.current?.focus();
        }
    }, [open]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && open) onCancel();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [open, onCancel]);

    if (!open) return null;

    const bgMap = {
        danger: "bg-red-600 hover:bg-red-700",
        warning: "bg-amber-500 hover:bg-amber-600",
        info: "bg-purple-600 hover:bg-purple-700",
    };

    const iconBgMap = {
        danger: "bg-red-100",
        warning: "bg-amber-100",
        info: "bg-purple-100",
    };

    const iconColorMap = {
        danger: "text-red-600",
        warning: "text-amber-600",
        info: "text-purple-600",
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7 animate-[scaleIn_200ms_ease-out]"
            >
                <div className="flex items-start gap-4">
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBgMap[variant]}`}
                    >
                        <LuTriangleAlert size={22} className={iconColorMap[variant]} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-7">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition text-sm cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-lg text-white font-semibold transition text-sm cursor-pointer ${bgMap[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
