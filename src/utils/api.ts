import { getStoredLearnerToken, getStoredStaffToken, type StaffScope } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://139.84.247.238';
const API_PUBLIC_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://139.84.247.238';
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

export type UploadedDocument = {
  name: string;
  url: string;
  size: number;
};

export type CourseModule = {
  id?: string | number;
  name: string;
  course: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type Certificate = {
  id?: string | number;
  name: string;
  course: string;
  status: string;
  issuedDate: string;
  detail: string;
  /** Verification code for earned certificates (printed with a QR code). */
  code: string;
};

export type EnrollmentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  description: string;
  course: Course;
  documents?: UploadedDocument[];
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

function toCourseModule(record: ApiRecord): CourseModule | null {
  const title = typeof record.title === 'string' ? record.title.trim() : '';

  if (!title) {
    return null;
  }

  return {
    id: typeof record.id === 'string' || typeof record.id === 'number' ? record.id : undefined,
    name: typeof record.name === 'string' ? record.name : '',
    course: typeof record.course === 'string' ? record.course.trim() : '',
    title,
    description: typeof record.description === 'string' ? stripHtml(record.description) : '',
    sortOrder: typeof record.sort_order === 'number' ? record.sort_order : 0,
  };
}

function toCertificate(record: ApiRecord): Certificate | null {
  const course = typeof record.course === 'string' ? record.course.trim() : '';

  if (!course) {
    return null;
  }

  return {
    id: typeof record.id === 'string' || typeof record.id === 'number' ? record.id : undefined,
    name: typeof record.name === 'string' ? record.name : '',
    course,
    status: typeof record.status === 'string' ? record.status.trim() : '',
    issuedDate: typeof record.issued_date === 'string' ? record.issued_date.trim() : '',
    detail: typeof record.detail === 'string' ? stripHtml(record.detail) : '',
    code: typeof record.code === 'string' ? record.code.trim() : '',
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

  // Learner pages call /api and /portal: send the learner's login automatically
  // so the server can return their own data (staff calls pass their own token).
  if (!headers.Authorization && (path.startsWith('/api/') || path.startsWith('/portal/'))) {
    const learnerToken = getStoredLearnerToken();
    if (learnerToken) headers.Authorization = `Bearer ${learnerToken}`;
  }

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

export async function fetchCourseModules(courseName: string): Promise<CourseModule[]> {
  if (!courseName.trim()) {
    return [];
  }

  const payload = await request<unknown>('/api/get-data/?model=Course_Module', {
    method: 'GET',
    headers: {
      model: 'Course_Module',
      filters: JSON.stringify({ course: courseName }),
    },
  });

  return extractRows(payload)
    .filter(isRecord)
    .map((item) => toCourseModule(item))
    .filter((item): item is CourseModule => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchCertificates(email: string): Promise<Certificate[]> {
  if (!email.trim()) {
    return [];
  }

  const payload = await request<unknown>('/api/get-data/?model=Certificate', {
    method: 'GET',
    headers: {
      model: 'Certificate',
      filters: JSON.stringify({ learner_email: email }),
    },
  });

  return extractRows(payload)
    .filter(isRecord)
    .map((item) => toCertificate(item))
    .filter((item): item is Certificate => item !== null);
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
      documents: payload.documents ?? [],
    }),
  });
}

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    const learnerToken = getStoredLearnerToken();
    response = await fetch(`${API_BASE_URL}/api/upload-file/`, {
      method: 'POST',
      body: formData,
      headers: learnerToken ? { Authorization: `Bearer ${learnerToken}` } : undefined,
    });
  } catch {
    throw new Error('Unable to reach the server right now. Please check the backend connection and try again.');
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
    throw new Error(pickMessage(payload) ?? `Upload failed with status ${response.status}`);
  }

  const rows = extractRows(payload);
  const first = rows[0];
  if (!isRecord(first) || typeof first.url !== 'string') {
    throw new Error('Upload response was invalid.');
  }

  return {
    name: typeof first.name === 'string' ? first.name : file.name,
    url: first.url,
    size: typeof first.size === 'number' ? first.size : file.size,
  };
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
      // Assignments are keyed by their record name; fall back to it when no id exists.
      assignment: payload.assignmentId ?? payload.assignmentName,
      assignment_name: payload.assignmentName,
      student_first_name: payload.studentFirstName,
      student_last_name: payload.studentLastName,
      student: payload.studentEmail,
      content: payload.content,
      attachment: payload.attachment || '',
    }),
  });
}

