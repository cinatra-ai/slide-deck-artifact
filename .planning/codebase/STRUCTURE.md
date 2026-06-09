# Codebase Structure

**Analysis Date:** 2026-06-09

## Directory Layout

```
slide-deck-artifact/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Baseline CI gate (build, typecheck, pack dry-run)
│       └── release.yml     # Versioned release pipeline
├── .planning/
│   └── codebase/           # GSD codebase map documents (this directory)
├── skills/
│   └── slide-deck-matcher/
│       └── SKILL.md        # LLM classification prompt for slide deck vs prose
├── src/
│   └── index.ts            # Package entry point — exports slideDeckArtifactManifest
├── .npmrc                  # npm/pnpm registry configuration
├── LICENSE                 # Apache-2.0
├── README.md               # User-facing capability description
├── package.json            # Package manifest + Cinatra platform registration block
└── tsconfig.json           # Standalone TypeScript config (ES2023, ESNext modules)
```

## Directory Purposes

**`src/`:**
- Purpose: TypeScript source — the sole package entry point
- Contains: `index.ts` only; exports the `SemanticArtifactManifest` constant
- Key files: `src/index.ts`

**`skills/`:**
- Purpose: Cinatra skill definitions (prompt-only, no code)
- Contains: One subdirectory per skill; each contains a `SKILL.md` with YAML frontmatter and LLM prompt body
- Key files: `skills/slide-deck-matcher/SKILL.md`

**`.github/workflows/`:**
- Purpose: GitHub Actions CI/CD pipelines
- Contains: `ci.yml` (baseline gate shared across all extracted Cinatra extension repos), `release.yml` (release automation)
- Key files: `.github/workflows/ci.yml`

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents consumed by planning and execution agents
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/index.ts`: TypeScript package entry — exports `slideDeckArtifactManifest`

**Configuration:**
- `package.json`: NPM package metadata + `cinatra` block (platform registration)
- `tsconfig.json`: TypeScript compiler config (standalone, extends nothing)
- `.npmrc`: Registry/auth configuration (existence noted; contents not read)

**Core Logic:**
- `src/index.ts`: The manifest constant (MIME type acceptance, skill linkage, confidence threshold)
- `skills/slide-deck-matcher/SKILL.md`: All classification intelligence (LLM prompt)

**CI/CD:**
- `.github/workflows/ci.yml`: Build, typecheck, dependency-shape validation, pack dry-run
- `.github/workflows/release.yml`: Release automation

## Naming Conventions

**Files:**
- TypeScript sources: `camelCase.ts` (e.g., `index.ts`)
- Skills: `kebab-case/SKILL.md` — subdirectory named after the skill, file always `SKILL.md`
- Workflows: `kebab-case.yml`

**Directories:**
- Skills: `kebab-case` matching the skill name declared in `package.json` (`cinatra.artifact.skills.matchers`)
- Source: flat `src/` with no subdirectories (single-file package)

**Exports:**
- Named exports only; the manifest constant uses `camelCase` with a descriptive suffix: `slideDeckArtifactManifest`

**Package name:**
- Scoped under `@cinatra-ai/`; kebab-case with `-artifact` suffix: `@cinatra-ai/slide-deck-artifact`

## Where to Add New Code

**New matcher skill:**
- Create `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`) and prompt body
- Register the skill in `src/index.ts` under `skills.matchers` and mirror in `package.json` → `cinatra.artifact.skills.matchers`

**New TypeScript export:**
- Add to `src/index.ts` (or create additional `.ts` files under `src/` and re-export from `src/index.ts`)
- `tsconfig.json` already includes `src/**/*.ts`

**Additional accepted MIME types:**
- Update `accepts.file.mimeTypes` in both `src/index.ts` and the `cinatra.artifact.accepts` block in `package.json`
- Note: `.pptx`/`.ppt` require a capability-registry expansion before they can be added

## Special Directories

**`skills/`:**
- Purpose: Houses prompt-only LLM skill definitions; no compiled output
- Generated: No
- Committed: Yes

**`dist/`:**
- Purpose: TypeScript compilation output (`outDir` in `tsconfig.json`)
- Generated: Yes (by `tsc`)
- Committed: No (not tracked; monorepo handles compilation)

**`.planning/`:**
- Purpose: GSD agent planning artifacts
- Generated: Yes
- Committed: Yes

---

*Structure analysis: 2026-06-09*
