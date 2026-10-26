import { FormEvent, useMemo, useState } from 'react';
import { useStaffRecords } from '../../hooks/useAdminRecords';
import { resolveApiAssetUrl, updateStaffRecord } from '../../utils/api';
import type { StaffScope } from '../../utils/auth';
import { htmlToText, sanitizeHtml } from '../../utils/richText';
import { AdminIcon } from '../admin/AdminIcons';
import { Spinner, errorReason, useToast } from '../admin/Toast';
import ConfirmDialog from '../admin/ConfirmDialog';
import '../../styles/admin.css';

type ApiRecord = Record<string, unknown>;
type Filter = 'to-mark' | 'marked' | 'all';

const STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'marked', label: 'Marked' },
  { value: 'returned', label: 'Returned for changes' },
];

function readString(record: ApiRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function isMarked(record: ApiRecord) {
  const status = readString(record, 'status');
  return status === 'marked' || status === 'returned';
}

function formatDate(value: string): string {
  const time = Date.parse(value);
  return Number.isNaN(time)
    ? ''
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(time));
}

function Attachment({ value }: { value: string }) {
  if (!value) return null;
  const isData = value.startsWith('data:');
  const href = isData ? value : resolveApiAssetUrl(value);
  const isImage = /^data:image\//.test(value) || /\.(png|jpe?g|gif|webp)$/i.test(value);
  const isAudio = /^data:audio\//.test(value) || /\.(webm|m4a|mp3|ogg|wav|aac|mp4)$/i.test(value);

  if (isAudio) {
    return (
      <div className="review-attachment">
        <span className="review-date">🎙️ Voice answer</span>
        <audio controls preload="none" src={href} style={{ width: '100%', maxWidth: 420 }} />
      </div>
    );
  }
  const extension = isData
    ? (value.slice(5, value.indexOf(';')).split('/')[1] ?? 'file').toUpperCase()
    : (value.split('.').pop() ?? 'file').toUpperCase();

  return (
    <div className="review-attachment">
      {isImage ? <img src={href} alt="Attachment preview" /> : null}
      <a href={href} target="_blank" rel="noopener noreferrer" download={isData ? `submission.${extension.toLowerCase()}` : undefined}>
        <AdminIcon name="Proposal_Request" size={16} />
        Open attachment <span>{extension}</span>
      </a>
    </div>
  );
}