export async function authenticateAdmin(payload: LearnerLoginPayload): Promise<unknown> {
  return request('/portal/authenticate-admin', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
}

export async function authenticateLecturer(payload: LearnerLoginPayload): Promise<unknown> {
  return request('/portal/authenticate-lecturer', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
}

function staffAuthHeaders(scope: StaffScope): Record<string, string> {
  const token = getStoredStaffToken(scope);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic record CRUD for a staff area: /admin/api/* or /lecturer/api/*.
export async function fetchStaffRecords<T = ApiRecord>(
  scope: StaffScope,
  model: string,
  filters?: Record<string, unknown>,
): Promise<T[]> {
  const headers: Record<string, string> = { model, ...staffAuthHeaders(scope) };
  if (filters) {
    headers.filters = JSON.stringify(filters);
  }

  const payload = await request<unknown>(`/${scope}/api/get-data/?model=${encodeURIComponent(model)}`, {
    method: 'GET',
    headers,
  });

  return extractRows(payload).filter(isRecord) as T[];
}

export async function createStaffRecord(scope: StaffScope, model: string, body: ApiRecord): Promise<unknown> {
  return request(`/${scope}/api/post-data/`, {
    method: 'POST',
    headers: { Model: model, ...staffAuthHeaders(scope) },
    body: JSON.stringify(body),
  });
}

export async function updateStaffRecord(scope: StaffScope, model: string, body: ApiRecord): Promise<unknown> {
  return request(`/${scope}/api/patch-data/`, {
    method: 'PATCH',
    headers: { Model: model, ...staffAuthHeaders(scope) },
    body: JSON.stringify(body),
  });
}

export async function deleteStaffRecord(scope: StaffScope, model: string, name: string): Promise<unknown> {
  return request(`/${scope}/api/delete-doc/`, {
    method: 'DELETE',
    headers: { Model: model, ...staffAuthHeaders(scope) },
    body: JSON.stringify({ name }),
  });
}

export const fetchAdminRecords = <T = ApiRecord>(model: string, filters?: Record<string, unknown>) =>
  fetchStaffRecords<T>('admin', model, filters);
export const createAdminRecord = (model: string, body: ApiRecord) => createStaffRecord('admin', model, body);
export const updateAdminRecord = (model: string, body: ApiRecord) => updateStaffRecord('admin', model, body);
export const deleteAdminRecord = (model: string, name: string) => deleteStaffRecord('admin', model, name);

// ---- Staff file uploads (lesson PDFs, audio) ----

export type UploadedFile = { name: string; url: string; size: number };

/** Uploads one file to /{scope}/api/upload-file/, reporting progress (0–100). */
export function uploadStaffFile(
  scope: StaffScope,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedFile> {
  return uploadWithProgress(`/${scope}/api/upload-file/`, getStoredStaffToken(scope), file, onProgress);
}

/** Uploads a file as the signed-in learner (voice notes, field photos, documents). */
export function uploadLearnerFile(file: File, onProgress?: (percent: number) => void): Promise<UploadedFile> {
  return uploadWithProgress('/api/upload-file/', getStoredLearnerToken(), file, onProgress);
}

function uploadWithProgress(
  path: string,
  token: string | null,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () =>
      reject(new Error('Unable to reach the server right now. Please check the backend connection and try again.'));
    xhr.onload = () => {
      let payload: unknown = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = xhr.responseText;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(pickMessage(payload) ?? `Upload failed (status ${xhr.status}).`));
        return;
      }
      const first = extractRows(payload)[0];
      if (!isRecord(first) || typeof first.url !== 'string') {
        reject(new Error('The server accepted the file but returned an unexpected response.'));
        return;
      }
      resolve({
        name: typeof first.name === 'string' ? first.name : file.name,
        url: first.url,
        size: typeof first.size === 'number' ? first.size : file.size,
      });
    };
    xhr.send(form);
  });
}

