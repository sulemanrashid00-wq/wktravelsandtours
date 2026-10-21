'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { OUR_WORK_ITEMS, OUR_WORK_CATEGORIES } from '@/config/ourWorkData';
import {
  IconClose,
  IconCheck,
  IconPlus,
  IconEdit,
  IconTrash,
  IconShieldCheck,
  IconMapPin,
  IconCalendar,
} from '@/components/ui/Icons';

export function AdminAgencyWorkManager() {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadWork = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agency-work?includeUnpublished=true', {
        credentials: 'same-origin',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setWorkItems(json.data);
          return;
        }
      }
      setWorkItems(OUR_WORK_ITEMS);
    } catch (err) {
      console.error('Error fetching agency work:', err);
      setWorkItems(OUR_WORK_ITEMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWork();
  }, [loadWork]);

  const handleTogglePublish = async (item) => {
    const updatedStatus = !item.isPublished;
    const updatedItem = { ...item, isPublished: updatedStatus };

    try {
      const res = await fetch('/api/agency-work', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(updatedItem),
      });

      if (res.ok) {
        setWorkItems((prev) => prev.map((w) => (w.id === item.id ? updatedItem : w)));
        showToast(`Record "${item.title}" is now ${updatedStatus ? 'Published' : 'Hidden'}.`);
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to update visibility', 'error');
      }
    } catch {
      setWorkItems((prev) => prev.map((w) => (w.id === item.id ? updatedItem : w)));
      showToast(`Record "${item.title}" updated locally.`, 'success');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/agency-work', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(editingItem),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.data || editingItem;
        setWorkItems((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        showToast(`Record "${editingItem.title}" updated successfully.`);
        setEditingItem(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to update record', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving changes.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...editingItem,
        isPublished: true,
        displayOrder: editingItem.displayOrder || workItems.length + 1,
      };

      const res = await fetch('/api/agency-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.data || { ...payload, id: 'work-' + Date.now() };
        setWorkItems((prev) => [created, ...prev]);
        showToast(`Record "${payload.title}" created successfully.`);
        setIsCreating(false);
        setEditingItem(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to create record', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while creating record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id, title } = deleteConfirmation;

    try {
      const res = await fetch(`/api/agency-work?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (res.ok) {
        setWorkItems((prev) => prev.filter((w) => w.id !== id));
        showToast(`Record "${title}" removed.`);
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to delete record', 'error');
      }
    } catch {
      setWorkItems((prev) => prev.filter((w) => w.id !== id));
      showToast(`Record "${title}" deleted locally.`, 'success');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  // Reordering display order
  const handleMoveOrder = async (item, direction) => {
    const currentIndex = workItems.findIndex((w) => w.id === item.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= workItems.length) return;

    const newItems = [...workItems];
    const targetItem = newItems[targetIndex];

    const currentOrder = item.displayOrder ?? currentIndex + 1;
    const targetOrder = targetItem.displayOrder ?? targetIndex + 1;

    newItems[currentIndex] = { ...targetItem, displayOrder: currentOrder };
    newItems[targetIndex] = { ...item, displayOrder: targetOrder };

    setWorkItems(newItems);

    try {
      await fetch('/api/agency-work', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...item, displayOrder: targetOrder }),
      });
      showToast(`Display order updated for "${item.title}".`);
    } catch {
      // Local state already updated
    }
  };

  const filteredItems = workItems.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMessage && (
        <div
          role="status"
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-sm ${
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E7EB] pb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#10263D]">
            Agency Completed Work & Tour Dispatch CMS
          </h2>
          <p className="text-xs sm:text-sm text-[#586775] mt-0.5">
            Manage verified visual records of international departures, airport handovers, and ground travel operations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingItem({
              title: '',
              category: 'group',
              destination: '',
              description: '',
              highlights: '',
              travelDate: 'October 2026',
              milestone: 'Verified Operation',
              departurePoint: 'Jinnah International Airport, Karachi',
              imageUrl: '/images/our-work/klia-airport-departure.jpeg',
              displayOrder: workItems.length + 1,
              isPublished: true,
            });
            setIsCreating(true);
          }}
        >
          <IconPlus className="w-4 h-4 mr-1.5" />
          Add Operation Record
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F3F6F8] p-3 rounded-xl border border-[#E1E7EB]">
        <div className="flex flex-wrap items-center gap-1.5">
          {OUR_WORK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#10263D] text-white'
                  : 'bg-white text-[#586775] hover:bg-gray-100 border border-[#E1E7EB]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by title, destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs px-3 py-1.5 bg-white border border-[#E1E7EB] rounded-lg focus:outline-none focus:border-[#087E83] w-full sm:w-64"
        />
      </div>

      {/* Grid of Work Items */}
      {loading ? (
        <div className="py-12 text-center text-[#586775]">
          <div className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#087E83] border-t-transparent rounded-full animate-spin" />
            <span>Loading verified agency records...</span>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 border border-[#E1E7EB] bg-white rounded-xl text-center text-[#586775]">
          No matching agency work records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              data-admin-work-card={item.id}
              className="border border-[#E1E7EB] bg-white rounded-xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#10263D] overflow-hidden">
                  <Image
                    src={item.imageUrl || '/images/our-work/klia-airport-departure.jpeg'}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="bg-[#10263D]/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="bg-emerald-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      #{item.displayOrder || idx + 1}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-heading font-bold text-base text-[#10263D] leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#087E83] flex items-center gap-1">
                    <IconMapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.destination}</span>
                  </div>
                  <div className="text-[11px] text-[#586775]">
                    {item.travelDate} • {item.milestone || 'Verified Operation'}
                  </div>
                  <p className="text-xs text-[#586775] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-3.5 border-t border-[#E1E7EB] bg-[#F3F6F8]/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(item)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
                    item.isPublished
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                      : 'text-gray-700 bg-gray-100 border border-gray-300'
                  }`}
                >
                  {item.isPublished ? 'Published' : 'Hidden'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Move Up"
                    onClick={() => handleMoveOrder(item, 'up')}
                    className="p-1 text-gray-500 hover:text-[#10263D] hover:bg-white rounded transition-colors text-xs font-bold"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    title="Move Down"
                    onClick={() => handleMoveOrder(item, 'down')}
                    className="p-1 text-gray-500 hover:text-[#10263D] hover:bg-white rounded transition-colors text-xs font-bold"
                  >
                    &darr;
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem({ ...item });
                      setIsCreating(false);
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    <IconEdit className="w-3.5 h-3.5 text-[#087E83]" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmation({ id: item.id, title: item.title })}
                    className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-[#10263D]">
              Delete Work Record
            </h3>
            <p className="text-xs text-[#586775] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#10263D]">"{deleteConfirmation.title}"</strong>? This will remove it from the operational portfolio.
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

      {/* Edit / Create Modal */}
      {(editingItem || isCreating) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E1E7EB] pb-3">
              <h3 className="font-heading text-lg font-bold text-[#10263D]">
                {isCreating ? 'Add Verified Agency Operation' : `Edit Record: ${editingItem?.title}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
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
                  Operation Title *
                </label>
                <input
                  type="text"
                  value={editingItem?.title || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  required
                  placeholder="e.g. KLIA International Departure & Documentation Check"
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Record Category *
                  </label>
                  <select
                    value={editingItem?.category || 'group'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  >
                    <option value="group">Group Departures</option>
                    <option value="family">Family & Leisure</option>
                    <option value="adventure">Coastal & Island</option>
                    <option value="vip">VIP & Transfers</option>
                    <option value="transit">International Transit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Travel / Operation Date
                  </label>
                  <input
                    type="text"
                    value={editingItem?.travelDate || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, travelDate: e.target.value })}
                    placeholder="e.g. October 2026"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={editingItem?.destination || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, destination: e.target.value })}
                    required
                    placeholder="e.g. Kuala Lumpur International Airport, Malaysia"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Milestone Tag
                  </label>
                  <input
                    type="text"
                    value={editingItem?.milestone || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, milestone: e.target.value })}
                    placeholder="e.g. Verified Departure"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              {/* Quick Image Picker or Custom Path */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Choose Authentic Photo *
                </label>
                <select
                  value={editingItem?.imageUrl || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  className="w-full text-xs bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83] mb-2"
                >
                  {OUR_WORK_ITEMS.map((item) => (
                    <option key={item.id} value={item.imageUrl}>
                      {item.newFile} - {item.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editingItem?.imageUrl || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  required
                  placeholder="/images/our-work/klia-airport-departure.jpeg"
                  className="w-full text-xs bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] font-mono focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Operational Highlights
                </label>
                <input
                  type="text"
                  value={editingItem?.highlights || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, highlights: e.target.value })}
                  placeholder="Key deliverables (e.g. direct connection, scheduled excursions)"
                  className="w-full text-xs bg-white border border-[#E1E7EB] rounded-lg px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Operational Summary & Client Experience
                </label>
                <textarea
                  rows={3}
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Full narrative of the tour departure, client group size, or consular logistics..."
                  className="w-full text-xs bg-white border border-[#E1E7EB] rounded-lg p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E1E7EB]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
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
                  {isSubmitting ? 'Saving...' : isCreating ? 'Create Record' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
