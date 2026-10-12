export type TranscriptionConfig = {
  baseURL: string;
  apiKey: string;
  model: string;
  maxFileBytes: number;
  audioOnly: boolean;
};

export async function transcribe(
  config: TranscriptionConfig,
  file: File,
  options: {
    buffered?: boolean;
    language?: string;
    signal?: AbortSignal;
  } = {},
) {
  if (!file.size || file.size > config.maxFileBytes) throw new Error("Invalid audio file size");
  if (!file.type.startsWith("audio/") && (config.audioOnly || !file.type.startsWith("video/"))) {
    throw new Error("Unexpected media MIME type");
  }
  const form = new FormData();
  form.append("model", config.model);
  form.append("file", file, file.name);
  form.append("response_format", "json");
  if (!options.buffered) form.append("stream", "true");
  if (options.language) form.append("language", options.language);
  return fetch(`${config.baseURL}/v1/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: form,
    ...(options.signal ? { signal: options.signal } : {}),
  });
}