// ---- Learner's own submissions (marks & feedback) ----

export type MySubmission = {
  name: string;
  assignment: string;
  assignment_name: string;
  course: string;
  content: string;
  status: string;
  grade: string;
  score: number;
  max_score: number;
  feedback: string;
  creation: string;
  modified: string;
};

export async function fetchMySubmissions(): Promise<MySubmission[]> {
  const token = getStoredLearnerToken();
  if (!token) return [];
  const payload = await request<unknown>(`/portal/my-submissions?_=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  return extractRows(payload).filter(isRecord) as unknown as MySubmission[];
}

// ---- Learner progress ----

export type LessonProgressUpdate = {
  key: string;
  module: string;
  percent: number;
  completed: boolean;
};

/** Sends a learner's lesson progress to the server (learner session). */
export async function recordLessonProgress(update: LessonProgressUpdate): Promise<void> {
  const token = getStoredLearnerToken();
  if (!token) return;
  await request('/portal/lesson-progress', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(update),
  });
}

export type ProgressRow = {
  learner_email: string;
  key: string;
  module: string;
  course: string;
  percent: number;
  completed: boolean;
  modified: string;
};

export type ProgressLogRow = {
  learner_email: string;
  key: string;
  course: string;
  percent: number;
  creation: string;
};

export type ProgressReport = {
  courses: { name: string; lecturer?: string }[];
  lessons_per_course: Record<string, number>;
  enrollments: { first_name: string; last_name: string; email: string; course: string; creation: string }[];
  progress: ProgressRow[];
  logs: ProgressLogRow[];
};

/** Progress report for the admin console or the lecturer portal (scoped server-side). */
export async function fetchProgressReport(scope: StaffScope): Promise<ProgressReport> {
  const payload = await request<unknown>(`/${scope}/api/progress?_=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store',
    headers: staffAuthHeaders(scope),
  });
  const data = (isRecord(payload) && isRecord(payload.data) ? payload.data : payload) as Partial<ProgressReport>;
  return {
    courses: data.courses ?? [],
    lessons_per_course: data.lessons_per_course ?? {},
    enrollments: data.enrollments ?? [],
    progress: data.progress ?? [],
    logs: data.logs ?? [],
  };
}

// ---- Admin user management (/admin/api/users) ----

export type UserRole = 'Admin' | 'Lecturer' | 'Learner';

export type PortalUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  role: UserRole;
  active: boolean;
  email_verified: boolean;
  creation: string;
};

export type PortalUserInput = Partial<Omit<PortalUser, 'id' | 'creation' | 'email_verified'>> & {
  password?: string;
};

export async function fetchUsers(role?: UserRole): Promise<PortalUser[]> {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  const payload = await request<unknown>(`/admin/api/users${query}`, {
    method: 'GET',
    headers: staffAuthHeaders('admin'),
  });
  return extractRows(payload).filter(isRecord) as unknown as PortalUser[];
}

export async function createUser(body: PortalUserInput): Promise<unknown> {
  return request('/admin/api/users', {
    method: 'POST',
    headers: staffAuthHeaders('admin'),
    body: JSON.stringify(body),
  });
}

export async function updateUser(id: number, body: PortalUserInput): Promise<unknown> {
  return request(`/admin/api/users/${id}`, {
    method: 'PATCH',
    headers: staffAuthHeaders('admin'),
    body: JSON.stringify(body),
  });
}

export async function deleteUser(id: number): Promise<unknown> {
  return request(`/admin/api/users/${id}`, {
    method: 'DELETE',
    headers: staffAuthHeaders('admin'),
  });
}

// Shared helpers for feature modules.
export { request as apiRequest, extractRows, isRecord, staffAuthHeaders };
