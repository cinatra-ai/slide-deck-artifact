# Codebase Concerns

**Analysis Date:** 2026-06-09

## Tech Debt

**PDF-only ingestion with no upgrade path documented:**
- Issue: `src/index.ts` explicitly accepts only `application/pdf` MIME type; native `.pptx` / `.ppt` formats are excluded because "the LLM attachment capability registry does not support them." No migration story or issue tracking link exists.
- Files: `src/index.ts` (comment block lines 6-10), `package.json` (`cinatra.artifact.accepts`)
- Impact: Users who upload `.pptx` files get no match and no error message — silent rejection. The workaround (export to PDF) is undocumented to end-users.
- Fix approach: Either expand the capability registry to include `application/vnd.openxmlformats-officedocument.presentationml.presentation` and `application/vnd.ms-powerpoint`, or expose a user-visible error / conversion hint in the matcher response.

**Hardcoded confidence threshold with no tunability:**
- Issue: `matcherConfidenceThreshold: 0.7` is baked into both `src/index.ts` and `package.json` with no environment-level or caller-level override mechanism.
- Files: `src/index.ts` (line 21), `package.json` (line 33)
- Impact: Borderline PDFs (confidence 0.50–0.69 per the SKILL.md guidance) are silently rejected. No A/B tuning or per-tenant configuration is possible without a code change.
- Fix approach: Expose `matcherConfidenceThreshold` as a configurable field in the manifest factory, or document it as an intentional hard limit.

**Manifest duplication between source and package.json:**
- Issue: The `cinatra.artifact` block in `package.json` (lines 16-35) is a verbatim copy of the runtime manifest exported from `src/index.ts`. Any change to one must be manually mirrored to the other.
- Files: `src/index.ts`, `package.json`
- Impact: Schema drift risk — if `src/index.ts` is updated without updating `package.json`, the build-time gate and runtime behavior silently diverge.
- Fix approach: Generate the `cinatra` block in `package.json` from `src/index.ts` as a build step, or treat `package.json` as the single source of truth and import from it in `src/index.ts` using `resolveJsonModule`.

## Known Bugs

**Not detected** — the codebase is too small (one source file, one SKILL.md) to exhibit runtime bugs. No TODOs or FIXMEs present.

## Security Considerations

**SKILL.md prompt-injection surface:**
- Risk: `skills/slide-deck-matcher/SKILL.md` is a raw LLM system prompt. A maliciously crafted PDF whose text layer mimics the matcher's output contract (`{"matches":true,"confidence":0.99,...}`) could attempt to override the classifier's response.
- Files: `skills/slide-deck-matcher/SKILL.md`
- Current mitigation: The prompt instructs the model to "Respond with JSON ONLY, no markdown wrapper," which is a structural guard but not a sandboxing guarantee.
- Recommendations: Validate the classifier's JSON response against a strict schema (boolean `matches`, numeric `confidence` in 0..1, string `rationale`) before trusting it; reject responses that do not parse cleanly.

**`.npmrc` committed with `auto-install-peers=false`:**
- Risk: The `.npmrc` file is committed to the repository. If registry credentials or auth tokens are ever added here (a common mistake), they would be exposed in the public repo.
- Files: `.npmrc`
- Current mitigation: Present contents are non-sensitive (one flag only).
- Recommendations: Add `.npmrc` to `.gitignore` if auth tokens are ever needed; use GitHub Actions secrets for registry auth instead.

**Release workflow inherits all org secrets:**
- Risk: `.github/workflows/release.yml` uses `secrets: inherit`, passing every org-level secret to the reusable workflow. If the reusable workflow (`cinatra-ai/.github`) is ever compromised or misconfigured, all org secrets are exposed.
- Files: `.github/workflows/release.yml` (line 30)
- Current mitigation: The reusable workflow is pinned to `@main` (not a SHA), so any upstream change is automatically trusted — no pin protection.
- Recommendations: Pin the reusable workflow to a commit SHA rather than `@main`; scope `secrets: inherit` to only the required `CINATRA_MARKETPLACE_VENDOR_TOKEN`.

## Performance Bottlenecks

**Not applicable** — this package is a static manifest + LLM prompt with no runtime computation path. All classification performance depends on the upstream LLM inference infrastructure, not this repo.

