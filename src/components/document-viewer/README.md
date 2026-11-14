# DocumentViewer

Independent mobile reader. Live example: `/document-viewer` (demonstration text only).
No existing page or saved document is changed.

```tsx
import DocumentViewer from "@/components/DocumentViewer";
import { exampleDocument } from "@/components/document-viewer/example";

export function Example() {
  return (
    <DocumentViewer
      blocks={exampleDocument}
      title="Guide pratique en rédaction"
      onBack={() => window.history.back()}
      // Supply your own persistence if desired:
      // onSave={async blocks => { await saveDocument(blocks); }}
      // onChange={blocks => { ... }}
      // onEditOnPC={() => { ... }}
    />
  );
}
```

## Included files

- `../DocumentViewer.tsx`: reader, accessible toolbars, search/replace, editing, download and callbacks.
- `Page.tsx`: fixed A4 page, reference marks, header, footnotes, highlighted search results.
- `layout.ts`: dimensions, measured pagination, anchored transforms and bounds.
- `useDocumentGestures.ts`: Pointer Events, two-pointer pinch, double tap, delta-aware wheel, inertial pan, resize.
- `DocumentViewer.css`: scoped paper and interface tokens; no effect on existing pages.
- `example.ts`: explicit sample typed blocks, never inserted into users' documents.
- `../../routes/document-viewer.tsx`: isolated example and route-specific viewport metadata.
- `../../test/document-viewer.test.ts`: concrete geometry and pagination tests.

100% means fitted text width, not physical desktop pixel scale. The fit uses
`(viewportWidth - 16) / (794 - 2 * margin)` to preserve 8px breathing room on each side.
Pinch is bounded from this fit to four times fit. “Page entière” deliberately allows a
lower scale so page margins can be inspected. Returning to “Ajuster à l’écran” restores
the fitted minimum. A4 page dimensions never change with zoom. The page gap is divided
by scale so it remains eight visible screen pixels.

This TanStack Start app has no `index.html`. The requested viewport metadata is in the
example route's `head()`, not the shared head, preserving browser zoom on other pages.
For a standalone HTML host, put the following in that host's head:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

Text stays native DOM text, never a canvas bitmap. While moving, `will-change: transform`
promotes the page stack; gesture completion removes the promotion and commits React
state. Pagination measures Arial at its reference size, splits overflowing paragraphs
without losing characters, and continues oversized notes at page bottoms. Notes are
linked with `referenceId` to a title or paragraph ID; displayed numbering is automatic.
Editing updates the original block using fragment offsets. Note text itself is read-only.

Without `onSave`, Save downloads JSON, **not** a fake cloud save or a Word export.
Share sends the actual JSON file when supported, otherwise downloads it. “Modifier sur PC”
uses `onEditOnPC` if supplied, otherwise offers a file download; it does not create remote
computer editing. Calendar is a local date picker, not scheduling. Speech uses the
device's available speech service, with no guaranteed installed French voice.

The component is intended for reading with optional plain-text block edits; it is not
a replacement for the existing rich-text HomeEditor. Physical touch quality and text
rasterization remain device/browser-dependent.