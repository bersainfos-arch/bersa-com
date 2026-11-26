import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/~oauth/initiate")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const source = new URL(request.url);
        const target = new URL("https://bersa-com.lovable.app/~oauth/initiate");
        if (source.searchParams.get("provider") !== "google") {
          return new Response("Connexion non disponible.", { status: 400 });
        }
        for (const name of ["provider", "redirect_uri", "state", "prompt", "response_mode"]) {
          const value = source.searchParams.get(name);
          if (value) target.searchParams.set(name, value);
        }
        return Response.redirect(target.toString(), 302);
      },
    },
  },
});
