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

- Share the browser-safe HomeEditor between / and /app so both entry points show the same writing experience.
- Keep opening phase timing in a pure module so the two-step signup transition can be tested without authentication.

- Use Tiptap in the shared HomeEditor and a separate EditorRibbon; commands must operate on the current selection or edited document, and AI text enters as text nodes, never raw HTML.
- Read attached Word/text files in the browser and send PDF/image parts through the authenticated writer function; unsupported attachments are not analyzed.
- Keep AI SDK providers in server-only modules and audio multipart uploads in an authenticated server route with bounded body size.
- Keep book proposals pending, private delivery links separate from catalog metadata, and authorize short-lived downloads through can_access_book using identifier-linked verified orders.
