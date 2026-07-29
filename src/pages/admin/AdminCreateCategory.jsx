import { useState, useEffect } from "react";
import { createCategory, getCategoriesAdmin, updateCategory, deleteCategory } from "../../services/adminService";
import { LuTrash2, LuPencil, LuSave, LuX, LuPlus, LuFolder, LuLayers } from "react-icons/lu";
import { toast } from "react-toastify";
import ConfirmDialog from "../../components/ConfirmDialog";
import AdminLayout from "../../components/admin/AdminLayout";

const AdminCreateCategory = () => {
    const [categories, setCategories] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Create form states
    const [form, setForm] = useState({
        name: "",
        description: "",
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Edit states
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
    });
    const [editLoading, setEditLoading] = useState(false);

    const fetchCategories = async () => {
        setListLoading(true);
        try {
            const data = await getCategoriesAdmin();
            setCategories(data || []);
        } catch (err) {
            toast.error(err.message || "Failed to load categories.");
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleEditChange = (e) => {
        setEditForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim() || !form.description.trim()) {
            toast.warn("Category name and description are required.");
            return;
        }

        try {
            setCreateLoading(true);
            await createCategory({
                name: form.name.trim(),
                description: form.description.trim(),
            });
            toast.success("Category created successfully.");
            setForm({ name: "", description: "" });
            fetchCategories();
        } catch (err) {
            toast.error(err.message || "Failed to create category");
        } finally {
            setCreateLoading(false);
        }
    };

    const startEditing = (cat) => {
        setEditingId(cat._id);
        setEditForm({
            name: cat.name,
            description: cat.description || "",
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ name: "", description: "" });
    };

    const handleEditSubmit = async (id) => {
        if (!editForm.name.trim() || !editForm.description.trim()) {
            toast.warn("Name and description are required.");
            return;
        }

        try {
            setEditLoading(true);
            await updateCategory(id, {
                name: editForm.name.trim(),
                description: editForm.description.trim(),
            });
            toast.success("Category updated successfully.");
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            toast.error(err.message || "Failed to update category.");
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            title: "Delete Category?",
            message: "Are you sure you want to delete this category? This might affect existing courses.",
            confirmText: "Delete",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    await deleteCategory(id);
                    toast.success("Category deleted successfully.");
                    fetchCategories();
                } catch (err) {
                    toast.error(err.message || "Failed to delete category.");
                }
            }
        });
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <LuLayers className="text-[#a435f0]" /> Category Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Create, modify, or delete course categories across the learning platform.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr]">
                {/* Creation Form Panel */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm h-fit">
                    <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-1.5 pb-3 border-b border-slate-100">
                        <LuPlus className="text-purple-600" /> Add New Category
                    </h2>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Category Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleCreateChange}
                                placeholder="Development, Marketing, etc..."
                                maxLength={50}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleCreateChange}
                                rows={4}
                                placeholder="Write a short description to guide students..."
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={createLoading}
                            className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold p-3 rounded-xl disabled:opacity-60 transition cursor-pointer text-sm shadow-md shadow-purple-50 border-none inline-flex items-center justify-center gap-2"
                        >
                            {createLoading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : null}
                            Create Category
                        </button>
                    </form>
                </div>

                {/* Categories Table / List Panel */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-1.5 pb-3 border-b border-slate-100">
                        <LuFolder className="text-purple-600" /> Active Categories
                    </h2>

                    {listLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <span className="w-10 h-10 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
                            <p className="text-slate-500 text-sm">Fetching categories...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <LuFolder size={40} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No categories available. Please add some.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categories.map((cat) => (
                                <div
                                    key={cat._id}
                                    className={`p-5 rounded-2xl border transition-all ${editingId === cat._id
                                        ? "border-purple-300 bg-purple-50/20"
                                        : "border-slate-100 hover:border-slate-300 hover:shadow-xs"
                                        }`}
                                >
                                    {editingId === cat._id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleEditChange}
                                                className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-purple-500"
                                            />
                                            <textarea
                                                name="description"
                                                value={editForm.description}
                                                onChange={handleEditChange}
                                                rows={2}
                                                className="w-full text-sm text-slate-600 border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-purple-500"
                                            />
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => handleEditSubmit(cat._id)}
                                                    disabled={editLoading}
                                                    className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg border-none cursor-pointer disabled:opacity-50"
                                                >
                                                    {editLoading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LuSave size={14} />} Save
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="inline-flex items-center gap-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3.5 py-1.5 rounded-lg border-none cursor-pointer"
                                                >
                                                    <LuX size={14} /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                                                <p className="text-slate-600 text-sm leading-relaxed">{cat.description || "No description provided."}</p>
                                                {cat.slug && (
                                                    <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-full px-2 py-0.5 mt-2">
                                                        Slug: {cat.slug}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => startEditing(cat)}
                                                    className="p-2 rounded-xl text-slate-500 hover:text-purple-650 hover:bg-purple-50 transition cursor-pointer border-none bg-transparent"
                                                    title="Edit Category"
                                                >
                                                    <LuPencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat._id)}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-red-650 hover:bg-red-50 transition cursor-pointer border-none bg-transparent"
                                                    title="Delete Category"
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reusable Confirmation Dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    open={!!confirmDialog}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText={confirmDialog.confirmText}
                    cancelText="Cancel"
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                    variant={confirmDialog.variant}
                />
            )}
            </div>
        </AdminLayout>
    );
};

export default AdminCreateCategory;