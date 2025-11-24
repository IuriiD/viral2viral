# Tasks: UGC Advertisement Video Generator

**Input**: Design documents from `/specs/001-ugc-video-generator/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are NOT included in this task list as TDD was not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- **Tests**: `backend/test/`, `frontend/test/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure per plan.md with modules/, config/, common/ folders
- [X] T002 Initialize backend Nest.js project with package.json, tsconfig.json, nest-cli.json in backend/
- [X] T003 [P] Create frontend Vite+React+TypeScript project with vite.config.ts, tsconfig.json in frontend/
- [X] T004 [P] Configure ESLint and Prettier for backend in backend/eslint.config.js and backend/.prettierrc
- [X] T005 [P] Configure ESLint and Prettier for frontend in frontend/eslint.config.js and frontend/.prettierrc
- [X] T006 Install backend dependencies: @nestjs/common, @nestjs/core, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, @google/genai, axios, class-validator, class-transformer, uuid
- [X] T007 [P] Install frontend dependencies: react, react-dom, axios, tailwindcss in frontend/package.json
- [X] T008 [P] Configure Tailwind CSS in frontend/tailwind.config.js and frontend/src/index.css
- [X] T009 Create .env.example files with required environment variables in both backend/ and frontend/
- [X] T010 Configure TypeScript strict mode in backend/tsconfig.json and frontend/tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Create configuration module in backend/src/config/configuration.ts to load environment variables
- [X] T012 [P] Create SessionService singleton provider for in-memory session storage in backend/src/common/session.service.ts
- [X] T013 [P] Create S3Service for AWS S3 operations (presigned URLs, uploads) in backend/src/modules/storage/s3.service.ts
- [X] T014 [P] Create StorageModule with S3Service in backend/src/modules/storage/storage.module.ts
- [X] T015 [P] Create HttpExceptionFilter for consistent error responses in backend/src/common/filters/http-exception.filter.ts
- [X] T016 [P] Create ResponseInterceptor for consistent API response format in backend/src/common/interceptors/response.interceptor.ts
- [X] T017 [P] Define Session interface and SessionStatus enum in backend/src/common/types/session.types.ts
- [X] T018 [P] Define OriginalVideo interface in backend/src/common/types/video.types.ts
- [X] T019 [P] Define VideoAnalysis, AnalysisStatus, and related interfaces in backend/src/common/types/analysis.types.ts
- [X] T020 [P] Define ProductInformation interface in backend/src/common/types/product.types.ts
- [X] T021 [P] Define GenerationPrompt and ModerationStatus in backend/src/common/types/prompt.types.ts
- [X] T022 [P] Define GeneratedVideo and GenerationStatus in backend/src/common/types/generation.types.ts
- [X] T023 [P] Create API client service with base configuration in frontend/src/services/api.ts
- [X] T024 [P] Define TypeScript interfaces matching backend types in frontend/src/types/index.ts
- [X] T025 Create AppModule importing all feature modules in backend/src/app.module.ts
- [X] T026 Create main.ts with app bootstrap, global filters, and CORS config in backend/src/main.ts
- [X] T027 [P] Setup frontend App.tsx with basic layout and Tailwind styles in frontend/src/App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Video Upload and Analysis (Priority: P1) 🎯 MVP

**Goal**: Enable users to upload UGC videos, analyze them using AI, and view/edit analysis results

**Independent Test**: Upload a video file, trigger analysis, see results displayed, edit analysis text

### Backend Implementation for User Story 1

