import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import {
  HOST_PROPS_API_VERSION,
  HOST_PROPS_BYTE_REFERENCE_VERSION,
  HOST_PROPS_V2_BYTES_FIELDS,
  HOST_PROPS_V2_FIELDS,
  rendererPropsShapeDrift,
  type ArtifactRendererProps,
} from "../src/renderer-props";
import SlideDeckDetailRenderer from "../src/renderers/detail";
import {
  DECK_OPENXML_PRESENTATION_MIME,
  DECK_PDF_MIME,
  SLIDE_DECK_DISPLAY_CONFORMANCE_ID,
  resolveDeckView,
} from "../src/renderers/deck-view";
import { resetShellMounts, shellMounts } from "./doubles/pdf-detail-shell";

const require_ = createRequire(import.meta.url);
const manifest = require_("../package.json");

const ISLAND_PREVIEW = "/api/lifecycle-views/artifact-bytes?bc=sealed-preview";
const ISLAND_DOWNLOAD = "/api/lifecycle-views/artifact-bytes?bc=sealed-download";
const SESSION_PREVIEW = "/api/artifacts/art_9/versions/rev_9ac3/preview";
const SESSION_DOWNLOAD = "/api/artifacts/art_9/versions/rev_9ac3/download";

function props(overrides: Partial<ArtifactRendererProps> = {}): ArtifactRendererProps {
  return {
    propsApiVersion: 2,
    artifact: {
      id: "art_9",
      title: "Q3 business review",
      objectType: "@cinatra-ai/slide-deck:deck",
      mime: DECK_PDF_MIME,
      size: 1_048_576,
      createdAt: "2026-08-31T09:00:00.000Z",
      updatedAt: "2026-08-31T09:00:00.000Z",
      ownerLevel: "workspace",
      visibility: "team",
      sourceUrl: null,
    },
    representation: { revisionId: "rev_9ac3", mime: DECK_PDF_MIME },
    urls: { preview: SESSION_PREVIEW, download: SESSION_DOWNLOAD },
    identity: { kind: "extension", extension: "@cinatra-ai/slide-deck-artifact" },
    actions: { download: SESSION_DOWNLOAD, openInSource: null },
    content: {
      kind: "none",
      channelVersion: 1,
      representationRevisionId: "rev_9ac3",
      reason: "unsupported-form",
    },
    bytes: { road: "island", preview: ISLAND_PREVIEW, download: ISLAND_DOWNLOAD },
    ...overrides,
  };
}

beforeEach(() => {
  resetShellMounts();
});

describe("the manifest declares the display at the new props version", () => {
  const artifact = manifest.cinatra.artifact;

  it("registers a detail renderer for the form its type accepts", () => {
    expect(artifact.ui.renderers.detail.propsApiVersion).toBe(HOST_PROPS_API_VERSION);
    expect(artifact.ui.renderers.detail.entry).toBe("./src/renderers/detail.tsx");
    expect(artifact.ui.renderers.detail.representations).toEqual([DECK_PDF_MIME]);
    // Every form the type accepts, and no form it does not.
    expect(artifact.ui.renderers.detail.representations).toEqual(
      artifact.accepts.file.mimeTypes,
    );
  });

  it("resolves the display through the package's own exports map", async () => {
    expect(manifest.exports["./src/renderers/detail"].default).toBe(
      "./src/renderers/detail.tsx",
    );
    const mod = await import("../src/renderers/detail");
    expect(typeof mod.default).toBe("function");
  });

  it("declares the host's UI package as an optional peer, never a dependency", () => {
    expect(manifest.peerDependencies["@cinatra-ai/sdk-ui"]).toBeTruthy();
    expect(manifest.peerDependenciesMeta["@cinatra-ai/sdk-ui"].optional).toBe(true);
    expect(manifest.dependencies?.["@cinatra-ai/sdk-ui"]).toBeUndefined();
    expect(manifest.devDependencies?.["@cinatra-ai/sdk-ui"]).toBeUndefined();
  });
});

describe("the props mirror matches the host's version-2 shape", () => {
  it("names the version the byte reference arrives at", () => {
    expect(HOST_PROPS_API_VERSION).toBe(2);
    expect(HOST_PROPS_BYTE_REFERENCE_VERSION).toBe(2);
    expect(HOST_PROPS_V2_FIELDS).toContain("bytes");
    expect(HOST_PROPS_V2_BYTES_FIELDS).toEqual(["road", "preview", "download"]);
  });

  it("reports no drift for a host-shaped version-2 snapshot, and catches drift", () => {
    expect(rendererPropsShapeDrift(props())).toEqual([]);
    expect(rendererPropsShapeDrift(props({ propsApiVersion: 1 }))).toContain(
      "bytes: present on a snapshot below version 2",
    );
    expect(rendererPropsShapeDrift({ ...props(), extra: true })).toContain(
      "extra: not a field of the host version-2 snapshot",
    );
  });
});

