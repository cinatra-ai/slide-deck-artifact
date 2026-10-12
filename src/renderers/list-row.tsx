import { Presentation } from "lucide-react";

// The row icon of a slide deck in the Artifacts list: the presentation icon of
// the shared icon set, drawn at 17 pixels inside the application's row cell.
// It reads nothing but its props, requests no host port and fetches nothing,
// and draws the same icon for every object type it receives.
export interface ListRowProps {
  artifact: { objectType: string };
}

export default function SlideDeckListRow(_props: ListRowProps) {
  return <Presentation aria-hidden size={17} strokeWidth={2} data-row-glyph="presentation" />;
}
