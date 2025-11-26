# Data Model: UGC Video Generator

**Feature**: `001-ugc-video-generator`  
**Date**: 2025-11-24  
**Status**: Complete

This document defines the data structures and entities for the UGC video generator application. Since this is a stateless POC without a database, these models represent in-memory session state and API request/response structures.

---

## Entity Definitions

### 1. Session

Represents a complete workflow instance. Stored in-memory on the backend.

**Purpose**: Track the state and data for a single user's workflow from video upload to final generation.

**TypeScript Interface**:
```typescript
interface Session {
  sessionId: string;                    // Unique identifier (UUID)
  createdAt: Date;                      // Session creation timestamp
  lastActivityAt: Date;                 // Last interaction timestamp (for cleanup)
  status: SessionStatus;                // Overall workflow status
  originalVideo?: OriginalVideo;        // Uploaded source video
  videoAnalysis?: VideoAnalysis;        // AI analysis results
  productInformation?: ProductInformation; // User's product details
  generationPrompt?: GenerationPrompt;  // Text-to-video prompt
  generatedVideo?: GeneratedVideo;      // Final output video
}

enum SessionStatus {
  CREATED = 'created',
  VIDEO_UPLOADED = 'video_uploaded',
  ANALYZING = 'analyzing',
  ANALYSIS_COMPLETE = 'analysis_complete',
  PRODUCT_INFO_ADDED = 'product_info_added',
  PROMPT_GENERATED = 'prompt_generated',
  GENERATING_VIDEO = 'generating_video',
  VIDEO_COMPLETE = 'video_complete',
  ERROR = 'error'
}
```

**Validation Rules**:
- `sessionId` must be a valid UUID v4
- `status` must progress forward (no backwards transitions except to ERROR)
- `lastActivityAt` updated on every state change

---

### 2. OriginalVideo

Represents the uploaded UGC advertisement video stored in AWS S3.

**Purpose**: Store metadata and references for the user's uploaded source video.

**TypeScript Interface**:
```typescript
interface OriginalVideo {
  s3Key: string;              // S3 object key (e.g., "sessions/{sessionId}/original.mp4")
  s3Bucket: string;           // S3 bucket name
  fileName: string;           // Original filename from user upload
  fileSize: number;           // File size in bytes (max 100MB = 104857600 bytes)
  mimeType: string;           // MIME type (video/mp4, video/mov, video/x-msvideo)
  uploadedAt: Date;           // Upload timestamp
  duration?: number;          // Video duration in seconds (optional, extracted if possible)
  thumbnailS3Key?: string;    // S3 key for generated thumbnail (optional)
  downloadUrl?: string;       // Presigned download URL (temporary, generated on request)
}
```

**Validation Rules**:
- `fileSize` must be ≤ 104,857,600 bytes (100MB)
- `mimeType` must be one of: `video/mp4`, `video/quicktime`, `video/x-msvideo`
- `fileName` must not contain path traversal characters (/, \)
- `s3Key` must follow pattern: `sessions/{uuid}/original.{ext}`

**Relationships**:
- One-to-one with Session
- Referenced by VideoAnalysis for analysis processing

---

### 3. VideoAnalysis

Represents AI-generated insights from the original video using Google Gemini.

**Purpose**: Store structured analysis results that will be used to generate video prompts.

**TypeScript Interface**:
```typescript
interface VideoAnalysis {
  analysisId: string;                // Unique identifier (UUID)
  analyzedAt: Date;                  // Analysis timestamp
  status: AnalysisStatus;            // Processing status
  sceneBreakdown: string;            // Raw scene-by-scene breakdown (can be edited by user)
  structuredData?: AnalysisStructuredData; // Parsed structured insights
  userEdits?: string;                // User's edited version of scene breakdown
  error?: AnalysisError;             // Error details if analysis failed
}

enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

interface AnalysisStructuredData {
  scenes: Scene[];
  overallAesthetic?: string;
  dominantColors?: string[];
  pacing?: string;
  audioStyle?: string;
}

interface Scene {
  timestamp: string;           // Original timestamp (e.g., "0:00-0:02")
  duration: number;            // Duration in seconds
  purpose: ScenePurpose;       // Hook, Problem, Solution, CTA
  visualDetails: {
    cameraAngle?: string;
    movement?: string;
    lighting?: string;
    colorPalette?: string;
    onScreenElements?: string;
  };
  cinematicDetails: {
    shotType?: string;
    pacing?: string;
    style?: string;
  };
  audioDetails: {
    dialogue?: string;
    soundDesign?: string;
    timing?: string;
  };
}

enum ScenePurpose {
  HOOK = 'hook',
  PROBLEM = 'problem',
  SOLUTION = 'solution',
  CTA = 'cta'
}

interface AnalysisError {
  code: string;
  message: string;
  timestamp: Date;
}
```

