<!-- refreshed: 2026-06-09 -->
# Architecture

**Analysis Date:** 2026-06-09

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│              Cinatra Monorepo / Host Application             │
│         (provides @cinatra-ai/sdk-extensions at runtime)    │
└──────────────────────────┬──────────────────────────────────┘
                           │ optional peerDependency
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           @cinatra-ai/slide-deck-artifact (this repo)        │
│                                                              │
│  src/index.ts  — SemanticArtifactManifest export             │
│                                                              │
│  cinatra.kind = "artifact"                                   │
│  Accepts: application/pdf only                               │
│  matcherConfidenceThreshold: 0.7                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ references skill by name
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           skills/slide-deck-matcher/SKILL.md                 │
│                                                              │
│  LLM prompt: classifies PDF as slide deck vs prose doc       │
│  Output contract: { matches, confidence, rationale }         │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Artifact manifest | Declares accepted MIME types, linked skills, and confidence threshold | `src/index.ts` |
| Package metadata | Cinatra platform registration (`cinatra.kind`, `artifact` block) | `package.json` |
| Slide-deck matcher skill | LLM prompt that classifies a PDF as slide deck vs prose | `skills/slide-deck-matcher/SKILL.md` |
| CI pipeline | Validates dependency shape, typechecks, packs | `.github/workflows/ci.yml` |
| Release pipeline | Handles versioned releases | `.github/workflows/release.yml` |

## Pattern Overview

**Overall:** Cinatra Semantic Artifact Extension — a source-mirror package extracted from the Cinatra monorepo.

**Key Characteristics:**
- Single-file TypeScript entry point exports one constant (`slideDeckArtifactManifest`) typed by `SemanticArtifactManifest` from `@cinatra-ai/sdk-extensions`.
- All classification logic lives in a prompt-only skill (`SKILL.md`) — no runtime code beyond the manifest declaration.
- The repo is a **source mirror**: `@cinatra-ai/sdk-extensions` is an optional peer dependency resolved only inside the Cinatra monorepo workspace. Standalone install, typecheck, and test are intentionally skipped in CI when first-party peers are detected.
- No build step is required by the extension itself — `main` and `types` both point to `src/index.ts` directly; the monorepo handles compilation.

## Layers

**Manifest Layer:**
- Purpose: Declares the artifact's contract to the Cinatra platform
- Location: `src/index.ts`
- Contains: A single exported `SemanticArtifactManifest` constant
- Depends on: `@cinatra-ai/sdk-extensions` (type-only, optional peer)
- Used by: Cinatra platform runtime and monorepo workspace

**Skill Layer:**
- Purpose: LLM-based classification prompt for determining if a PDF is a slide deck
- Location: `skills/slide-deck-matcher/SKILL.md`
- Contains: Classification rules, confidence guidance, and JSON output contract
- Depends on: Nothing at runtime (prompt only)
- Used by: Cinatra platform skill runner referenced via `@cinatra-ai/slide-deck-artifact:slide-deck-matcher`

**Platform Metadata Layer:**
- Purpose: Registers the extension with the Cinatra artifact registry
- Location: `package.json` (`cinatra` block)
- Contains: `apiVersion`, `kind`, `dependencies`, and the `artifact` configuration object (mirrors `src/index.ts` content)
- Depends on: Nothing
- Used by: Cinatra platform tooling and extraction scripts

## Data Flow

### PDF Classification Path

1. Platform receives a file attachment with MIME type `application/pdf` → consults manifest in `src/index.ts`
2. Manifest specifies `matcherConfidenceThreshold: 0.7` and matcher skill `@cinatra-ai/slide-deck-artifact:slide-deck-matcher`
3. Platform invokes the skill defined in `skills/slide-deck-matcher/SKILL.md` with the PDF as context
4. LLM returns `{ "matches": <bool>, "confidence": <0..1>, "rationale": "<string>" }` (JSON only, no markdown)
5. Platform accepts the artifact if `matches === true && confidence >= 0.7`

**State Management:**
- Stateless — no runtime state. The manifest is a pure constant; the skill is a stateless prompt.

## Key Abstractions

**SemanticArtifactManifest:**
- Purpose: Platform type that describes what files an artifact accepts and which skills classify them
- Examples: `src/index.ts` (the only consumer in this repo)
- Pattern: Imported as a type-only import from `@cinatra-ai/sdk-extensions`; the constant is exported as a named export

**Skill (SKILL.md):**
- Purpose: A prompt-only classification skill with a structured JSON output contract
- Examples: `skills/slide-deck-matcher/SKILL.md`
- Pattern: YAML frontmatter (`name`, `description`) followed by markdown prompt body; output contract is strict JSON

## Entry Points

**Package Entry Point:**
- Location: `src/index.ts`
- Triggers: Imported by Cinatra monorepo workspace or any consumer resolving `@cinatra-ai/slide-deck-artifact`
- Responsibilities: Exports `slideDeckArtifactManifest`

**Platform Registration Entry Point:**
- Location: `package.json` → `cinatra` block
- Triggers: Read by Cinatra platform tooling during artifact registry loading
- Responsibilities: Declares `kind: "artifact"`, accepted MIME types, and linked skill names

## Architectural Constraints

- **Scope:** PDF (`application/pdf`) only. `.pptx`/`.ppt` native formats are explicitly excluded pending a capability-registry expansion.
- **Confidence threshold:** Fixed at `0.7` — classifications below this are rejected even if `matches: true`.
- **Source mirror:** This repo cannot be installed or typechecked standalone because `@cinatra-ai/sdk-extensions` is not published to any registry. The monorepo provides it.
- **No runtime logic:** The extension contains zero executable business logic. All intelligence is in the LLM skill prompt.
- **Global state:** None.
- **Circular imports:** None (single file).

## Anti-Patterns

### Adding `@cinatra-ai/*` to `dependencies` or `devDependencies`

**What happens:** A first-party Cinatra package is placed in `dependencies`, `devDependencies`, or `optionalDependencies` instead of `peerDependencies`.
**Why it's wrong:** These packages are not published to any registry; the CI gate (`ci.yml` classify step) will exit with code 2 and fail the build.
**Do this instead:** Declare them under `peerDependencies` and mark each as `optional: true` in `peerDependenciesMeta` (see `package.json`).

### Embedding classification logic in TypeScript instead of SKILL.md

**What happens:** Slide-deck detection rules are written as TypeScript code rather than as a prompt skill.
**Why it's wrong:** The Cinatra platform routes classification through the skill runner; TypeScript logic would bypass the LLM and produce no output the platform can consume.
**Do this instead:** All classification rules belong in `skills/slide-deck-matcher/SKILL.md` following the existing prompt and output contract.

## Error Handling

**Strategy:** Not applicable — the extension contains no runtime error-handling code. Error handling for skill invocation and confidence thresholding is the responsibility of the Cinatra platform runtime.

**Patterns:**
- CI fails fast (exit 1) on first-party dependency shape regressions (see `.github/workflows/ci.yml`)
- Skill output contract requires strict JSON; malformed responses are handled by the platform

## Cross-Cutting Concerns

**Logging:** Not applicable (no runtime code).
**Validation:** Package shape validated at CI time by the inline Node.js script in `.github/workflows/ci.yml`.
**Authentication:** Not applicable.

---

*Architecture analysis: 2026-06-09*
