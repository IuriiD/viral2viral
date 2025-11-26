/**
 * Frontend TypeScript Interfaces
 *
 * Type definitions matching backend API structures.
 */

// Session types
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

export interface Session {
  sessionId: string;
  createdAt: string;
  lastActivityAt: string;
  status: SessionStatus;
  originalVideo?: OriginalVideo;
  videoAnalysis?: VideoAnalysis;
  productInformation?: ProductInformation;
  generationPrompt?: GenerationPrompt;
  generatedVideo?: GeneratedVideo;
}

// Video types
export interface OriginalVideo {
  s3Key: string;
  s3Bucket: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  duration?: number;
  thumbnailS3Key?: string;
  downloadUrl?: string;
}

// Analysis types
export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export interface VideoAnalysis {
  analysisId: string;
  analyzedAt: string;
  status: AnalysisStatus;
  sceneBreakdown: string;
  userEdits?: string;
  error?: {
    code: string;
    message: string;
    timestamp: string;
  };
}

// Product types
export interface ProductInformation {
  productName: string;
  productDescription: string;
  productImageS3Key?: string;
  productImageMimeType?: string;
  addedAt: string;
  downloadUrl?: string;
}

// Prompt types
export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FLAGGED = 'flagged',
  BYPASSED = 'bypassed',
}

export interface GenerationPrompt {
  promptId: string;
  generatedText: string;
  userEditedText?: string;
  finalText: string;
  characterCount: number;
  generatedAt: string;
  approvedAt?: string;
  moderationStatus: ModerationStatus;
  moderationFlags?: string[];
}

// Generation types
export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export interface GeneratedVideo {
  generatedVideoId: string;
  s3Key: string;
  s3Bucket: string;
  fileName: string;
  fileSize?: number;
  mimeType: string;
  status: GenerationStatus;
  initiatedAt: string;
  completedAt?: string;
  estimatedCompletionTime?: string;
  downloadUrl?: string;
  error?: {
    code: string;
    message: string;
    timestamp: string;
    retryable: boolean;
  };
}

// API Request/Response types
export interface UploadVideoRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadVideoResponse {
  uploadUrl: string;
  uploadFields: Record<string, string>;
  s3Key: string;
}

export interface UploadProductImageRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface SubmitProductInfoRequest {
  productName: string;
  productDescription: string;
}

export interface UpdateAnalysisRequest {
  editedText: string;
}

export interface UpdatePromptRequest {
  editedText: string;
}
