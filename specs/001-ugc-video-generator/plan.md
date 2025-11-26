# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements a UGC (User Generated Content) advertisement video generator that allows users to upload sample UGC videos, analyze them using Google Gemini AI, input product information, generate text-to-video prompts using OpenAI GPT-5 (via laozhang.ai proxy), and create new advertisement videos using OpenAI Sora 2 (via laozhang.ai proxy). The application consists of a Nest.js backend providing RESTful APIs and a React/Vite frontend SPA. Videos and images are stored in AWS S3, with no database persistence (stateless POC). The workflow guides users through: video upload → AI analysis → product info input → prompt generation/editing → product image upload → video generation → download.

## Technical Context

**Language/Version**: Node.js v20+, TypeScript 5.x  
**Primary Dependencies**: 
- Backend: Nest.js (framework), AWS SDK (S3), Google Generative AI SDK (Gemini), axios (HTTP client for laozhang.ai)
- Frontend: Vite (build tool), React 18, TypeScript, Tailwind CSS
**Storage**: AWS S3 (video and image file storage), stateless in-memory session state (no database/cache per POC requirements)  
**Testing**: Jest (unit tests), Supertest (integration/API tests)  
**Target Platform**: Web application - Node.js backend server + browser-based SPA frontend  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: 
- Video upload within 30s for 100MB files
- Video analysis initiated within 5s of upload completion
- Video generation status polling every 3-5s
- Frontend UI responsiveness <200ms for user interactions
**Constraints**: 
- Stateless POC (no database persistence)
- Session data held in memory only
- Video files up to 100MB (source), images up to 10MB
- API response time <2s for non-AI operations
- Support concurrent users but no specific scalability target for POC
**Scale/Scope**: POC application, single workflow per session, ~5-10 API endpoints, 1 main frontend page with workflow states

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Standards
- [x] **Linting & Formatting**: ESLint and Prettier will be configured for both backend (Nest.js) and frontend (React/TS). Configuration files will be in place before implementation.
- [x] **Type Safety**: TypeScript will be used throughout both backend and frontend for full type safety.
- [x] **Modularity**: Nest.js modular architecture ensures single-purpose modules. React components will be kept focused (<50 lines per component where possible).
- [x] **Documentation**: JSDoc/TSDoc will document all service methods and public APIs. Each module will have header comments explaining purpose.
- [x] **Error Handling**: All async operations (S3, Gemini, laozhang.ai) will use try-catch. Custom exception filters in Nest.js will provide context.
- [x] **Dependencies**: Dependencies are justified: Nest.js (backend framework), AWS SDK (required for S3), Google Generative AI SDK (required for Gemini), axios (HTTP client), React/Vite/Tailwind (frontend stack).

### II. Testing Standards (NON-NEGOTIABLE)
- [x] **TDD**: Tests will be written first using Jest/Supertest for backend, React Testing Library for frontend.
- [x] **Test Coverage**: Target 80%+ unit test coverage for business logic (services), 100% integration test coverage for API endpoints.
- [x] **Test Organization**: 
  - Unit tests: `backend/test/unit/` and `frontend/test/unit/`
  - Integration tests: `backend/test/integration/` for API endpoints
  - Contract tests: API contracts will be validated against OpenAPI spec
- [x] **Test Quality**: Tests will be independent, using mocks for external services (S3, Gemini, laozhang.ai).
- [x] **Mocking Strategy**: External APIs mocked in unit tests. Integration tests may use test S3 bucket but will not call production AI APIs.
- [x] **Test Documentation**: Each test suite will have header explaining what's tested and why.

### III. User Experience Consistency
- [x] **API Response Format**: All API endpoints will return consistent JSON structure with success/error/data/meta fields.
- [x] **Error Messages**: User-facing errors will be actionable (e.g., "Video file too large. Maximum size is 100MB."). Technical errors logged server-side.
- [x] **Validation**: Input validation at API layer (DTO validation with class-validator) and frontend (before submission). Clear, specific error messages.
- [x] **Documentation**: Quickstart guide will be created in Phase 1 with examples of API usage.
- [x] **Accessibility**: Frontend will use semantic HTML, proper ARIA labels, keyboard navigation support.
- [x] **Idempotency**: File upload operations will use unique IDs to prevent duplicate uploads.

### IV. Performance Requirements
- [x] **Performance targets defined**: Upload <30s for 100MB, UI response <200ms, polling every 3-5s for status updates.
- [x] **Monitoring approach**: Response times will be logged. Performance benchmarks in integration tests.

**GATE STATUS**: ✅ PASS - All constitution principles are addressed. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application (backend + frontend structure)
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── modules/
│   │   ├── video/
│   │   │   ├── video.controller.ts
│   │   │   ├── video.service.ts
│   │   │   └── dto/
│   │   ├── analysis/
│   │   │   ├── analysis.controller.ts
│   │   │   ├── analysis.service.ts
│   │   │   └── dto/
│   │   ├── prompt/
│   │   │   ├── prompt.controller.ts
│   │   │   ├── prompt.service.ts
│   │   │   └── dto/
│   │   ├── generation/
│   │   │   ├── generation.controller.ts
│   │   │   ├── generation.service.ts
│   │   │   └── dto/
│   │   └── storage/
│   │       ├── storage.service.ts
│   │       └── s3.service.ts
│   ├── config/
│   │   └── configuration.ts
│   └── common/
│       ├── filters/
│       ├── interceptors/
│       └── types/
├── test/
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── VideoUpload.tsx
│   │   ├── AnalysisDisplay.tsx
│   │   ├── ProductInput.tsx
│   │   ├── PromptEditor.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── ProgressIndicator.tsx
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   │   └── useWorkflow.ts
│   └── types/
│       └── index.ts
├── public/
├── test/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Structure Decision**: Web application structure selected based on the requirement for a Nest.js backend with RESTful APIs and a Vite/React/TypeScript frontend SPA. The backend follows Nest.js modular architecture with feature-based modules (video, analysis, prompt, generation) and shared services (storage/S3). The frontend uses a component-based structure organized by the workflow steps, with centralized API service layer and custom hooks for state management.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified.** All constitution principles have been addressed in the design phase:

- Code quality standards will be enforced via ESLint/Prettier
- TDD approach with Jest/Supertest for comprehensive test coverage
- Consistent API response format and error handling
- Performance targets documented and achievable with chosen architecture
- No additional complexity introduced beyond necessary for feature requirements

---

## Post-Phase 1 Constitution Re-Check

*Re-evaluation after Phase 1 design complete*

### Design Review Against Constitution

✅ **I. Code Quality Standards**: 
- TypeScript provides full type safety
- Nest.js modular architecture enforces single-purpose modules
- OpenAPI contracts serve as API documentation
- DTOs with class-validator provide input validation

✅ **II. Testing Standards**: 
- Test strategy documented in research.md
- Unit tests planned for all service methods with mocks for external APIs
- Integration tests planned for all API endpoints
- Test organization follows constitution structure (unit/, integration/)

✅ **III. User Experience Consistency**: 
- OpenAPI spec defines consistent API response format
- Error codes documented with user-actionable messages
- Frontend workflow provides clear visual feedback at each step
- Quickstart guide provides comprehensive user documentation

✅ **IV. Performance Requirements**: 
- Performance targets specified and achievable:
  - Direct S3 upload avoids backend bottleneck
  - Async processing with polling for long-running operations
  - Frontend optimized with React hooks and Tailwind CSS

### Final Gate Status

**GATE STATUS**: ✅ PASS - All constitution principles validated in design. Ready for implementation (Phase 2).
