import { useMemo, useState } from 'react';
import { useStaffRecords } from '../../hooks/useAdminRecords';
import { createStaffRecord, deleteStaffRecord, updateStaffRecord } from '../../utils/api';
import type { StaffScope } from '../../utils/auth';
import type { QuizQuestion } from '../../utils/features';
import ConfirmDialog from '../admin/ConfirmDialog';
import { Spinner, errorReason, useToast } from '../admin/Toast';
import '../../styles/features.css';

type ApiRecord = Record<string, unknown>;

type Draft = {
  name: string | null;
  course: string;
  module: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  max_attempts: number;
  questions: QuizQuestion[];
};

const emptyQuestion = (): QuizQuestion => ({ prompt: '', options: ['', ''], answer: 0, marks: 1 });

const emptyDraft = (course = ''): Draft => ({
  name: null,
  course,
  module: '',
  title: '',
  description: '',
  status: 'draft',
  max_attempts: 2,
  questions: [emptyQuestion()],
});

function str(record: ApiRecord, key: string) {
  const v = record[key];
  return typeof v === 'string' ? v : '';
}

function toDraft(record: ApiRecord): Draft {
  const questions = Array.isArray(record.questions) ? (record.questions as QuizQuestion[]) : [];
  return {
    name: str(record, 'name'),
    course: str(record, 'course'),
    module: str(record, 'module'),
    title: str(record, 'title'),
    description: str(record, 'description'),
    status: str(record, 'status') === 'published' ? 'published' : 'draft',
    max_attempts: Number(record.max_attempts) || 0,
    questions: questions.length ? questions.map((q) => ({ ...q, options: [...(q.options ?? [])] })) : [emptyQuestion()],
  };
}

function validate(draft: Draft): string | null {
  if (!draft.course) return 'Choose the course this quiz belongs to.';
  if (!draft.title.trim()) return 'Give the quiz a title.';
  for (const [i, q] of draft.questions.entries()) {
    if (!q.prompt.trim()) return `Question ${i + 1} needs a question text.`;
    const filled = q.options.filter((o) => o.trim());
    if (filled.length < 2) return `Question ${i + 1} needs at least two answer options.`;
    if (!q.options[q.answer]?.trim()) return `Question ${i + 1}: mark which option is correct.`;
    if (!(q.marks > 0)) return `Question ${i + 1}: marks must be more than 0.`;
  }
  return null;
}

