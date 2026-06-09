# Coding Conventions

**Analysis Date:** 2026-06-09

## Naming Patterns

**Files:**
- TypeScript source files use camelCase: `src/index.ts`
- Skill definition files use kebab-case directories: `skills/slide-deck-matcher/SKILL.md`
- Workflow configs use UPPERCASE: `SKILL.md`, `LICENSE`, `README.md`

**Exports:**
- Named exports only; no default exports detected
- Export names use camelCase with descriptive suffixes: `slideDeckArtifactManifest`
- Export names mirror the artifact/package name in camelCase: `slideDeckArtifactManifest` for `@cinatra-ai/slide-deck-artifact`

**Variables:**
- camelCase for all TypeScript identifiers
- `const` preferred (only `const` observed in `src/index.ts`)

**Types:**
- Type imports use `import type` syntax (verbatimModuleSyntax enforced): `import type { SemanticArtifactManifest } from "@cinatra-ai/sdk-extensions"`
- No inline type aliases detected; types are imported from `@cinatra-ai/sdk-extensions`

## Code Style

**Formatting:**
- No Prettier or Biome config detected in repo root
- Formatting is governed by the host monorepo (this is a source mirror extracted from the cinatra monorepo)

**Linting:**
- No ESLint config detected in repo root
- Linting is governed by the host monorepo

**TypeScript strictness (`tsconfig.json`):**
- `strict: true` — enables all strict checks
- `noImplicitAny: false` — explicit any is allowed where needed
- `verbatimModuleSyntax: true` — enforces `import type` for type-only imports
- `isolatedModules: true` — each file must be independently compilable
- `target: ES2023`, `module: ESNext`, `moduleResolution: bundler`

## Import Organization

**Order (observed in `src/index.ts`):**
1. Type imports from external packages (`import type { ... } from "@cinatra-ai/..."`)
2. No value imports observed (package is manifest-only)

**Path Aliases:**
- None detected; bare package specifiers used for all imports

**Import style:**
- `import type` required for type-only imports (enforced by `verbatimModuleSyntax`)

## Error Handling

**Patterns:**
- Not applicable — `src/index.ts` is a pure manifest export with no runtime logic or error paths
- CI validation uses `process.exit(2)` for shape regressions in `.github/workflows/ci.yml` inline Node.js scripts

## Logging

**Framework:** Not applicable — no runtime code; this package is a static manifest

**CI logging:**
- `echo "::error::"` GitHub Actions annotation format used in `.github/workflows/ci.yml` for CI errors

## Comments

**When to Comment:**
- Block comments explain non-obvious constraints: the `.pptx`/`.ppt` exclusion rationale is documented in `src/index.ts` lines 3–9
- CI YAML uses inline comments extensively to document skipping logic and ordering rules

**JSDoc/TSDoc:**
- Not used — the single export is self-documenting via its type (`SemanticArtifactManifest`)

## Module Design

**Exports:** Single named export per file (`src/index.ts` exports `slideDeckArtifactManifest`)

**Barrel Files:** `src/index.ts` acts as the sole entry and barrel — `package.json` points `"main"` and `"types"` directly to `./src/index.ts`

**ESM-only:** `"type": "module"` in `package.json`; no CommonJS compatibility

## Dependency Shape Rules

**Enforced by CI (`ci.yml`):**
- First-party `@cinatra-ai/*` packages MUST be declared as `peerDependencies` only, never `dependencies` / `devDependencies` / `optionalDependencies`
- All first-party peers MUST be marked `peerDependenciesMeta[pkg].optional: true`
- Violations cause `exit 2` → CI failure with a descriptive error message

## Skill Definition Conventions (`skills/*/SKILL.md`)

- YAML front matter with `name` and `description` fields
- Classifier skills output strict JSON only: `{ "matches": <boolean>, "confidence": <number 0..1>, "rationale": "<string>" }`
- Confidence bands documented inline (0.85–0.95 / 0.70–0.84 / 0.50–0.69 / <0.50)
- Positive and negative examples explicitly listed in `## What ... IS` and `## What ... is NOT` sections

---

*Convention analysis: 2026-06-09*