- [X] T028 [P] [US1] Create VideoModule in backend/src/modules/video/video.module.ts
- [X] T029 [P] [US1] Create AnalysisModule in backend/src/modules/analysis/analysis.module.ts
- [X] T030 [P] [US1] Create UploadVideoRequestDto with validation in backend/src/modules/video/dto/upload-video-request.dto.ts
- [X] T031 [P] [US1] Create UploadVideoResponseDto in backend/src/modules/video/dto/upload-video-response.dto.ts
- [X] T032 [P] [US1] Create TriggerAnalysisResponseDto in backend/src/modules/analysis/dto/trigger-analysis-response.dto.ts
- [X] T033 [P] [US1] Create GetAnalysisResponseDto in backend/src/modules/analysis/dto/get-analysis-response.dto.ts
- [X] T034 [P] [US1] Create UpdateAnalysisRequestDto with validation in backend/src/modules/analysis/dto/update-analysis-request.dto.ts
- [X] T035 [US1] Create VideoService with generateUploadUrl method in backend/src/modules/video/video.service.ts
- [X] T036 [US1] Create AnalysisService with analyzeVideo method using Google Gemini in backend/src/modules/analysis/analysis.service.ts
- [X] T037 [US1] Implement getAnalysisStatus and updateAnalysis methods in backend/src/modules/analysis/analysis.service.ts
- [X] T038 [US1] Create VideoController with POST /sessions/:sessionId/video/upload-url endpoint in backend/src/modules/video/video.controller.ts
- [X] T039 [US1] Create AnalysisController with POST /sessions/:sessionId/analysis endpoint in backend/src/modules/analysis/analysis.controller.ts
- [X] T040 [US1] Add GET /sessions/:sessionId/analysis endpoint to AnalysisController in backend/src/modules/analysis/analysis.controller.ts
- [X] T041 [US1] Add PATCH /sessions/:sessionId/analysis endpoint to AnalysisController in backend/src/modules/analysis/analysis.controller.ts
- [X] T042 [US1] Add session state transitions for video_uploaded and analyzing in backend/src/common/session.service.ts

### Frontend Implementation for User Story 1

- [X] T043 [P] [US1] Create VideoUpload component with file input and progress bar in frontend/src/components/VideoUpload.tsx
- [X] T044 [P] [US1] Create AnalysisDisplay component with editable text area in frontend/src/components/AnalysisDisplay.tsx
- [X] T045 [P] [US1] Create ProgressIndicator component for loading states in frontend/src/components/ProgressIndicator.tsx
- [X] T046 [US1] Add uploadVideo API method in frontend/src/services/api.ts
- [X] T047 [US1] Add triggerAnalysis API method in frontend/src/services/api.ts
- [X] T048 [US1] Add getAnalysisStatus API method with polling in frontend/src/services/api.ts
- [X] T049 [US1] Add updateAnalysis API method in frontend/src/services/api.ts
- [X] T050 [US1] Create useWorkflow custom hook managing video upload state in frontend/src/hooks/useWorkflow.ts
- [X] T051 [US1] Add analysis state management to useWorkflow hook in frontend/src/hooks/useWorkflow.ts
- [X] T052 [US1] Integrate VideoUpload and AnalysisDisplay components into App.tsx in frontend/src/App.tsx
- [X] T053 [US1] Add error handling and user-facing error messages for video and analysis operations in frontend/src/App.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can upload videos, analyze them, and edit results

---

## Phase 4: User Story 2 - Product Information Input (Priority: P2)

**Goal**: Allow users to enter product name and description for personalization

**Independent Test**: Enter product name and description, verify both are stored and displayed correctly

### Backend Implementation for User Story 2

- [ ] T054 [P] [US2] Create ProductModule in backend/src/modules/product/product.module.ts
- [ ] T055 [P] [US2] Create SubmitProductInfoRequestDto with validation (3-100 chars name, 1-250 chars description) in backend/src/modules/product/dto/submit-product-info-request.dto.ts
- [ ] T056 [P] [US2] Create SubmitProductInfoResponseDto in backend/src/modules/product/dto/submit-product-info-response.dto.ts
- [ ] T057 [US2] Create ProductService with submitProductInfo method in backend/src/modules/product/product.service.ts
- [ ] T058 [US2] Create ProductController with POST /sessions/:sessionId/product endpoint in backend/src/modules/product/product.controller.ts
- [ ] T059 [US2] Add session state transition for product_info_added in backend/src/common/session.service.ts

### Frontend Implementation for User Story 2

