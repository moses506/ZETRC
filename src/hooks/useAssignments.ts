import { useEffect, useState } from 'react';
import { fetchAssignments, type Assignment } from '../utils/api';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAssignments = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchAssignments();

        if (cancelled) {
          return;
        }

        setAssignments(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load assignments right now.',
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAssignments();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    assignments,
    isLoading,
    errorMessage,
  };
}
