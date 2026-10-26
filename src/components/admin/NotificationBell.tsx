import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type { StaffScope } from '../../utils/auth';
import { AdminIcon } from './AdminIcons';

type NotificationBellProps = {
  scope: StaffScope;
  email: string;
  onNavigate: (target: string) => void;
};

function timeAgo(when: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - when) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(when));
}

function NotificationBell({ scope, email, onNavigate }: NotificationBellProps) {
  const { items, isLoading, unreadCount, isUnread, markRead, markAllRead } = useNotifications(scope, email);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const visible = filter === 'unread' ? items.filter(isUnread) : items;

  return (
    <div className="admin-notif" ref={rootRef}>
      <button
        type="button"
        className={`admin-notif-trigger${isOpen ? ' admin-notif-trigger-open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <AdminIcon name="bell" size={18} />
        {unreadCount > 0 ? (
          <span className="admin-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="admin-notif-panel" role="dialog" aria-label="Notifications">
          <div className="admin-notif-head">
            <div>
              <h3>Notifications</h3>
              <span>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</span>
            </div>
            <button type="button" className="admin-notif-markall" onClick={markAllRead} disabled={!unreadCount}>
              <AdminIcon name="check" size={14} />
              Mark all read
            </button>
          </div>

          <div className="admin-notif-tabs">
            <button
              type="button"
              className={filter === 'all' ? 'admin-notif-tab-active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={filter === 'unread' ? 'admin-notif-tab-active' : ''}
              onClick={() => setFilter('unread')}
            >
              Unread{unreadCount ? ` (${unreadCount})` : ''}
            </button>
          </div>

          <ul className="admin-notif-list">
            {isLoading ? (
              <li className="admin-notif-empty">Loading…</li>
            ) : visible.length === 0 ? (
              <li className="admin-notif-empty">
                <span className="admin-notif-empty-icon">
                  <AdminIcon name="bell" size={20} />
                </span>
                {filter === 'unread' ? 'No unread notifications.' : 'Nothing here yet.'}
              </li>
            ) : (
              visible.map((item) => {
                const unread = isUnread(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`admin-notif-item${unread ? ' admin-notif-item-unread' : ''}`}
                      onClick={() => {
                        markRead(item.id);
                        setIsOpen(false);
                        onNavigate(item.target);
                      }}
                    >
                      <span className={`admin-activity-icon admin-tone-${item.tone}`}>
                        <AdminIcon name={item.icon} size={16} />
                      </span>
                      <span className="admin-notif-text">
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                        <small>{timeAgo(item.when)}</small>
                      </span>
                      {unread ? <span className="admin-notif-dot" aria-label="Unread" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