- [ ] T060 [P] [US2] Create ProductInput component with name and description fields in frontend/src/components/ProductInput.tsx
- [ ] T061 [P] [US2] Add character counters for product name (100 max) and description (250 max) in frontend/src/components/ProductInput.tsx
- [ ] T062 [US2] Add submitProductInfo API method in frontend/src/services/api.ts
- [ ] T063 [US2] Add product info state management to useWorkflow hook in frontend/src/hooks/useWorkflow.ts
- [ ] T064 [US2] Integrate ProductInput component into App.tsx workflow in frontend/src/App.tsx
- [ ] T065 [US2] Add inline validation messages for product name and description in frontend/src/components/ProductInput.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - video analysis and product input are separate, functional features

---

## Phase 5: User Story 3 - Prompt Generation and Moderation (Priority: P3)

**Goal**: Generate text-to-video prompt from analysis and product info, allow editing and approval

**Independent Test**: Trigger prompt generation with mock data, display generated prompt, allow edits, approve prompt

### Backend Implementation for User Story 3

- [ ] T066 [P] [US3] Create PromptModule in backend/src/modules/prompt/prompt.module.ts
- [ ] T067 [P] [US3] Create GeneratePromptResponseDto in backend/src/modules/prompt/dto/generate-prompt-response.dto.ts
- [ ] T068 [P] [US3] Create UpdatePromptRequestDto with validation (1-500 chars) in backend/src/modules/prompt/dto/update-prompt-request.dto.ts
- [ ] T069 [P] [US3] Create UpdatePromptResponseDto in backend/src/modules/prompt/dto/update-prompt-response.dto.ts
- [ ] T070 [P] [US3] Create ApprovePromptResponseDto in backend/src/modules/prompt/dto/approve-prompt-response.dto.ts
- [ ] T071 [US3] Create PromptService with generatePrompt method using GPT-5 via laozhang.ai in backend/src/modules/prompt/prompt.service.ts
- [ ] T072 [US3] Implement updatePrompt and approvePrompt methods in backend/src/modules/prompt/prompt.service.ts
- [ ] T073 [US3] Add basic content moderation logic in PromptService in backend/src/modules/prompt/prompt.service.ts
- [ ] T074 [US3] Create PromptController with POST /sessions/:sessionId/prompt endpoint in backend/src/modules/prompt/prompt.controller.ts
- [ ] T075 [US3] Add PATCH /sessions/:sessionId/prompt endpoint to PromptController in backend/src/modules/prompt/prompt.controller.ts
- [ ] T076 [US3] Add POST /sessions/:sessionId/prompt/approve endpoint to PromptController in backend/src/modules/prompt/prompt.controller.ts
- [ ] T077 [US3] Add session state transition for prompt_generated in backend/src/common/session.service.ts

### Frontend Implementation for User Story 3

- [ ] T078 [P] [US3] Create PromptEditor component with editable text area and character counter in frontend/src/components/PromptEditor.tsx
- [ ] T079 [P] [US3] Add approve button and moderation warnings to PromptEditor component in frontend/src/components/PromptEditor.tsx
- [ ] T080 [US3] Add generatePrompt API method in frontend/src/services/api.ts
- [ ] T081 [US3] Add updatePrompt API method in frontend/src/services/api.ts
- [ ] T082 [US3] Add approvePrompt API method in frontend/src/services/api.ts
- [ ] T083 [US3] Add prompt state management to useWorkflow hook in frontend/src/hooks/useWorkflow.ts
- [ ] T084 [US3] Integrate PromptEditor component into App.tsx workflow in frontend/src/App.tsx
- [ ] T085 [US3] Add validation for prompt length (500 char max) in frontend/src/components/PromptEditor.tsx

**Checkpoint**: All user stories 1-3 should now be independently functional - video analysis, product input, and prompt generation work separately

---

## Phase 6: User Story 4 - Advertisement Video Generation and Display (Priority: P4)

**Goal**: Upload product image, generate advertisement video using Sora 2, display both videos side-by-side

**Independent Test**: Upload product image (displays on page), trigger video generation with approved prompt and image, poll for status, display generated video alongside original

### Backend Implementation for User Story 4