function SubmissionCard({ record, scope, onSaved }: { record: ApiRecord; scope: StaffScope; onSaved: () => void }) {
  const toast = useToast();
  const name = readString(record, 'name');
  const student = `${readString(record, 'student_first_name')} ${readString(record, 'student_last_name')}`.trim() || 'Student';
  const [status, setStatus] = useState(readString(record, 'status') || 'submitted');
  const [grade, setGrade] = useState(readString(record, 'grade'));
  const initialScore = Number(record.score) || 0;
  const initialMax = Number(record.max_score) || 0;
  const [score, setScore] = useState(initialMax > 0 ? String(initialScore) : '');
  const [maxScore, setMaxScore] = useState(initialMax > 0 ? String(initialMax) : '100');
  const [feedback, setFeedback] = useState(readString(record, 'feedback'));
  const [isSaving, setIsSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const answerHtml = useMemo(() => sanitizeHtml(readString(record, 'content')), [record]);
  const answerLength = htmlToText(readString(record, 'content')).length;
  const dirty =
    status !== (readString(record, 'status') || 'submitted') ||
    grade !== readString(record, 'grade') ||
    score !== (initialMax > 0 ? String(initialScore) : '') ||
    maxScore !== (initialMax > 0 ? String(initialMax) : '100') ||
    feedback !== readString(record, 'feedback');

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    const hasScore = score.trim() !== '';
    const scoreValue = Number(score);
    const maxValue = Number(maxScore);
    if (hasScore && (!Number.isFinite(scoreValue) || scoreValue < 0)) {
      toast.error('Check the score', 'Score must be a number of 0 or more.');
      return;
    }
    if (hasScore && (!Number.isFinite(maxValue) || maxValue <= 0)) {
      toast.error('Check the score', '"Out of" must be a number greater than 0.');
      return;
    }
    if (hasScore && scoreValue > maxValue) {
      toast.error('Check the score', `Score can't be more than ${maxValue}.`);
      return;
    }
    if (status === 'marked' && !hasScore) {
      toast.error('Add a score', 'Enter a score so this counts towards the student\'s CA.');
      return;
    }

    setConfirmOpen(true);
  };

  const saveMarking = async () => {
    const hasScore = score.trim() !== '';
    const scoreValue = Number(score);
    const maxValue = Number(maxScore);
    setIsSaving(true);
    try {
      await updateStaffRecord(scope, 'Assignment_Submission', {
        name,
        status,
        grade,
        feedback,
        score: hasScore ? scoreValue : 0,
        max_score: hasScore ? maxValue : 0,
      });
      toast.success(
        status === 'marked' ? 'Marked and sent' : status === 'returned' ? 'Returned to student' : 'Saved',
        `${student} · ${readString(record, 'assignment_name')}`,
      );
      setConfirmOpen(false);
      onSaved();
    } catch (error) {
      toast.error('Could not save marking', errorReason(error));
    } finally {
      setIsSaving(false);
    }
  };

  const initials = student
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="review-card">
      <div className="review-main">
        <header className="review-head">
          <span className="admin-user-avatar">{initials}</span>
          <div className="review-who">
            <strong>{student}</strong>
            <span>{readString(record, 'student')}</span>
          </div>
          <span className={`admin-pill admin-pill-${readString(record, 'status') || 'submitted'}`}>
            {(readString(record, 'status') || 'submitted').replace(/_/g, ' ')}
          </span>
        </header>

        <div className="review-assignment">
          <AdminIcon name="Assignment" size={15} />
          {readString(record, 'assignment_name') || readString(record, 'assignment') || 'Assignment'}
          <span className="review-date">· {formatDate(readString(record, 'creation'))}</span>
        </div>

        {answerHtml ? (
          <>
            <div
              className={`review-answer${!expanded && answerLength > 600 ? ' review-answer-clamped' : ''}`}
              dangerouslySetInnerHTML={{ __html: answerHtml }}
            />
            {answerLength > 600 ? (
              <button type="button" className="admin-panel-link" onClick={() => setExpanded((v) => !v)}>
                {expanded ? 'Show less' : 'Read full answer'}
              </button>
            ) : null}
          </>
        ) : (
          <p className="admin-panel-empty">No written answer — see the attachment.</p>
        )}

        <Attachment value={readString(record, 'attachment')} />
      </div>

      <form className="review-mark" onSubmit={handleSave}>
        <h4>Marking</h4>
        <fieldset className="admin-fieldset review-fields" disabled={isSaving}>
          <label className="admin-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="review-score">
            <label className="admin-field">
              <span>Score</span>
              <input
                type="number"
                min={0}
                step="any"
                value={score}
                placeholder="e.g. 18"
                onChange={(event) => setScore(event.target.value)}
              />
            </label>
            <span className="review-score-slash">/</span>
            <label className="admin-field">
              <span>Out of</span>
              <input
                type="number"
                min={1}
                step="any"
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
              />
            </label>
            <span className="review-score-pct">
              {score.trim() !== '' && Number(maxScore) > 0
                ? `${Math.round((Number(score) / Number(maxScore)) * 100)}%`
                : '—'}
            </span>
          </div>
          <label className="admin-field">
            <span>Grade label (optional)</span>
            <input value={grade} placeholder="e.g. B+ or Merit" onChange={(event) => setGrade(event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Feedback to student</span>
            <textarea
              rows={4}
              value={feedback}
              placeholder="What went well, and what to improve…"
              onChange={(event) => setFeedback(event.target.value)}
            />
          </label>
        </fieldset>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving || !dirty}>
          {isSaving ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            'Save marking'
          )}
        </button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        busy={isSaving}
        title={status === 'submitted' ? 'Save these changes?' : 'Send this result to the student?'}
        confirmLabel={status === 'marked' ? 'Yes, send result' : status === 'returned' ? 'Yes, return it' : 'Yes, save'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void saveMarking()}
      >
        <dl className="confirm-summary">
          <div>
            <dt>Student</dt>
            <dd>{student}</dd>
          </div>
          <div>
            <dt>Assignment</dt>
            <dd>{readString(record, 'assignment_name') || readString(record, 'assignment')}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{STATUSES.find((option) => option.value === status)?.label ?? status}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd className="confirm-score">
              {score.trim() !== ''
                ? `${score} / ${maxScore} (${Math.round((Number(score) / Number(maxScore)) * 100)}%)`
                : 'No score'}
              {grade ? ` · ${grade}` : ''}
            </dd>
          </div>
          <div className="confirm-summary-wide">
            <dt>Feedback</dt>
            <dd>{feedback.trim() ? feedback : <em>No feedback written</em>}</dd>
          </div>
        </dl>
        {status !== 'submitted' ? (
          <p className="confirm-note">
            {student.split(' ')[0]} will be notified and{' '}
            {score.trim() !== '' ? 'this score will count towards their CA.' : 'will see your feedback.'}
          </p>
        ) : null}
        {status === 'marked' && !feedback.trim() ? (
          <p className="confirm-warn">You haven&apos;t written any feedback. Students learn more with a short comment.</p>
        ) : null}
      </ConfirmDialog>
    </article>
  );
}

/** Card-based review screen for assignment submissions, with inline marking. */
function SubmissionsReview({ scope }: { scope: StaffScope }) {
  const { records, isLoading, errorMessage, refetch } = useStaffRecords<ApiRecord>(scope, 'Assignment_Submission');
  const [filter, setFilter] = useState<Filter>('to-mark');
  const [search, setSearch] = useState('');

  const counts = useMemo(
    () => ({
      'to-mark': records.filter((record) => !isMarked(record)).length,
      marked: records.filter(isMarked).length,
      all: records.length,
    }),
    [records],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records
      .filter((record) => (filter === 'all' ? true : filter === 'marked' ? isMarked(record) : !isMarked(record)))
      .filter((record) =>
        !term
          ? true
          : [record.student_first_name, record.student_last_name, record.student, record.assignment_name]
              .join(' ')
              .toLowerCase()
              .includes(term),
      );
  }, [records, filter, search]);

  return (
    <div className="admin-overview">
      <div className="review-toolbar">
        <div className="progress-range" role="group" aria-label="Filter submissions">
          {(
            [
              ['to-mark', 'To mark'],
              ['marked', 'Marked'],
              ['all', 'All'],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'progress-range-active' : ''}
              onClick={() => setFilter(key)}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>
        <input
          type="search"
          className="admin-search"
          placeholder="Search by student or assignment…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {errorMessage ? <div className="admin-alert admin-alert-error">{errorMessage}</div> : null}

      {isLoading ? (
        <p className="admin-panel-empty">Loading submissions…</p>
      ) : visible.length === 0 ? (
        <p className="admin-panel-empty">
          {filter === 'to-mark' && records.length > 0
            ? 'All caught up — every submission has been marked.'
            : 'No submissions here yet.'}
        </p>
      ) : (
        <div className="review-list">
          {visible.map((record) => (
            <SubmissionCard key={readString(record, 'name')} record={record} scope={scope} onSaved={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SubmissionsReview;
