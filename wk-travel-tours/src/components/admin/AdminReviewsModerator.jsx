'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconCheck,
  IconClose,
  IconStar,
  IconPlus,
  IconTrash,
  IconShieldCheck,
} from '@/components/ui/Icons';

export function AdminReviewsModerator() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [toastMessage, setToastMessage] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const [newReview, setNewReview] = useState({
    customerName: '',
    rating: 5,
    comment: '',
    tripReference: '',
    status: 'approved',
  });

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews?status=all', { credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setReviews(json.data);
          return;
        }
      }
      // Fallback
      setReviews([
        {
          id: 'rev-1',
          customer_name: 'Muhammad Tariq',
          rating: 5,
          comment: 'Booked the Thailand Bangkok & Pattaya tour for our family. All hotel vouchers and airport pickups were right on time.',
          trip_reference: 'Explore Thailand Multi-City Tour',
          status: 'approved',
          created_at: '2026-09-15T10:00:00Z',
        },
        {
          id: 'rev-2',
          customer_name: 'Dr. Farhan Qureshi',
          rating: 5,
          comment: 'Processed our Malaysia and Singapore tourist visas through their Defence Karachi office. Clear document checklist and zero surprises.',
          trip_reference: '4-in-1 Visit Visa Filing',
          status: 'pending',
          created_at: '2026-09-28T14:30:00Z',
        },
        {
          id: 'rev-3',
          customer_name: 'Zainab & Bilal',
          rating: 5,
          comment: 'Our honeymoon trip to Baku was expertly coordinated. The private transfers and Nizami Street hotel selection were top-tier.',
          trip_reference: 'Baku Azerbaijan Couple Tour',
          status: 'approved',
          created_at: '2026-10-04T12:00:00Z',
        },
      ]);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        showToast(
          `Review marked as ${newStatus === 'approved' ? 'Approved & Visible Publicly' : newStatus}.`
        );
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to update review status', 'error');
      }
    } catch {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      showToast(`Review status updated locally to ${newStatus}.`, 'success');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id } = deleteConfirmation;

    try {
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        showToast('Review permanently deleted.');
      } else {
        const json = await res.json();
        showToast(json.error || 'Failed to delete review', 'error');
      }
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Review deleted locally.', 'success');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        customerName: newReview.customerName.trim(),
        rating: parseInt(newReview.rating, 10) || 5,
        comment: newReview.comment.trim(),
        tripReference: newReview.tripReference?.trim() || null,
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.data || {
          ...payload,
          id: 'rev-' + Date.now(),
          status: 'approved',
          created_at: new Date().toISOString(),
        };

        // If newly created through admin, ensure it is approved
        if (newReview.status === 'approved' && created.id) {
          await fetch('/api/reviews', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ id: created.id, status: 'approved' }),
          });
          created.status = 'approved';
        }

        setReviews((prev) => [created, ...prev]);
        showToast('Verified customer review added successfully.');
        setIsAdding(false);
        setNewReview({
          customerName: '',
          rating: 5,
          comment: '',
          tripReference: '',
          status: 'approved',
        });
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to submit review', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while adding review.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = reviews.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E1E7EB] pb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#10263D]">
            Customer Reviews Moderation Desk
          </h2>
          <p className="text-xs sm:text-sm text-[#586775] mt-0.5">
            Strictly verify genuine traveler feedback before publishing to the live website.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAdding(true)}
        >
          <IconPlus className="w-4 h-4 mr-1.5" />
          Add Verified Review
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((filter) => {
          const count = reviews.filter((r) => (filter === 'all' ? true : r.status === filter)).length;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded text-xs uppercase tracking-wider font-semibold transition-colors ${
                activeFilter === filter
                  ? 'bg-[#10263D] text-white shadow-xs'
                  : 'bg-white text-[#586775] border border-[#E1E7EB] hover:bg-[#F3F6F8]'
              }`}
            >
              {filter} ({count})
            </button>
          );
        })}
      </div>

      {/* Reviews Cards List */}
      {loading ? (
        <div className="py-12 text-center text-[#586775]">
          <div className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#087E83] border-t-transparent rounded-full animate-spin" />
            <span>Loading customer reviews...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 border border-[#E1E7EB] bg-white rounded-xl text-center text-[#586775]">
          No reviews found in this moderation category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((rev) => (
            <div
              key={rev.id}
              className="border border-[#E1E7EB] bg-white rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#10263D]">
                      {rev.customer_name || rev.customerName}
                    </h3>
                    <span className="text-[11px] text-[#087E83] font-medium block">
                      {rev.trip_reference || rev.tripReference || 'International Tour'}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      rev.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : rev.status === 'rejected'
                        ? 'bg-red-50 text-red-800 border border-red-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <IconStar
                      key={i}
                      filled={i < (rev.rating || 5)}
                      className="w-3.5 h-3.5 fill-current"
                    />
                  ))}
                  <span className="text-[10px] text-[#586775] ml-1.5 font-bold">
                    {rev.rating || 5}.0 / 5
                  </span>
                </div>

                {/* Comment Quote */}
                <p className="text-xs text-[#586775] leading-relaxed italic bg-[#F3F6F8] p-3 rounded-lg border border-[#E1E7EB]">
                  "{rev.comment}"
                </p>

                {rev.created_at && (
                  <div className="text-[10px] text-[#586775]">
                    Submitted: {new Date(rev.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E1E7EB] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {rev.status !== 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(rev.id, 'approved')}
                      className="h-7 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                    >
                      <IconCheck className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                  )}

                  {rev.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                      className="h-7 px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      Reject
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmation({ id: rev.id, name: rev.customer_name || rev.customerName })}
                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                  title="Permanently Delete Review"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </Button>
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
              Delete Customer Review
            </h3>
            <p className="text-xs text-[#586775] leading-relaxed">
              Are you sure you want to permanently delete the review from <strong className="text-[#10263D]">"{deleteConfirmation.name}"</strong>?
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
                Delete Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      {isAdding && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E7EB] pb-3">
              <h3 className="font-heading text-lg font-bold text-[#10263D]">
                Add Verified Customer Review
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[#586775] hover:text-[#10263D]"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Customer / Traveler Name *
                </label>
                <input
                  type="text"
                  value={newReview.customerName}
                  onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                  required
                  placeholder="e.g. Muhammad Salman"
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Trip Reference / Package *
                  </label>
                  <input
                    type="text"
                    value={newReview.tripReference}
                    onChange={(e) => setNewReview({ ...newReview, tripReference: e.target.value })}
                    required
                    placeholder="e.g. Thailand (Bangkok, Pattaya, Phuket)"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Rating (1 to 5 Stars) *
                  </label>
                  <select
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value, 10) })}
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  >
                    <option value={5}>5 Stars - Exceptional Service</option>
                    <option value={4}>4 Stars - Great Experience</option>
                    <option value={3}>3 Stars - Satisfactory</option>
                    <option value={2}>2 Stars - Needs Improvement</option>
                    <option value={1}>1 Star - Dissatisfied</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                  Review Statement / Honest Feedback *
                </label>
                <textarea
                  rows={4}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  required
                  placeholder="Genuine feedback provided by the client regarding logistics, hotel quality, and customer support..."
                  className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E1E7EB]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Add Verified Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
