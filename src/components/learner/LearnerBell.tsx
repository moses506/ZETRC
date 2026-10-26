import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAnnouncements,
  fetchNotifications,
  markNotificationsRead,
  type Announcement,
  type AppNotification,
} from '../../utils/features';

type LearnerBellProps = {
  /** Opens a dashboard view (e.g. "assignments") when a notification is clicked. */
  onNavigate: (view: string) => void;
  icon: JSX.Element;
};

const REFRESH_MS = 60_000;

function ago(value: string) {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return '';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(t));
}

const KIND_ICON: Record<string, string> = {
  marked: '📝',
  certificate: '🎓',
  enrollment: '✅',
  announcement: '📣',
  lesson: '📚',
  quiz: '❓',
  reply: '💬',
  discussion: '💬',
};

/** Learner bell: stored notifications (marks, approvals, certificates…) and announcements. */
function LearnerBell({ onNavigate, icon }: LearnerBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  const load = useCallback(async () => {
    const [notes, news] = await Promise.all([
      fetchNotifications('learner').catch(() => ({ items: [], unread: 0 })),
      fetchAnnouncements().catch(() => []),
    ]);
    setItems(notes.items);
    setUnread(notes.unread);
    setAnnouncements(news);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  // Close on outside click; mark everything read once the learner has seen the list.
  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (wasOpen.current && !open && unread > 0) {
      void markNotificationsRead('learner').then(() => {
        setUnread(0);
        setItems((list) => list.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      });
    }
    wasOpen.current = open;
  }, [open, unread]);

  return (
    <div className="notification-wrap" ref={ref}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} new` : ''}`}
        aria-expanded={open}
      >
        {icon}
        {unread > 0 ? <span className="notification-badge notification-badge-new">{unread > 9 ? '9+' : unread}</span> : null}
      </button>
      {open ? (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">Updates</div>
          <div className="announce-list">
            {items.length === 0 ? (
              <div className="announce-row announce-info">
                <div className="announce-body">No updates yet. Marks, approvals and new lessons will appear here.</div>
              </div>
            ) : (
              items.slice(0, 8).map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`announce-row result-notice${n.read_at ? '' : ' result-notice-new'}`}
                  onClick={() => {
                    setOpen(false);
                    if (n.link) onNavigate(n.link);
                  }}
                >
                  <div className="announce-title">
                    {!n.read_at ? <span className="result-dot" aria-label="New" /> : null}
                    {KIND_ICON[n.kind] ?? '🔔'} {n.title}
                  </div>
                  {n.body ? <div className="announce-body">{n.body}</div> : null}
                  <div className="announce-date">{ago(n.creation)}</div>
                </button>
              ))
            )}
          </div>
          {announcements.length ? (
            <>
              <div className="notification-dropdown-header">Announcements</div>
              <div className="announce-list">
                {announcements.slice(0, 5).map((a) => (
                  <div key={a.name} className={`announce-row ${a.priority === 'important' ? 'announce-warn' : 'announce-info'}`}>
                    <div className="announce-title">{a.title}</div>
                    <div className="announce-body">{a.body}</div>
                    <div className="announce-date">
                      {a.course || 'All learners'} · {a.author_name || 'ZETRC'} · {ago(a.creation)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default LearnerBell;