## Fragile Areas

**CI skip logic based on first-party peer detection:**
- Files: `.github/workflows/ci.yml` (lines 47-69)
- Why fragile: The CI decision to skip install/typecheck/test is made by inline Node.js `require('./package.json')` inside a shell `node -e` string. Exit code `0` = source mirror (skip), exit code `1` = standalone (run), exit code `2` = regression error. This three-way exit-code contract is non-obvious and brittle; any accidental `process.exit()` in the inline script would misclassify the repo type.
- Safe modification: When modifying `package.json` peer dependency declarations, verify the CI classification step still exits with the intended code (0 for this repo, since it has a first-party peer).
- Test coverage: No automated test for this CI gate logic.

**Reusable release workflow is dormant:**
- Files: `.github/workflows/release.yml`
- Why fragile: The workflow comment explicitly states it is "Dormant until the org infra exists." A GitHub Release triggered now would invoke a non-existent reusable workflow and fail silently or with a cryptic error.
- Safe modification: Do not publish a GitHub Release until the `cinatra-ai/.github` reusable workflow and `CINATRA_MARKETPLACE_VENDOR_TOKEN` secret are confirmed live.

## Scaling Limits

**Single-skill matcher, no fallback:**
- Current capacity: One matcher skill (`slide-deck-matcher`) with a fixed 0.7 confidence threshold.
- Limit: If the LLM returns a confidence between 0.5 and 0.69 for a genuine slide deck, the artifact is permanently rejected with no escalation path.
- Scaling path: Add a secondary matcher or a human-review escalation route for the 0.50–0.69 borderline band documented in `skills/slide-deck-matcher/SKILL.md`.

## Dependencies at Risk

**`@cinatra-ai/sdk-extensions` pinned to `*` (wildcard):**
- Risk: `peerDependencies` declares `"@cinatra-ai/sdk-extensions": "*"`, meaning any version is accepted. A breaking change in the SDK would not be caught at install time.
- Files: `package.json` (line 9)
- Impact: Silent type mismatch if `SemanticArtifactManifest` shape changes in a future SDK version.
- Migration plan: Pin to a minimum semver range (e.g., `">=0.1.0 <2"`) once the SDK reaches a stable release.

**No lockfile committed:**
- Risk: CI runs `pnpm install --no-frozen-lockfile` for standalone repos (not this one, but the pattern is set). For truly standalone extensions this means non-reproducible installs.
- Files: `.github/workflows/ci.yml` (line 81)
- Impact: Transitive dependency upgrades between CI runs can introduce unexpected behavior.
- Migration plan: Commit a lockfile and use `--frozen-lockfile` for standalone repos.

## Missing Critical Features

**No input validation on matcher JSON response:**
- Problem: `skills/slide-deck-matcher/SKILL.md` specifies an output contract but there is no schema-validation layer in this repo that enforces it.
- Blocks: Reliable downstream consumption of `matches`, `confidence`, and `rationale` fields.

**No user-facing documentation for the PDF-only constraint:**
- Problem: `README.md` describes the artifact as covering "pitch decks, sales decks, conference talks..." without mentioning the PDF-only ingestion requirement.
- Files: `README.md`
- Blocks: Users who upload `.pptx` files receive no guidance.

## Test Coverage Gaps

**No tests exist:**
- What's not tested: The manifest structure exported from `src/index.ts`, the confidence threshold value, and the SKILL.md prompt behavior.
- Files: `src/index.ts`, `skills/slide-deck-matcher/SKILL.md`
- Risk: Regressions in the manifest schema (e.g., wrong MIME type, wrong threshold) would not be caught before release.
- Priority: High — a snapshot/unit test asserting the exported manifest shape would catch the most likely class of regressions (manifest duplication drift) with minimal effort.

**No integration test for the matcher skill:**
- What's not tested: Whether the LLM classifier correctly identifies slide-deck PDFs vs. prose PDFs using the SKILL.md prompt.
- Risk: Prompt regressions (accidental edits to `SKILL.md`) are invisible until production classification degrades.
- Priority: Medium — an eval harness with fixture PDFs (one landscape deck, one portrait whitepaper) would provide a regression signal.

---

*Concerns audit: 2026-06-09*
