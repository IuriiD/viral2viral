/**
 * Session Types
 *
 * Defines session state structure and status enum for workflow tracking.
 */

import { OriginalVideo } from './video.types';
import { VideoAnalysis } from './analysis.types';
import { ProductInformation } from './product.types';
import { GenerationPrompt } from './prompt.types';
import { GeneratedVideo } from './generation.types';

/**
 * Session status enum representing workflow progression
 */
export enum SessionStatus {
  CREATED = 'created',
  VIDEO_UPLOADED = 'video_uploaded',
  ANALYZING = 'analyzing',
  ANALYSIS_COMPLETE = 'analysis_complete',
  PRODUCT_INFO_ADDED = 'product_info_added',
  PROMPT_GENERATED = 'prompt_generated',
  GENERATING_VIDEO = 'generating_video',
  VIDEO_COMPLETE = 'video_complete',
  ERROR = 'error',
}

/**
 * Session represents a complete workflow instance
 * Stored in-memory on the backend
 */
export interface Session {
  /** Unique identifier (UUID) */
  sessionId: string;

  /** Session creation timestamp */
  createdAt: Date;

  /** Last interaction timestamp (for cleanup) */
  lastActivityAt: Date;

  /** Overall workflow status */
  status: SessionStatus;

  /** Uploaded source video (optional until uploaded) */
  originalVideo?: OriginalVideo;

  /** AI analysis results (optional until analyzed) */
  videoAnalysis?: VideoAnalysis;

  /** User's product details (optional until submitted) */
  productInformation?: ProductInformation;

  /** Text-to-video prompt (optional until generated) */
  generationPrompt?: GenerationPrompt;

  /** Final output video (optional until generated) */
  generatedVideo?: GeneratedVideo;
}
