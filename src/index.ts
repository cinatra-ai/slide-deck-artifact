import type { SemanticArtifactManifest } from "@cinatra-ai/sdk-extensions";

// `@cinatra-ai/slide-deck-artifact` covers slide decks (pitch / sales /
// conference / training decks) as semantic artifacts. Distinct from generic
// blog-post / contract / document classes.
//
// Scope: bytes-only matcher; application/pdf ONLY. The .pptx / .ppt native
// formats are NOT in the LLM attachment capability registry, so exported PDFs
// are the supported ingestion path. Adding the office formats requires a
// capability-registry expansion.
//
// THE DISPLAY. `ui.renderers.detail` registers this pack's own display for its
// own type at PROPS VERSION 2 — the version that carries the island-scoped byte
// reference, without which a deck paints nothing inside a third-party
// application. The display writes NO viewer: the pdf form is drawn by the one
// shared pdf shell the host ships for every pdf reading in the fleet, and a
// presentation that reaches the display anyway takes the named OpenXML road of
// the office-document display rather than a blank panel.
export const slideDeckArtifactManifest: SemanticArtifactManifest = {
  accepts: {
    file: {
      mimeTypes: ["application/pdf"],
    },
  },
  ui: {
    abiVersion: 1,
    sdkAbiRange: "^2.5.0",
    renderers: {
      detail: {
        entry: "./src/renderers/detail.tsx",
        propsApiVersion: 2,
        representations: ["application/pdf"],
      },
    },
  },
  skills: {
    matchers: ["@cinatra-ai/slide-deck-matcher-skill:slide-deck-matcher"],
  },
  matcherConfidenceThreshold: 0.7,
  objectTypes: [
    {
      type: "@cinatra-ai/slide-deck:deck",
      claim: "dedicated",
      dispositions: {
        projection: "artifact-safe",
        pinnable: true,
        snapshotPolicy: "content",
        sensitivity: "normal",
      },
      schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          slideCount: {
            type: "number",
          },
          runId: {
            type: "string",
          },
        },
        additionalProperties: true,
      },
    },
  ],
};
