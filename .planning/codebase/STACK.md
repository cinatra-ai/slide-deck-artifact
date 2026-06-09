# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- TypeScript (ES2023 target) - sole source language, `src/index.ts`

**Secondary:**
- Not applicable — no secondary language detected

## Runtime

**Environment:**
- Node.js 24 (specified in CI via `actions/setup-node@v4`, `.github/workflows/ci.yml`)

**Package Manager:**
- pnpm (via corepack) — version unspecified, resolved through `corepack enable`
- Lockfile: not committed (CI runs `--no-frozen-lockfile`)

## Frameworks

**Core:**
- No application framework — this is a Cinatra platform artifact extension (manifest + LLM skill only)

**Testing:**
- Not applicable — no test runner configured; tests are run by the host cinatra monorepo

**Build/Dev:**
- TypeScript compiler (`tsc`) — standalone `tsconfig.json` at repo root
- `npm pack --dry-run` used in CI to validate package shape

## Key Dependencies

**Critical:**
- `@cinatra-ai/sdk-extensions` (peer, optional) — provides the `SemanticArtifactManifest` type consumed in `src/index.ts`; resolved only inside the cinatra monorepo, never from a public registry

**Infrastructure:**
- No runtime dependencies declared in `package.json`
- No devDependencies declared

## Configuration

**Environment:**
- No `.env` files present
- No environment variables required at runtime — this is a source-mirror artifact extension, not a standalone runnable service

**Build:**
- `tsconfig.json` — standalone strict TypeScript config; targets `ES2023`, `ESNext` modules, `bundler` module resolution, outputs to `dist/`, includes declaration maps and source maps
- `.npmrc` — present (contents not read); likely configures registry scope for `@cinatra-ai/*`
- `package.json` — `cinatra` manifest block declares `apiVersion: cinatra.ai/v1`, `kind: artifact`, accepted MIME types, and matcher skill references

## Platform Requirements

**Development:**
- Node.js 24+, corepack/pnpm
- Must be developed inside or alongside the cinatra monorepo — `@cinatra-ai/sdk-extensions` types are not on any public registry
- TypeScript types are provided by the monorepo workspace; standalone `tsc` is skipped in CI when first-party peers are declared

**Production:**
- Deployed as a Cinatra Marketplace extension via the `release.yml` GitHub Actions workflow
- Publishing path: GitHub Release tag → `cinatra-ai/.github` reusable workflow → marketplace MCP proxy submission → `registry.cinatra.ai`
- Build provenance attestation via OIDC (`id-token: write`, `attestations: write`)
- No server/container deployment — the extension is consumed by the Cinatra platform runtime

---

*Stack analysis: 2026-06-09*
