// THE RECORDING DOUBLE for the host's shared pdf shell.
//
// The real shell is host-internal: it ships in the host's own UI package, is
// declared here as an optional peer, and resolves only when the host builds
// this repo into its workspace. A standalone checkout therefore cannot import
// it, so the standalone suite maps the shell specifier here (see
// vitest.config.ts) and records what the display hands it.
//
// The double deliberately mirrors the shell's exported surface and NOTHING of
// its behaviour: this repo asserts the DELEGATION — that the deck's pdf form is
// drawn by the shared shell over the byte-road addresses — while the shell's own
// two readings are the shell's contract and are tested where the shell lives.

import type { ReactElement } from "react";

export type PdfShellSlot = "detail" | "preview";

export interface RecordedShellMount {
  previewHref: string | null;
  downloadHref: string | null;
  slot: PdfShellSlot;
  compact?: boolean;
}

export const shellMounts: RecordedShellMount[] = [];

export function resetShellMounts(): void {
  shellMounts.length = 0;
}

export function PdfDetailShell(mount: {
  readonly previewHref: string | null;
  readonly downloadHref: string | null;
  readonly slot: PdfShellSlot;
  readonly compact?: boolean;
}): ReactElement {
  shellMounts.push({ ...mount });
  return (
    <div
      data-double="pdf-detail-shell"
      data-slot={mount.slot}
      data-preview={mount.previewHref ?? ""}
    />
  );
}