describe("the pdf form is drawn by the shared previewer, never by a viewer of our own", () => {
  it("mounts the shared shell over the island byte addresses", () => {
    const html = renderToStaticMarkup(createElement(SlideDeckDetailRenderer, props()));
    expect(shellMounts).toEqual([
      {
        previewHref: ISLAND_PREVIEW,
        downloadHref: ISLAND_DOWNLOAD,
        slot: "detail",
      },
    ]);
    expect(html).toContain('data-double="pdf-detail-shell"');
    expect(html).not.toContain(SESSION_PREVIEW);
    expect(html).toContain('data-form="pdf"');
    expect(html).toContain('data-byte-road="island"');
  });

  it("hands the shell the session road unchanged on a cookie surface", () => {
    renderToStaticMarkup(
      createElement(
        SlideDeckDetailRenderer,
        props({
          bytes: { road: "session", preview: SESSION_PREVIEW, download: SESSION_DOWNLOAD },
        }),
      ),
    );
    expect(shellMounts[0].previewHref).toBe(SESSION_PREVIEW);
  });

  it("leaves the floor to the shell by handing it a null address, never a blank of its own", () => {
    renderToStaticMarkup(
      createElement(
        SlideDeckDetailRenderer,
        props({ bytes: { road: "island", preview: null, download: ISLAND_DOWNLOAD } }),
      ),
    );
    expect(shellMounts).toEqual([
      { previewHref: null, downloadHref: ISLAND_DOWNLOAD, slot: "detail" },
    ]);
  });

  it("imports the shared shell and writes no previewer of its own", async () => {
    const source = await readFile(
      new URL("../src/renderers/detail.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("@cinatra-ai/sdk-ui/artifacts/pdf-detail-shell");
    expect(source).not.toMatch(/<embed/);
    expect(source).not.toMatch(/pdfjs|react-pdf/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });
});

describe("the presentation form takes the OpenXML deck road", () => {
  const presentation = () =>
    props({
      artifact: { ...props().artifact, mime: DECK_OPENXML_PRESENTATION_MIME },
      representation: { revisionId: "rev_9ac3", mime: DECK_OPENXML_PRESENTATION_MIME },
    });

  it("resolves to the OpenXML road, not to the pdf previewer", () => {
    expect(resolveDeckView(presentation())).toEqual({
      kind: "openxml",
      downloadHref: ISLAND_DOWNLOAD,
    });
    renderToStaticMarkup(createElement(SlideDeckDetailRenderer, presentation()));
    expect(shellMounts).toEqual([]);
  });

  it("names the road without claiming a viewer it never mounted", () => {
    const html = renderToStaticMarkup(
      createElement(SlideDeckDetailRenderer, presentation()),
    );
    // The office-document display owns that viewer; this display mounts none,
    // so it must not tell the reader one drew the deck in front of them.
    expect(html).not.toContain("read through the embedded OpenXML viewer");
    expect(html).toContain("office-document display, not here");
    expect(shellMounts).toEqual([]);
  });

  it("draws the named road with its download affordance, never a blank", () => {
    const html = renderToStaticMarkup(
      createElement(SlideDeckDetailRenderer, presentation()),
    );
    expect(html).toContain('data-form="presentation"');
    expect(html).toContain('data-openxml-road="office-document"');
    expect(html).toContain(`href="${ISLAND_DOWNLOAD}"`);
    expect(html).toContain("Download presentation");
    expect(html.length).toBeGreaterThan(0);
  });
});

describe("the floors — typed, never blank", () => {
  it("refuses to render when the host offers an older props version", () => {
    const older = props({ propsApiVersion: 1 });
    delete (older as { bytes?: unknown }).bytes;
    expect(resolveDeckView(older)).toEqual({
      kind: "floor",
      reason: "props-version-too-old",
    });
    const html = renderToStaticMarkup(createElement(SlideDeckDetailRenderer, older));
    expect(shellMounts).toEqual([]);
    expect(html).toContain('data-floor="props-version-too-old"');
    expect(html).toContain("This deck needs a newer display contract");
    expect(html.length).toBeGreaterThan(0);
  });

  it("hands a current, addressless snapshot to the shell rather than the version floor", () => {
    // A v2 snapshot legitimately carries no `bytes` key where the revision has
    // neither address. The pdf form still belongs to the shell, which owns the
    // download floor — the version floor would be a false sentence about the
    // reader's workspace.
    const addressless = props();
    delete (addressless as { bytes?: unknown }).bytes;
    expect(resolveDeckView(addressless)).toEqual({
      kind: "pdf",
      previewHref: null,
      downloadHref: null,
      road: null,
    });
    const html = renderToStaticMarkup(
      createElement(SlideDeckDetailRenderer, addressless),
    );
    expect(shellMounts).toEqual([
      { previewHref: null, downloadHref: null, slot: "detail" },
    ]);
    expect(html).not.toContain("newer display contract");
    expect(html).toContain('data-conformance-id="slide-deck-display"');
  });

  it("floors a form the deck type does not accept, with its download offered", () => {
    const html = renderToStaticMarkup(
      createElement(
        SlideDeckDetailRenderer,
        props({
          artifact: { ...props().artifact, mime: "image/png" },
          representation: { revisionId: "rev_9ac3", mime: "image/png" },
        }),
      ),
    );
    expect(html).toContain('data-floor="unsupported-form"');
    expect(html).toContain(`href="${ISLAND_DOWNLOAD}"`);
  });

  it("refuses an address that carries the work's bytes inline", () => {
    expect(
      resolveDeckView(
        props({
          bytes: {
            road: "island",
            preview: "data:application/pdf;base64,JVBERi0=",
            download: null,
          },
        }),
      ),
    ).toEqual({ kind: "floor", reason: "inline-bytes" });
  });

  it("carries the conformance id on every reading", () => {
    expect(SLIDE_DECK_DISPLAY_CONFORMANCE_ID).toBe("slide-deck-display");
    const older = props({ propsApiVersion: 1 });
    delete (older as { bytes?: unknown }).bytes;
    const readings = [
      renderToStaticMarkup(createElement(SlideDeckDetailRenderer, props())),
      renderToStaticMarkup(createElement(SlideDeckDetailRenderer, older)),
    ];
    for (const html of readings) {
      expect(html).toContain('data-conformance-id="slide-deck-display"');
      expect(html).toContain('data-artifact-renderer="slide-deck"');
      expect(html).toContain('data-slot="detail"');
    }
  });
});