- [ ] T086 [P] [US4] Create GenerationModule in backend/src/modules/generation/generation.module.ts
- [ ] T087 [P] [US4] Create UploadProductImageRequestDto with validation in backend/src/modules/product/dto/upload-product-image-request.dto.ts
- [ ] T088 [P] [US4] Create UploadProductImageResponseDto in backend/src/modules/product/dto/upload-product-image-response.dto.ts
- [ ] T089 [P] [US4] Create GenerateVideoResponseDto in backend/src/modules/generation/dto/generate-video-response.dto.ts
- [ ] T090 [P] [US4] Create GetVideoStatusResponseDto in backend/src/modules/generation/dto/get-video-status-response.dto.ts
- [ ] T091 [US4] Add generateProductImageUploadUrl method to ProductService in backend/src/modules/product/product.service.ts
- [ ] T092 [US4] Create GenerationService with generateVideo method using Sora 2 via laozhang.ai in backend/src/modules/generation/generation.service.ts
- [ ] T093 [US4] Implement async video generation with status polling in backend/src/modules/generation/generation.service.ts
- [ ] T094 [US4] Add getVideoStatus method to retrieve generation progress in backend/src/modules/generation/generation.service.ts
- [ ] T095 [US4] Add POST /sessions/:sessionId/product/image/upload-url endpoint to ProductController in backend/src/modules/product/product.controller.ts
- [ ] T096 [US4] Create GenerationController with POST /sessions/:sessionId/generate endpoint in backend/src/modules/generation/generation.controller.ts
- [ ] T097 [US4] Add GET /sessions/:sessionId/generate endpoint to GenerationController in backend/src/modules/generation/generation.controller.ts
- [ ] T098 [US4] Add session state transitions for generating_video and video_complete in backend/src/common/session.service.ts

### Frontend Implementation for User Story 4

- [ ] T099 [P] [US4] Create ImageUpload component with file input and preview in frontend/src/components/ImageUpload.tsx
- [ ] T100 [P] [US4] Create VideoPlayer component with playback controls for both original and generated videos in frontend/src/components/VideoPlayer.tsx
- [ ] T101 [P] [US4] Add download button to VideoPlayer component in frontend/src/components/VideoPlayer.tsx
- [ ] T102 [US4] Add uploadProductImage API method in frontend/src/services/api.ts
- [ ] T103 [US4] Add generateVideo API method in frontend/src/services/api.ts
- [ ] T104 [US4] Add getVideoStatus API method with polling logic in frontend/src/services/api.ts
- [ ] T105 [US4] Add image and video generation state management to useWorkflow hook in frontend/src/hooks/useWorkflow.ts
- [ ] T106 [US4] Implement status polling with 3-5 second intervals in useWorkflow hook in frontend/src/hooks/useWorkflow.ts
- [ ] T107 [US4] Integrate ImageUpload and VideoPlayer components into App.tsx workflow in frontend/src/App.tsx
- [ ] T108 [US4] Add side-by-side video comparison layout in frontend/src/App.tsx
- [ ] T109 [US4] Add error handling for image upload and video generation failures in frontend/src/App.tsx

**Checkpoint**: Complete workflow functional - users can upload videos, analyze them, enter product info, generate prompts, upload product images, and generate videos

---

## Phase 7: Session Management and Validation

**Purpose**: Complete session lifecycle management and final integration

