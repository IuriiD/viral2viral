# Research Document: UGC Video Generator

**Feature**: `001-ugc-video-generator`  
**Date**: 2025-11-24  
**Status**: Complete

This document consolidates technical research findings to resolve all NEEDS CLARIFICATION items from the Technical Context and guide implementation decisions.

## Research Areas

### 1. Nest.js Architecture for Stateless POC

**Decision**: Use Nest.js with modular architecture and in-memory session management

**Rationale**: 
- Nest.js provides built-in support for modular architecture, making it easy to organize code by feature (video, analysis, prompt, generation)
- TypeScript-first framework aligns with project requirements
- Built-in dependency injection simplifies testing and service composition
- Express/Fastify under the hood provides familiar HTTP server capabilities
- For stateless POC, session data can be stored in-memory using NestJS providers with singleton scope

**Alternatives considered**:
- **Express.js alone**: More lightweight but lacks structure and DI, requiring more boilerplate
- **Fastify with TypeScript**: Faster but less mature ecosystem and fewer TypeScript-first patterns
- **Next.js API routes**: Considered but doesn't fit backend-only service architecture as cleanly

**Implementation approach**:
- Use `@Module()` decorators to create feature modules (VideoModule, AnalysisModule, PromptModule, GenerationModule, StorageModule)
- Create a `SessionService` as a singleton provider to hold workflow state in memory (Map<sessionId, SessionData>)
- Use DTOs (Data Transfer Objects) with class-validator for request validation
- Implement exception filters for consistent error handling
- Serve frontend static files from backend using `@nestjs/serve-static`

