import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/transcribe")({ server: { handlers: { POST: async ({ request }) => {
 const { handleTranscription } = await import("@/lib/transcription-handler.server");
 return handleTranscription(request);
} } } });