// THE DECK DISPLAY'S RESOLVERS — the whole branch as pure functions over the
// authorized snapshot, decided without React.
//
// THE DRAWING, IN ITS OWN WORDS: "A deck is read in the viewer the fleet already
// has. The deck type accepts one content form — the exported pdf — and its
// display draws it through the same embedded PDF viewer as every other pdf
// reading: the browser's own bundled viewer fills the panel, pages and scrolls
// itself, and the display adds no controls of its own. ... The same two readings
// hold as anywhere else: the embedded viewer, and the download floor beneath it
// where there is no preview to show."
//
// AND ITS NOTE ON THE OFFICE FORM: "A deck handed over in its office format is
// an office document, not a deck. ... The office-document display is a named
// download shell here — the format, the size, and one download — and its
// presentation form gains an embedded OpenXML viewer with the document
// extension's own retrofit, which is what draws it."
//
// SO THERE ARE THREE READINGS AND NO FOURTH. The pdf form goes to the shared
// pdf shell — this repository writes no previewer, mounts no page renderer and
// adds no controls. A presentation that reaches this display anyway takes the
// NAMED OPENXML ROAD rather than a blank panel: the reading the office-document
// display owns, with the deck's own download beside it. Everything else is a
// typed floor.
//
// AND THE ADDRESSES ARE THE BYTE REFERENCE'S. The session addresses under `urls`
// are cookie-gated and paint nothing inside a third-party application, so the
// display hands the shell the byte reference and never a host route of its own.

import {
  addressCarriesInlineBytes,
  isBelowByteReferenceVersion,
  normalizeAddress,
  type ArtifactByteRoad,
  type ArtifactRendererProps,
} from "../renderer-props";

/** The drawing's conformance id for this display. */
export const SLIDE_DECK_DISPLAY_CONFORMANCE_ID = "slide-deck-display";

/** The one content form the deck type accepts — the exported deck. */
export const DECK_PDF_MIME = "application/pdf";

/** The office presentation form, named so the OpenXML road is not a guess. */
export const DECK_OPENXML_PRESENTATION_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Why a floor was drawn — closed and named. */
export type DeckFloorReason =
  /** The host offered a snapshot older than the byte reference. */
  | "props-version-too-old"
  /** A form that is neither the exported deck nor a presentation. */
  | "unsupported-form"
  /** An address arrived carrying the work's bytes instead of naming them. */
  | "inline-bytes";

/** The resolved reading. */
export type DeckView =
  | {
      kind: "pdf";
      previewHref: string | null;
      downloadHref: string | null;
      /** Null where a current snapshot names no byte reference at all: there is
       *  no road over a revision that has no addresses. */
      road: ArtifactByteRoad | null;
    }
  | { kind: "openxml"; downloadHref: string | null }
  | { kind: "floor"; reason: DeckFloorReason };

/** What a floor says to the reader. */
export const DECK_FLOOR_MESSAGES: Readonly<Record<DeckFloorReason, string>> =
  Object.freeze({
    "props-version-too-old":
      "This deck needs a newer display contract than this workspace offers.",
    "unsupported-form": "This deck cannot be previewed here.",
    "inline-bytes": "This deck cannot be previewed here.",
  });

/** What the OpenXML road says — the office-document reading, named. */
/**
 * IT NAMES THE ROAD; IT DOES NOT CLAIM A READING IT DID NOT DRAW. This display
 * mounts no OpenXML viewer — per the drawing that viewer is the office-document
 * display's, and it arrives with that extension's own retrofit. A sentence here
 * saying the deck "is read through the embedded OpenXML viewer" would tell the
 * reader a reading had happened in front of them when nothing was mounted, which
 * is the one thing worse than the named gap.
 */
export const DECK_OPENXML_ROAD_MESSAGE =
  "A deck in its office format is an office document: it is read on the office-document display, not here.";

/**
 * The form this snapshot is on. The resolved representation is the pinned
 * truth; the row's own media type answers only where no representation was
 * resolved.
 */
export function deckForm(props: ArtifactRendererProps): string {
  return props.representation?.mime ?? props.artifact.mime;
}

/** THE WHOLE BRANCH, as a total function over the authorized snapshot. */
export function resolveDeckView(props: ArtifactRendererProps): DeckView {
  // THE VERSION FLOOR IS ABOUT THE VERSION AND NOTHING ELSE.
  if (isBelowByteReferenceVersion(props)) {
    return { kind: "floor", reason: "props-version-too-old" };
  }
  // A CURRENT SNAPSHOT CAN NAME NO BYTE REFERENCE AT ALL — the host omits the
  // field where the revision has neither address, because a road named over
  // nothing would read as an empty road rather than as "this revision has no
  // bytes". That is a fact about the WORK, so it takes the form's own reading
  // with no addresses in it — never the version floor, which would tell a reader
  // on a fully current workspace that their workspace is behind.
  const bytes = props.bytes ?? null;
  if (
    bytes !== null &&
    (addressCarriesInlineBytes(bytes.preview) ||
      addressCarriesInlineBytes(bytes.download))
  ) {
    return { kind: "floor", reason: "inline-bytes" };
  }

  const form = deckForm(props);
  const downloadHref = normalizeAddress(bytes?.download ?? null);

  if (form === DECK_PDF_MIME) {
    // The shell owns BOTH pdf readings — the embedded viewer and the download
    // floor beneath it — so a missing preview address is handed to it as null
    // rather than floored here. Two floors for one form would be two answers to
    // the reader for one fact.
    return {
      kind: "pdf",
      previewHref: normalizeAddress(bytes?.preview ?? null),
      downloadHref,
      road: bytes?.road ?? null,
    };
  }
  if (form === DECK_OPENXML_PRESENTATION_MIME) {
    return { kind: "openxml", downloadHref };
  }
  return { kind: "floor", reason: "unsupported-form" };
}

/** The download the floors and the OpenXML road offer, where there is one. */
export function deckDownloadHref(props: ArtifactRendererProps): string | null {
  const download = props.bytes?.download ?? null;
  if (addressCarriesInlineBytes(download)) return null;
  return normalizeAddress(download);
}
