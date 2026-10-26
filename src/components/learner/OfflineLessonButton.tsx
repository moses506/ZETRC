import { useEffect, useState } from 'react';
import { isSavedOffline, removeFromOffline, saveForOffline } from '../../utils/offline';

/** "Save for offline" toggle for a lesson's files (PDF / audio). */
function OfflineLessonButton({ hrefs, label = 'Save for offline' }: { hrefs: string[]; label?: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const key = hrefs.join('|');

  useEffect(() => {
    let cancelled = false;
    isSavedOffline(hrefs).then((value) => !cancelled && setSaved(value));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!hrefs.length || typeof window === 'undefined' || !('caches' in window)) return null;

  const toggle = async () => {
    setError(null);
    setBusy(true);
    try {
      if (saved) {
        await removeFromOffline(hrefs);
        setSaved(false);
      } else {
        await saveForOffline(hrefs, (done, total) => setProgress(`${done}/${total}`));
        setSaved(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save for offline.');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <span className="offline-save">
      <button type="button" className={`library-link-btn offline-save-btn${saved ? ' offline-saved' : ''}`} onClick={() => void toggle()} disabled={busy}>
        {busy ? `Saving… ${progress}` : saved ? '✓ Available offline' : `⬇ ${label}`}
      </button>
      {saved && !busy ? (
        <button type="button" className="offline-remove" onClick={() => void toggle()} title="Remove offline copy">
          Remove
        </button>
      ) : null}
      {error ? <span className="offline-error">{error}</span> : null}
    </span>
  );
}

export default OfflineLessonButton;