**Validation Rules**:
- `sceneBreakdown` max length: 10,000 characters
- `userEdits` max length: 10,000 characters
- `status` must transition: PENDING → PROCESSING → (COMPLETE | FAILED)

**Relationships**:
- One-to-one with Session
- Input for GenerationPrompt creation

---

### 4. ProductInformation

Represents user's product details for the new advertisement.

**Purpose**: Store product name and description that will be incorporated into the generated video prompt.

**TypeScript Interface**:
```typescript
interface ProductInformation {
  productName: string;           // Product name (3-100 characters)
  productDescription: string;    // Product description (max 250 characters)
  productImageS3Key?: string;    // S3 key for uploaded product image
  productImageMimeType?: string; // MIME type of product image
  addedAt: Date;                 // Timestamp when product info was added
  downloadUrl?: string;          // Presigned download URL for image (temporary)
}
```

**Validation Rules**:
- `productName` length: 3-100 characters, required
- `productName` must not be empty or only whitespace
- `productDescription` length: 1-250 characters, required
- `productDescription` must not be empty or only whitespace
- `productImageMimeType` must be one of: `image/png`, `image/jpeg`, `image/webp` (if image provided)
- Product image file size max: 10,485,760 bytes (10MB)

**Relationships**:
- One-to-one with Session
- Input for GenerationPrompt creation

---

### 5. GenerationPrompt

Represents the text-to-video prompt for creating the new advertisement.

**Purpose**: Store the AI-generated and user-edited prompt that will be sent to Sora 2 for video generation.

**TypeScript Interface**:
```typescript
interface GenerationPrompt {
  promptId: string;              // Unique identifier (UUID)
  generatedText: string;         // AI-generated prompt text
  userEditedText?: string;       // User's edited version (if modified)
  finalText: string;             // Final approved text (generated or edited)
  characterCount: number;        // Character count of final text
  generatedAt: Date;             // Timestamp when generated by AI
  approvedAt?: Date;             // Timestamp when approved by user
  moderationStatus: ModerationStatus; // Content moderation result
  moderationFlags?: string[];    // Flagged content categories (if any)
}

enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FLAGGED = 'flagged',
  BYPASSED = 'bypassed'  // User explicitly approved despite flags
}
```

**Validation Rules**:
- `finalText` max length: 500 characters
- `finalText` must not be empty
- `approvedAt` must be set before video generation can proceed
- If `moderationStatus` is FLAGGED, user must acknowledge before proceeding

**Relationships**:
- One-to-one with Session
- Input for GeneratedVideo creation

---

### 6. GeneratedVideo

Represents the newly created advertisement video stored in AWS S3.

**Purpose**: Track the video generation process and store the final output.

**TypeScript Interface**:
```typescript
interface GeneratedVideo {
  generatedVideoId: string;      // Unique identifier (UUID)
  s3Key: string;                 // S3 object key for generated video
  s3Bucket: string;              // S3 bucket name
  fileName: string;              // Generated filename
  fileSize?: number;             // File size in bytes (unknown until complete)
  mimeType: string;              // MIME type (typically video/mp4)
  status: GenerationStatus;      // Processing status
  initiatedAt: Date;             // When generation was started
  completedAt?: Date;            // When generation finished
  estimatedCompletionTime?: Date; // Estimated completion (if available)
  downloadUrl?: string;          // Presigned download URL (temporary, generated on request)
  error?: GenerationError;       // Error details if generation failed
}

enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

interface GenerationError {
  code: string;
  message: string;
  timestamp: Date;
  retryable: boolean;            // Whether user can retry
}
```

**Validation Rules**:
- `status` must transition: PENDING → PROCESSING → (COMPLETE | FAILED)
- `completedAt` must be after `initiatedAt`
- `downloadUrl` only available when status is COMPLETE

**Relationships**:
- One-to-one with Session
- Final output of the workflow

---

## API Request/Response DTOs

### Upload Video Request

