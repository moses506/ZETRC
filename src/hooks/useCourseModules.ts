import { useEffect, useState } from 'react';
import { fetchCourseModules, type CourseModule } from '../utils/api';

export function useCourseModules(courseName: string | undefined) {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(courseName));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!courseName) {
      setModules([]);
      setIsLoading(false);
      return;
    }

    const loadModules = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchCourseModules(courseName);

        if (cancelled) {
          return;
        }

        setModules(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load course modules right now.',
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadModules();

    return () => {
      cancelled = true;
    };
  }, [courseName]);

  return {
    modules,
    isLoading,
    errorMessage,
  };
}