- [ ] T110 [P] Create SessionController with POST /sessions endpoint in backend/src/modules/session/session.controller.ts
- [ ] T111 [P] Create SessionModule in backend/src/modules/session/session.module.ts
- [ ] T112 [P] Add GET /sessions/:sessionId endpoint to SessionController in backend/src/modules/session/session.controller.ts
- [ ] T113 [P] Create CreateSessionResponseDto in backend/src/modules/session/dto/create-session-response.dto.ts
- [ ] T114 [P] Create GetSessionResponseDto in backend/src/modules/session/dto/get-session-response.dto.ts
- [ ] T115 Add session TTL cleanup logic (24 hours) to SessionService in backend/src/common/session.service.ts
- [ ] T116 [P] Add createSession API method in frontend/src/services/api.ts
- [ ] T117 [P] Add getSession API method in frontend/src/services/api.ts
- [ ] T118 Initialize session on app load in frontend/src/App.tsx
- [ ] T119 Add session restoration logic for page refreshes in frontend/src/hooks/useWorkflow.ts
- [ ] T120 Add health check endpoint GET /health in backend/src/app.controller.ts

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T121 [P] Add request logging middleware in backend/src/common/middleware/logger.middleware.ts
- [ ] T122 [P] Add rate limiting configuration for API endpoints in backend/src/main.ts
- [ ] T123 [P] Implement retry logic with exponential backoff for external API calls in backend/src/common/utils/retry.util.ts
- [ ] T124 [P] Add comprehensive JSDoc comments to all service methods in backend/src/modules/
- [ ] T125 [P] Add loading skeletons for better UX during long operations in frontend/src/components/
- [ ] T126 [P] Implement proper accessibility attributes (ARIA labels, keyboard navigation) in all frontend components
- [ ] T127 [P] Add proper error boundary component in frontend/src/components/ErrorBoundary.tsx
- [ ] T128 Optimize bundle size by lazy loading components in frontend/src/App.tsx
- [ ] T129 Add API response caching for session data in frontend/src/services/api.ts
- [ ] T130 Create comprehensive README.md with setup and run instructions in repository root
- [ ] T131 Update quickstart.md with final API examples and troubleshooting guide in specs/001-ugc-video-generator/quickstart.md
- [ ] T132 Run full workflow validation per quickstart.md scenarios
- [ ] T133 [P] Add security headers and CORS configuration hardening in backend/src/main.ts
- [ ] T134 [P] Implement input sanitization for all user-provided text in backend/src/common/pipes/sanitize.pipe.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion - can run in parallel with US1, US2
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) completion - can run in parallel with US1, US2, US3
- **Session Management (Phase 7)**: Depends on all user stories being complete
- **Polish (Phase 8)**: Depends on Session Management completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1, US2 (but uses their data at runtime)
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Independent of US1, US2, US3 (but uses their data at runtime)

**Note**: While user stories are independent for implementation and testing, the full workflow requires them to work together. Each story can be developed in isolation and tested with mock data.

### Within Each User Story

- DTOs and types can be created in parallel
- Services depend on DTOs
- Controllers depend on Services
- Frontend components can be built in parallel
- API methods can be added in parallel
- Integration into App.tsx happens after components are ready

### Parallel Opportunities

#### Phase 1 - Setup
All tasks T003-T010 marked [P] can run in parallel after T001-T002

#### Phase 2 - Foundational
All tasks T012-T024 marked [P] can run in parallel after T011

#### User Story Development (once Foundational is complete)
- **Parallel User Stories**: US1, US2, US3, US4 can all be worked on simultaneously by different developers
- **Within US1**: T028-T034 (DTOs) can run in parallel, then T035-T037 (Services), then T038-T042 (Controllers)
- **Within US1 Frontend**: T043-T045 can run in parallel, then T046-T049 (API methods), then T050-T053 (Integration)
- Same pattern applies to US2, US3, US4

---

## Parallel Example: User Story 1 Backend

```bash
# Launch all DTOs together:
Task: "Create UploadVideoRequestDto in backend/src/modules/video/dto/upload-video-request.dto.ts"
Task: "Create UploadVideoResponseDto in backend/src/modules/video/dto/upload-video-response.dto.ts"
Task: "Create TriggerAnalysisResponseDto in backend/src/modules/analysis/dto/trigger-analysis-response.dto.ts"
Task: "Create GetAnalysisResponseDto in backend/src/modules/analysis/dto/get-analysis-response.dto.ts"
Task: "Create UpdateAnalysisRequestDto in backend/src/modules/analysis/dto/update-analysis-request.dto.ts"
```

---

## Parallel Example: Multiple User Stories

