/**
 * Video Types
 *
 * Defines original video metadata and storage information.
 */

/**
 * OriginalVideo represents the uploaded UGC advertisement video stored in AWS S3
 */
export interface OriginalVideo {
  /** S3 object key (e.g., "sessions/{sessionId}/original.mp4") */
  s3Key: string;

  /** S3 bucket name */
  s3Bucket: string;

  /** Original filename from user upload */
  fileName: string;

  /** File size in bytes (max 100MB = 104857600 bytes) */
  fileSize: number;

  /** MIME type (video/mp4, video/quicktime, video/x-msvideo) */
  mimeType: string;

  /** Upload timestamp */
  uploadedAt: Date;

  /** Video duration in seconds (optional, extracted if possible) */
  duration?: number;

  /** S3 key for generated thumbnail (optional) */
  thumbnailS3Key?: string;

  /** Presigned download URL (temporary, generated on request) */
  downloadUrl?: string;
}
