/**
 * Generation Types
 *
 * Defines generated video structures and processing status.
 */

/**
 * Video generation status
 */
export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

/**
 * Generation error details
 */
export interface GenerationError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error timestamp */
  timestamp: Date;

  /** Whether user can retry */
  retryable: boolean;
}

/**
 * GeneratedVideo represents the newly created advertisement video
 */
export interface GeneratedVideo {
  /** Unique identifier (UUID) */
  generatedVideoId: string;

  /** S3 object key for generated video */
  s3Key: string;

  /** S3 bucket name */
  s3Bucket: string;

  /** Generated filename */
  fileName: string;

  /** File size in bytes (unknown until complete, optional) */
  fileSize?: number;

  /** MIME type (typically video/mp4) */
  mimeType: string;

  /** Processing status */
  status: GenerationStatus;

  /** When generation was started */
  initiatedAt: Date;

  /** When generation finished (optional) */
  completedAt?: Date;

  /** Estimated completion (if available, optional) */
  estimatedCompletionTime?: Date;

  /** Presigned download URL (temporary, generated on request, optional) */
  downloadUrl?: string;

  /** Error details if generation failed (optional) */
  error?: GenerationError;
}