```bash
# Once Foundational phase completes, launch all user stories in parallel:
Team Member 1: User Story 1 (Video Upload and Analysis) - Tasks T028-T053
Team Member 2: User Story 2 (Product Information Input) - Tasks T054-T065
Team Member 3: User Story 3 (Prompt Generation and Moderation) - Tasks T066-T085
Team Member 4: User Story 4 (Advertisement Video Generation) - Tasks T086-T109
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Tasks T001-T010)
2. Complete Phase 2: Foundational (Tasks T011-T027) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Story 1 (Tasks T028-T053)
4. **STOP and VALIDATE**: Test video upload and analysis independently with real videos
5. Deploy/demo MVP if ready

**MVP Delivers**: Users can upload UGC videos, get AI analysis, and review insights - immediate value without full workflow

### Incremental Delivery

1. **Foundation**: Complete Setup + Foundational → Foundation ready (27 tasks)
2. **MVP**: Add User Story 1 → Test independently → Deploy/Demo (26 tasks - total 53)
3. **Enhanced**: Add User Story 2 → Test independently → Deploy/Demo (12 tasks - total 65)
4. **Advanced**: Add User Story 3 → Test independently → Deploy/Demo (20 tasks - total 85)
5. **Complete**: Add User Story 4 → Test independently → Deploy/Demo (24 tasks - total 109)
6. **Production Ready**: Add Session Management + Polish → Final validation (25 tasks - total 134)

Each story adds value without breaking previous stories. Early stories can be demonstrated and get user feedback before completing full workflow.

### Parallel Team Strategy (4 Developers)

**Week 1**: All together on Setup + Foundational (27 tasks)

**Week 2+**: Once Foundational is done:
- **Developer A**: User Story 1 (26 tasks)
- **Developer B**: User Story 2 (12 tasks)
- **Developer C**: User Story 3 (20 tasks)
- **Developer D**: User Story 4 (24 tasks)

**Week 3+**: Integration
- All: Session Management (11 tasks)
- All: Polish & Cross-Cutting (14 tasks)

Stories complete and integrate independently. Each developer can test their story in isolation before integration.

---

## Task Summary

- **Total Tasks**: 134
- **Phase 1 (Setup)**: 10 tasks
- **Phase 2 (Foundational)**: 17 tasks - BLOCKS everything
- **Phase 3 (User Story 1 - P1)**: 26 tasks - MVP
- **Phase 4 (User Story 2 - P2)**: 12 tasks
- **Phase 5 (User Story 3 - P3)**: 20 tasks
- **Phase 6 (User Story 4 - P4)**: 24 tasks
- **Phase 7 (Session Management)**: 11 tasks
- **Phase 8 (Polish)**: 14 tasks

### Parallel Opportunities Identified

- **Setup Phase**: 8 parallelizable tasks
- **Foundational Phase**: 13 parallelizable tasks
- **User Story 1**: 11 parallelizable tasks
- **User Story 2**: 4 parallelizable tasks
- **User Story 3**: 7 parallelizable tasks
- **User Story 4**: 7 parallelizable tasks
- **Session Management**: 5 parallelizable tasks
- **Polish**: 10 parallelizable tasks

**Total Parallelizable Tasks**: 65 of 134 (48%)

### Independent Test Criteria

**User Story 1**: Upload test video → Trigger analysis → See analysis results → Edit analysis text → Verify edits saved
**User Story 2**: Enter product name "Test Product" → Enter description → Verify both displayed with character counters
**User Story 3**: Generate prompt with mock data → See generated text → Edit prompt → Approve → Verify approved status
**User Story 4**: Upload product image → See image preview → Trigger generation → Poll status → See both videos side-by-side

### Suggested MVP Scope

**Minimum Viable Product = User Story 1 Only**
- Tasks T001-T027 (Foundation) + T028-T053 (US1) = 53 tasks
- Delivers: Video upload + AI analysis + editable insights
- Value: Marketing teams can analyze successful UGC videos to learn what works
- Testable without completing full video generation pipeline

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are NOT included (TDD not explicitly requested in spec)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths are absolute and follow plan.md structure
- Each task includes specific file path for clarity
