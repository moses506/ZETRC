import { useEffect, useState } from 'react';
import { fetchCertificates, type Certificate } from '../utils/api';

export function useCertificates(email: string | undefined) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(email));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!email) {
      setCertificates([]);
      setIsLoading(false);
      return;
    }

    const loadCertificates = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchCertificates(email);

        if (cancelled) {
          return;
        }

        setCertificates(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load certificates right now.',
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCertificates();

    return () => {
      cancelled = true;
    };
  }, [email]);

  return {
    certificates,
    isLoading,
    errorMessage,
  };
}
