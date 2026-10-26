import { useCallback, useEffect, useState } from 'react';
import { fetchStaffRecords, fetchUsers, type PortalUser, type UserRole } from '../utils/api';
import type { StaffScope } from '../utils/auth';

function useLoader<T>(load: () => Promise<T[]>, deps: unknown[], label: string) {
  const [records, setRecords] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await load();
        if (!cancelled) {
          setRecords(result);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : `Unable to load ${label} right now.`);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  return { records, isLoading, errorMessage, refetch };
}

/** Records of one model from /admin/api or /lecturer/api. */
export function useStaffRecords<T = Record<string, unknown>>(
  scope: StaffScope,
  model: string,
  filters?: Record<string, unknown>,
) {
  return useLoader<T>(
    () => fetchStaffRecords<T>(scope, model, filters),
    [scope, model, JSON.stringify(filters ?? {})],
    `${model} records`,
  );
}

export function useAdminRecords<T = Record<string, unknown>>(
  model: string,
  filters?: Record<string, unknown>,
) {
  return useStaffRecords<T>('admin', model, filters);
}

/** Portal accounts (admin only), optionally filtered by role. */
export function useUsers(role?: UserRole) {
  return useLoader<PortalUser>(() => fetchUsers(role), [role ?? ''], 'users');
}
