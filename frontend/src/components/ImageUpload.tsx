import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onUpload: () => void;
  uploadProgress?: number;
  previewUrl?: string | null;
  error?: string;
  disabled?: boolean;
}

/**
 * ImageUpload component for product image upload with preview
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onUpload,
  uploadProgress,
  previewUrl,
  error,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PNG, JPEG, or WebP image file.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Image file must be smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
    onImageSelect(file);
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      onUpload();
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
        {previewUrl ? (
          <div className="space-y-4 w-full">
            <img
              src={previewUrl}
              alt="Product preview"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-md object-contain"
            />
            <p className="text-sm text-gray-600 text-center">
              {selectedFile?.name}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600">
              Upload a product image (PNG, JPEG, or WebP)
            </p>
            <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleBrowseClick}
            disabled={disabled}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {previewUrl ? 'Change Image' : 'Browse'}
          </button>

          {selectedFile && !uploadProgress && (
            <button
              onClick={handleUploadClick}
              disabled={disabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Upload Image
            </button>
          )}
        </div>
      </div>

      {uploadProgress !== undefined &&
        uploadProgress > 0 &&
        uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};
