import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMySubmissions, type MySubmission } from '../utils/api';
import { fetchMyCA, type CourseCA } from '../utils/features';

const REFRESH_MS = 60_000;

export const isMarkedSubmission = (s: MySubmission) => s.status === 'marked' || s.status === 'returned';

export type ContinuousAssessment = {
  /** Overall CA as a percentage, or null when nothing has been scored yet. */
  percent: number | null;
  assessed: number;
  submitted: number;
  score: number;
  maxScore: number;
};

/** CA = total marks awarded ÷ total marks available, across scored submissions. */
export function computeCA(submissions: MySubmission[]): ContinuousAssessment {
  const scored = submissions.filter((s) => isMarkedSubmission(s) && Number(s.max_score) > 0);
  const score = scored.reduce((sum, s) => sum + Number(s.score || 0), 0);
  const maxScore = scored.reduce((sum, s) => sum + Number(s.max_score || 0), 0);
  return {
    percent: maxScore > 0 ? (score / maxScore) * 100 : null,
    assessed: scored.length,
    submitted: submissions.length,
    score,
    maxScore,
  };
}

/** The signed-in learner's submissions with marks and feedback, refreshed every minute. */
export function useMySubmissions() {
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [courseCA, setCourseCA] = useState<CourseCA[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const [subs, ca] = await Promise.all([fetchMySubmissions(), fetchMyCA().catch(() => null)]);
      setSubmissions(subs);
      if (ca) setCourseCA(ca);
    } catch {
      // keep the last good list; the dashboard still works without marks
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    const timer = window.setInterval(() => void refetch(), REFRESH_MS);
    const onFocus = () => void refetch();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refetch]);

  // Prefer the server's CA (it includes quiz scores); fall back to submissions only.
  const ca = useMemo<ContinuousAssessment>(() => {
    if (!courseCA) return computeCA(submissions);
    const score = courseCA.reduce((sum, c) => sum + c.score, 0);
    const maxScore = courseCA.reduce((sum, c) => sum + c.max_score, 0);
    return {
      percent: maxScore > 0 ? (score / maxScore) * 100 : null,
      assessed: courseCA.reduce((sum, c) => sum + c.assessed, 0),
      submitted: submissions.length,
      score: Math.round(score * 10) / 10,
      maxScore: Math.round(maxScore * 10) / 10,
    };
  }, [courseCA, submissions]);
  const marked = useMemo(() => submissions.filter(isMarkedSubmission), [submissions]);

  return { submissions, marked, ca, courseCA: courseCA ?? [], isLoading, refetch };
}
