import { useEffect, useState } from 'react';
import { fetchLessons, type LessonContent } from '../utils/api';

export function useLessons() {
  const [lessons, setLessons] = useState<LessonContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLessons = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchLessons();

        if (cancelled) {
          return;
        }

        setLessons(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load lessons right now.',
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLessons();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    lessons,
    isLoading,
    errorMessage,
  };
}
