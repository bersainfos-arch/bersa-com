<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the home announcements slideshow in a browser-safe HomeNews component with category filters; only display supplied media to avoid inventing events.

- Keep HomeEditor browser-safe with document commands separate from the AppShell header so navigation cannot overlap document tools.
- Sanitize technology branding only in static interface copy and metadata through the translation layer; never rewrite user documents, messages, request payloads, or internal identifiers.
- Keep secondary app navigation in AppShell's accessible dropdown and reserve space below the home paper viewport for the persistent commands, so navigation and commands never cover document text.
- Keep opening phase timing in a pure module so the two-step signup transition can be tested without authentication.

- Use Tiptap in the shared HomeEditor and a separate EditorRibbon; commands must operate on the current selection or edited document, and AI text enters as text nodes, never raw HTML.
- Read attached Word/text files in the browser and send PDF/image parts through the authenticated writer function; unsupported attachments are not analyzed.
- Keep AI SDK providers in server-only modules and audio multipart uploads in an authenticated server route with bounded body size.
- Route linked Gemini credentials through the connector gateway and use the saved Groq credential for authenticated audio transcription; credentials and raw provider error bodies never reach the browser.
- Keep book proposals pending, private delivery links separate from catalog metadata, and authorize short-lived downloads through can_access_book using identifier-linked verified orders.
- Stream writing through an authenticated, bounded HTTP endpoint so text appears incrementally without crossing the server-function serialization boundary.
- Retrieve only administrator-enabled knowledge as untrusted reference context; private uploads must never enter ordinary assistant answers.
- Keep course resources private and authorize downloads against active, price-matching enrollment; manual payments require administrator confirmation.
- Keep currency conversion dependent on configured exchange rates; never synthesize payment rates.
- Keep static interface translations in lazy-loaded locale dictionaries; the compile-time UI transform must never translate document content, user publications, state values or API payloads.
- Persist language preferences in auth user metadata and user-scoped local storage; only these non-privileged preferences may be user-editable, and account preferences take precedence when signing in.
- The public `/` is the compact document home; `/redaction` owns the sole HomeEditor, while `/accueil` is Discover without home-only bottom navigation, to prevent duplicate workspaces.
- Import Word/PDF lazily through document-import; sanitize imported HTML before display, and transfer device files in memory rather than storing names as fake document content.
- Published document templates store editable imported Word HTML in Lovable Cloud; browser-local templates are not the public catalog.
- Automatic editor page separators are ProseMirror decorations, not document text, so pagination does not modify saved content or undo history.
- Keep page-margin editing in a measured overlay inside HomeEditor paper; store paragraph formatting and bookmarks as Tiptap attributes/marks so commands survive saving.
- Export PDF as separate measured pages with notes bound to their reference page, avoiding a single tall bitmap that cuts page boundaries.
- Home and the template catalogue share Home, with category ordering in home-catalog; document actions fetch the selected document on demand to avoid eager content downloads.
- CV previews scale through ResizeObserver to the available width; exported A4 markup stays unchanged so mobile sizing cannot alter document forms.
