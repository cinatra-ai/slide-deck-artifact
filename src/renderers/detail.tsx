// THE SLIDE-DECK DISPLAY (the `detail` slot).
//
// The type had no display of its own until now: a deck was drawn by the foreign
// pdf display. This display is registered for the deck's own type, and it still
// writes no viewer — it EMBEDS the one the fleet already has.
//
// THE PDF FORM IS THE SHARED SHELL'S, WHOLE. The host ships one pdf shell for
// every pdf reading in the fleet — the embedded viewer where the browser's own
// bundled viewer fills the panel and does its own scrolling, and the download
// floor beneath it where there is no preview to show. This display mounts THAT
// shell and adds no page counter, no Previous, no Next and no viewer of its own:
// "no renderer of ours paints a document's pages".
//
// THE PRESENTATION FORM TAKES THE NAMED OPENXML ROAD. Per the drawing, a deck
// handed over in its office format is an office document, and the embedded
// OpenXML viewer arrives with the office-document display's own retrofit.
// Until it is mountable from here, a presentation that reaches this
// display is drawn as that named road with the deck's own download beside it —
// never a blank panel, and never a second previewer forked into this repository.
//
// THE ADDRESSES ARE THE BYTE REFERENCE'S, on whichever road the surface is on,
// so the deck draws the same inside a third-party application as it does on its
// own page. The display fetches no host route of its own.

import type { ReactElement } from "react";

import { PdfDetailShell } from "@cinatra-ai/sdk-ui/artifacts/pdf-detail-shell";

import type { ArtifactRendererProps } from "../renderer-props";
import {
  DECK_FLOOR_MESSAGES,
  DECK_OPENXML_ROAD_MESSAGE,
  SLIDE_DECK_DISPLAY_CONFORMANCE_ID,
  deckDownloadHref,
  resolveDeckView,
} from "./deck-view";

function DeckDownload({
  downloadHref,
}: {
  readonly downloadHref: string | null;
}): ReactElement {
  if (downloadHref === null) {
    return (
      <p className="text-muted-foreground text-sm">
        This deck has no downloadable content.
      </p>
    );
  }
  return (
    <a href={downloadHref} download className="btn-outline inline-flex items-center">
      Download presentation
    </a>
  );
}

export default function SlideDeckDetailRenderer(
  props: ArtifactRendererProps,
): ReactElement {
  const view = resolveDeckView(props);

  if (view.kind === "floor") {
    return (
      <section
        className="soft-panel rounded-card flex flex-col items-center gap-3 p-6 text-center"
        data-conformance-id={SLIDE_DECK_DISPLAY_CONFORMANCE_ID}
        data-artifact-renderer="slide-deck"
        data-slot="detail"
        data-floor={view.reason}
      >
        <p className="text-muted-foreground text-sm">
          {DECK_FLOOR_MESSAGES[view.reason]}
        </p>
        <DeckDownload downloadHref={deckDownloadHref(props)} />
      </section>
    );
  }

  if (view.kind === "openxml") {
    return (
      <section
        className="soft-panel rounded-card flex flex-col items-center gap-3 p-6 text-center"
        data-conformance-id={SLIDE_DECK_DISPLAY_CONFORMANCE_ID}
        data-artifact-renderer="slide-deck"
        data-slot="detail"
        data-form="presentation"
        data-openxml-road="office-document"
      >
        <p className="text-muted-foreground text-sm">{DECK_OPENXML_ROAD_MESSAGE}</p>
        <DeckDownload downloadHref={view.downloadHref} />
      </section>
    );
  }

  return (
    <section
      data-conformance-id={SLIDE_DECK_DISPLAY_CONFORMANCE_ID}
      data-artifact-renderer="slide-deck"
      data-slot="detail"
      data-form="pdf"
      data-byte-road={view.road ?? undefined}
    >
      <PdfDetailShell
        previewHref={view.previewHref}
        downloadHref={view.downloadHref}
        slot="detail"
      />
    </section>
  );
}
