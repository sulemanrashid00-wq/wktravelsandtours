'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { initialBanners } from '@/config/initialData';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconClose,
  IconCheck,
  IconPlus,
  IconEdit,
  IconTrash,
} from '@/components/ui/Icons';

export function AdminBannersManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banners', { credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBanners(json.data);
          return;
        }
      }
      setBanners(initialBanners);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setBanners(initialBanners);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleToggleActive = async (banner) => {
    const updatedStatus = banner.isActive === false ? true : false;
    const updatedBanner = { ...banner, isActive: updatedStatus };

    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(updatedBanner),
      });

      if (res.ok) {
        setBanners((prev) => prev.map((b) => (b.id === banner.id ? updatedBanner : b)));
        showToast(`Banner "${banner.title}" is now ${updatedStatus ? 'Active' : 'Hidden'}.`);
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to update banner status', 'error');
      }
    } catch {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updatedBanner : b)));
      showToast(`Banner "${banner.title}" updated locally.`, 'success');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...editingBanner,
        popularDestinations: Array.isArray(editingBanner.popularDestinations)
          ? editingBanner.popularDestinations
          : (editingBanner.popularDestinationsText || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
      };

      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.data || payload;
        setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast(`Banner "${payload.title}" updated successfully.`);
        setEditingBanner(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to update banner', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while updating banner.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...editingBanner,
        popularDestinations: (editingBanner.popularDestinationsText || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: true,
      };

      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.data || { ...payload, id: 'b-' + Date.now() };
        setBanners((prev) => [...prev, created]);
        showToast(`New campaign banner "${payload.title}" created successfully.`);
        setIsCreating(false);
        setEditingBanner(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to create banner', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while creating banner.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id, title } = deleteConfirmation;

    try {
      const res = await fetch(`/api/banners?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        showToast(`Banner "${title}" removed.`);
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to delete banner', 'error');
      }
    } catch {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showToast(`Banner "${title}" deleted locally.`, 'success');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E1E7EB] pb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#10263D]">
            Promotional Custom-Trip Banners
          </h2>
          <p className="text-xs sm:text-sm text-[#586775] mt-0.5">
            Manage the top promotional slider campaigns (Family, VIP Friends, and Honeymoon specials).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingBanner({
              title: '',
              subtitle: '',
              badge: 'Custom Tour',
              image: '/images/banners/family-package-banner.jpeg',
              targetTripType: 'family',
              targetUrl: '/custom-trip?type=family',
              popularDestinationsText: 'Thailand, Malaysia, Sri Lanka, Singapore, Dubai',
            });
            setIsCreating(true);
          }}
        >
          <IconPlus className="w-4 h-4 mr-1.5" />
          Add Promotional Banner
        </Button>
      </div>

      {/* Banner Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-[#586775]">
          <div className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#087E83] border-t-transparent rounded-full animate-spin" />
            <span>Loading promotional campaigns...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="border border-[#E1E7EB] bg-white rounded-xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative aspect-[3/4] bg-[#10263D] overflow-hidden">
                  <Image
                    src={banner.image || '/images/banners/family-package-banner.jpeg'}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="teal" size="sm">
                      {banner.badge || 'Custom Tour'}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-xs text-[#10263D] text-[10px] font-bold px-2 py-1 rounded shadow-xs">
                      Price: Based on Your Choice
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-heading font-bold text-base text-[#10263D] leading-snug">
                    {banner.title}
                  </h3>
                  <p className="text-xs text-[#586775] line-clamp-2">
                    {banner.subtitle}
                  </p>
                  <div className="text-[11px] text-[#586775] font-mono truncate">
                    Destination Links: {(banner.popularDestinations || []).slice(0, 4).join(', ')}
                  </div>
                  <div className="text-[10px] text-[#087E83] font-mono truncate">
                    Target: {banner.targetUrl}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#E1E7EB] bg-[#F3F6F8]/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(banner)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
                    banner.isActive !== false
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                      : 'text-gray-700 bg-gray-100 border border-gray-300'
                  }`}
                >
                  {banner.isActive !== false ? 'Active' : 'Hidden'}
                </button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBanner({
                        ...banner,
                        popularDestinationsText: (banner.popularDestinations || []).join(', '),
                      });
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
                    onClick={() => setDeleteConfirmation({ id: banner.id, title: banner.title })}
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
              Delete Promotional Banner
            </h3>
            <p className="text-xs text-[#586775] leading-relaxed">
              Are you sure you want to delete banner <strong className="text-[#10263D]">"{deleteConfirmation.title}"</strong>?
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
      {(editingBanner || isCreating) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E7EB] pb-3">
              <h3 className="font-heading text-lg font-bold text-[#10263D]">
                {isCreating ? 'Add Promotional Banner' : `Edit Banner: ${editingBanner?.title}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingBanner(null);
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
                  Banner Title *
                </label>
                <input
                  type="text"
                  value={editingBanner?.title || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  required
                  placeholder="e.g. VIP Friends Package"
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Subtitle / Promo Text
                </label>
                <textarea
                  rows={2}
                  value={editingBanner?.subtitle || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  placeholder="Promotional copy displayed on the card..."
                  className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={editingBanner?.badge || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                    placeholder="e.g. Family Travel, Honeymoon"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Target Trip Type
                  </label>
                  <select
                    value={editingBanner?.targetTripType || 'family'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetTripType: e.target.value })}
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  >
                    <option value="family">Family Package</option>
                    <option value="friends">VIP Friends & Groups</option>
                    <option value="honeymoon">Honeymoon Customized</option>
                    <option value="solo">Solo Adventure</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Target Link URL *
                  </label>
                  <input
                    type="text"
                    value={editingBanner?.targetUrl || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetUrl: e.target.value })}
                    required
                    placeholder="/custom-trip?type=family"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] font-mono focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Banner Image Path *
                  </label>
                  <input
                    type="text"
                    value={editingBanner?.image || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                    required
                    placeholder="/images/banners/family-package-banner.jpeg"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] font-mono focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Popular Destinations (Comma separated)
                </label>
                <input
                  type="text"
                  value={editingBanner?.popularDestinationsText || ''}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, popularDestinationsText: e.target.value })
                  }
                  placeholder="Thailand, Malaysia, Sri Lanka, Singapore, Dubai"
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E1E7EB]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingBanner(null);
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
                  {isSubmitting ? 'Saving...' : isCreating ? 'Create Banner' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