/** Build, publish and manage auto-marked multiple-choice quizzes. */
function QuizManager({ scope }: { scope: StaffScope }) {
  const toast = useToast();
  const quizzes = useStaffRecords<ApiRecord>(scope, 'Quiz');
  const courses = useStaffRecords<ApiRecord>(scope, 'Course');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const courseNames = useMemo(() => courses.records.map((c) => str(c, 'name')), [courses.records]);
  const totalMarks = draft ? draft.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0) : 0;

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) =>
    setDraft((d) => d && { ...d, questions: d.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });

  const save = async (publish: boolean) => {
    if (!draft) return;
    const problem = validate(draft);
    if (problem) {
      toast.error('Please fix the quiz', problem);
      return;
    }
    setSaving(true);
    const body = {
      ...(draft.name ? { name: draft.name } : {}),
      course: draft.course,
      module: draft.module.trim(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: publish ? 'published' : draft.status,
      max_attempts: Number(draft.max_attempts) || 0,
      questions: draft.questions.map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()),
        answer: q.answer,
        marks: Number(q.marks) || 1,
      })),
    };
    try {
      if (draft.name) await updateStaffRecord(scope, 'Quiz', body);
      else await createStaffRecord(scope, 'Quiz', body);
      toast.success(publish ? 'Quiz published' : 'Quiz saved', publish ? 'Learners in the course have been notified.' : draft.title);
      setDraft(null);
      setConfirmPublish(false);
      quizzes.refetch();
    } catch (error) {
      toast.error('Could not save quiz', errorReason(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (name: string) => {
    try {
      await deleteStaffRecord(scope, 'Quiz', name);
      toast.success('Quiz deleted');
      quizzes.refetch();
    } catch (error) {
      toast.error('Could not delete quiz', errorReason(error));
    } finally {
      setPendingDelete(null);
    }
  };

  if (draft) {
    return (
      <div className="fx">
        <div className="fx-card fx">
          <div className="fx-spread">
            <h3>{draft.name ? 'Edit quiz' : 'New quiz'}</h3>
            <span className="fx-pill fx-pill-blue">
              {draft.questions.length} question{draft.questions.length === 1 ? '' : 's'} · {totalMarks} marks
            </span>
          </div>

          <div className="fx-grid-2">
            <label className="fx-field">
              Course
              <select className="fx-select" value={draft.course} onChange={(e) => setDraft({ ...draft, course: e.target.value })}>
                <option value="">— Select course —</option>
                {courseNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="fx-field">
              Title
              <input className="fx-input" value={draft.title} placeholder="e.g. Module 2 check-in" onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="fx-field">
              Module (optional)
              <input className="fx-input" value={draft.module} onChange={(e) => setDraft({ ...draft, module: e.target.value })} />
            </label>
            <label className="fx-field">
              Attempts allowed (0 = unlimited)
              <input
                className="fx-input"
                type="number"
                min={0}
                value={draft.max_attempts}
                onChange={(e) => setDraft({ ...draft, max_attempts: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="fx-field">
            Instructions for learners
            <textarea className="fx-textarea" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </label>

          {draft.questions.map((q, qi) => (
            <div className="fx-question" key={qi}>
              <div className="fx-spread">
                <strong>Question {qi + 1}</strong>
                <div className="fx-row">
                  <label className="fx-row fx-small">
                    Marks
                    <input
                      className="fx-input"
                      style={{ width: 70 }}
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={q.marks}
                      onChange={(e) => updateQuestion(qi, { marks: Number(e.target.value) })}
                    />
                  </label>
                  {draft.questions.length > 1 ? (
                    <button
                      type="button"
                      className="fx-btn fx-btn-small fx-btn-danger"
                      onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, i) => i !== qi) })}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <textarea
                className="fx-textarea"
                style={{ minHeight: 60 }}
                placeholder="Type the question…"
                value={q.prompt}
                onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
              />
              <span className="fx-small fx-muted">Tick the correct answer:</span>
              {q.options.map((option, oi) => (
                <div className="fx-option" key={oi}>
                  <input
                    type="radio"
                    name={`q${qi}-answer`}
                    checked={q.answer === oi}
                    onChange={() => updateQuestion(qi, { answer: oi })}
                    aria-label={`Option ${oi + 1} is correct`}
                  />
                  <input
                    className="fx-input"
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    value={option}
                    onChange={(e) =>
                      updateQuestion(qi, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })
                    }
                  />
                  {q.options.length > 2 ? (
                    <button
                      type="button"
                      className="fx-btn fx-btn-small"
                      aria-label="Remove option"
                      onClick={() =>
                        updateQuestion(qi, {
                          options: q.options.filter((_, i) => i !== oi),
                          answer: q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer,
                        })
                      }
                    >
                      ×
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
              {q.options.length < 6 ? (
                <button
                  type="button"
                  className="fx-btn fx-btn-small"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => updateQuestion(qi, { options: [...q.options, ''] })}
                >
                  + Add option
                </button>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            className="fx-btn"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setDraft({ ...draft, questions: [...draft.questions, emptyQuestion()] })}
          >
            + Add question
          </button>

          <div className="fx-spread">
            <button type="button" className="fx-btn" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </button>
            <div className="fx-row">
              <button type="button" className="fx-btn" onClick={() => void save(false)} disabled={saving}>
                {saving && !confirmPublish ? <Spinner /> : null}
                {draft.status === 'published' ? 'Save changes' : 'Save as draft'}
              </button>
              {draft.status !== 'published' ? (
                <button
                  type="button"
                  className="fx-btn fx-btn-primary"
                  disabled={saving}
                  onClick={() => {
                    const problem = validate(draft);
                    if (problem) toast.error('Please fix the quiz', problem);
                    else setConfirmPublish(true);
                  }}
                >
                  Publish to learners
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmPublish}
          busy={saving}
          title="Publish this quiz?"
          confirmLabel="Yes, publish"
          onCancel={() => setConfirmPublish(false)}
          onConfirm={() => void save(true)}
        >
          <p>
            <strong>{draft.title}</strong> ({draft.questions.length} questions, {totalMarks} marks) will appear for every learner
            in <strong>{draft.course}</strong>, and they'll get a notification. Scores count towards their CA.
          </p>
          <p className="confirm-warn">After learners start answering, avoid changing correct answers — earlier attempts keep their original scores.</p>
        </ConfirmDialog>
      </div>
    );
  }

  return (
    <div className="fx">
      <div className="fx-spread">
        <p className="fx-muted" style={{ margin: 0 }}>
          Multiple-choice quizzes are marked automatically and count towards each learner's CA (best attempt).
        </p>
        <button type="button" className="fx-btn fx-btn-primary" onClick={() => setDraft(emptyDraft(courseNames[0] ?? ''))}>
          + New quiz
        </button>
      </div>

      {quizzes.errorMessage ? <div className="fx-alert">{quizzes.errorMessage}</div> : null}

      {quizzes.isLoading ? (
        <div className="fx-empty">Loading quizzes…</div>
      ) : quizzes.records.length === 0 ? (
        <div className="fx-empty">No quizzes yet. Create one to check learners' understanding after each module.</div>
      ) : (
        <div className="fx-table-wrap">
          <table className="fx-table">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Course</th>
                <th>Questions</th>
                <th>Attempts allowed</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {quizzes.records.map((quiz) => {
                const d = toDraft(quiz);
                return (
                  <tr key={d.name}>
                    <td>
                      <strong>{d.title}</strong>
                      {d.module ? <div className="fx-small fx-muted">{d.module}</div> : null}
                    </td>
                    <td>{d.course}</td>
                    <td>
                      {d.questions.length} · {d.questions.reduce((s, q) => s + (Number(q.marks) || 1), 0)} marks
                    </td>
                    <td>{d.max_attempts || 'Unlimited'}</td>
                    <td>
                      <span className={`fx-pill ${d.status === 'published' ? 'fx-pill-good' : 'fx-pill-warn'}`}>{d.status}</span>
                    </td>
                    <td>
                      <div className="fx-row" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="fx-btn fx-btn-small" onClick={() => setDraft(d)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="fx-btn fx-btn-small fx-btn-danger"
                          onClick={() => setPendingDelete(d.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this quiz?"
        tone="danger"
        confirmLabel="Delete quiz"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && void remove(pendingDelete)}
      >
        <p>Learners will no longer see it. Scores already earned stay in their CA.</p>
      </ConfirmDialog>
    </div>
  );
}

export default QuizManager;
