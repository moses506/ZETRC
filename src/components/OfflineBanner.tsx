import { useEffect, useState } from 'react';
import { OFFLINE_QUEUE_EVENT, flushOfflineQueue, pendingSubmissions } from '../utils/offline';

/** Shows when the device is offline or has submissions waiting to be sent. */
function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [queued, setQueued] = useState(() => pendingSubmissions().length);
  const [justSent, setJustSent] = useState(0);

  useEffect(() => {
    const update = () => setQueued(pendingSubmissions().length);
    const goOnline = async () => {
      setOnline(true);
      const sent = await flushOfflineQueue();
      if (sent) {
        setJustSent(sent);
        setTimeout(() => setJustSent(0), 6000);
      }
      update();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener(OFFLINE_QUEUE_EVENT, update);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener(OFFLINE_QUEUE_EVENT, update);
    };
  }, []);

  if (online && !queued && !justSent) return null;

  return (
    <div className={`offline-banner${online ? ' offline-banner-online' : ''}`} role="status">
      {!online
        ? `You're offline. Lessons you saved still work${queued ? `, and ${queued} submission${queued === 1 ? '' : 's'} will be sent when you reconnect` : ''}.`
        : justSent
          ? `✓ Back online — ${justSent} saved submission${justSent === 1 ? ' was' : 's were'} sent.`
          : `${queued} submission${queued === 1 ? '' : 's'} waiting to be sent…`}
    </div>
  );
}

export default OfflineBanner;