**Reference documentation**:
- [Nest.js Official Documentation](https://docs.nestjs.com/)
- [Nest.js Modules](https://docs.nestjs.com/modules)
- [Nest.js Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)

---

### 2. AWS S3 Integration Patterns

**Decision**: Use AWS SDK v3 with presigned URLs for uploads and signed URLs for downloads

**Rationale**:
- AWS SDK v3 is modular, tree-shakeable, and has better TypeScript support than v2
- Presigned POST URLs allow direct browser-to-S3 uploads without routing large files through backend
- Signed GET URLs provide time-limited access to stored videos/images
- Existing `scripts/s3Service.js` demonstrates basic patterns that can be adapted

**Alternatives considered**:
- **AWS SDK v2**: Older, less type-safe, larger bundle size
- **Streaming uploads through backend**: Simpler but creates backend bottleneck for 100MB files
- **Third-party storage (Cloudinary, uploadcare)**: Easier but adds dependency and cost

**Implementation approach**:
- Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Create `S3Service` in backend with methods:
  - `generatePresignedUploadUrl(key, contentType)`: Returns presigned POST for frontend to upload directly
  - `generatePresignedDownloadUrl(key)`: Returns signed GET URL with expiration
  - `uploadBuffer(key, buffer)`: Direct upload for server-generated content (video generation results)
- Frontend uploads files using presigned URLs via fetch/axios
- Store S3 keys in session state (in-memory)

**Key considerations**:
- Set CORS policy on S3 bucket to allow direct uploads from frontend domain
- Use unique prefixes for keys (e.g., `sessions/{sessionId}/video.mp4`)
- Implement cleanup strategy (out of scope for POC but documented)

**Reference documentation**:
- [AWS SDK v3 JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

---

### 3. Google Gemini API Integration

**Decision**: Use `@google/genai` SDK with multimodal video understanding API

**Rationale**:
- Official Google Generative AI SDK provides type-safe access to Gemini models
- Supports video file input via base64 encoding (as demonstrated in `test-gemini-understand-video.js`)
- `gemini-2.5-flash` model offers fast video analysis with good quality
- Can provide structured prompts to extract specific video characteristics

**Alternatives considered**:
- **REST API directly**: More control but requires manual request construction and error handling
- **Third-party video analysis APIs (AWS Rekognition, Azure Video Indexer)**: More expensive and less flexible for custom prompt engineering
- **OpenAI GPT-4 Vision**: Doesn't support video, only images

**Implementation approach**:
- Install `@google/genai` package
- Create `AnalysisService` with `analyzeVideo(s3Key)` method
- Download video from S3 to buffer, convert to base64
- Send to Gemini with structured prompt requesting JSON output with scene breakdown
- Parse response and return structured analysis data
- Handle rate limits with retry logic (exponential backoff)

**Prompt engineering strategy**:
- Based on example in `test-gemini-understand-video.js`, request JSON response format
- Ask for specific fields: visual style, camera angles, pacing, audio, messaging tone
- Include instruction to keep analysis concise and actionable for prompt generation

**Reference documentation**:
- [Google Generative AI SDK](https://github.com/google/generative-ai-js)
- [Gemini API Documentation](https://ai.google.dev/tutorials/node_quickstart)

---

### 4. OpenAI GPT-5 via laozhang.ai Proxy

**Decision**: Use HTTP client (axios) to call OpenAI-compatible API at laozhang.ai

**Rationale**:
- laozhang.ai provides OpenAI-compatible API endpoint with GPT-5 access
- Existing example in `test-laozhang-generate-text.js` demonstrates authentication and request format
- Can use standard OpenAI chat completion format
- More cost-effective than official OpenAI API for this use case

**Alternatives considered**:
- **Official OpenAI SDK**: Requires official API access to GPT-5 (may not be available)
- **Direct REST calls with http/https modules**: Works but less ergonomic than axios

**Implementation approach**:
- Install `axios` package
- Create `PromptService` with `generatePrompt(analysisText, productInfo)` method
- Use chat completion format with system prompt and user message
- System prompt instructs model to generate Sora-compatible video prompt
- Parse JSON response to extract generated prompt text
- Implement retry logic for transient failures

**API configuration**:
```typescript
baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.laozhang.ai/v1'
headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
model: 'gpt-5'
```

**Reference documentation**:
- [OpenAI Chat Completion API](https://platform.openai.com/docs/api-reference/chat)
- Example: `scripts/test-laozhang-generate-text.js`

---

### 5. OpenAI Sora 2 via laozhang.ai Proxy

**Decision**: Use axios to call Sora 2 video generation via laozhang.ai chat completion API with multimodal input

**Rationale**:
- laozhang.ai exposes Sora 2 through OpenAI-compatible chat completion endpoint
- Existing example in `test-laozhang-sora2.js` demonstrates video generation with reference image
- Supports multimodal input (text prompt + reference image as base64)
- Returns video URL via markdown link in response content

**Alternatives considered**:
- **Official OpenAI Sora API**: May not be publicly available or accessible
- **Other video generation APIs (Runway, Stability)**: Different pricing/quality tradeoffs

**Implementation approach**:
- Create `GenerationService` with `generateVideo(prompt, imageS3Key)` method
- Download product image from S3, convert to base64 data URL
- Construct multimodal message with text prompt and image
- Send request to laozhang.ai `/v1/chat/completions` endpoint with model `sora-2`
- Parse response to extract video URL from markdown
- Download generated video from URL and upload to S3
- Return S3 URL for frontend to display

**API request structure** (based on test-laozhang-sora2.js):
```typescript
{
  model: 'sora-2',
  n: 1,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: dataUrlImage } }
      ]
    }
  ]
}
```

**Key considerations**:
- Video generation is long-running (3-5 minutes typical)
- Implement async processing with status polling
- Store generation job status in session state
- Frontend polls backend for status updates

**Reference documentation**:
- Example: `scripts/test-laozhang-sora2.js`
- OpenAI chat completion multimodal format

---

### 6. Frontend State Management

**Decision**: Use React hooks (useState, useEffect) with custom hook for workflow orchestration

**Rationale**:
- Simple, built-in solution sufficient for single-page workflow
- No need for Redux/MobX complexity in POC
- Custom `useWorkflow` hook can centralize state and API calls
- Aligns with existing landing page structure in `scripts/landing-page`

**Alternatives considered**:
- **Redux Toolkit**: Overkill for POC, adds complexity
- **Zustand**: Lightweight but unnecessary for single workflow
- **React Context**: Could work but hooks pattern is simpler

**Implementation approach**:
- Create `useWorkflow` hook to manage:
  - Current workflow step (upload, analyze, product-info, prompt, generate)
  - Data for each step (uploaded video, analysis results, product info, prompt, generated video)
  - Loading states and errors
  - API calls to backend
- Components subscribe to workflow state and trigger state transitions
- Use existing Tailwind components from landing-page example for consistent styling

**Reference documentation**:
- [React Hooks](https://react.dev/reference/react)
- Existing example: `scripts/landing-page/src/App.tsx`

---

### 7. File Upload Strategy

**Decision**: Direct browser-to-S3 upload using presigned POST URLs

**Rationale**:
- Avoids routing 100MB files through backend server
- Reduces backend memory usage and latency
- Better user experience with direct upload progress tracking
- S3 handles multipart uploads automatically

**Alternatives considered**:
- **Backend proxy upload**: Simpler but creates bottleneck
- **Chunked upload**: More complex, not needed for 100MB limit

**Implementation approach**:
1. Frontend requests presigned upload URL from backend
2. Backend generates presigned POST URL with conditions (file size, content type)
3. Frontend uses FormData + fetch to POST directly to S3
4. On success, frontend notifies backend of uploaded file key
5. Backend validates file exists in S3 before proceeding

**Reference documentation**:
- [S3 Presigned POST](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-post-example.html)

---

### 8. Error Handling Strategy

**Decision**: Centralized exception filter in Nest.js with standardized error response format

**Rationale**:
- Consistent error format across all API endpoints
- Separates user-facing messages from technical details
- Enables proper HTTP status codes
- Simplifies client-side error handling

**Implementation approach**:
- Create `HttpExceptionFilter` implementing `ExceptionFilter`
- Return format:
```typescript
{
  success: false,
  error: {
    code: 'VIDEO_TOO_LARGE',
    message: 'Video file exceeds maximum size of 100MB'
  },
  meta: {
    timestamp: '2025-11-24T...',
    requestId: 'uuid'
  }
}
```
- Map exception types to appropriate HTTP status codes
- Log technical details server-side
- Return only user-actionable messages to frontend

**Reference documentation**:
- [Nest.js Exception Filters](https://docs.nestjs.com/exception-filters)

---

### 9. Best Practices Summary

**NestJS Module Organization**:
- One module per feature domain (video, analysis, prompt, generation)
- Shared services in separate module (storage)
- Keep controllers thin - business logic in services
- Use DTOs for validation and type safety

**TypeScript Patterns**:
- Define interfaces for all data structures
- Use strict type checking (`strict: true` in tsconfig)
- Leverage utility types (Partial, Pick, Omit) for DTOs
- Document complex types with JSDoc

**Testing Strategy**:
- Mock external services (S3, Gemini, laozhang.ai) in unit tests
- Use dependency injection to swap implementations
- Test error paths and edge cases
- Integration tests cover full API workflows

**Security Considerations**:
- Validate all file uploads (size, type, content)
- Use signed/presigned URLs with expiration
- Sanitize user inputs before passing to AI APIs
- Rate limit API endpoints (future enhancement)

---

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Backend Framework | Nest.js | 10.x | Application structure, DI, HTTP server |
| Backend Runtime | Node.js | 20.x | JavaScript runtime |
| Language | TypeScript | 5.x | Type-safe development |
| Storage | AWS S3 | SDK v3 | Video/image file storage |
| Video Analysis | Google Gemini | 2.5-flash | AI video understanding |
| Prompt Generation | OpenAI GPT-5 | via laozhang.ai | Text-to-video prompt generation |
| Video Generation | OpenAI Sora 2 | via laozhang.ai | AI video generation |
| Frontend Framework | React | 18.x | UI components |
| Frontend Build | Vite | 5.x | Fast dev server and build |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| HTTP Client | axios | 1.x | Backend HTTP requests |
| Testing | Jest + Supertest | Latest | Unit and integration tests |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AI API rate limits | High - blocks workflow | Implement exponential backoff, queue requests |
| Large file uploads fail | Medium - poor UX | Use presigned URLs, implement retry logic |
| Video generation timeout | Medium - long wait | Async processing with polling, clear status updates |
| Memory leaks in session store | Low - POC only | Document cleanup strategy, add session TTL |
| CORS issues with S3 | Medium - upload fails | Configure S3 bucket CORS policy |
| API key exposure | High - security risk | Use environment variables, never commit keys |

---

## Next Steps (Phase 1)

With research complete, Phase 1 will proceed to:
1. Create data model definitions (`data-model.md`)
2. Generate OpenAPI contracts for all APIs (`/contracts/`)
3. Write quickstart documentation (`quickstart.md`)
4. Update agent context with new technology decisions

All NEEDS CLARIFICATION items have been resolved with concrete implementation decisions backed by research and existing code examples.
