import { useCallback, useEffect, useState } from 'react';
import { fetchQuizzes, submitQuizAttempt, type LearnerQuiz, type QuizResult } from '../../utils/features';
import ConfirmDialog from '../admin/ConfirmDialog';
import { Spinner, ToastProvider, errorReason, useToast } from '../admin/Toast';
import '../../styles/features.css';

const letter = (i: number) => String.fromCharCode(65 + i);

function QuizzesInner({ onScored }: { onScored?: () => void }) {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<LearnerQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<LearnerQuiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const load = useCallback(async () => {
    try {
      setQuizzes(await fetchQuizzes());
    } catch (error) {
      toast.error('Could not load quizzes', errorReason(error));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const start = (quiz: LearnerQuiz) => {
    setActive(quiz);
    setAnswers(quiz.questions.map(() => -1));
    setResult(null);
  };

  const submit = async () => {
    if (!active) return;
    setSubmitting(true);
    try {
      const res = await submitQuizAttempt(active.name, answers);
      setResult(res);
      setConfirming(false);
      toast.success('Quiz submitted', `You scored ${res.score}/${res.max_score} (${Math.round(res.percent)}%).`);
      onScored?.();
      void load();
    } catch (error) {
      toast.error('Could not submit quiz', errorReason(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (active) {
    const answered = answers.filter((a) => a >= 0).length;
    return (
      <div className="fx">
        <button type="button" className="fx-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setActive(null)}>
          ← All quizzes
        </button>
        <div className="fx-card fx" style={{ gap: 14 }}>
          <div className="fx-spread">
            <div>
              <span className="fx-pill fx-pill-blue">{active.course}</span>
              <h3 style={{ fontSize: 20, marginTop: 8 }}>{active.title}</h3>
            </div>
            {result ? (
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: 28 }}>
                  {result.score}/{result.max_score}
                </strong>
                <div className="fx-muted">{Math.round(result.percent)}%</div>
              </div>
            ) : (
              <span className="fx-muted">
                {answered}/{active.questions.length} answered
              </span>
            )}
          </div>
          {active.description ? <p className="fx-muted" style={{ margin: 0 }}>{active.description}</p> : null}
          {result ? (
            <div className={`fx-alert ${result.percent >= (result.ca.pass_mark || 50) ? 'fx-alert-good' : 'fx-alert-warn'}`}>
              {result.percent >= (result.ca.pass_mark || 50) ? 'Well done! ' : 'Keep going — review the answers below. '}
              Your CA in {active.course} is now{' '}
              <strong>{result.ca.percent === null ? '—' : `${Math.round(result.ca.percent)}%`}</strong>.
            </div>
          ) : null}

          {active.questions.map((q, qi) => {
            const outcome = result?.results[qi];
            return (
              <div key={qi} className="fx-question" style={{ background: '#fff' }}>
                <strong>
                  {qi + 1}. {q.prompt}{' '}
                  <span className="fx-small fx-muted">({q.marks} mark{q.marks === 1 ? '' : 's'})</span>
                </strong>
                {q.options.map((option, oi) =>
                  option ? (
                    <button
                      key={oi}
                      type="button"
                      disabled={Boolean(result)}
                      className={`fx-choice${answers[qi] === oi ? ' fx-choice-selected' : ''}${
                        outcome && oi === outcome.correct_answer ? ' fx-choice-correct' : ''
                      }${outcome && !outcome.correct && oi === outcome.chosen ? ' fx-choice-wrong' : ''}`}
                      onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                    >
                      <span className="fx-choice-letter">{letter(oi)}</span>
                      {option}
                      {outcome && oi === outcome.correct_answer ? <span style={{ marginLeft: 'auto' }}>✓</span> : null}
                    </button>
                  ) : null,
                )}
              </div>
            );
          })}

          {result ? (
            <div className="fx-row" style={{ justifyContent: 'flex-end' }}>
              {active.max_attempts === 0 || active.attempts + 1 < active.max_attempts ? (
                <button type="button" className="fx-btn" onClick={() => start({ ...active, attempts: active.attempts + 1 })}>
                  Try again
                </button>
              ) : null}
              <button type="button" className="fx-btn fx-btn-primary" onClick={() => setActive(null)}>
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="fx-btn fx-btn-primary"
              style={{ alignSelf: 'flex-end' }}
              disabled={answered < active.questions.length}
              onClick={() => setConfirming(true)}
            >
              Submit answers
            </button>
          )}
        </div>

        <ConfirmDialog
          open={confirming}
          busy={submitting}
          title="Submit your answers?"
          confirmLabel="Yes, submit"
          cancelLabel="Check again"
          onCancel={() => setConfirming(false)}
          onConfirm={() => void submit()}
        >
          <p style={{ margin: 0 }}>
            You've answered all {active.questions.length} questions. Your score is marked straight away and counts towards your CA.
          </p>
          {active.max_attempts > 0 ? (
            <p className="confirm-warn">
              This uses attempt {active.attempts + 1} of {active.max_attempts}.
            </p>
          ) : null}
        </ConfirmDialog>
      </div>
    );
  }

  return (
    <div className="fx">
      {loading ? (
        <div className="fx-empty">
          <Spinner /> Loading quizzes…
        </div>
      ) : quizzes.length === 0 ? (
        <div className="fx-empty">No quizzes yet. Your lecturer will publish them as you move through the course.</div>
      ) : (
        <div className="fx-gallery">
          {quizzes.map((quiz) => {
            const left = quiz.max_attempts === 0 ? null : quiz.max_attempts - quiz.attempts;
            const done = left !== null && left <= 0;
            return (
              <div key={quiz.name} className="fx-card fx" style={{ gap: 10 }}>
                <span className="fx-pill fx-pill-blue" style={{ alignSelf: 'flex-start' }}>
                  {quiz.course}
                </span>
                <h3>{quiz.title}</h3>
                <span className="fx-small fx-muted">
                  {quiz.questions.length} questions · {quiz.max_score} marks
                  {left !== null ? ` · ${Math.max(0, left)} attempt${left === 1 ? '' : 's'} left` : ' · unlimited attempts'}
                </span>
                {quiz.best_score !== null ? (
                  <span className="fx-pill fx-pill-good" style={{ alignSelf: 'flex-start' }}>
                    Best: {quiz.best_score}/{quiz.max_score}
                  </span>
                ) : null}
                <button type="button" className="fx-btn fx-btn-primary" disabled={done} onClick={() => start(quiz)}>
                  {done ? 'No attempts left' : quiz.attempts ? 'Try again' : 'Start quiz'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Learner quiz list and quiz-taking screen (with its own toasts). */
function LearnerQuizzes(props: { onScored?: () => void }) {
  return (
    <ToastProvider>
      <QuizzesInner {...props} />
    </ToastProvider>
  );
}

export default LearnerQuizzes;
