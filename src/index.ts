import type { SemanticArtifactManifest } from "@cinatra-ai/sdk-extensions";

// `@cinatra-ai/slide-deck-artifact` covers slide decks (pitch / sales /
// conference / training decks) as semantic artifacts. Distinct from generic
// blog-post / contract / document classes.
//
// Scope: bytes-only matcher; application/pdf ONLY. The .pptx / .ppt native
// formats are NOT in the LLM attachment capability registry, so exported PDFs
// are the supported ingestion path. Adding the office formats requires a
// capability-registry expansion.
export const slideDeckArtifactManifest: SemanticArtifactManifest = {
  accepts: {
    file: {
      mimeTypes: ["application/pdf"],
    },
  },
  skills: {
    matchers: ["@cinatra-ai/slide-deck-artifact:slide-deck-matcher"],
  },
  matcherConfidenceThreshold: 0.7,
};
