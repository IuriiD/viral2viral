import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  downloadUrl?: string;
  className?: string;
}

/**
 * VideoPlayer component with playback controls and download button
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  downloadUrl,
  className = '',
}) => {
  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="bg-black rounded-lg overflow-hidden shadow-lg">
        <video
          src={videoUrl}
          controls
          className="w-full h-auto"
          playsInline
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

        {downloadUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </button>
        )}
      </div>
    </div>
  );
};
