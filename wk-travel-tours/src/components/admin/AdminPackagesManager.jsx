'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { initialPackages } from '@/config/initialData';
import { formatPKR } from '@/lib/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconClose,
  IconCheck,
  IconSearch,
  IconFilter,
  IconClock,
  IconShieldCheck,
  IconTrash,
  IconEdit,
  IconPlus,
} from '@/components/ui/Icons';

const ALL_CATEGORY_OPTIONS = [
  { value: 'solo', label: 'Solo Travel' },
  { value: 'friends', label: 'Friends & Groups' },
  { value: 'family', label: 'Family Vacations' },
  { value: 'honeymoon', label: 'Honeymoon Escapes' },
  { value: 'visa', label: 'Visit Visas' },
  { value: 'featured', label: 'Featured International' },
];

export function AdminPackagesManager() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingPackage, setEditingPackage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch live packages from API
  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/packages?includeInactive=true', { credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPackages(json.data);
          return;
        }
      }
      // Fallback
      setPackages(initialPackages);
    } catch (err) {
      console.error('Failed to fetch packages from API:', err);
      setPackages(initialPackages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // Toggle active/published status
  const handleToggleActive = async (pkg) => {
    const updatedStatus = pkg.isActive === false ? true : false;
    const updatedPkg = { ...pkg, isActive: updatedStatus };

    try {
      const res = await fetch('/api/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(updatedPkg),
      });

      if (res.ok) {
        setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updatedPkg : p)));
        showToast(`Package "${pkg.title}" is now ${updatedStatus ? 'Published' : 'Draft'}.`);
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to update visibility', 'error');
      }
    } catch {
      // Local optimistic update if offline
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updatedPkg : p)));
      showToast(`Package "${pkg.title}" updated locally.`, 'success');
    }
  };

  // Toggle featured status independently
  const handleToggleFeatured = async (pkg) => {
    const updatedFeatured = !pkg.isFeatured;
    const updatedPkg = { ...pkg, isFeatured: updatedFeatured };

    try {
      const res = await fetch('/api/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(updatedPkg),
      });

      if (res.ok) {
        setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updatedPkg : p)));
        showToast(
          `"${pkg.title}" is ${updatedFeatured ? 'now Featured on Homepage' : 'removed from Featured'}.`
        );
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to update featured flag', 'error');
      }
    } catch {
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updatedPkg : p)));
      showToast(`Package "${pkg.title}" updated locally.`, 'success');
    }
  };

  // Delete package
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id, title } = deleteConfirmation;

    try {
      const res = await fetch(`/api/packages?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (res.ok) {
        setPackages((prev) => prev.filter((p) => p.id !== id));
        showToast(`Package "${title}" deleted successfully.`);
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to delete package', 'error');
      }
    } catch {
      setPackages((prev) => prev.filter((p) => p.id !== id));
      showToast(`Package "${title}" deleted locally.`, 'success');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  // Save edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...editingPackage,
        price: parseInt(editingPackage.price, 10) || 0,
        durationDays: parseInt(editingPackage.durationDays, 10) || 1,
        inclusions: Array.isArray(editingPackage.inclusions)
          ? editingPackage.inclusions
          : (editingPackage.inclusionsText || '')
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
        exclusions: Array.isArray(editingPackage.exclusions)
          ? editingPackage.exclusions
          : (editingPackage.exclusionsText || '')
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
        highlights: Array.isArray(editingPackage.highlights)
          ? editingPackage.highlights
          : (editingPackage.highlightsText || '')
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
        categories: editingPackage.allowedCategories || [editingPackage.category || 'solo'],
        allowedCategories: editingPackage.allowedCategories || [editingPackage.category || 'solo'],
        isCustomized: editingPackage.isCustomized ?? false,
        packageType: editingPackage.isCustomized ? 'customized' : (editingPackage.packageType || 'standard'),
        displayOrder: parseInt(editingPackage.displayOrder, 10) || 10,
      };

      const res = await fetch('/api/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.data || payload;
        setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(`Package "${payload.title}" updated successfully.`);
        setEditingPackage(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to save changes', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving package.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new package
  const handleCreateNew = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const slugVal = (editingPackage.slug || editingPackage.title || 'package')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const payload = {
        ...editingPackage,
        slug: slugVal,
        price: parseInt(editingPackage.price, 10) || 0,
        durationDays: parseInt(editingPackage.durationDays, 10) || 1,
        isActive: editingPackage.isActive ?? true,
        isFeatured: editingPackage.isFeatured ?? false,
        isCustomized: editingPackage.isCustomized ?? false,
        packageType: editingPackage.isCustomized ? 'customized' : (editingPackage.packageType || 'standard'),
        displayOrder: parseInt(editingPackage.displayOrder, 10) || 10,
        primaryImage:
          editingPackage.primaryImage || '/images/packages/thailand-bangkok-pattaya-phuket.jpeg',
        inclusions: (editingPackage.inclusionsText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        exclusions: (editingPackage.exclusionsText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        highlights: (editingPackage.highlightsText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        category: editingPackage.category || 'solo',
        categories: editingPackage.allowedCategories?.length
          ? editingPackage.allowedCategories
          : [editingPackage.category || 'solo'],
        allowedCategories: editingPackage.allowedCategories?.length
          ? editingPackage.allowedCategories
          : [editingPackage.category || 'solo'],
        serviceType: editingPackage.serviceType || 'tour',
      };

      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.data || payload;
        setPackages((prev) => [created, ...prev]);
        showToast(`New package "${payload.title}" created successfully.`);
        setIsCreating(false);
        setEditingPackage(null);
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to create package', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while creating package.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (pkg) => {
    setEditingPackage({
      ...pkg,
      isCustomized: pkg.isCustomized ?? pkg.is_customized ?? false,
      displayOrder: pkg.displayOrder ?? pkg.display_order ?? 10,
      packageType: pkg.packageType ?? pkg.package_type ?? 'standard',
      inclusionsText: (pkg.inclusions || []).join('\n'),
      exclusionsText: (pkg.exclusions || []).join('\n'),
      highlightsText: (pkg.highlights || []).join('\n'),
      allowedCategories: pkg.allowedCategories || pkg.categories || [pkg.category || 'solo'],
    });
    setIsCreating(false);
  };

  const openCreateModal = () => {
    setEditingPackage({
      title: '',
      slug: '',
      destination: '',
      subtitle: '',
      tagline: '',
      price: 250000,
      pricingBasis: 'per_person',
      duration: '7 Days / 6 Nights',
      durationDays: 7,
      category: 'solo',
      allowedCategories: ['solo'],
      serviceType: 'tour',
      isFeatured: false,
      isActive: true,
      isCustomized: false,
      displayOrder: 10,
      packageType: 'standard',
      badge: '',
      primaryImage: '/images/packages/thailand-bangkok-pattaya-phuket.jpeg',
      inclusionsText: 'Return Air Ticket\nStandard Hotel Accommodation\nDaily Breakfast Included\nAirport Meet & Greet Transfers',
      exclusionsText: 'Consular Visa Processing Fees\nPersonal Expenses & Porterage\nOptional City Excursions',
      highlightsText: 'Guided City Sightseeing Tour\nCaspian Waterfront Walkway\nTraditional Cultural Bazar Visit',
      importantNotes: 'Rates are subject to flight availability at the time of final booking.',
    });
    setIsCreating(true);
  };

  const toggleCategorySelection = (catSlug) => {
    const current = editingPackage.allowedCategories || [];
    let updated;
    if (current.includes(catSlug)) {
      updated = current.filter((c) => c !== catSlug);
      if (updated.length === 0) updated = [catSlug]; // Keep at least one
    } else {
      updated = [...current, catSlug];
    }
    setEditingPackage({
      ...editingPackage,
      allowedCategories: updated,
      // If primary category is removed, assign first in updated
      category: updated.includes(editingPackage.category) ? editingPackage.category : updated[0],
    });
  };

  // Filter packages
  const filtered = packages.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.destination?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'featured') return p.isFeatured === true;

    const assigned = p.allowedCategories || p.categories || [p.category];
    return assigned.includes(categoryFilter) || p.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className={`p-3.5 rounded border text-xs flex items-center justify-between shadow-sm transition-all ${
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
            Package Catalogue Manager
          </h2>
          <p className="text-xs sm:text-sm text-[#586775] mt-0.5">
            Manage international tour itineraries, confirmed rates, explicit categories, and featured flags.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal}>
          <IconPlus className="w-4 h-4 mr-1.5" />
          Add New Package
        </Button>
      </div>

      {/* Controls Strip: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-[#E1E7EB] rounded-lg shadow-sm">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="w-4 h-4 text-[#586775] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search package title or destination..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-[#E1E7EB] rounded text-[#10263D] focus:outline-none focus:border-[#087E83]"
          />
        </div>

        <div className="flex items-center gap-2">
          <IconFilter className="w-4 h-4 text-[#586775] hidden sm:block" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
          >
            <option value="all">All Categories ({packages.length})</option>
            <option value="featured">Featured On Homepage</option>
            <option value="solo">Solo Travel</option>
            <option value="friends">Friends & Groups</option>
            <option value="family">Family Vacations</option>
            <option value="honeymoon">Honeymoon Escapes</option>
            <option value="visa">Visit Visas</option>
          </select>
        </div>
      </div>

      {/* Packages Table */}
      <div className="border border-[#E1E7EB] bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E1E7EB] bg-[#F3F6F8] text-[#10263D] uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Package</th>
              <th className="py-3.5 px-4">Destination</th>
              <th className="py-3.5 px-4">Classification</th>
              <th className="py-3.5 px-4">Confirmed Rate</th>
              <th className="py-3.5 px-4">Duration</th>
              <th className="py-3.5 px-4 text-center">Featured</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E7EB]">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-[#586775]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#087E83] border-t-transparent rounded-full animate-spin" />
                    <span>Loading real database packages...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-[#586775]">
                  No packages found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-[#F3F6F8]/60 transition-colors">
                  {/* Title & Image */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-14 bg-[#10263D] rounded overflow-hidden flex-shrink-0 border border-[#E1E7EB]">
                        <Image
                          src={pkg.primaryImage || '/images/packages/thailand-bangkok-pattaya-phuket.jpeg'}
                          alt={pkg.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-heading font-bold text-[#10263D] block max-w-xs truncate">
                          {pkg.title}
                        </span>
                        <span className="text-[10px] text-[#586775] font-mono">
                          /{pkg.slug}
                        </span>
                        {pkg.serviceType === 'visa' && (
                          <span className="inline-block mt-0.5 text-[9px] uppercase font-bold text-[#087E83] bg-[#087E83]/10 px-1.5 py-0.2 rounded">
                            Visa Service
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Destination */}
                  <td className="py-3.5 px-4 font-medium text-[#10263D]">
                    {pkg.destination}
                  </td>

                  {/* Classification */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(pkg.allowedCategories || pkg.categories || [pkg.category || 'solo']).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F3F6F8] text-[#10263D] border border-[#E1E7EB]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Confirmed Rate */}
                  <td className="py-3.5 px-4 font-bold text-[#10263D]">
                    {formatPKR(pkg.price)}
                    <span className="text-[10px] text-[#586775] block font-normal">
                      {pkg.pricingBasis === 'per_person'
                        ? 'Per Person'
                        : pkg.pricingBasis === 'visa_only'
                        ? 'Visa / Consular Fee'
                        : 'Fixed Group Rate'}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 text-[#586775]">
                    {pkg.duration}
                  </td>

                  {/* Featured Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(pkg)}
                      title="Click to toggle homepage featured status"
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        pkg.isFeatured
                          ? 'bg-[#087E83] text-white'
                          : 'bg-white text-[#586775] border border-[#E1E7EB] hover:border-[#087E83]'
                      }`}
                    >
                      {pkg.isFeatured ? 'Featured' : 'Standard'}
                    </button>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(pkg)}
                      title="Click to toggle publish status"
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        pkg.isActive !== false
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {pkg.isActive !== false ? 'Published' : 'Draft'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(pkg)}
                        title="Edit package details"
                        className="h-7 px-2 text-xs"
                      >
                        <IconEdit className="w-3.5 h-3.5 text-[#087E83]" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmation({ id: pkg.id, title: pkg.title })}
                        title="Delete package"
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
              Confirm Deletion
            </h3>
            <p className="text-xs text-[#586775] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#10263D]">"{deleteConfirmation.title}"</strong>? This will remove the package from all live public sliders and database listings.
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
                Delete Package
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Modal Dialog */}
      {(editingPackage || isCreating) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E7EB] pb-4">
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[#10263D]">
                  {isCreating ? 'Create International Tour Package' : `Edit Package: ${editingPackage?.title}`}
                </h3>
                <span className="text-xs text-[#586775]">
                  Enforce strict classification, pricing transparency, and accurate inclusions.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPackage(null);
                  setIsCreating(false);
                }}
                className="text-[#586775] hover:text-[#10263D] p-1 rounded"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isCreating ? handleCreateNew : handleSaveEdit} className="space-y-5 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Package Title *
                  </label>
                  <input
                    type="text"
                    value={editingPackage?.title || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, title: e.target.value })}
                    required
                    placeholder="e.g. Explore Thailand: Bangkok, Pattaya & Phuket"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={editingPackage?.slug || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, slug: e.target.value })}
                    required
                    placeholder="e.g. thailand-bangkok-pattaya-phuket"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] font-mono focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              {/* Destination & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={editingPackage?.destination || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, destination: e.target.value })}
                    required
                    placeholder="e.g. Thailand"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Duration Label *
                  </label>
                  <input
                    type="text"
                    value={editingPackage?.duration || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, duration: e.target.value })}
                    required
                    placeholder="e.g. 7 Days / 6 Nights"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Duration (Days Count) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editingPackage?.durationDays || 7}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        durationDays: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    required
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              {/* Rate & Pricing Basis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Confirmed Rate in PKR *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingPackage?.price || 0}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        price: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    required
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Pricing Basis *
                  </label>
                  <select
                    value={editingPackage?.pricingBasis || 'per_person'}
                    onChange={(e) => setEditingPackage({ ...editingPackage, pricingBasis: e.target.value })}
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  >
                    <option value="per_person">Per Person (Twin Sharing)</option>
                    <option value="fixed_group">Fixed Group Rate</option>
                    <option value="visa_only">Consular / Visa Fee Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Service Type *
                  </label>
                  <select
                    value={editingPackage?.serviceType || 'tour'}
                    onChange={(e) => setEditingPackage({ ...editingPackage, serviceType: e.target.value })}
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  >
                    <option value="tour">Holiday Tour Package</option>
                    <option value="visa">Consular Visa Filing Only</option>
                  </select>
                </div>
              </div>

              {/* Category Classification Architecture */}
              <div className="p-4 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D]">
                    Eligible Category Sections (Multi-Section Classification) *
                  </label>
                  <span className="text-[11px] text-[#586775]">
                    Select which homepage carousels this package belongs to.
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = (editingPackage?.allowedCategories || []).includes(cat.value);
                    return (
                      <label
                        key={cat.value}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-white border-[#087E83] text-[#10263D] font-semibold shadow-xs'
                            : 'bg-white border-[#E1E7EB] text-[#586775] hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCategorySelection(cat.value)}
                          className="rounded text-[#087E83] focus:ring-[#087E83]"
                        />
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Primary Category & Flags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E1E7EB]">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                      Primary Canonical Category
                    </label>
                    <select
                      value={editingPackage?.category || 'solo'}
                      onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                      className="w-full text-xs bg-white border border-[#E1E7EB] rounded px-3 py-1.5 text-[#10263D]"
                    >
                      {ALL_CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="isFeaturedToggle"
                      checked={editingPackage?.isFeatured || false}
                      onChange={(e) =>
                        setEditingPackage({ ...editingPackage, isFeatured: e.target.checked })
                      }
                      className="rounded text-[#087E83] focus:ring-[#087E83]"
                    />
                    <label htmlFor="isFeaturedToggle" className="text-xs font-semibold text-[#10263D] cursor-pointer">
                      Feature on Top Slider
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="isActiveToggle"
                      checked={editingPackage?.isActive !== false}
                      onChange={(e) =>
                        setEditingPackage({ ...editingPackage, isActive: e.target.checked })
                      }
                      className="rounded text-[#087E83] focus:ring-[#087E83]"
                    />
                    <label htmlFor="isActiveToggle" className="text-xs font-semibold text-[#10263D] cursor-pointer">
                      Published & Publicly Visible
                    </label>
                  </div>

                  {/* Phase 3: Customized Package Category Priority */}
                  <div className="flex items-center gap-2 pt-2 col-span-1 sm:col-span-2">
                    <input
                      type="checkbox"
                      id="isCustomizedToggle"
                      checked={editingPackage?.isCustomized || false}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          isCustomized: e.target.checked,
                          packageType: e.target.checked ? 'customized' : 'standard',
                        })
                      }
                      className="rounded text-[#087E83] focus:ring-[#087E83]"
                    />
                    <label htmlFor="isCustomizedToggle" className="text-xs font-semibold text-[#10263D] cursor-pointer">
                      Customized Package Priority (Appear First in its Category Slider)
                    </label>
                  </div>

                  {/* Display Order */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                      Display Order (Ascending)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={editingPackage?.displayOrder ?? 10}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          displayOrder: parseInt(e.target.value, 10) || 10,
                        })
                      }
                      className="w-full text-xs bg-white border border-[#E1E7EB] rounded px-3 py-1.5 text-[#10263D]"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={editingPackage?.subtitle || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, subtitle: e.target.value })}
                    placeholder="e.g. City Lights, Beaches, Fun, Island Vibes & Nature"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Primary Image Path *
                  </label>
                  <input
                    type="text"
                    value={editingPackage?.primaryImage || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, primaryImage: e.target.value })}
                    required
                    placeholder="/images/packages/thailand-bangkok-pattaya-phuket.jpeg"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] font-mono focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Inclusions (One item per line)
                  </label>
                  <textarea
                    rows={4}
                    value={editingPackage?.inclusionsText || ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, inclusionsText: e.target.value })
                    }
                    placeholder="Return Air Ticket&#10;Hotel Stay (Twin Sharing)&#10;Daily Breakfast"
                    className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Exclusions (One item per line)
                  </label>
                  <textarea
                    rows={4}
                    value={editingPackage?.exclusionsText || ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, exclusionsText: e.target.value })
                    }
                    placeholder="Consular Visa Fees&#10;Personal Expenses&#10;Lunch & Dinner"
                    className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              {/* Highlights & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Tour Highlights (One item per line)
                  </label>
                  <textarea
                    rows={3}
                    value={editingPackage?.highlightsText || ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, highlightsText: e.target.value })
                    }
                    placeholder="Coral Island Speedboat Tour with Lunch&#10;Phuket City Tour&#10;Chao Phraya River Cruise"
                    className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Important Notes & Visa Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={editingPackage?.importantNotes || ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, importantNotes: e.target.value })
                    }
                    placeholder="Passport must be valid for at least 6 months. Flight rates are subject to airline availability."
                    className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E1E7EB]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPackage(null);
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
                  {isSubmitting
                    ? 'Saving Changes...'
                    : isCreating
                    ? 'Create Package Record'
                    : 'Save Package Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
