import { useCallback, useEffect, useState } from 'react';
import {
  createThread,
  deleteThread,
  fetchThread,
  fetchThreads,
  replyToThread,
  setThreadResolved,
  type Actor,
  type Reply,
  type Thread,
} from '../../utils/features';
import ConfirmDialog from '../admin/ConfirmDialog';
import { Spinner, errorReason, useToast } from '../admin/Toast';
import '../../styles/features.css';

function when(value: string) {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return '';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(t));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(role: string) {
  return role === 'Lecturer' ? 'Lecturer' : role === 'Admin' ? 'ZETRC team' : '';
}

type DiscussionsProps = {
  actor: Actor;
  /** Email of the signed-in account, to show delete/resolve on own posts. */
  myEmail: string;
};

/** Course discussion board: questions, answers from lecturers and peers. */
function Discussions({ actor, myEmail }: DiscussionsProps) {
  const toast = useToast();
  const isStaff = actor !== 'learner';
  const [course, setCourse] = useState('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ thread: Thread; replies: Reply[] } | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ course: '', title: '', body: '' });
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchThreads(actor, course || undefined);
      setThreads(data.threads);
      if (!course) setCourses(data.courses);
    } catch (error) {
      toast.error('Could not load discussions', errorReason(error));
    } finally {
      setLoading(false);
    }
  }, [actor, course, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openThread = useCallback(
    async (id: number) => {
      setOpenId(id);
      try {
        setDetail(await fetchThread(actor, id));
      } catch (error) {
        toast.error('Could not open discussion', errorReason(error));
        setOpenId(null);
      }
    },
    [actor, toast],
  );

  const post = async () => {
    if (!draft.course || !draft.title.trim() || !draft.body.trim()) {
      toast.error('Almost there', 'Choose a course and add a title and your question.');
      return;
    }
    setBusy(true);
    try {
      const created = await createThread(actor, { ...draft, title: draft.title.trim(), body: draft.body.trim() });
      toast.success('Posted', isStaff ? 'Learners have been notified.' : 'Your lecturer has been notified.');
      setComposing(false);
      setDraft({ course: '', title: '', body: '' });
      await load();
      void openThread(created.id);
    } catch (error) {
      toast.error('Could not post', errorReason(error));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!detail || !reply.trim()) return;
    setBusy(true);
    try {
      await replyToThread(actor, detail.thread.id, reply.trim());
      setReply('');
      await openThread(detail.thread.id);
      void load();
    } catch (error) {
      toast.error('Could not send reply', errorReason(error));
    } finally {
      setBusy(false);
    }
  };

  const toggleResolved = async () => {
    if (!detail) return;
    try {
      await setThreadResolved(actor, detail.thread.id, !detail.thread.resolved);
      await openThread(detail.thread.id);
      void load();
    } catch (error) {
      toast.error('Could not update', errorReason(error));
    }
  };

  const remove = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await deleteThread(actor, detail.thread.id);
      toast.success('Discussion deleted');
      setConfirmDelete(false);
      setOpenId(null);
      setDetail(null);
      void load();
    } catch (error) {
      toast.error('Could not delete', errorReason(error));
    } finally {
      setBusy(false);
    }
  };

  if (openId !== null) {
    const mine = detail && detail.thread.author_email.toLowerCase() === myEmail.toLowerCase();
    return (
      <div className="fx">
        <button type="button" className="fx-btn" style={{ alignSelf: 'flex-start' }} onClick={() => (setOpenId(null), setDetail(null))}>
          ← All discussions
        </button>
        {!detail ? (
          <div className="fx-empty">
            <Spinner /> Loading…
          </div>
        ) : (
          <div className="fx-card fx" style={{ gap: 4 }}>
            <div className="fx-spread">
              <span className="fx-pill fx-pill-blue">{detail.thread.course}</span>
              <div className="fx-row">
                {detail.thread.resolved ? <span className="fx-pill fx-pill-good">✓ Answered</span> : null}
                {mine || isStaff ? (
                  <button type="button" className="fx-btn fx-btn-small" onClick={() => void toggleResolved()}>
                    {detail.thread.resolved ? 'Reopen' : 'Mark as answered'}
                  </button>
                ) : null}
                {mine || isStaff ? (
                  <button type="button" className="fx-btn fx-btn-small fx-btn-danger" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
            <h3 style={{ fontSize: 19, margin: '8px 0 0' }}>{detail.thread.title}</h3>
            <div className="fx-post">
              <span className={`fx-avatar${detail.thread.author_role !== 'Learner' ? ' fx-avatar-staff' : ''}`}>
                {initials(detail.thread.author_name)}
              </span>
              <div>
                <strong>{detail.thread.author_name}</strong>{' '}
                {roleLabel(detail.thread.author_role) ? <span className="fx-pill fx-pill-warn">{roleLabel(detail.thread.author_role)}</span> : null}{' '}
                <span className="fx-small fx-muted">{when(detail.thread.creation)}</span>
                <div className="fx-post-body">{detail.thread.body}</div>
              </div>
            </div>
            <span className="fx-small fx-muted" style={{ marginTop: 8 }}>
              {detail.replies.length} repl{detail.replies.length === 1 ? 'y' : 'ies'}
            </span>
            {detail.replies.map((r) => (
              <div className="fx-post" key={r.id}>
                <span className={`fx-avatar${r.author_role !== 'Learner' ? ' fx-avatar-staff' : ''}`}>{initials(r.author_name)}</span>
                <div>
                  <strong>{r.author_name}</strong>{' '}
                  {roleLabel(r.author_role) ? <span className="fx-pill fx-pill-warn">{roleLabel(r.author_role)}</span> : null}{' '}
                  <span className="fx-small fx-muted">{when(r.creation)}</span>
                  <div className="fx-post-body">{r.body}</div>
                </div>
              </div>
            ))}
            <label className="fx-field" style={{ marginTop: 12 }}>
              Your reply
              <textarea
                className="fx-textarea"
                value={reply}
                placeholder={isStaff ? 'Answer the question or add guidance…' : 'Share what you know or ask a follow-up…'}
                onChange={(e) => setReply(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="fx-btn fx-btn-primary"
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
              disabled={busy || !reply.trim()}
              onClick={() => void sendReply()}
            >
              {busy ? <Spinner /> : null} Post reply
            </button>
          </div>
        )}
        <ConfirmDialog
          open={confirmDelete}
          busy={busy}
          tone="danger"
          title="Delete this discussion?"
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void remove()}
        >
          <p>The question and all replies will be removed for everyone.</p>
        </ConfirmDialog>
      </div>
    );
  }

  return (
    <div className="fx">
      <div className="fx-spread">
        <select className="fx-select" style={{ width: 'auto', minWidth: 240 }} value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All my courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="fx-btn fx-btn-primary"
          onClick={() => {
            setDraft({ course: course || courses[0] || '', title: '', body: '' });
            setComposing(true);
          }}
          disabled={!courses.length}
        >
          + {isStaff ? 'Start a discussion' : 'Ask a question'}
        </button>
      </div>

      {composing ? (
        <div className="fx-card fx" style={{ gap: 12 }}>
          <h3>{isStaff ? 'Start a discussion' : 'Ask your lecturer and classmates'}</h3>
          <div className="fx-grid-2">
            <label className="fx-field">
              Course
              <select className="fx-select" value={draft.course} onChange={(e) => setDraft({ ...draft, course: e.target.value })}>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="fx-field">
              Title
              <input
                className="fx-input"
                placeholder="e.g. When is the best time to plant cowpeas?"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
          </div>
          <label className="fx-field">
            Details
            <textarea className="fx-textarea" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
          <div className="fx-row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="fx-btn" onClick={() => setComposing(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="fx-btn fx-btn-primary" onClick={() => void post()} disabled={busy}>
              {busy ? <Spinner /> : null} Post
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="fx-empty">
          <Spinner /> Loading discussions…
        </div>
      ) : !courses.length ? (
        <div className="fx-empty">Discussions open once you're enrolled in (or teaching) a course.</div>
      ) : threads.length === 0 ? (
        <div className="fx-empty">No discussions yet. Be the first to ask a question!</div>
      ) : (
        threads.map((t) => (
          <button key={t.id} type="button" className="fx-thread" onClick={() => void openThread(t.id)}>
            <div className="fx-spread">
              <strong>{t.title}</strong>
              {t.resolved ? <span className="fx-pill fx-pill-good">✓ Answered</span> : t.reply_count === 0 ? <span className="fx-pill fx-pill-warn">Needs an answer</span> : null}
            </div>
            <span className="fx-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.body}
            </span>
            <span className="fx-small fx-muted">
              {t.author_name} · {t.course} · {t.reply_count} repl{t.reply_count === 1 ? 'y' : 'ies'} · active {when(t.last_activity)}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

export default Discussions;
