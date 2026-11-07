import { cap } from './claude/runtime';

/** Save text as a file with a plain browser download. Returns false when the browser refuses. */
export function downloadText(fileName: string, text: string, type = 'application/json'): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export type SaveOutcome = 'saved' | 'declined' | 'busy' | 'failed';

/**
 * Offer a file to the person. Inside claude.ai the platform asks them to confirm the save (a published artifact
 * cannot download by itself); elsewhere it is an ordinary browser download.
 */
export async function saveFile(fileName: string, text: string, type = 'application/json'): Promise<SaveOutcome> {
  const downloads = await cap('downloads');
  if (downloads) {
    try {
      await downloads.save({ filename: fileName, data: text });
      return 'saved';
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'declined') return 'declined';
      if (code === 'rate_limited') return 'busy';
      // Any other refusal: fall through to the browser download.
    }
  }
  return downloadText(fileName, text, type) ? 'saved' : 'failed';
}

/** Words for the toast after saveFile. */
export function saveMessage(outcome: SaveOutcome, what = 'File'): { text: string; ok: boolean } {
  if (outcome === 'saved') return { text: `${what} saved.`, ok: true };
  if (outcome === 'declined') return { text: 'Save cancelled.', ok: true };
  if (outcome === 'busy') return { text: 'A save is already waiting for an answer. Finish that one first.', ok: false };
  return { text: 'This view blocked the download. Use "Copy to clipboard" instead.', ok: false };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
