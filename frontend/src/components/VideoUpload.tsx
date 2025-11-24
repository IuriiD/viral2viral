import { useState, ChangeEvent } from 'react';

interface VideoUploadProps {
  onUploadStart: (file: File) => void;
  onUploadError: (error: string) => void;
  isUploading: boolean;
  isInitializing: boolean;
}

/**
 * VideoUpload Component
 *
 * Handles video file selection and upload progress display
 */
export function VideoUpload({
  onUploadStart,
  onUploadError,
  isUploading,
  isInitializing,
}: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError(
        'Invalid video format. Please upload MP4, MOV, or AVI files.'
      );
      return;
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      onUploadError('Video file exceeds maximum size of 100MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setProgress(0);
    onUploadStart(selectedFile);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Video</h2>
      <p className="text-gray-600 mb-4">
        Upload your UGC advertisement video to analyze and recreate
      </p>

      <div className="mb-4">
        <label
          htmlFor="video-upload"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Video File
        </label>
        <input
          id="video-upload"
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo"
          onChange={handleFileChange}
          disabled={isUploading || isInitializing}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: MP4, MOV, AVI • Max size: 100MB
        </p>
      </div>

      {selectedFile && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Selected:</span> {selectedFile.name}
          </p>
          <p className="text-xs text-gray-500">
            Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      )}

      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading || isInitializing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isInitializing
          ? 'Initializing...'
          : isUploading
            ? 'Uploading...'
            : 'Upload Video'}
      </button>
    </div>
  );
}
