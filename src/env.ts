/** True when built for a sandboxed host (e.g. a Claude artifact) that blocks printing and file downloads. */
export const IS_SANDBOXED = import.meta.env.VITE_TARGET === 'artifact';

/**
 * Exports text as a file download, or — where downloads are blocked — copies it to the clipboard.
 * Must be called from a click handler. Resolves to how the text was delivered.
 */
export async function exportText(filename: string, text: string, mime: string): Promise<'downloaded' | 'copied'> {
  if (IS_SANDBOXED) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
