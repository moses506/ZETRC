export type LearnerProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  roleLabel: string;
  initials: string;
};

export type LearnerEnrollment = {
  courseName: string;
  duration: string;
  description: string;
};

type UnknownRecord = Record<string, unknown>;

const defaultProfile: LearnerProfile = {
  firstName: 'Learner',
  lastName: '',
  fullName: 'Learner',
  email: '',
  phoneNumber: '',
  roleLabel: 'Pilot Trainee',
  initials: 'LE',
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function safeParse(storageKey: string): unknown {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function readString(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function hasIdentityField(record: UnknownRecord): boolean {
  return [
    'first_name',
    'firstName',
    'last_name',
    'lastName',
    'full_name',
    'fullName',
    'name',
    'email',
    'login_email',
  ].some((key) => typeof record[key] === 'string' && record[key].trim());
}

function findRecord(value: unknown): UnknownRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const directCandidates = [
    'user',
    'learner',
    'data',
    'profile',
    'response',
    'result',
    'account',
    'user_data',
    'learner_data',
  ];

  for (const key of directCandidates) {
    const candidate = value[key];
    const record = findRecord(candidate);
    if (record) {
      return record;
    }

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const arrayRecord = findRecord(item);
        if (arrayRecord) {
          return arrayRecord;
        }
      }
    }
  }

  if (hasIdentityField(value)) {
    return value;
  }

  return null;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function buildInitials(firstName: string, lastName: string, fullName: string): string {
  const fromNames = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim();

  if (fromNames) {
    return fromNames.toUpperCase();
  }

  const tokens = fullName.split(/\s+/).filter(Boolean);
  const fallback = `${tokens[0]?.charAt(0) ?? ''}${tokens[1]?.charAt(0) ?? ''}`;

  return (fallback || 'LE').toUpperCase();
}

export function getStoredLearnerProfile(): LearnerProfile {
  const authSession = safeParse('zetrcAuthSession');
  const rootRecord = isRecord(authSession) ? authSession : null;
  const sessionRecord = findRecord(authSession);

  const fullNameFromSession =
    (sessionRecord && readString(sessionRecord, ['full_name', 'fullName', 'name'])) ||
    '';
  const nameParts = splitFullName(fullNameFromSession);

  const firstName =
    (sessionRecord && readString(sessionRecord, ['first_name', 'firstName', 'given_name'])) ||
    nameParts.firstName ||
    defaultProfile.firstName;

  const lastName =
    (sessionRecord && readString(sessionRecord, ['last_name', 'lastName', 'family_name'])) ||
    nameParts.lastName ||
    defaultProfile.lastName;

  const fullName =
    fullNameFromSession ||
    `${firstName} ${lastName}`.trim() ||
    defaultProfile.fullName;

  const email =
    (sessionRecord && readString(sessionRecord, ['email', 'login_email'])) ||
    (rootRecord && readString(rootRecord, ['email', 'login_email'])) ||
    defaultProfile.email;

  const phoneNumber =
    (sessionRecord &&
      readString(sessionRecord, ['contact_no', 'contactNo', 'phone', 'phone_number'])) ||
    defaultProfile.phoneNumber;

  const roleLabel =
    (sessionRecord &&
      readString(sessionRecord, ['role', 'role_label', 'participant_type'])) ||
    defaultProfile.roleLabel;

  return {
    firstName,
    lastName,
    fullName,
    email,
    phoneNumber,
    roleLabel,
    initials: buildInitials(firstName, lastName, fullName),
  };
}

export function getStoredLearnerEnrollment(): LearnerEnrollment | null {
  const enrollmentData = safeParse('zetrcEnrollment');

  if (!isRecord(enrollmentData)) {
    return null;
  }

  const courseName = readString(enrollmentData, ['courseName']);

  if (!courseName) {
    return null;
  }

  return {
    courseName,
    duration: readString(enrollmentData, ['duration']),
    description: readString(enrollmentData, ['description']),
  };
}

export function getStoredLearnerToken(): string | null {
  const sessionRecord = findRecord(safeParse('zetrcAuthSession'));
  const token = sessionRecord && readString(sessionRecord, ['token']);
  return token || null;
}

export function hasStoredLearnerSession(): boolean {
  return isRecord(safeParse('zetrcAuthSession'));
}

export function clearStoredLearnerData(): void {
  localStorage.removeItem('zetrcAuthSession');
  localStorage.removeItem('zetrcRememberUser');
  localStorage.removeItem('zetrcEnrollment');
  localStorage.removeItem('zetrcLastRegistration');
}

export type AdminProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  initials: string;
};

