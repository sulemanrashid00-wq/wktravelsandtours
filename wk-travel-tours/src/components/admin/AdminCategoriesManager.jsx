'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initialCategories } from '@/config/initialData';
import { Button } from '@/components/ui/Button';
import {
  IconClose,
  IconCheck,
  IconPlus,
  IconEdit,
  IconTrash,
  IconFilter,
} from '@/components/ui/Icons';

export function AdminCategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories', { credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
          return;
        }
      }
      setCategories(initialCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(initialCategories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Create new category
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingCategory.name.trim(),
        slug: (editingCategory.slug || editingCategory.name)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        description: editingCategory.description?.trim() || '',
        display_order: parseInt(editingCategory.display_order, 10) || 0,
      };

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.data || { ...payload, id: 'cat-' + Date.now() };
        setCategories((prev) => [...prev, created]);
        showToast(`Category "${payload.name}" created successfully.`);
        setIsCreating(false);
        setEditingCategory(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to create category', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while creating category.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        id: editingCategory.id,
        name: editingCategory.name.trim(),
        slug: editingCategory.slug.toLowerCase().trim(),
        description: editingCategory.description?.trim() || '',
        display_order: parseInt(editingCategory.display_order, 10) || 0,
      };

      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.data || payload;
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast(`Category "${payload.name}" updated successfully.`);
        setEditingCategory(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to update category', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while updating category.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete category
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id, name } = deleteConfirmation;

    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast(`Category "${name}" removed.`);
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to delete category', 'error');
      }
    } catch {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast(`Category "${name}" deleted locally.`, 'success');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className={`p-3.5 rounded border text-xs flex items-center justify-between shadow-sm ${
            toastMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <IconCheck
              className={`w-4 h-4 ${
                toastMessage.type === 'error' ? 'text-red-600' : 'text-emerald-600'
              }`}
            />
            <span className="font-medium">{toastMessage.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-500 hover:text-gray-800"
          >
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E1E7EB] pb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#10263D]">
            Categories & Homepage Sections
          </h2>
          <p className="text-xs sm:text-sm text-[#586775] mt-0.5">
            Define canonical package categories, display orders, and homepage section titles.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingCategory({
              name: '',
              slug: '',
              description: '',
              display_order: categories.length + 1,
            });
            setIsCreating(true);
          }}
        >
          <IconPlus className="w-4 h-4 mr-1.5" />
          Add New Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="border border-[#E1E7EB] bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E1E7EB] bg-[#F3F6F8] text-[#10263D] uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4 w-16 text-center">Order</th>
              <th className="py-3.5 px-4">Category Name</th>
              <th className="py-3.5 px-4">System Slug</th>
              <th className="py-3.5 px-4">Public Description</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E7EB]">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-[#586775]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#087E83] border-t-transparent rounded-full animate-spin" />
                    <span>Loading categories...</span>
                  </div>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-[#586775]">
                  No categories configured.
                </td>
              </tr>
            ) : (
              categories.map((cat, idx) => (
                <tr key={cat.id || cat.slug || idx} className="hover:bg-[#F3F6F8]/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#10263D] text-center">
                    {cat.display_order ?? idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-heading font-bold text-[#10263D]">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#586775]">
                    {cat.slug}
                  </td>
                  <td className="py-3.5 px-4 text-[#586775] max-w-md">
                    {cat.description || 'No description provided.'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategory({ ...cat });
                          setIsCreating(false);
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <IconEdit className="w-3.5 h-3.5 text-[#087E83]" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmation({ id: cat.id || cat.slug, name: cat.name })}
                        className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-[#10263D]">
              Delete Category
            </h3>
            <p className="text-xs text-[#586775] leading-relaxed">
              Are you sure you want to delete category <strong className="text-[#10263D]">"{deleteConfirmation.name}"</strong>? Packages currently assigned to this category will remain in the database under their other categories.
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E1E7EB]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(editingCategory || isCreating) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E7EB] pb-3">
              <h3 className="font-heading text-lg font-bold text-[#10263D]">
                {isCreating ? 'Add New Category' : `Edit Category: ${editingCategory?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCreating(false);
                }}
                className="text-[#586775] hover:text-[#10263D]"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isCreating ? handleCreate : handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editingCategory?.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                  placeholder="e.g. Solo Travel, Family Vacations"
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  System Slug *
                </label>
                <input
                  type="text"
                  value={editingCategory?.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  required
                  placeholder="e.g. solo, family, friends, honeymoon"
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] font-mono focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCategory?.display_order || 0}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      display_order: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Public Description
                </label>
                <textarea
                  rows={3}
                  value={editingCategory?.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Short tagline or description displayed on website section header..."
                  className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E1E7EB]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCreating(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : isCreating ? 'Create Category' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

