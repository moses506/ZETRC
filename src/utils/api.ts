const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/zetrc-api';
const API_PUBLIC_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://twisted-disparity-tingly.ngrok-free.dev';
type ApiRecord = Record<string, unknown>;

export type LearnerRegistrationPayload = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactNo: string;
  password: string;
  passwordConfirmation: string;
};

export type LearnerLoginPayload = {
  email: string;
  password: string;
};

export type Course = {
  id?: string | number;
  name: string;
  duration: string;
  description: string;
};

export type EnrollmentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  description: string;
  course: Course;
};

export type StudentEnrollment = {
  id?: string | number;
  email: string;
  courseName: string;
  duration: string;
  description: string;
};

export type LessonContent = {
  id?: string | number;
  name: string;
  module: string;
  introduction: string;
  summary: string;
  practicalInfo: string;
  attachments: string;
  audioFiles: string;
  keyPoints: string[];
};

export type Assignment = {
  id?: string | number;
  name: string;
  course: string;
  submissionDate: string;
  description: string;
  remarks: string;
  status: string;
  owner: string;
  firstName: string;
  lastName: string;
  contactNo: string;
  lecturerName: string;
  modifiedBy: string;
  statusColor: string;
  statusInnerColor: string;
};

export type AssignmentSubmissionPayload = {
  name: string;
  assignmentId?: string | number;
  assignmentName: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  content: string;
  attachment?: string;
};

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function resolveApiAssetUrl(path: string): string {
  if (!path) {
    return '';
  }

  if (path.startsWith('/')) {
    return `/zetrc-media${path}`;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const assetUrl = new URL(path);
      const apiBaseUrl = new URL(API_PUBLIC_BASE_URL);

      if (assetUrl.origin === apiBaseUrl.origin) {
        return `/zetrc-media${assetUrl.pathname}${assetUrl.search}`;
      }
    } catch {
      return path;
    }

    return path;
  }

  try {
    const assetUrl = new URL(path, API_PUBLIC_BASE_URL);
    const apiBaseUrl = new URL(API_PUBLIC_BASE_URL);

    if (assetUrl.origin === apiBaseUrl.origin) {
      return `/zetrc-media${assetUrl.pathname}${assetUrl.search}`;
    }

    return assetUrl.toString();
  } catch {
    return path;
  }
}

function toCourse(record: ApiRecord): Course | null {
  const name = typeof record.name === 'string' ? record.name.trim() : '';

  if (!name) {
    return null;
  }

  const duration = typeof record.duration === 'string' ? record.duration.trim() : '';
  const description =
    typeof record.description === 'string' ? stripHtml(record.description) : '';
  const id =
    typeof record.id === 'string' || typeof record.id === 'number' ? record.id : undefined;

  return {
    id,
    name,
    duration,
    description,
  };
}

function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.message)) {
    return payload.message;
  }

  if (Array.isArray(payload.docs)) {
    return payload.docs;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (isRecord(payload.data)) {
    const nestedRows = extractRows(payload.data);

    if (nestedRows.length > 0) {
      return nestedRows;
    }
  }

  if (isRecord(payload.message)) {
    const nestedRows = extractRows(payload.message);

    if (nestedRows.length > 0) {
      return nestedRows;
    }
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    throw new Error(payload.error.trim());
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    const message = payload.message.trim();

    if (
      message.toLowerCase().includes('error') ||
      message.toLowerCase().includes('nonetype') ||
      message.toLowerCase().includes('not iterable')
    ) {
      throw new Error(message);
    }
  }

  if (typeof payload.name === 'string' && payload.name.trim()) {
    return [payload];
  }

  return [];
}