/** A staff area with its own session slot in localStorage. */
export type StaffScope = 'admin' | 'lecturer';

const STAFF_SESSION_KEYS: Record<StaffScope, string> = {
  admin: 'zetrcAdminSession',
  lecturer: 'zetrcLecturerSession',
};

const STAFF_DEFAULT_NAMES: Record<StaffScope, string> = {
  admin: 'Admin',
  lecturer: 'Lecturer',
};

export function getStaffSessionKey(scope: StaffScope): string {
  return STAFF_SESSION_KEYS[scope];
}

export function hasStoredStaffSession(scope: StaffScope): boolean {
  return isRecord(safeParse(STAFF_SESSION_KEYS[scope]));
}

export function getStoredStaffProfile(scope: StaffScope): AdminProfile {
  const sessionRecord = findRecord(safeParse(STAFF_SESSION_KEYS[scope]));
  const fallbackName = STAFF_DEFAULT_NAMES[scope];

  const fullNameFromSession =
    (sessionRecord && readString(sessionRecord, ['full_name', 'fullName', 'name'])) || '';
  const nameParts = splitFullName(fullNameFromSession);

  const firstName =
    (sessionRecord && readString(sessionRecord, ['first_name', 'firstName'])) ||
    nameParts.firstName ||
    fallbackName;

  const lastName =
    (sessionRecord && readString(sessionRecord, ['last_name', 'lastName'])) || nameParts.lastName || '';

  const fullName = fullNameFromSession || `${firstName} ${lastName}`.trim() || fallbackName;

  const email = (sessionRecord && readString(sessionRecord, ['email', 'login_email'])) || '';

  return {
    firstName,
    lastName,
    fullName,
    email,
    initials: buildInitials(firstName, lastName, fullName),
  };
}

export function getStoredStaffToken(scope: StaffScope): string | null {
  const sessionRecord = findRecord(safeParse(STAFF_SESSION_KEYS[scope]));
  const token = sessionRecord && readString(sessionRecord, ['token']);

  return token || null;
}

export function clearStoredStaffData(scope: StaffScope): void {
  localStorage.removeItem(STAFF_SESSION_KEYS[scope]);
}

// Admin wrappers kept for existing call sites.
export const hasStoredAdminSession = (): boolean => hasStoredStaffSession('admin');
export const getStoredAdminProfile = (): AdminProfile => getStoredStaffProfile('admin');
export const getStoredAdminToken = (): string | null => getStoredStaffToken('admin');
export const clearStoredAdminData = (): void => clearStoredStaffData('admin');

// Lecturer equivalents.
export const hasStoredLecturerSession = (): boolean => hasStoredStaffSession('lecturer');
export const getStoredLecturerProfile = (): AdminProfile => getStoredStaffProfile('lecturer');
export const clearStoredLecturerData = (): void => clearStoredStaffData('lecturer');

/**
 * After a sign-in on the learner login page, move Admin/Lecturer sessions into
 * their own slot so staff land in their portal instead of course enrollment.
 * Returns the staff scope the session moved to, or null for learners.
 */
export function promoteLearnerSessionToStaff(): StaffScope | null {
  const learnerSession = safeParse('zetrcAuthSession');
  const sessionRecord = findRecord(learnerSession);
  const role = (sessionRecord ? readString(sessionRecord, ['role']) : '').toLowerCase();

  const scope: StaffScope | null = role === 'admin' ? 'admin' : role === 'lecturer' ? 'lecturer' : null;
  if (!scope) {
    return null;
  }

  localStorage.setItem(STAFF_SESSION_KEYS[scope], JSON.stringify(learnerSession));
  clearStoredLearnerData();
  return scope;
}
