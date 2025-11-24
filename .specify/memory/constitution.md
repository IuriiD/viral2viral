<!--
SYNC IMPACT REPORT
==================
Version Change: N/A → 1.0.0
Constitution Type: Initial ratification
Principles Established: 4 core principles
- I. Code Quality Standards
- II. Testing Standards (NON-NEGOTIABLE)
- III. User Experience Consistency
- IV. Performance Requirements

Templates Status:
✅ plan-template.md - Compatible (Constitution Check section present)
✅ spec-template.md - Compatible (User scenarios and requirements align)
✅ tasks-template.md - Compatible (Test-first approach supported)
✅ checklist-template.md - Compatible (Quality gate validations supported)

Follow-up Actions: None - all templates compatible with initial constitution
-->

# Zeely Constitution

## Core Principles

### I. Code Quality Standards

All code contributions MUST adhere to the following non-negotiable quality standards:

- **Linting & Formatting**: Code MUST pass ESLint checks with zero warnings. Prettier formatting MUST be applied before commits. Configuration files (.eslintrc, .prettierrc) define the single source of truth.
- **Type Safety**: All JavaScript MUST include JSDoc type annotations for public APIs. TypeScript SHOULD be adopted for new modules where type safety is critical.
- **Modularity**: Functions MUST be single-purpose with clear inputs/outputs. Maximum function length is 50 lines; exceed only with documented justification.
- **Documentation**: Every module MUST have a header comment explaining purpose, dependencies, and usage. Public functions MUST have JSDoc with @param, @returns, and @throws tags.
- **Error Handling**: All async operations MUST use try-catch. Errors MUST include context (operation, inputs, stack trace). No silent failures.
- **Dependencies**: New dependencies require approval with justification.

### II. Testing Standards (NON-NEGOTIABLE)

Test-first development is mandatory for all feature work:

- **Test-Driven Development (TDD)**: Tests MUST be written first and MUST fail before implementation begins. The Red-Green-Refactor cycle is strictly enforced.
- **Test Coverage Requirements**: 
  - Unit tests: Minimum 80% line coverage for business logic
  - Integration tests: All API endpoints and external service integrations
  - Contract tests: All public module interfaces
- **Test Organization**:
  - Unit tests: `tests/unit/` - isolated function/class testing
  - Integration tests: `tests/integration/` - cross-module workflows
  - Contract tests: `tests/contract/` - API/interface validation
- **Test Quality**: Tests MUST be independent, deterministic, and fast (<100ms per unit test). No flaky tests permitted in main branch.
- **Mocking Strategy**: External services (AI APIs, databases) MUST be mocked in unit tests. Integration tests MAY use test environments but MUST NOT depend on production services.
- **Test Documentation**: Each test file MUST have a header explaining what's being tested and why. Complex test scenarios MUST include comments.

**Rationale**: TDD ensures correctness before implementation, reduces debugging time, and serves as living documentation. High test coverage enables confident refactoring and prevents regressions.

### III. User Experience Consistency

User-facing features MUST deliver predictable, high-quality experiences:

- **API Response Format**: All API responses MUST follow a consistent JSON structure:
  ```json
  {
    "success": true/false,
    "data": {...},
    "error": { "code": "ERROR_CODE", "message": "Human-readable" },
    "meta": { "timestamp": "ISO8601", "requestId": "uuid" }
  }
  ```
- **Error Messages**: User-facing errors MUST be actionable (tell users what to do next). Technical details MUST be logged but NOT exposed to end users.
- **Validation**: Input validation MUST happen early with clear, specific error messages. Validation rules MUST be consistent across all entry points (API, CLI, UI).
- **Documentation**: User-facing features MUST have quickstart documentation in `docs/` with working examples. Breaking changes MUST include migration guides.
- **Accessibility**: Text outputs MUST be readable (no jargon without explanation). CLI tools MUST support `--help` and `--version` flags.
- **Idempotency**: State-changing operations MUST be idempotent where possible. Retry behavior MUST be documented and safe.

**Rationale**: Consistency reduces cognitive load, enables users to build accurate mental models, and minimizes support burden. Predictable behavior builds trust and adoption.

### IV. Performance Requirements

## Quality Gates

All features MUST pass these gates before merging:

### Pre-Implementation
- [ ] Constitution compliance verified (all principles addressed in spec)
- [ ] User stories independently testable and prioritized
- [ ] Technical approach documented with performance considerations

### Implementation
- [ ] All tests written first and initially failing
- [ ] Code passes linting and formatting checks
- [ ] Test coverage meets minimums (80% unit, 100% integration)
- [ ] No console.log or debug code in commits

### Pre-Merge
- [ ] All tests passing and deterministic (3 consecutive runs)
- [ ] Performance benchmarks meet targets (if applicable)
- [ ] Documentation updated (code comments, user docs, CHANGELOG)
- [ ] Code review approved by at least one team member
- [ ] No unhandled errors or warnings in test runs

## Development Workflow

### Feature Development Process
1. **Specification**: Create feature spec following `spec-template.md` with testable user stories
2. **Planning**: Generate implementation plan with `plan-template.md` including Constitution Check
3. **Task Breakdown**: Create tasks with `tasks-template.md` organized by user story priority
4. **Test-First Implementation**: For each task:
   - Write failing tests
   - Implement minimum code to pass tests
   - Refactor while keeping tests green
   - Commit with descriptive message
5. **Validation**: Run full test suite, linting, and checklist before PR
6. **Review**: Address feedback, maintain test coverage
7. **Merge**: Squash commits if needed, update CHANGELOG

### Branching Strategy
- **Main branch**: Always deployable, all tests passing
- **Feature branches**: `###-feature-name` format (e.g., `001-ai-text-generation`)
- **Hotfix branches**: `hotfix-###-description` format

### Commit Standards
- Format: `type(scope): description` (e.g., `feat(api): add rate limiting`)
- Types: feat, fix, docs, test, refactor, perf, chore
- Description: Imperative mood, lowercase, no period, <72 chars

## Governance

### Constitution Authority
This constitution supersedes all other development practices and guides. Any conflicts between this constitution and other documentation MUST be resolved in favor of the constitution.

### Amendment Process
Constitution amendments require:
1. **Proposal**: Document rationale, impact analysis, and migration plan
2. **Review**: Team review and approval (consensus or designated authority)
3. **Version Update**: Semantic versioning (MAJOR.MINOR.PATCH)
   - MAJOR: Breaking changes to principles or governance
   - MINOR: New principles or significant expansions
   - PATCH: Clarifications, typo fixes, non-semantic changes
4. **Propagation**: Update all affected templates and documentation
5. **Communication**: Announce changes with migration timeline

### Compliance Review
- **Per-Feature**: Constitution Check section in every plan.md
- **Per-PR**: Reviewer MUST verify constitution compliance
- **Quarterly**: Team reviews constitution relevance and effectiveness
- **Violations**: MUST be documented in Complexity Tracking section with justification

### Enforcement
- Automated: Linting, formatting, test coverage checks in CI/CD
- Manual: Code review checklist includes constitution compliance
- Escalation: Persistent violations require team discussion and process improvement

**Version**: 1.0.0 | **Ratified**: 2025-11-24 | **Last Amended**: 2025-11-24
