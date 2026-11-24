/** Save only through real browser capabilities; never pretend a folder was selected. */
export async function saveDeviceFile(blob: Blob, name: string): Promise<"saved" | "shared" | "downloaded" | "cancelled"> {
  const device = window as unknown as { showSaveFilePicker?: (options: unknown) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> };
  try {
    if (device.showSaveFilePicker) {
      const extension = name.split(".").pop() || "bin";
      const handle = await device.showSaveFilePicker({ suggestedName: name, types: [{ description: name, accept: { [blob.type.split(";")[0] || "application/octet-stream"]: [`.${extension}`] } }] });
      const writer = await handle.createWritable();
      await writer.write(blob);
      await writer.close();
      return "saved";
    }
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return "shared";
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "cancelled";
    // Unsupported picker/share permissions fall back to a real download.
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}