function toLesson(record: ApiRecord): LessonContent | null {
  const name = typeof record.name === 'string' ? record.name.trim() : '';

  if (!name) {
    return null;
  }

  const keyPoints = Array.isArray(record.key_points)
    ? record.key_points
        .filter(isRecord)
        .map((item) => (typeof item.title === 'string' ? item.title.trim() : ''))
        .filter(Boolean)
    : [];

  return {
    id: typeof record.id === 'string' || typeof record.id === 'number' ? record.id : undefined,
    name,
    module: typeof record.module === 'string' ? record.module.trim() : '',
    introduction: typeof record.introduction === 'string' ? stripHtml(record.introduction) : '',
    summary: typeof record.summary === 'string' ? stripHtml(record.summary) : '',
    practicalInfo:
      typeof record.practical_info === 'string' ? stripHtml(record.practical_info) : '',
    attachments: typeof record.attachments === 'string' ? record.attachments.trim() : '',
    audioFiles: typeof record.audio_files === 'string' ? record.audio_files.trim() : '',
    keyPoints,
  };
}

function toAssignment(record: ApiRecord): Assignment | null {
  const name = typeof record.name === 'string' ? record.name.trim() : '';

  if (!name) {
    return null;
  }

  return {
    id: typeof record.id === 'string' || typeof record.id === 'number' ? record.id : undefined,
    name,
    course: typeof record.course === 'string' ? record.course.trim() : '',
    submissionDate:
      typeof record.submission_date === 'string' ? record.submission_date.trim() : '',
    description:
      typeof record.description === 'string' ? stripHtml(record.description) : '',
    remarks: typeof record.remarks === 'string' ? stripHtml(record.remarks) : '',
    status: typeof record.status === 'string' ? record.status.trim() : '',
    owner: typeof record.owner === 'string' ? record.owner.trim() : '',
    firstName: typeof record.first_name === 'string' ? record.first_name.trim() : '',
    lastName: typeof record.last_name === 'string' ? record.last_name.trim() : '',
    contactNo: typeof record.contact_no === 'string' ? record.contact_no.trim() : '',
    lecturerName:
      typeof record.lecturer_name === 'string' ? record.lecturer_name.trim() : '',
    modifiedBy: typeof record.modified_by === 'string' ? record.modified_by.trim() : '',
    statusColor:
      typeof record.status_color === 'string' ? record.status_color.trim() : '',
    statusInnerColor:
      typeof record.status_inner_color === 'string' ? record.status_inner_color.trim() : '',
  };
}

function toStudentEnrollment(record: ApiRecord): StudentEnrollment | null {
  // The API may return the course as a nested object or a plain string
  const courseField = record.course;
  const courseName =
    isRecord(courseField) && typeof courseField.name === 'string'
      ? courseField.name.trim()
      : typeof courseField === 'string'
        ? courseField.trim()
        : typeof record.course_name === 'string'
          ? record.course_name.trim()
          : '';

  if (!courseName) {
    return null;
  }

  const duration =
    isRecord(courseField) && typeof courseField.duration === 'string'
      ? courseField.duration.trim()
      : typeof record.duration === 'string'
        ? record.duration.trim()
        : '';

  const description =
    typeof record.description === 'string' ? stripHtml(record.description) : '';

  const email =
    typeof record.email === 'string'
      ? record.email.trim()
      : typeof record.student === 'string'
        ? record.student.trim()
        : '';

  const id =
    typeof record.id === 'string' || typeof record.id === 'number' ? record.id : undefined;

  return {
    id,
    email,
    courseName,
    duration,
    description,
  };
}

function pickMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    const normalized = payload.toLowerCase();

    if (
      normalized.includes('err_ngrok_6024') ||
      normalized.includes('err_ngrok_8012') ||
      normalized.includes('failed to establish a connection to the upstream web service') ||
      normalized.includes('traffic successfully made it to the ngrok agent')
    ) {
      return 'The backend is unavailable right now. Please try again in a moment.';
    }

    if (normalized.includes('<!doctype html') || normalized.includes('<html')) {
      return 'The server returned an unexpected page instead of API data. Please try again shortly.';
    }

    return payload;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const directKeys = ['message', 'error', 'detail', 'error_message'];

  for (const key of directKeys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const errors = payload.errors;

  if (Array.isArray(errors)) {
    const firstError = errors.find((item) => typeof item === 'string' && item.trim());
    if (typeof firstError === 'string') {
      return firstError;
    }
  }

  if (isRecord(errors)) {
    for (const value of Object.values(errors)) {
      if (typeof value === 'string' && value.trim()) {
        return value;
      }

      if (Array.isArray(value)) {
        const firstItem = value.find((item) => typeof item === 'string' && item.trim());
        if (typeof firstItem === 'string') {
          return firstItem;
        }
      }
    }
  }

  return null;
}

