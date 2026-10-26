// API calls for ZETRC features: notifications, announcements, quizzes, CA,
// certificates, gradebook, enrollment review, discussions, field journal,
// impact report and audit log.
import { apiRequest, extractRows, isRecord, staffAuthHeaders } from './api';
import { getStoredLearnerToken, type StaffScope } from './auth';

/** Whose login to send: the learner's, or a staff area's. */
export type Actor = 'learner' | StaffScope;

function authHeaders(actor: Actor): Record<string, string> {
  if (actor === 'learner') {
    const token = getStoredLearnerToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return staffAuthHeaders(actor);
}

function dataOf<T>(payload: unknown): T {
  return (isRecord(payload) && 'data' in payload ? payload.data : payload) as T;
}

async function get<T>(actor: Actor, path: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?';
  return dataOf<T>(
    await apiRequest<unknown>(`${path}${sep}_=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: authHeaders(actor),
    }),
  );
}

async function send<T>(actor: Actor, method: string, path: string, body?: unknown): Promise<T> {
  return dataOf<T>(
    await apiRequest<unknown>(path, {
      method,
      headers: authHeaders(actor),
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

// ---------- Notifications ----------

export type AppNotification = {
  id: number;
  kind: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  creation: string;
};

export async function fetchNotifications(actor: Actor): Promise<{ items: AppNotification[]; unread: number }> {
  const data = await get<{ items?: AppNotification[]; unread?: number }>(actor, '/portal/notifications');
  return { items: data?.items ?? [], unread: data?.unread ?? 0 };
}

export function markNotificationsRead(actor: Actor, ids?: number[]) {
  return send(actor, 'POST', '/portal/notifications/read', { ids: ids ?? [] });
}

// ---------- Announcements ----------

export type Announcement = {
  name: string;
  course: string;
  title: string;
  body: string;
  priority: string;
  author_name: string;
  creation: string;
};

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return extractRows(await get<unknown>('learner', '/portal/announcements')) as Announcement[];
}

// ---------- Profile & enrollments ----------

export type Profile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  gender: string;
  district: string;
  cooperative: string;
  sms_opt_in: boolean;
};

export const fetchMe = () => get<Profile>('learner', '/portal/me');
export const updateMe = (body: Partial<Profile>) => send<Profile>('learner', 'PATCH', '/portal/me', body);

export type MyEnrollment = {
  name: string;
  course: string;
  status: string;
  review_note: string;
  creation: string;
};

export async function fetchMyEnrollments(): Promise<MyEnrollment[]> {
  return extractRows(await get<unknown>('learner', '/portal/my-enrollments')) as MyEnrollment[];
}

// ---------- CA ----------

export type CAItem = { key: string; title: string; kind: string; score: number; max_score: number; status: string };
export type CourseCA = {
  course: string;
  percent: number | null;
  score: number;
  max_score: number;
  assessed: number;
  pass_mark: number;
  items: CAItem[];
};

export async function fetchMyCA(): Promise<CourseCA[]> {
  return extractRows(await get<unknown>('learner', '/portal/my-ca')) as CourseCA[];
}

// ---------- Quizzes ----------

export type QuizQuestion = { prompt: string; options: string[]; answer: number; marks: number };

export type LearnerQuiz = {
  name: string;
  course: string;
  module: string;
  title: string;
  description: string;
  questions: { prompt: string; options: string[]; marks: number }[];
  max_score: number;
  max_attempts: number;
  attempts: number;
  best_score: number | null;
};

export type QuizResult = {
  score: number;
  max_score: number;
  percent: number;
  results: { correct: boolean; chosen: number; correct_answer: number }[];
  ca: CourseCA;
};

export async function fetchQuizzes(): Promise<LearnerQuiz[]> {
  return extractRows(await get<unknown>('learner', '/portal/quizzes')) as LearnerQuiz[];
}

export const submitQuizAttempt = (name: string, answers: number[]) =>
  send<QuizResult>('learner', 'POST', `/portal/quizzes/${encodeURIComponent(name)}/attempt`, { answers });

// ---------- Certificates ----------

export type CertificateCheck = {
  valid: boolean;
  code: string;
  learner?: string;
  course?: string;
  duration?: string;
  issued_date?: string;
  ca_percent?: number;
  lecturer?: string;
  detail?: string;
};

export const verifyCertificate = (code: string) =>
  get<CertificateCheck>('learner', `/portal/verify-certificate/${encodeURIComponent(code.trim())}`);

// ---------- Gradebook ----------

export type GradebookColumn = { key: string; title: string; kind: 'assignment' | 'quiz'; due: string };
export type GradebookCell = { score: number; max_score: number; status: string };
export type GradebookRow = {
  email: string;
  name: string;
  cells: Record<string, GradebookCell>;
  ca: number | null;
  assessed: number;
  last_active: string;
  risks: string[];
};
export type Gradebook = { course: string; pass_mark: number; columns: GradebookColumn[]; rows: GradebookRow[] };

export const fetchGradebook = (scope: StaffScope, course: string) =>
  get<Gradebook>(scope, `/${scope}/api/gradebook?course=${encodeURIComponent(course)}`);

// ---------- Enrollment review ----------

export const reviewEnrollment = (name: string, decision: 'approved' | 'rejected' | 'pending', note: string) =>
  send('admin', 'POST', '/admin/api/enrollments/review', { name, decision, note });

// ---------- Discussions ----------

export type Thread = {
  id: number;
  course: string;
  title: string;
  body: string;
  author_email: string;
  author_name: string;
  author_role: string;
  reply_count: number;
  resolved: boolean;
  last_activity: string;
  creation: string;
};
export type Reply = {
  id: number;
  thread_id: number;
  body: string;
  author_email: string;
  author_name: string;
  author_role: string;
  creation: string;
};

export async function fetchThreads(actor: Actor, course?: string): Promise<{ threads: Thread[]; courses: string[] }> {
  const data = await get<{ threads?: Thread[]; courses?: string[] }>(
    actor,
    `/portal/discussions${course ? `?course=${encodeURIComponent(course)}` : ''}`,
  );
  return { threads: data?.threads ?? [], courses: data?.courses ?? [] };
}

export const createThread = (actor: Actor, body: { course: string; title: string; body: string }) =>
  send<Thread>(actor, 'POST', '/portal/discussions', body);
export const fetchThread = (actor: Actor, id: number) =>
  get<{ thread: Thread; replies: Reply[] }>(actor, `/portal/discussions/${id}`);
export const replyToThread = (actor: Actor, id: number, body: string) =>
  send<Reply>(actor, 'POST', `/portal/discussions/${id}/replies`, { body });
export const setThreadResolved = (actor: Actor, id: number, resolved: boolean) =>
  send(actor, 'PATCH', `/portal/discussions/${id}`, { resolved });
export const deleteThread = (actor: Actor, id: number) => send(actor, 'DELETE', `/portal/discussions/${id}`);

// ---------- Field journal ----------

export type FieldPhoto = {
  id: number;
  learner_email: string;
  learner_name: string;
  course: string;
  caption: string;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  taken_at: string;
  creation: string;
};

export async function fetchMyPhotos(): Promise<FieldPhoto[]> {
  return extractRows(await get<unknown>('learner', '/portal/field-photos')) as FieldPhoto[];
}
export const addPhoto = (photo: Partial<FieldPhoto>) => send<FieldPhoto>('learner', 'POST', '/portal/field-photos', photo);
export const deletePhoto = (id: number) => send('learner', 'DELETE', `/portal/field-photos/${id}`);
export async function fetchStaffPhotos(scope: StaffScope): Promise<FieldPhoto[]> {
  return extractRows(await get<unknown>(scope, `/${scope}/api/field-photos`)) as FieldPhoto[];
}

// ---------- Impact & audit (admin) ----------

export type CountRow = { label: string; count: number };
export type ImpactReport = {
  generated_at: string;
  totals: {
    learners: number;
    active_30d: number;
    enrollments: number;
    approved: number;
    pending: number;
    certificates: number;
    completion_rate: number;
    average_ca: number | null;
    field_photos: number;
    submissions: number;
    quiz_attempts: number;
  };
  by_gender: CountRow[];
  by_district: CountRow[];
  by_course: { course: string; enrollments: number; certificates: number; completion: number; average_ca: number | null }[];
  by_month: { month: string; count: number }[];
};

export const fetchImpact = () => get<ImpactReport>('admin', '/admin/api/impact');

export type AuditEntry = {
  id: number;
  actor_email: string;
  actor_role: string;
  action: string;
  model: string;
  record: string;
  summary: string;
  changes: string;
  creation: string;
};

export async function fetchAuditLog(filters: { model?: string; actor?: string } = {}): Promise<AuditEntry[]> {
  const params = new URLSearchParams();
  if (filters.model) params.set('model', filters.model);
  if (filters.actor) params.set('actor', filters.actor);
  const query = params.toString();
  return extractRows(await get<unknown>('admin', `/admin/api/audit-log${query ? `?${query}` : ''}`)) as AuditEntry[];
}

// ---------- CSV export (opens in Excel) ----------

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = '\ufeff' + rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