```typescript
interface UploadVideoRequestDto {
  sessionId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface UploadVideoResponseDto {
  success: boolean;
  data: {
    uploadUrl: string;           // Presigned POST URL
    uploadFields: Record<string, string>; // Form fields for POST
    s3Key: string;               // S3 key where file will be stored
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Trigger Analysis Request

```typescript
interface TriggerAnalysisRequestDto {
  sessionId: string;
}

interface TriggerAnalysisResponseDto {
  success: boolean;
  data: {
    analysisId: string;
    status: AnalysisStatus;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Get Analysis Result Request

```typescript
interface GetAnalysisRequestDto {
  sessionId: string;
}

interface GetAnalysisResponseDto {
  success: boolean;
  data: VideoAnalysis;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Update Analysis Request

```typescript
interface UpdateAnalysisRequestDto {
  sessionId: string;
  editedText: string;
}

interface UpdateAnalysisResponseDto {
  success: boolean;
  data: VideoAnalysis;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Submit Product Info Request

```typescript
interface SubmitProductInfoRequestDto {
  sessionId: string;
  productName: string;
  productDescription: string;
}

interface SubmitProductInfoResponseDto {
  success: boolean;
  data: ProductInformation;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Upload Product Image Request

```typescript
interface UploadProductImageRequestDto {
  sessionId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface UploadProductImageResponseDto {
  success: boolean;
  data: {
    uploadUrl: string;
    uploadFields: Record<string, string>;
    s3Key: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Generate Prompt Request

```typescript
interface GeneratePromptRequestDto {
  sessionId: string;
}

interface GeneratePromptResponseDto {
  success: boolean;
  data: GenerationPrompt;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Update Prompt Request

```typescript
interface UpdatePromptRequestDto {
  sessionId: string;
  editedText: string;
}

interface UpdatePromptResponseDto {
  success: boolean;
  data: GenerationPrompt;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Approve Prompt Request

```typescript
interface ApprovePromptRequestDto {
  sessionId: string;
}

interface ApprovePromptResponseDto {
  success: boolean;
  data: GenerationPrompt;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Generate Video Request

```typescript
interface GenerateVideoRequestDto {
  sessionId: string;
}

interface GenerateVideoResponseDto {
  success: boolean;
  data: GeneratedVideo;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Get Video Status Request

```typescript
interface GetVideoStatusRequestDto {
  sessionId: string;
}

interface GetVideoStatusResponseDto {
  success: boolean;
  data: GeneratedVideo;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Get Session Request

```typescript
interface GetSessionRequestDto {
  sessionId: string;
}

interface GetSessionResponseDto {
  success: boolean;
  data: Session;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

---

## State Transitions

Valid workflow state transitions:

```
CREATED 
  → VIDEO_UPLOADED (after video upload completes)
  → ANALYZING (when analysis is triggered)
  → ANALYSIS_COMPLETE (when Gemini returns results)
  → PRODUCT_INFO_ADDED (when product info submitted)
  → PROMPT_GENERATED (when GPT-5 generates prompt)
  → GENERATING_VIDEO (when Sora 2 generation starts)
  → VIDEO_COMPLETE (when video is ready)

ERROR (from any state if an error occurs)
```

---

## Data Persistence Notes

**In-Memory Storage** (POC):
- All session data stored in a `Map<sessionId, Session>` on backend
- No persistence across server restarts
- Session TTL: 24 hours (cleanup after inactivity)
- S3 files remain stored but orphaned after session expires

**Future Database Schema** (out of scope for POC):
- Sessions table with all session data
- Videos table for both original and generated videos
- Analysis table for video analysis results
- Prompts table for generation prompts
- Foreign key relationships mirror entity relationships above

---

## Validation Summary

| Field | Validation Rule | Error Code |
|-------|----------------|------------|
| Video file size | ≤ 100MB | VIDEO_TOO_LARGE |
| Video MIME type | video/mp4, video/quicktime, video/x-msvideo | INVALID_VIDEO_FORMAT |
| Product name | 3-100 chars | PRODUCT_NAME_INVALID |
| Product description | 1-250 chars | PRODUCT_DESCRIPTION_INVALID |
| Product image size | ≤ 10MB | IMAGE_TOO_LARGE |
| Product image type | image/png, image/jpeg, image/webp | INVALID_IMAGE_FORMAT |
| Prompt text | 1-500 chars | PROMPT_TOO_LONG |
| Session ID | Valid UUID v4 | INVALID_SESSION_ID |

---

This data model provides a complete foundation for implementing the backend services and API endpoints in Phase 2.
