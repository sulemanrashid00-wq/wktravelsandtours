'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { resolveImageUrl, isVideoMedia, validateMediaFile, formatFileSize } from '@/lib/utils/media';
import { IconCheck, IconClose, IconTrash, IconEdit } from '@/components/ui/Icons';

/**
 * Robust, Touch-friendly Media Upload Component
 * Supports desktop drag-and-drop & native mobile gallery/camera file picker.
 * Direct Supabase Storage uploads via /api/media/upload.
 */
export function ImageUploadInput({
  value = '',
  onChange,
  onUploadStateChange,
  bucket = 'packages',
  prefix = 'media',
  label = 'Media Asset',
  helperText = 'Select JPEG, JPG, PNG, or WebP (max 10MB).',
  aspectRatio = 'aspect-[4/5]',
  fit = 'contain',
  allowVideo = false,
  fallbackType = 'package',
}) {
  const [previewUrl, setPreviewUrl] = useState(value);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentFileMeta, setCurrentFileMeta] = useState(null);

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  const notifyUploadState = (uploading) => {
    setIsUploading(uploading);
    if (typeof onUploadStateChange === 'function') {
      onUploadStateChange(uploading);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    setErrorMessage('');

    // 1. Client-side validation
    const validation = validateMediaFile(file, { allowVideo });
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    // 2. Set temporary local object URL for instant user preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setCurrentFileMeta({ name: file.name, size: file.size, type: file.type });

    // 3. Initiate actual upload to Supabase Storage via Next.js API
    notifyUploadState(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('prefix', prefix);
    if (allowVideo) {
      formData.append('isVideo', 'true');
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(Math.round((event.loaded / event.total) * 100), 95);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      notifyUploadState(false);
      setUploadProgress(100);

      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          const uploadedUrl = response.url;
          setPreviewUrl(uploadedUrl);
          if (typeof onChange === 'function') {
            onChange(uploadedUrl);
          }
        } else {
          setErrorMessage(response.error || 'Upload failed. Please try again.');
          // Revert to original value
          setPreviewUrl(value);
        }
      } catch (err) {
        setErrorMessage('Failed to parse upload server response.');
        setPreviewUrl(value);
      }
    };

    xhr.onerror = () => {
      notifyUploadState(false);
      setErrorMessage('Network error while uploading image. Please check your connection.');
      setPreviewUrl(value);
    };

    xhr.onabort = () => {
      notifyUploadState(false);
      setErrorMessage('Upload cancelled.');
      setPreviewUrl(value);
    };

    xhr.open('POST', '/api/media/upload');
    xhr.send(formData);
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewUrl('');
    setCurrentFileMeta(null);
    setErrorMessage('');
    if (typeof onChange === 'function') {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const isVideo = isVideoMedia(previewUrl);
  const resolvedDisplayUrl = resolveImageUrl(previewUrl, fallbackType);

  return (
    <div className="space-y-2 text-xs">
      {/* Label & Actions */}
      <div className="flex items-center justify-between">
        <label className="block font-semibold uppercase tracking-wider text-[#10263D]">
          {label} *
        </label>
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-[11px] text-[#087E83] hover:underline font-medium"
        >
          {showManualInput ? 'Hide Path Editor' : 'Edit Path Manually'}
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-900 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-red-700 hover:text-red-900 ml-2"
          >
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Upload Dropzone / Touch Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-[#087E83] bg-teal-50/50'
            : isUploading
            ? 'border-teal-400 bg-gray-50 cursor-wait'
            : 'border-[#E1E7EB] bg-white hover:border-[#087E83] hover:bg-[#F3F6F8]/50'
        }`}
      >
        {/* Hidden Native File Input with camera & gallery capture for mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowVideo ? 'image/*,video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/jpg'}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {previewUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
            {/* Visual Thumbnail */}
            <div
              className={`relative ${aspectRatio} w-24 sm:w-28 bg-[#10263D] rounded-lg overflow-hidden flex-shrink-0 border border-[#E1E7EB] shadow-xs`}
            >
              {isVideo ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-2 text-center">
                  <span className="text-xl mb-1">▶</span>
                  <span className="text-[10px] uppercase font-bold text-teal-400">Video Media</span>
                </div>
              ) : (
                <Image
                  src={resolvedDisplayUrl}
                  alt="Media preview"
                  fill
                  className={fit === 'contain' ? 'object-contain' : 'object-cover'}
                  sizes="120px"
                  unoptimized={resolvedDisplayUrl.startsWith('http')}
                />
              )}
            </div>

            {/* Media Information and Action Controls */}
            <div className="flex-1 space-y-1.5 w-full">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <IconCheck className="w-3 h-3 text-emerald-600" />
                  Media Ready
                </span>
                {currentFileMeta && (
                  <span className="text-[11px] text-[#586775]">
                    {formatFileSize(currentFileMeta.size)}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#10263D] font-mono break-all line-clamp-2">
                {previewUrl}
              </p>

              {isUploading ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-[#087E83] font-semibold">
                    <span>Uploading to Cloud Storage...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#087E83] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelUpload();
                    }}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Cancel upload
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#087E83] hover:bg-[#066569] text-white rounded font-medium text-xs shadow-xs min-h-[36px]"
                  >
                    <IconEdit className="w-3.5 h-3.5" />
                    <span>Replace Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemove}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium text-xs min-h-[36px]"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#087E83]/10 flex items-center justify-center text-[#087E83]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div>
              <span className="font-semibold text-xs sm:text-sm text-[#10263D] block">
                Tap to select photo from phone or desktop
              </span>
              <span className="text-[11px] text-[#586775] block mt-0.5">
                {helperText}
              </span>
            </div>

            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#087E83] hover:bg-[#066569] text-white font-semibold rounded-lg text-xs shadow-sm min-h-[44px]"
            >
              Choose Image File
            </button>
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      {showManualInput && (
        <div className="pt-1 space-y-1">
          <label className="block text-[11px] text-[#586775]">
            Direct Image Path or Public URL:
          </label>
          <input
            type="text"
            value={previewUrl}
            onChange={(e) => {
              setPreviewUrl(e.target.value);
              if (typeof onChange === 'function') {
                onChange(e.target.value);
              }
            }}
            placeholder="e.g. /images/packages/asia-grand-tour-4-countries.jpeg"
            className="w-full text-xs font-mono bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
          />
        </div>
      )}
    </div>
  );
}

