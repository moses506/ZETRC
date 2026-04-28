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

function findRecord(value: unknown): UnknownRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const directCandidates = ['user', 'learner', 'data', 'profile'];

  for (const key of directCandidates) {
    const candidate = value[key];
    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return value;
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
  const registrationData = safeParse('zetrcLastRegistration');

  const sessionRecord = findRecord(authSession);
  const registrationRecord = isRecord(registrationData) ? registrationData : null;
  const registrationProfile = registrationRecord && isRecord(registrationRecord.profile)
    ? registrationRecord.profile
    : null;

  const firstName =
    (sessionRecord && readString(sessionRecord, ['first_name', 'firstName'])) ||
    (registrationProfile && readString(registrationProfile, ['firstName', 'first_name'])) ||
    defaultProfile.firstName;

  const lastName =
    (sessionRecord && readString(sessionRecord, ['last_name', 'lastName'])) ||
    (registrationProfile && readString(registrationProfile, ['lastName', 'last_name'])) ||
    defaultProfile.lastName;

  const sessionFullName = sessionRecord
    ? readString(sessionRecord, ['full_name', 'fullName', 'name'])
    : '';
  const registrationFullName = registrationProfile
    ? readString(registrationProfile, ['fullName', 'name'])
    : '';

  const fullName =
    sessionFullName ||
    registrationFullName ||
    `${firstName} ${lastName}`.trim() ||
    defaultProfile.fullName;

  const email =
    (sessionRecord && readString(sessionRecord, ['email'])) ||
    (registrationProfile && readString(registrationProfile, ['email'])) ||
    defaultProfile.email;

  const phoneNumber =
    (sessionRecord && readString(sessionRecord, ['contact_no', 'contactNo', 'phone', 'phone_number'])) ||
    (registrationProfile && readString(registrationProfile, ['phoneNumber', 'contactNo', 'contact_no'])) ||
    defaultProfile.phoneNumber;

  const roleLabel =
    (sessionRecord && readString(sessionRecord, ['role', 'role_label', 'participant_type'])) ||
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
