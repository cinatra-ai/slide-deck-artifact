# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**Cinatra Platform Runtime:**
- Cinatra AI platform — this artifact extension is loaded and executed by the Cinatra platform runtime; the extension does not call external APIs directly
  - SDK/Client: `@cinatra-ai/sdk-extensions` (optional peer, monorepo-internal)
  - Auth: Not applicable — auth is owned by the host platform

**Cinatra Marketplace:**
- `registry.cinatra.ai` — target registry for published extension releases
  - Submission path: GitHub Release → reusable workflow (`cinatra-ai/.github`) → marketplace MCP proxy
  - Auth: `CINATRA_MARKETPLACE_VENDOR_TOKEN` org secret (referenced in `.github/workflows/release.yml`; value not read)

## Data Storage

**Databases:**
- Not applicable — this extension contains no database access; persistence (library storage, search indexing) is managed by the Cinatra host platform

**File Storage:**
- Not applicable — accepted files (`application/pdf`) are handled by the Cinatra platform, not this extension directly

**Caching:**
- Not applicable

## Authentication & Identity

**Auth Provider:**
- Not applicable at the extension level — authentication is delegated entirely to the Cinatra platform runtime

## Monitoring & Observability

**Error Tracking:**
- Not detected — no error tracking SDK present

**Logs:**
- Not applicable — no logging code in extension sources; observability is platform-managed

## CI/CD & Deployment

**Hosting:**
- Cinatra Marketplace / `registry.cinatra.ai`

**CI Pipeline:**
- GitHub Actions — two workflows in `.github/workflows/`
  - `ci.yml`: runs on push/PR to `main`; classifies repo type, conditionally installs deps, typechecks, tests, and dry-run packs
  - `release.yml`: triggered on GitHub Release publication or manual `workflow_dispatch`; delegates to `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main` with OIDC provenance

## Environment Configuration

**Required env vars:**
- None required at runtime for this extension
- `CINATRA_MARKETPLACE_VENDOR_TOKEN` — org-level GitHub secret required only during the release CI workflow for marketplace submission

**Secrets location:**
- GitHub org secrets (not committed to repo)

## Webhooks & Callbacks

**Incoming:**
- Not applicable — this extension exposes no HTTP endpoints

**Outgoing:**
- Not applicable — the extension itself makes no outbound HTTP calls; the Cinatra platform invokes the LLM skill (`skills/slide-deck-matcher/SKILL.md`) and routes results internally

---

*Integration audit: 2026-06-09*
