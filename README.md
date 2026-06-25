# Slide Deck

A Cinatra artifact that classifies PDF files as slide decks — pitch decks, sales decks, conference talks, board decks, training presentations, and customer-facing decks. Once classified, a slide deck gets a first-class home in the library where it can be searched, previewed, and attached as context to chat threads or teammate handoffs.

To install, add `@cinatra-ai/slide-deck-artifact` as a dependency in your workspace and enable it from the marketplace. No credentials or API keys are required; the artifact operates entirely within the Cinatra host and uses only the file bytes you supply. Configuration is managed through the Cinatra workspace settings — no environment variables are needed.

Usage: attach or upload a PDF to Cinatra. The matcher evaluates the file's visual structure (orientation, text density, heading layout) and assigns a confidence score. Files scoring at or above 0.7 are classified as slide decks. Native presentation formats such as PPTX or PPT must be exported to PDF first; the matcher accepts `application/pdf` only.

Troubleshooting: if a legitimate slide deck is not classified (missed), check that the PDF export preserved landscape orientation and slide structure. Text-dense portrait PDFs and scanned image-only PDFs that lack slide structure will correctly return `matches:false`. If a prose PDF is incorrectly matched, review whether it uses a landscape, sparse-text layout that resembles a deck — the matcher follows visual structure, not content topic.

## Works with

- Cinatra library (search, preview, and attachment)

## Capabilities

- Save a presentation as a classified, searchable library item
- Retrieve a past pitch, sales, or board deck on demand
- Attach a deck as context for a chat thread or a teammate handoff
- Preview, download, or reclassify a deck from the library
