# Testing Patterns

**Analysis Date:** 2026-06-09

## Test Framework

**Runner:**
- Not detected — no test runner is configured in `package.json` (no `scripts.test` entry, no jest/vitest/mocha config file)

**Assertion Library:**
- Not detected

**Run Commands:**
```bash
# No test script defined in package.json
# CI skips standalone test execution for this repo:
#   "Skipping standalone tests (host-internal @cinatra-ai/* peers — the cinatra monorepo runs these)."
corepack pnpm test --if-present   # CI command (no-ops when no test script present)
```

## Why Tests Are Absent

This repository is a **source mirror** extracted from the cinatra monorepo. It declares `@cinatra-ai/sdk-extensions` as an optional peer dependency, which is never published to a registry and is only resolvable inside the host monorepo workspace. As documented in `.github/workflows/ci.yml`:

> "Host-internal-peer repos can't run their tests standalone (the tests import @cinatra-ai/* sources that resolve only in the monorepo); the monorepo runs them."

The CI `build` job detects this condition by checking for first-party peer dependencies and sets `first_party=1`, which causes the Test step to exit early with a skip message.

## Test File Organization

**Location:** No test files present in this repository

**Expected pattern (monorepo side):**
- Tests for this package live in the cinatra monorepo alongside the resolved `@cinatra-ai/sdk-extensions` source
- Test placement, naming, and runner are governed by monorepo conventions, not this repo

## CI Validation (Substitute for Standalone Tests)

While unit tests do not run standalone, the CI pipeline (`ci.yml`) enforces correctness through structural validation:

**Dependency shape gate (`build` job, "Classify repo" step):**
- Asserts no first-party `@cinatra-ai/*` packages leaked into `dependencies`, `devDependencies`, or `optionalDependencies`
- Asserts all first-party peers have `peerDependenciesMeta[pkg].optional === true`
- Implemented as an inline `node -e` script — zero external dependencies

**Pack dry-run (`build` job, "Pack (dry run)" step):**
- Runs `npm pack --dry-run` to validate package shape and publish payload without resolving peers
- Catches missing files, bad `main`/`types` pointers, and manifest errors

**Kind-specific gate (`kind-gates` job):**
- Runs after `build` via `needs: build`
- For `artifact` kind (this repo): no extra gate today — step echoes "No kind-specific gate for this extension kind."

## Mocking

Not applicable — no runtime logic to mock; the package exports a single static manifest object.

## Fixtures and Factories

Not applicable — no test infrastructure present.

## Coverage

**Requirements:** Not enforced (no test runner configured)

## Test Types

**Unit Tests:** Run in cinatra monorepo only, not in this extracted repo

**Integration Tests:** Not applicable

**E2E Tests:** Not applicable

## Skill Classifier Correctness

The `skills/slide-deck-matcher/SKILL.md` classifier is validated implicitly by the monorepo's LLM-in-the-loop test harness (not present here). The skill's output contract is:

```json
{ "matches": true, "confidence": 0.87, "rationale": "Landscape orientation, one-idea-per-page..." }
```

Confidence threshold for a positive match: `0.7` (set in `package.json` `cinatra.artifact.matcherConfidenceThreshold` and mirrored in `src/index.ts`).

---

*Testing analysis: 2026-06-09*