async function request<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
  let response: Response;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.body) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  console.log('API request', {
    url: `${API_BASE_URL}${path}`,
    method: init.method ?? 'GET',
    headers,
    body: init.body ?? null,
  });

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(
      'Unable to reach the server right now. Please check the backend connection and try again.',
    );
  }

  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    throw new Error(
      pickMessage(payload) ?? `Request failed with status ${response.status}`,
    );
  }

  return payload as TResponse;
}

export async function submitLearnerRegistration(
  payload: LearnerRegistrationPayload,
): Promise<unknown> {
  return request('/portal/submit-learner-registration', {
    method: 'POST',
    body: JSON.stringify({
      stage_1: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        contact_no: payload.contactNo,
        password: payload.password,
        password_confirmation: payload.passwordConfirmation,
      },
    }),
  });
}

export async function authenticateLearner(payload: LearnerLoginPayload): Promise<unknown> {
  return request('/portal/authenticate', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
}

export async function fetchCourses(): Promise<Course[]> {
  const payload = await request<unknown>('/api/get-data/?model=Course', {
    method: 'GET',
    headers: {
      model: 'Course',
    },
  });

  return extractRows(payload)
    .filter(isRecord)
    .map((item) => toCourse(item))
    .filter((item): item is Course => item !== null);
}

export async function fetchStudentEnrollment(email: string): Promise<StudentEnrollment | null> {
  const payload = await request<unknown>('/api/get-data/?model=Student_Enrollment', {
    method: 'GET',
    headers: {
      model: 'Student_Enrollment',
      filters: JSON.stringify({ email }),
    },
  });

  const enrollments = extractRows(payload)
    .filter(isRecord)
    .map((item) => toStudentEnrollment(item))
    .filter((item): item is StudentEnrollment => item !== null);

  return enrollments[0] ?? null;
}

export async function fetchLessons(): Promise<LessonContent[]> {
  const payload = await request<unknown>('/api/get-data/?model=Lesson_Content', {
    method: 'GET',
    headers: {
      model: 'Lesson_Content',
    },
  });

  return extractRows(payload)
    .filter(isRecord)
    .map((item) => toLesson(item))
    .filter((item): item is LessonContent => item !== null);
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const payload = await request<unknown>('/api/get-data/?model=Assignment', {
    method: 'GET',
    headers: {
      model: 'Assignment',
    },
  });

  return extractRows(payload)
    .filter(isRecord)
    .map((item) => toAssignment(item))
    .filter((item): item is Assignment => item !== null);
}

export async function submitEnrollment(payload: EnrollmentPayload): Promise<unknown> {
  return request('/api/post-data/', {
    method: 'POST',
    headers: {
      Model: 'Student_Enrollment',
    },
    body: JSON.stringify({
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      course: payload.course.id ?? payload.course.name,
      description: payload.description,
    }),
  });
}

export function getApiMessage(payload: unknown, fallback: string): string {
  return pickMessage(payload) ?? fallback;
}

export async function submitAssignmentSubmission(
  payload: AssignmentSubmissionPayload,
): Promise<unknown> {
  return request('/api/post-data/', {
    method: 'POST',
    headers: {
      Model: 'Assignment_Submission',
    },
    body: JSON.stringify({
      name: payload.name,
      assignment: payload.assignmentId,
      assignment_name: payload.assignmentName,
      student_first_name: payload.studentFirstName,
      student_last_name: payload.studentLastName,
      student: payload.studentEmail,
      content: payload.content,
      attachment: payload.attachment || '',
    }),
  });
}
