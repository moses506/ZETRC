// Offline support: service worker registration, saving lesson files for
// offline use, and a queue that sends submissions once the device reconnects.
import { submitAssignmentSubmission, type AssignmentSubmissionPayload } from './api';

const LESSON_CACHE = 'zetrc-lessons-v1';
const QUEUE_KEY = 'zetrcOfflineQueue';
export const OFFLINE_QUEUE_EVENT = 'zetrcOfflineQueueChanged';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
  window.addEventListener('online', () => void flushOfflineQueue());
  setTimeout(() => void flushOfflineQueue(), 3000);
}

// ---------- Lesson files ----------

const absolute = (href: string) => new URL(href, window.location.origin).toString();

export async function isSavedOffline(hrefs: string[]): Promise<boolean> {
  if (!('caches' in window) || !hrefs.length) return false;
  const cache = await caches.open(LESSON_CACHE);
  const hits = await Promise.all(hrefs.map((h) => cache.match(absolute(h), { ignoreSearch: true })));
  return hits.every(Boolean);
}

/** Downloads the files into the offline cache. Throws if any file fails. */
export async function saveForOffline(hrefs: string[], onProgress?: (done: number, total: number) => void) {
  if (!('caches' in window)) throw new Error('This browser cannot save lessons for offline use.');
  const cache = await caches.open(LESSON_CACHE);
  let done = 0;
  for (const href of hrefs) {
    const response = await fetch(href, { cache: 'reload' });
    if (!response.ok) throw new Error(`Could not download ${href.split('/').pop()} (status ${response.status}).`);
    await cache.put(absolute(href), response);
    done += 1;
    onProgress?.(done, hrefs.length);
  }
}

export async function removeFromOffline(hrefs: string[]) {
  if (!('caches' in window)) return;
  const cache = await caches.open(LESSON_CACHE);
  await Promise.all(hrefs.map((h) => cache.delete(absolute(h), { ignoreSearch: true })));
}

// ---------- Submission queue ----------

type QueuedItem = { id: string; kind: 'assignment'; payload: AssignmentSubmissionPayload; queuedAt: string };

function readQueue(): QueuedItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedItem[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable
  }
  window.dispatchEvent(new Event(OFFLINE_QUEUE_EVENT));
}

export const pendingSubmissions = () => readQueue();

const isNetworkError = (error: unknown) =>
  !navigator.onLine || (error instanceof Error && /unable to reach the server|failed to fetch|network/i.test(error.message));

/**
 * Submits an assignment, or queues it when the device is offline.
 * Returns "sent" or "queued"; other errors are thrown as usual.
 */
export async function submitAssignmentOrQueue(payload: AssignmentSubmissionPayload): Promise<'sent' | 'queued'> {
  try {
    await submitAssignmentSubmission(payload);
    return 'sent';
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    writeQueue([...readQueue(), { id: `${Date.now()}`, kind: 'assignment', payload, queuedAt: new Date().toISOString() }]);
    return 'queued';
  }
}

let flushing = false;

/** Sends queued submissions. Items that still fail stay in the queue. */
export async function flushOfflineQueue(): Promise<number> {
  if (flushing || !navigator.onLine) return 0;
  flushing = true;
  let sent = 0;
  try {
    const remaining: QueuedItem[] = [];
    for (const item of readQueue()) {
      try {
        await submitAssignmentSubmission(item.payload);
        sent += 1;
      } catch (error) {
        if (isNetworkError(error)) remaining.push(item);
        // Non-network errors (e.g. duplicate) are dropped so they don't block the queue.
      }
    }
    writeQueue(remaining);
  } finally {
    flushing = false;
  }
  return sent;
}
