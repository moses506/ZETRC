import { useEffect, useMemo, useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react';
import '../styles/dashboard.css';
import type { LearnerEnrollment, LearnerProfile } from '../utils/auth';
import { resolveApiAssetUrl, type Assignment, submitAssignmentSubmission } from '../utils/api';
import { useLessons } from '../hooks/useLessons';
import { useAssignments } from '../hooks/useAssignments';
import { useCourseModules } from '../hooks/useCourseModules';
import { useCertificates } from '../hooks/useCertificates';
import { RichTextEditor } from '../components/RichTextEditor';
import { useLanguage } from '../i18n/LanguageContext';

type DashboardProps = {
  learnerEnrollment: LearnerEnrollment | null;
  learnerProfile: LearnerProfile;
  onLogout: () => void;
  onRequestProposal: () => void;
};

type ViewKey = 'dashboard' | 'mycourse' | 'training' | 'assignments' | 'certificates' | 'library';

type AudioProgressEntry = {
  currentTime: number;
  duration: number;
  percent: number;
  completed: boolean;
};

type AudioCacheStatus = 'idle' | 'loading' | 'ready' | 'error';

type AudioBlobEntry = {
  url: string;
  mimeType: string;
};

type AssignmentSubmissionEntry = {
  response: string;
  submittedAt: string;
  attachmentName?: string;
  attachmentSize?: number;
};

type AssignmentUploadDraft = {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
};

import { openWhatsApp } from '../utils/whatsapp';
const audioProgressStorageKey = 'zetrcLessonAudioProgress';
const audioProgressUpdatedEvent = 'zetrcAudioProgressUpdated';
const assignmentSubmissionStorageKey = 'zetrcAssignmentSubmissions';

function relativeDateLabel(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

const modules = [
  { num: 1, name: 'Climate-smart farming basics', desc: 'Understand weather changes and how to adapt', status: 'done' },
  { num: 2, name: 'Soil health & productivity', desc: 'Improve soil using low-cost techniques', status: 'done' },
  { num: 3, name: 'Crop management', desc: 'Better planting, spacing, and care', status: 'active' },
  { num: 4, name: 'Post-harvest handling', desc: 'Reduce losses and improve quality', status: 'locked' },
  { num: 5, name: 'Basic processing for income', desc: 'Turn crops into higher-value products', status: 'locked' },
];

const tasks = [
  { color: 'amber', text: 'Submit Module 3 field observation', due: `Due: ${relativeDateLabel(2)}` },
  { color: 'green', text: 'Watch crop spacing video lesson', due: 'Recommended today' },
  { color: 'green', text: 'Complete Module 3 quiz', due: 'Unlocks Module 4' },
  { color: 'gray', text: 'Group feedback session — Cooperatives cohort', due: `${relativeDateLabel(6)} at 10:00` },
];

const announcements = [
  { title: 'Module 4 now available for preview', body: 'Post-harvest handling content has been uploaded. Complete Module 3 to unlock.', date: relativeDateLabel(0), type: 'info' },
  { title: 'Assignment deadline reminder', body: 'Your Module 3 field observation is due in 2 days. Submit via the form or WhatsApp.', date: relativeDateLabel(-2), type: 'warn' },
  { title: 'ZETRC Academy — early access open', body: 'Sign up for early access to the full digital learning platform with certifications.', date: relativeDateLabel(-4), type: 'info' },
];

const weekFocus = [
  { label: 'Current module', value: 'Module 3' },
  { label: 'Time this week', value: '2h 40m' },
  { label: 'Completion', value: '68%' },
];

const resourceCards = [
  { title: 'Module guide', desc: 'Download the crop management workbook for field notes and revision.' },
  { title: 'Voice note support', desc: 'Send assignment questions through WhatsApp for faster cohort support.' },
  { title: 'Practice checklist', desc: 'Use the weekly checklist before submitting your observation report.' },
];

const assignmentBoard = [
  {
    title: 'Module 3 field observation',
    due: `Due ${relativeDateLabel(2)}`,
    status: 'urgent',
    type: 'Observation report',
    detail: 'Visit one plot, record spacing patterns, and upload 2 photos or 1 short voice note.',
  },
  {
    title: 'Crop spacing quiz',
    due: 'Opens after lesson 3.2',
    status: 'open',
    type: 'Quiz',
    detail: 'Answer 10 short questions to confirm row spacing and stand count understanding.',
  },
  {
    title: 'Peer discussion reflection',
    due: relativeDateLabel(6),
    status: 'scheduled',
    type: 'Reflection',
    detail: 'Share one challenge from your field observations and one practice you want to improve.',
  },
];

const submissionChecklist = [
  'Take clear plot photos or prepare one short voice note',
  'Include crop type, planting date, and spacing observations',
  'Mention one issue noticed in the field and one corrective action',
  'Submit before the deadline to unlock the next module task',
];

const assignmentActivity = [
  { title: 'Module 2 soil worksheet', meta: `Reviewed · ${relativeDateLabel(-3)}`, state: 'done' },
  { title: 'Water use practice note', meta: 'Submitted · awaiting feedback', state: 'pending' },
  { title: 'Crop management observation', meta: 'Not submitted yet', state: 'current' },
];

const certificateBenefits = [
  'Certificates reflect completed modules and verified practical submissions',
  'Issued credentials can be shared with partner organizations and coordinators',
  'Locked certificates become available automatically as modules are completed',
];

type LibraryItem = {
  title: string;
  module: string;
  language: string;
  format: 'PDF' | 'Audio' | 'Video';
  detail: string;
  href: string;
  action: string;
  state: 'ready' | 'pending';
};

type TrainingModuleItem = {
  num: number;
  name: string;
  desc: string;
  status: string;
  resources: LibraryItem[];
};

const trainingModuleMap: TrainingModuleItem[] = [
  {
    num: 1,
    name: 'No modules yet',
    desc: 'Live modules will appear here once lesson content is published.',
    status: 'locked',
    resources: [],
  },
  {
    num: 2,
    name: 'Post-harvest handling',
    desc: 'Waiting for the next bilingual module upload.',
    status: 'locked',
    resources: [],
  },
  {
    num: 3,
    name: 'Crop management',
    desc: 'Waiting for the next bilingual module upload.',
    status: 'locked',
    resources: [],
  },
  {
    num: 4,
    name: 'Basic processing for income',
    desc: 'Waiting for the next bilingual module upload.',
    status: 'locked',
    resources: [],
  },
];

function buildLessonModuleRows(lessons: { name: string; module: string; introduction: string; summary: string }[]) {
  return lessons.slice(0, 5).map((lesson, index) => ({
    num: index + 1,
    name: lesson.module || lesson.name,
    desc: lesson.introduction || lesson.summary || 'Lesson content is available in the dashboard.',
    status: index === 0 ? 'active' : index < 2 ? 'done' : 'locked',
  }));
}

function getAudioCandidates(href: string): string[] {
  if (!href) {
    return [];
  }

  const baseCandidates = href
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const normalizedCandidates = baseCandidates.length > 0 ? baseCandidates : [href];
  const expandedCandidates = normalizedCandidates.flatMap((candidate) => {
    const normalizedHref = candidate.toLowerCase();

    if (normalizedHref.includes('.amr')) {
      return [
        candidate.replace(/\.amr(\?|$)/i, '.mp3$1'),
        candidate.replace(/\.amr(\?|$)/i, '.m4a$1'),
        candidate,
      ];
    }

    return [candidate];
  });

  return [...new Set(expandedCandidates)];
}

function isBrowserPlayableAudio(href: string): boolean {
  const normalizedHref = href.toLowerCase();
  return ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].some((ext) => normalizedHref.includes(ext));
}

function getAudioMimeType(href: string): string | undefined {
  const normalizedHref = href.toLowerCase();

  if (normalizedHref.includes('.mp3')) {
    return 'audio/mpeg';
  }

  if (normalizedHref.includes('.wav')) {
    return 'audio/wav';
  }

  if (normalizedHref.includes('.ogg')) {
    return 'audio/ogg';
  }

  if (normalizedHref.includes('.m4a')) {
    return 'audio/mp4';
  }

  if (normalizedHref.includes('.aac')) {
    return 'audio/aac';
  }

  return undefined;
}

function normalizeCertificateState(status: string): 'earned' | 'pending' | 'locked' {
  const normalized = status.toLowerCase();
  if (normalized.includes('earn')) {
    return 'earned';
  }
  if (normalized.includes('review') || normalized.includes('pending')) {
    return 'pending';
  }
  return 'locked';
}

function certificateStatusLabel(cert: { status: string; issuedDate: string }): string {
  const state = normalizeCertificateState(cert.status);
  if (state === 'earned') {
    return cert.issuedDate ? `Earned ${cert.issuedDate}` : 'Earned';
  }
  if (state === 'pending') {
    return 'In review';
  }
  return 'Locked';
}

function buildLessonResources(lesson: {
  name: string;
  module: string;
  summary: string;
  attachments: string;
  audioFiles: string;
}): LibraryItem[] {
  const resources: LibraryItem[] = [];

  if (lesson.attachments) {
    resources.push({
      title: `${lesson.name} PDF`,
      module: lesson.module || lesson.name,
      language: 'API',
      format: 'PDF',
      detail: lesson.summary || 'Lesson attachment from the training API.',
      href: resolveApiAssetUrl(lesson.attachments),
      action: 'Open PDF',
      state: 'ready',
    });
  }

  if (lesson.audioFiles) {
    resources.push({
      title: `${lesson.name} Audio`,
      module: lesson.module || lesson.name,
      language: 'API',
      format: 'Audio',
      detail: lesson.summary || 'Lesson audio from the training API.',
      href: resolveApiAssetUrl(lesson.audioFiles),
      action: 'Play audio',
      state: 'ready',
    });
  }

  return resources;
}

function readAudioProgress(): Record<string, AudioProgressEntry> {
  try {
    const raw = localStorage.getItem(audioProgressStorageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as Record<string, AudioProgressEntry>;
  } catch {
    return {};
  }
}

function writeAudioProgress(progress: Record<string, AudioProgressEntry>) {
  localStorage.setItem(audioProgressStorageKey, JSON.stringify(progress));
  window.dispatchEvent(new Event(audioProgressUpdatedEvent));
}

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const safeSeconds = Math.floor(seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatAssignmentDate(value: string): string {
  if (!value) {
    return 'No due date provided';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function formatTodayLong(): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

function readAssignmentSubmissions(): Record<string, AssignmentSubmissionEntry> {
  try {
    const raw = localStorage.getItem(assignmentSubmissionStorageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as Record<string, AssignmentSubmissionEntry>;
  } catch {
    return {};
  }
}

function writeAssignmentSubmissions(
  submissions: Record<string, AssignmentSubmissionEntry>,
) {
  localStorage.setItem(assignmentSubmissionStorageKey, JSON.stringify(submissions));
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    });
    reader.addEventListener('error', () => {
      reject(new Error('Unable to prepare this file for upload.'));
    });
    reader.readAsDataURL(file);
  });
}

function stripEditorHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatAssignmentLecturer(item: Assignment): string {
  const nameParts = [item.firstName, item.lastName].filter(Boolean).join(' ').trim();
  return item.lecturerName || item.owner || nameParts || 'Lecturer not assigned';
}

function toAssignmentStatus(status: string): 'urgent' | 'open' | 'scheduled' {
  const normalized = status.toLowerCase();

  if (normalized.includes('active') || normalized.includes('open')) {
    return 'open';
  }

  if (normalized.includes('review') || normalized.includes('pending')) {
    return 'scheduled';
  }

  return 'urgent';
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5c-2 0-3.5 1.6-3.5 3.6v2.4c0 .5-.2 1-.6 1.4l-.7.7c-.5.5-.1 1.4.6 1.4h8.4c.7 0 1.1-.9.6-1.4l-.7-.7c-.4-.4-.6-.9-.6-1.4V5.1c0-2-1.5-3.6-3.5-3.6z" strokeLinejoin="round" />
      <path d="M6.5 13.2a1.5 1.5 0 003 0" strokeLinecap="round" />
    </svg>
  );
}

function ZetrcIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect width="22" height="22" rx="6" fill="#071a14" />
      <path d="M11 3L19 11L11 19L3 11Z" stroke="#06431f" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="2.5" fill="#d9a51f" />
    </svg>
  );
}

function ModuleStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: 'badge-done',
    active: 'badge-active',
    available: 'badge-available',
    locked: 'badge-locked',
  };
  const label: Record<string, string> = {
    done: 'Done',
    active: 'In progress',
    available: 'Available',
    locked: 'Locked',
  };
  return <span className={`mod-badge ${map[status] ?? 'badge-available'}`}>{label[status] ?? 'Available'}</span>;
}

function ModuleNumber({ num, status }: { num: number; status: string }) {
  return <div className={`mod-num mod-${status}`}>{status === 'done' ? '✓' : num}</div>;
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg className="ring-svg" width="148" height="148" viewBox="0 0 148 148">
      <circle cx="74" cy="74" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
      <circle
        cx="74" cy="74" r={r} fill="none"
        stroke="#d9a51f" strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 74 74)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="74" y="68" textAnchor="middle" className="ring-pct">{pct}%</text>
      <text x="74" y="86" textAnchor="middle" className="ring-sub">completed</text>
    </svg>
  );
}

function DashboardOverview({
  liveModules,
  lessons,
  certificates,
}: {
  liveModules: { num: number; name: string; desc: string; status: string }[];
  lessons: {
    name: string;
    module: string;
    summary: string;
    attachments: string;
    audioFiles: string;
    keyPoints: string[];
  }[];
  certificates: { name: string; course: string; status: string; issuedDate: string }[];
}) {
  const [savedAudioProgress, setSavedAudioProgress] = useState<Record<string, AudioProgressEntry>>(
    () => readAudioProgress(),
  );
  const displayModules = liveModules;
  const totalLessons = lessons.length;
  const moduleNames = [...new Set(lessons.map((lesson) => lesson.module || lesson.name).filter(Boolean))];
  const totalModules = moduleNames.length;
  const audioReadyCount = lessons.filter((lesson) => lesson.audioFiles).length;
  const keyPointCount = lessons.reduce((total, lesson) => total + lesson.keyPoints.length, 0);
  const libraryItems = lessons.flatMap((lesson) => buildLessonResources(lesson));
  const libraryHighlights = [
    { label: 'PDF modules', value: String(libraryItems.filter((item) => item.format === 'PDF').length) },
    { label: 'Audio lessons', value: String(libraryItems.filter((item) => item.format === 'Audio').length) },
  ];
  const getAudioProgressKey = (lesson: { name: string; module: string; audioFiles: string }) => {
    const moduleName = lesson.module || lesson.name;
    const href = resolveApiAssetUrl(lesson.audioFiles);

    return `${moduleName}::${href}`;
  };
  const lessonProgressValues = lessons.map((lesson) => {
    if (!lesson.audioFiles) {
      return 0;
    }

    return savedAudioProgress[getAudioProgressKey(lesson)]?.percent ?? 0;
  });
  const completedLessonCount = lessonProgressValues.filter((percent) => percent >= 95).length;
  const lessonCoveragePct =
    totalLessons > 0
      ? Math.round(
          lessonProgressValues.reduce((total, percent) => total + percent, 0) / totalLessons,
        )
      : 0;

  useEffect(() => {
    const refreshAudioProgress = () => {
      setSavedAudioProgress(readAudioProgress());
    };

    window.addEventListener(audioProgressUpdatedEvent, refreshAudioProgress);
    window.addEventListener('storage', refreshAudioProgress);
    window.addEventListener('focus', refreshAudioProgress);

    return () => {
      window.removeEventListener(audioProgressUpdatedEvent, refreshAudioProgress);
      window.removeEventListener('storage', refreshAudioProgress);
      window.removeEventListener('focus', refreshAudioProgress);
    };
  }, []);

  return (
    <>
      <div className="stats-grid">
        {[
          {
            label: 'Lesson progress',
            value: `${lessonCoveragePct}%`,
            fill: lessonCoveragePct,
            sub: `${completedLessonCount} of ${totalLessons} lesson${totalLessons === 1 ? '' : 's'} completed`,
            color: 'green',
          },
          {
            label: 'Modules',
            value: String(totalModules),
            fill: totalModules > 0 ? 100 : 0,
            sub: `${totalModules} module${totalModules === 1 ? '' : 's'} from lesson API`,
            color: 'neutral',
          },
          {
            label: 'Lessons',
            value: String(totalLessons),
            fill: totalLessons > 0 ? 100 : 0,
            sub: `${keyPointCount} key point${keyPointCount === 1 ? '' : 's'} across lessons`,
            color: 'green',
          },
          {
            label: 'Audios',
            value: String(audioReadyCount),
            fill: totalLessons > 0 ? Math.round((audioReadyCount / totalLessons) * 100) : 0,
            sub: `${audioReadyCount} of ${totalLessons} lesson${totalLessons === 1 ? '' : 's'} have audio`,
            color: 'neutral',
          },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-track">
              <div className="stat-fill" style={{ width: `${s.fill}%` }} />
            </div>
            <div className={`stat-sub ${s.color === 'green' ? 'sub-green' : ''}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Training modules</span>
            <span className="card-link">View all</span>
          </div>
          <div className="module-list">
            {displayModules.length > 0 ? displayModules.map((m) => (
              <div className={`module-row ${m.status === 'active' ? 'module-active' : ''}`} key={m.num}>
                <ModuleNumber num={m.num} status={m.status} />
                <div className="mod-info">
                  <div className="mod-name">{m.name}</div>
                  <div className="mod-desc">{m.desc}</div>
                </div>
                <ModuleStatusBadge status={m.status} />
              </div>
            )) : (
              <div className="training-audio-note">No modules have been returned by the lesson API yet.</div>
            )}
          </div>
        </div>

        <div className="card ring-card">
          <div className="card-header">
            <span className="card-title">Lesson coverage</span>
          </div>
          <div className="ring-center">
            <ProgressRing pct={lessonCoveragePct} />
            <p className="ring-caption">{completedLessonCount} of {totalLessons} lessons completed</p>
          </div>
          <div className="mini-stats">
            <div className="mini-stat">
              <div className="mini-val">{completedLessonCount}</div>
              <div className="mini-lbl">Lessons done</div>
            </div>
            <div className="mini-stat">
              <div className="mini-val">{audioReadyCount}</div>
              <div className="mini-lbl">Audios</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upcoming tasks</span>
            <span className="card-link">View all</span>
          </div>
          <div className="task-list">
            {tasks.map((t, i) => (
              <div className="task-row" key={i}>
                <div className={`task-dot dot-${t.color}`} />
                <div>
                  <div className="task-text">{t.text}</div>
                  <div className="task-due">{t.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Certificates</span>
          </div>
          {certificates.length === 0 ? (
            <div className="training-audio-note">
              No certificates yet — they&apos;ll appear here once a course is completed.
            </div>
          ) : (
            <div className="cert-list">
              {certificates.map((c) => {
                const state = normalizeCertificateState(c.status);
                return (
                  <div className={`cert-row ${state !== 'earned' ? 'cert-dim' : ''}`} key={c.name}>
                    <div className={`cert-icon-wrap ${state === 'earned' ? 'icon-earned' : 'icon-locked'}`}>
                      <CertIcon earned={state === 'earned'} />
                    </div>
                    <div className="cert-info">
                      <div className="cert-name">{c.course}</div>
                      <div className="cert-status">{certificateStatusLabel(c)}</div>
                    </div>
                    <button className={`cert-btn ${state !== 'earned' ? 'cert-btn-locked' : ''}`}>
                      {state === 'earned' ? 'Download' : state === 'pending' ? 'Pending' : 'Locked'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="library-preview-grid">
        <div className="card library-preview-card">
          <div className="card-header">
            <span className="card-title">Learning library</span>
            <span className="card-link">{libraryItems.length} item{libraryItems.length === 1 ? '' : 's'}</span>
          </div>
          <div className="library-highlight-grid">
            {libraryHighlights.map((item) => (
              <div className="library-highlight-tile" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          {libraryItems.length === 0 ? (
            <div className="training-audio-note">
              No PDF or audio lessons have been published yet.
            </div>
          ) : (
            <div className="library-preview-list">
              {libraryItems.slice(0, 4).map((item) => (
                <article className="library-preview-row" key={`${item.title}-${item.href}`}>
                  <div>
                    <div className="library-preview-meta">
                      <span className={`media-pill media-${item.format.toLowerCase()}`}>{item.format}</span>
                      <span>{item.module}</span>
                    </div>
                    <h3>{item.title}</h3>
                  </div>
                  {item.format === 'PDF' ? (
                    <a className="library-link-btn" href={item.href} target="_blank" rel="noreferrer">
                      Open PDF
                    </a>
                  ) : isBrowserPlayableAudio(item.href) ? (
                    <audio className="library-audio-player library-audio-preview" controls preload="none">
                      {getAudioCandidates(item.href).map((candidate) => (
                        <source key={candidate} src={candidate} type={getAudioMimeType(candidate)} />
                      ))}
                      Your browser does not support audio playback.
                    </audio>
                  ) : (
                    <a className="library-link-btn" href={item.href} target="_blank" rel="noreferrer">
                      Download audio
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MyCourseView({
  learnerEnrollment,
  courseModules,
  courseModulesLoading,
}: {
  learnerEnrollment: LearnerEnrollment | null;
  courseModules: { name: string; title: string; description: string }[];
  courseModulesLoading: boolean;
}) {
  return (
    <div className="mycourse-view">
      <div className="card enrolled-course-card">
        <div className="card-header">
          <span className="card-title">Your course</span>
          {learnerEnrollment ? (
            <span className="card-link">{learnerEnrollment.duration || 'Flexible'}</span>
          ) : null}
        </div>
        {learnerEnrollment ? (
          <>
            <h2 className="enrolled-course-name">{learnerEnrollment.courseName}</h2>
            {learnerEnrollment.description ? (
              <p className="enrolled-course-desc">{learnerEnrollment.description}</p>
            ) : null}
            <div className="module-list">
              {courseModulesLoading ? (
                <div className="training-audio-note">Loading modules for this course...</div>
              ) : courseModules.length > 0 ? (
                courseModules.map((m, i) => (
                  <div className="module-row" key={m.name || m.title}>
                    <ModuleNumber num={i + 1} status="active" />
                    <div className="mod-info">
                      <div className="mod-name">{m.title}</div>
                      <div className="mod-desc">{m.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="training-audio-note">
                  No modules have been added to this course yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="training-audio-note">
            You haven&apos;t applied for a course yet. Enroll to see it here.
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryView({
  lessons,
}: {
  lessons: {
    name: string;
    module: string;
    summary: string;
    attachments: string;
    audioFiles: string;
  }[];
}) {
  const libraryItems = lessons.flatMap((lesson) => buildLessonResources(lesson));
  const pdfCount = libraryItems.filter((item) => item.format === 'PDF').length;
  const audioCount = libraryItems.filter((item) => item.format === 'Audio').length;
  const highlights = [
    { label: 'PDF modules', value: String(pdfCount) },
    { label: 'Audio lessons', value: String(audioCount) },
  ];

  return (
    <div className="library-view">
      <section className="library-hero-card">
        <div className="library-hero-copy">
          <span className="training-kicker">Learning library</span>
          <h2>PDF and audio lessons from your training modules</h2>
          <p>
            Resources here come straight from published lesson content — as PDFs and audio
            lessons are added to a module, they show up here automatically.
          </p>
        </div>

        <div className="library-summary-grid">
          {highlights.map((item) => (
            <div className="library-summary-pill" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="library-main-grid">
        <div className="library-board-card">
          <div className="card-header">
            <span className="card-title">Available resources</span>
            <span className="card-link">
              {libraryItems.length} item{libraryItems.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="library-board-list">
            {libraryItems.length === 0 ? (
              <div className="training-audio-note">
                No PDF or audio lessons have been published yet. They&apos;ll show up here as
                soon as a module has an attachment or audio file.
              </div>
            ) : (
              libraryItems.map((item) => (
                <article className="library-board-row" key={`${item.title}-${item.href}`}>
                  <div className="library-board-top">
                    <div>
                      <div className="library-row-tags">
                        <span className={`media-pill media-${item.format.toLowerCase()}`}>{item.format}</span>
                        <span className="module-pill">{item.module}</span>
                      </div>
                      <h3>{item.title}</h3>
                    </div>
                    <span className="library-state state-ready">Ready</span>
                  </div>
                  <p>{item.detail}</p>
                  <div className="library-board-footer">
                    <span>From the training API</span>
                    {item.format === 'PDF' ? (
                      <div className="training-resource-actions">
                        <a
                          className="btn-primary-top assignment-inline-btn"
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open PDF →
                        </a>
                        <a className="library-link-btn" href={item.href} download>
                          Download PDF
                        </a>
                      </div>
                    ) : (
                      <div className="training-resource-actions">
                        {isBrowserPlayableAudio(item.href) ? (
                          <audio className="library-audio-player" controls preload="none">
                            {getAudioCandidates(item.href).map((candidate) => (
                              <source key={candidate} src={candidate} type={getAudioMimeType(candidate)} />
                            ))}
                            Your browser does not support audio playback.
                          </audio>
                        ) : (
                          <div className="training-audio-note">
                            This audio file uses a protected or unsupported format for in-browser
                            playback. Download it below to listen externally.
                          </div>
                        )}
                        <a className="library-link-btn" href={item.href} target="_blank" rel="noreferrer">
                          Download audio
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="library-side-stack">
          <div className="library-side-card">
            <div className="card-header">
              <span className="card-title">How this library works</span>
            </div>
            <div className="certificate-benefits-list">
              <div className="certificate-benefit-item">
                <span className="login-check">✓</span>
                <span>
                  PDFs and audio are uploaded through the backend and linked to a lesson&apos;s
                  attachment/audio fields.
                </span>
              </div>
              <div className="certificate-benefit-item">
                <span className="login-check">✓</span>
                <span>Every published lesson with a file appears here automatically — no manual list to maintain.</span>
              </div>
              <div className="certificate-benefit-item">
                <span className="login-check">✓</span>
                <span>Video lessons aren&apos;t supported yet — only PDF and audio attachments are shown.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MyTrainingView({
  lessons,
  assignments,
  onViewAssignments,
}: {
  lessons: {
    id?: string | number;
    name: string;
    module: string;
    introduction: string;
    summary: string;
    practicalInfo: string;
    attachments: string;
    audioFiles: string;
    keyPoints: string[];
  }[];
  assignments: Assignment[];
  onViewAssignments: () => void;
}) {
  const [audioProgress, setAudioProgress] = useState<Record<string, AudioProgressEntry>>(
    () => readAudioProgress(),
  );
  const [audioBlobUrls, setAudioBlobUrls] = useState<Record<string, AudioBlobEntry>>({});
  const [audioCacheStatus, setAudioCacheStatus] = useState<Record<string, AudioCacheStatus>>({});

  const liveLessonSegments = useMemo(
    () =>
      lessons.slice(0, 3).map((lesson, index) => ({
        title: lesson.name,
        duration: lesson.module || `Lesson ${index + 1}`,
        type: lesson.keyPoints.length > 0 ? 'Key lesson' : 'Lesson',
        state: index === 0 ? 'current' : index === 1 ? 'next' : 'locked',
      })),
    [lessons],
  );
  const liveModuleMap: TrainingModuleItem[] = useMemo(() => {
    const withResources = lessons.slice(0, 4).map((lesson, index) => ({
      num: index + 1,
      name: lesson.module || lesson.name,
      desc: lesson.introduction || lesson.summary || 'Lesson content available.',
      resources: buildLessonResources(lesson),
    }));

    // Default to the first module that actually has playable audio, so
    // landing on this page shows working audio right away instead of
    // whichever lesson happens to be first (which may have none).
    const audioIndex = withResources.findIndex((m) =>
      m.resources.some((r) => r.format === 'Audio'),
    );
    const activeIndex = audioIndex >= 0 ? audioIndex : 0;

    return withResources.map((m, index) => ({
      ...m,
      status: index === activeIndex ? 'active' : 'available',
    }));
  }, [lessons]);
  const activeModuleIndex = liveModuleMap.findIndex((m) => m.status === 'active');
  const firstLesson = lessons[activeModuleIndex >= 0 ? activeModuleIndex : 0] ?? null;
  const currentAssignment = assignments[0] ?? null;
  const [selectedModule, setSelectedModule] = useState<TrainingModuleItem>(
    liveModuleMap.find((m) => m.status === 'active') ?? liveModuleMap[0] ?? trainingModuleMap[0],
  );
  useEffect(() => {
    const defaultModule = liveModuleMap.find((m) => m.status === 'active') ?? liveModuleMap[0];
    if (defaultModule) {
      setSelectedModule(defaultModule);
    }
  }, [lessons]);
  const buildAudioKey = (moduleName: string, href: string) => `${moduleName}::${href}`;
  const allAudioResources = useMemo(
    () =>
      liveModuleMap.flatMap((module) =>
        module.resources
          .filter((resource) => resource.format === 'Audio')
          .map((resource) => ({
            moduleName: module.name,
            href: resource.href,
            title: resource.title,
          })),
      ),
    [liveModuleMap],
  );

  useEffect(() => {
    if (allAudioResources.length === 0) {
      setAudioBlobUrls((current) => {
        Object.values(current).forEach((entry) => URL.revokeObjectURL(entry.url));
        return {};
      });
      setAudioCacheStatus({});
      return;
    }

    const controllers: AbortController[] = [];
    const nextBlobUrls: Record<string, AudioBlobEntry> = {};
    let cancelled = false;

    setAudioCacheStatus((current) => {
      const next = { ...current };
      allAudioResources.forEach((resource) => {
        next[buildAudioKey(resource.moduleName, resource.href)] = 'loading';
      });
      return next;
    });

    const preloadAudio = async () => {
      const results = await Promise.all(
        allAudioResources.map(async (resource) => {
          const resourceKey = buildAudioKey(resource.moduleName, resource.href);
          const candidates = getAudioCandidates(resource.href).filter(isBrowserPlayableAudio);

          for (const candidate of candidates) {
            const controller = new AbortController();
            controllers.push(controller);

            try {
              const response = await fetch(candidate, {
                method: 'GET',
                signal: controller.signal,
              });

              if (!response.ok) {
                continue;
              }

              const blob = await response.blob();

              if (!blob.size || !blob.type.startsWith('audio/')) {
                continue;
              }

              const objectUrl = URL.createObjectURL(blob);
              nextBlobUrls[resourceKey] = {
                url: objectUrl,
                mimeType: blob.type || getAudioMimeType(candidate) || 'audio/mpeg',
              };
              return { key: resourceKey, status: 'ready' as const };
            } catch {
              continue;
            }
          }

          return { key: resourceKey, status: 'error' as const };
        }),
      );

      if (cancelled) {
        Object.values(nextBlobUrls).forEach((entry) => URL.revokeObjectURL(entry.url));
        return;
      }

      setAudioBlobUrls((current) => {
        Object.values(current).forEach((entry) => URL.revokeObjectURL(entry.url));
        return nextBlobUrls;
      });

      setAudioCacheStatus((current) => {
        const next = { ...current };
        results.forEach((result) => {
          next[result.key] = result.status;
        });
        return next;
      });
    };

    void preloadAudio();

    return () => {
      cancelled = true;
      controllers.forEach((controller) => controller.abort());
    };
  }, [allAudioResources]);

  const completedAudios = allAudioResources.filter(
    (resource) => audioProgress[buildAudioKey(resource.moduleName, resource.href)]?.completed,
  ).length;
  const selectedModuleAudio = selectedModule.resources.find((resource) => resource.format === 'Audio');
  const currentAudioDescriptor = selectedModuleAudio
    ? {
        moduleName: selectedModule.name,
        href: selectedModuleAudio.href,
        title: selectedModuleAudio.title,
      }
    : null;
  const currentAudioProgress = currentAudioDescriptor
    ? audioProgress[buildAudioKey(currentAudioDescriptor.moduleName, currentAudioDescriptor.href)] ?? null
    : null;
  const currentAudioCacheState = currentAudioDescriptor
    ? audioCacheStatus[buildAudioKey(currentAudioDescriptor.moduleName, currentAudioDescriptor.href)] ?? 'idle'
    : 'idle';
  const currentAudioPercent = currentAudioProgress?.percent ?? 0;
  const weekFocus = [
    { label: 'Current module', value: firstLesson?.module || 'Training' },
    { label: 'Live lessons', value: String(lessons.length || 0) },
    {
      label: 'Audio completed',
      value: `${completedAudios}/${allAudioResources.length || 0}`,
    },
  ];

  const updateAudioProgress = (key: string, nextEntry: AudioProgressEntry) => {
    setAudioProgress((current) => {
      const next = {
        ...current,
        [key]: nextEntry,
      };
      writeAudioProgress(next);
      return next;
    });
  };

  const handleAudioLoadedMetadata = (key: string) => (event: SyntheticEvent<HTMLAudioElement>) => {
    const player = event.currentTarget;
    const savedProgress = audioProgress[key];

    if (savedProgress?.currentTime && savedProgress.currentTime < player.duration) {
      player.currentTime = savedProgress.currentTime;
    }

    updateAudioProgress(key, {
      currentTime: savedProgress?.currentTime ?? 0,
      duration: Number.isFinite(player.duration) ? player.duration : savedProgress?.duration ?? 0,
      percent: savedProgress?.percent ?? 0,
      completed: savedProgress?.completed ?? false,
    });
  };

  const handleAudioTimeUpdate = (key: string) => (event: SyntheticEvent<HTMLAudioElement>) => {
    const player = event.currentTarget;
    const duration = Number.isFinite(player.duration) ? player.duration : 0;
    const currentTime = Number.isFinite(player.currentTime) ? player.currentTime : 0;
    const percent = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

    updateAudioProgress(key, {
      currentTime,
      duration,
      percent,
      completed: percent >= 95,
    });
  };

  const handleAudioEnded = (key: string) => (event: SyntheticEvent<HTMLAudioElement>) => {
    const player = event.currentTarget;
    const duration = Number.isFinite(player.duration) ? player.duration : 0;

    updateAudioProgress(key, {
      currentTime: duration,
      duration,
      percent: 100,
      completed: true,
    });
  };

  return (
    <div className="training-view">
      <section className="dash-training-hero">
        <div className="dash-training-hero-copy">
          <span className="training-kicker">My training</span>
          <h2>{firstLesson?.module || 'My live training content'}</h2>
          <p>
            {firstLesson?.introduction ||
              'Your live lessons from the training API will appear here as soon as content is available.'}
          </p>
          <div className="dash-training-meta-row">
            {weekFocus.map((item) => (
              <div className="dash-training-meta-pill" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-training-hero-progress">
          <div className="dash-lesson-preview-card">
            <div className="dash-lesson-preview-top">
              <span className="card-tagline">Now learning</span>
              <span className="dash-lesson-duration">{firstLesson?.module || 'Lesson content'}</span>
            </div>
            <h3>{firstLesson?.name || 'No lesson available yet'}</h3>
            <p>{firstLesson?.summary || 'Continue from your last checkpoint and prepare for the next lesson.'}</p>
            <div className="dash-lesson-progress">
              <div className="dash-lesson-progress-bar">
                <div className="dash-lesson-progress-fill" style={{ width: `${currentAudioPercent}%` }} />
              </div>
              <span>
                {currentAudioDescriptor
                  ? currentAudioProgress?.completed
                    ? 'Audio completed'
                    : `${currentAudioPercent}% complete`
                  : 'No audio lesson selected'}
              </span>
            </div>
            {currentAudioDescriptor ? (
              <p className="task-due">
                {currentAudioCacheState === 'ready'
                  ? 'Audio preloaded in the app and ready to play.'
                  : currentAudioCacheState === 'loading'
                    ? 'Downloading audio into the app...'
                    : 'Using direct audio source while the app tries to prepare playback.'}
              </p>
            ) : null}
            <button
              className="btn-primary-top"
              type="button"
              disabled={!currentAudioDescriptor}
              onClick={() => {
                const audioElement = document.querySelector<HTMLAudioElement>('.training-audio-player');
                audioElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (audioElement) {
                  const playAttempt = audioElement.play();
                  void playAttempt.catch(() => undefined);
                }
              }}
            >
              Resume audio →
            </button>
            {currentAudioDescriptor ? (
              <p className="task-due">
                {currentAudioProgress?.completed
                  ? 'Completed in this browser.'
                  : `Last checkpoint ${formatAudioTime(currentAudioProgress?.currentTime ?? 0)} of ${formatAudioTime(currentAudioProgress?.duration ?? 0)}`}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="training-main-grid">
        <div className="training-lessons-card">
          <div className="card-header">
            <span className="card-title">Your learning path</span>
            <span className="card-link">
              {lessons.length} lesson{lessons.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="lesson-list">
            {liveLessonSegments.length === 0 ? (
              <div className="training-audio-note">No lessons have been published yet.</div>
            ) : (
              liveLessonSegments.map((lesson) => (
                <article className={`lesson-row lesson-${lesson.state}`} key={lesson.title}>
                  <div className="lesson-index">
                    {lesson.state === 'current' ? '▶' : lesson.state === 'next' ? '2' : '3'}
                  </div>
                  <div className="lesson-copy">
                    <div className="lesson-type-row">
                      <span className="lesson-type">{lesson.type}</span>
                      <span className="lesson-time">{lesson.duration}</span>
                    </div>
                    <h3>{lesson.title}</h3>
                  </div>
                  <span className={`lesson-state state-${lesson.state}`}>
                    {lesson.state === 'current' ? 'In progress' : lesson.state === 'next' ? 'Up next' : 'Later'}
                  </span>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="training-side-stack">
          <div className="training-side-card">
            <div className="card-header">
              <span className="card-title">Module map</span>
            </div>
            <div className="module-list">
              {(liveModuleMap.length > 0 ? liveModuleMap : trainingModuleMap).map((m) => (
                <button
                  type="button"
                  className={`module-row module-map-button ${selectedModule.num === m.num ? 'module-active' : ''}`}
                  key={m.num}
                  onClick={() => {
                    if (m.status !== 'locked') {
                      setSelectedModule(m);
                    }
                  }}
                  disabled={m.status === 'locked'}
                >
                  <ModuleNumber num={m.num} status={m.status} />
                  <div className="mod-info">
                    <div className="mod-name">{m.name}</div>
                    <div className="mod-desc">{m.desc}</div>
                  </div>
                  <ModuleStatusBadge status={m.status} />
                </button>
              ))}
            </div>
          </div>

          <div className="training-side-card training-assignment-card">
            <div className="card-header">
              <span className="card-title">Current assignment</span>
            </div>
            {currentAssignment ? (
              <>
                <h3>{currentAssignment.name}</h3>
                <p>
                  {currentAssignment.description ||
                    currentAssignment.remarks ||
                    'No further details were provided for this assignment.'}
                </p>
                <button className="btn-primary-top assignment-btn" type="button" onClick={onViewAssignments}>
                  Start submission →
                </button>
              </>
            ) : (
              <p className="training-audio-note">No assignments right now.</p>
            )}
          </div>
        </div>
      </section>

      <section className="training-module-resource-card">
        <div className="card-header">
          <span className="card-title">{selectedModule.name}</span>
          <span className="card-link">
            {selectedModule.resources.length > 0 ? 'In-page module library' : 'Upload pending'}
          </span>
        </div>
        <p className="training-module-resource-copy">
          {selectedModule.resources.length > 0
            ? 'Study the module directly from this page. PDFs open inside the training view and audio lessons play without leaving the dashboard.'
            : 'This module does not have uploaded PDF or audio resources yet.'}
        </p>
        <div className="training-module-resource-grid">
          {selectedModule.resources.length > 0 ? (
            selectedModule.resources.map((item) => (
              <article className="training-module-resource-item" key={`${selectedModule.num}-${item.title}`}>
                <div className="library-row-tags">
                  <span className={`media-pill media-${item.format.toLowerCase()}`}>{item.format}</span>
                  <span className="module-pill">{selectedModule.name}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                {item.format === 'PDF' ? (
                  <div className="training-resource-actions">
                    <a
                      className="btn-primary-top assignment-inline-btn"
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open PDF →
                    </a>
                    <a className="library-link-btn" href={item.href} download>
                      Download PDF
                    </a>
                  </div>
                ) : item.format === 'Audio' ? (
                  <div className="training-resource-actions">
                    {isBrowserPlayableAudio(item.href) ? (
                      <audio
                        className="library-audio-player training-audio-player"
                        controls
                        preload="metadata"
                        onLoadedMetadata={handleAudioLoadedMetadata(buildAudioKey(selectedModule.name, item.href))}
                        onTimeUpdate={handleAudioTimeUpdate(buildAudioKey(selectedModule.name, item.href))}
                        onEnded={handleAudioEnded(buildAudioKey(selectedModule.name, item.href))}
                      >
                        {(() => {
                          const progressKey = buildAudioKey(selectedModule.name, item.href);
                          const cachedAudioEntry = audioBlobUrls[progressKey];

                          if (cachedAudioEntry) {
                            return <source src={cachedAudioEntry.url} type={cachedAudioEntry.mimeType} />;
                          }

                          return getAudioCandidates(item.href).map((candidate) => (
                            <source key={candidate} src={candidate} type={getAudioMimeType(candidate)} />
                          ));
                        })()}
                        Your browser does not support audio playback.
                      </audio>
                    ) : (
                      <div className="training-audio-note">
                        This audio file uses a protected or unsupported format for in-browser
                        playback. Download it below to listen externally.
                      </div>
                    )}
                    <a
                      className="library-link-btn"
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download audio
                    </a>
                    {(() => {
                      const progressKey = buildAudioKey(selectedModule.name, item.href);
                      const progress = audioProgress[progressKey];
                      const cacheState = audioCacheStatus[progressKey] ?? 'idle';

                      return (
                        <div className="training-audio-note">
                          {cacheState === 'ready'
                            ? progress?.completed
                              ? 'Completed. This audio has been downloaded into the app and marked finished on this device.'
                              : `Ready in app. Progress: ${progress?.percent ?? 0}%${progress?.duration ? ` · ${formatAudioTime(progress.currentTime)} of ${formatAudioTime(progress.duration)}` : ''}`
                            : cacheState === 'loading'
                              ? 'Downloading audio for in-app playback...'
                              : 'The app could not prepare this audio locally yet, so the fallback link will download it.'}
                        </div>
                      );
                    })()}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <article className="training-module-resource-item training-module-empty">
              <h3>No uploaded learning resources yet</h3>
              <p>Upload a PDF or audio file to this module&apos;s lesson content and it will appear here automatically.</p>
            </article>
          )}
        </div>
      </section>

      <section className="training-resource-grid">
        {resourceCards.map((card) => (
          <article className="training-resource-card" key={card.title}>
            <span className="card-tagline">Support resource</span>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function AssignmentsView({
  assignments,
  isLoading,
  errorMessage,
  learnerProfile,
}: {
  assignments: Assignment[];
  isLoading: boolean;
  errorMessage: string | null;
  learnerProfile: LearnerProfile;
}) {
  const [openAssignmentName, setOpenAssignmentName] = useState<string | null>(null);
  const [draftResponses, setDraftResponses] = useState<Record<string, string>>({});
  const [submittedResponses, setSubmittedResponses] = useState<
    Record<string, AssignmentSubmissionEntry>
  >(() => readAssignmentSubmissions());
  const [uploadedAssignments, setUploadedAssignments] = useState<
    Record<string, AssignmentUploadDraft>
  >({});
  const [submittingAssignments, setSubmittingAssignments] = useState<Record<string, boolean>>({});
  const [submissionErrors, setSubmissionErrors] = useState<Record<string, string>>({});

  const visibleAssignments = assignments.filter((item) => !submittedResponses[item.name]);
  const liveAssignments = visibleAssignments.map((item) => ({
    raw: item,
    title: item.name,
    due: item.submissionDate ? `Due ${formatAssignmentDate(item.submissionDate)}` : 'No due date',
    status: toAssignmentStatus(item.status),
    type: item.course || 'Assignment',
    detail: item.description || item.remarks || 'Assignment details are available from the API.',
    remarks: item.remarks || 'No remarks provided.',
    lecturer: formatAssignmentLecturer(item),
    lecturerContact: item.contactNo || item.owner || 'No contact provided',
    badgeStyle:
      item.statusColor && item.statusInnerColor
        ? {
            backgroundColor: item.statusColor,
            color: item.statusInnerColor,
          }
        : undefined,
  }));
  const openTasks = visibleAssignments.filter((item) => toAssignmentStatus(item.status) !== 'scheduled').length;
  const dueThisWeek = visibleAssignments.filter((item) => {
    if (!item.submissionDate) {
      return false;
    }

    const dueDate = new Date(item.submissionDate);
    const now = new Date();
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }).length;
  const inReview = visibleAssignments.filter((item) => item.status.toLowerCase().includes('review')).length;
  const submittedActivityItems = Object.entries(submittedResponses)
    .sort(([, first], [, second]) => second.submittedAt.localeCompare(first.submittedAt))
    .map(([title, submission]) => ({
      title,
      meta: `Submitted in app on ${formatAssignmentDate(submission.submittedAt)}${
        submission.attachmentName ? ` · ${submission.attachmentName}` : ''
      }`,
      state: 'done' as const,
    }));
  const assignmentActivityItems = assignments.slice(0, 3).map((item) => ({
    title: item.name,
    meta: `${item.status || 'Status unavailable'}${item.submissionDate ? ` · ${formatAssignmentDate(item.submissionDate)}` : ''}${submittedResponses[item.name] ? ' · submitted in app' : ''}`,
    state:
      submittedResponses[item.name]
        ? 'done'
        : item.status.toLowerCase().includes('review')
        ? 'pending'
        : item.status.toLowerCase().includes('active')
          ? 'current'
          : 'done',
  }));
  const activityItems = [...submittedActivityItems, ...assignmentActivityItems].slice(0, 5);
  const handleSubmitAssignment = async (assignmentName: string) => {
    const content = draftResponses[assignmentName]?.trim() ?? '';
    const upload = uploadedAssignments[assignmentName];
    const hasTypedResponse = Boolean(stripEditorHtml(content));

    if (!hasTypedResponse && !upload) {
      setSubmissionErrors((current) => ({
        ...current,
        [assignmentName]: 'Type a response or upload your assignment document.',
      }));
      return;
    }

    setSubmittingAssignments((current) => ({
      ...current,
      [assignmentName]: true,
    }));
    setSubmissionErrors((current) => ({
      ...current,
      [assignmentName]: '',
    }));

    try {
      const assignment = assignments.find((a) => a.name === assignmentName);
      const submissionName = `${learnerProfile.firstName}-${assignmentName}-${new Date().toISOString().split('T')[0]}`;

      await submitAssignmentSubmission({
        name: submissionName,
        assignmentId: assignment?.id,
        assignmentName: assignmentName,
        studentFirstName: learnerProfile.firstName,
        studentLastName: learnerProfile.lastName,
        studentEmail: learnerProfile.email,
        content: hasTypedResponse ? content : `Uploaded assignment document: ${upload?.name}`,
        attachment: upload?.dataUrl,
      });

      setSubmittedResponses((current) => {
        const next = {
          ...current,
          [assignmentName]: {
            response: hasTypedResponse ? content : '',
            submittedAt: new Date().toISOString(),
            attachmentName: upload?.name,
            attachmentSize: upload?.size,
          },
        };
        writeAssignmentSubmissions(next);
        return next;
      });

      setDraftResponses((current) => ({
        ...current,
        [assignmentName]: '',
      }));
      setUploadedAssignments((current) => {
        const next = { ...current };
        delete next[assignmentName];
        return next;
      });
      setOpenAssignmentName(null);
    } catch (error) {
      setSubmissionErrors((current) => ({
        ...current,
        [assignmentName]: error instanceof Error ? error.message : 'Failed to submit assignment',
      }));
    } finally {
      setSubmittingAssignments((current) => ({
        ...current,
        [assignmentName]: false,
      }));
    }
  };

  const handleAssignmentFileChange = async (
    assignmentName: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSubmissionErrors((current) => ({
      ...current,
      [assignmentName]: '',
    }));

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setUploadedAssignments((current) => ({
        ...current,
        [assignmentName]: {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
        },
      }));
    } catch (error) {
      setSubmissionErrors((current) => ({
        ...current,
        [assignmentName]:
          error instanceof Error ? error.message : 'Unable to prepare this file for upload.',
      }));
    }
  };

  const clearAssignmentFile = (assignmentName: string) => {
    setUploadedAssignments((current) => {
      const next = { ...current };
      delete next[assignmentName];
      return next;
    });
  };

  const openDetailItem = liveAssignments.find((item) => item.title === openAssignmentName) ?? null;

  if (openDetailItem) {
    const item = openDetailItem;
    const uploadedFile = uploadedAssignments[item.title];
    const savedSubmission = submittedResponses[item.title];
    const editorContent = draftResponses[item.title] ?? savedSubmission?.response ?? '';
    const canSubmit = Boolean(stripEditorHtml(editorContent)) || Boolean(uploadedFile);

    return (
      <div className="assignment-detail-page">
        <button
          type="button"
          className="assignment-back-btn"
          onClick={() => setOpenAssignmentName(null)}
        >
          ← Back to assignments
        </button>

        <div className="assignment-detail-header">
          <div>
            <span className="assignment-type">{item.type}</span>
            <h2>{item.title}</h2>
          </div>
          <span
            className={`assignment-status status-${item.status}`}
            style={item.badgeStyle}
          >
            {item.status === 'urgent' ? 'Due soon' : item.status === 'open' ? 'Open' : 'Scheduled'}
          </span>
        </div>
        <p className="assignment-detail-due">{item.due}</p>

        <div className="assignment-brief-grid">
          <div>
            <span className="assignment-type">Assignment brief</span>
            <p>{item.detail}</p>
          </div>
          <div>
            <span className="assignment-type">Lecturer</span>
            <p>
              {item.lecturer}
              {item.lecturerContact ? ` · ${item.lecturerContact}` : ''}
            </p>
          </div>
          <div>
            <span className="assignment-type">Remarks</span>
            <p>{item.remarks}</p>
          </div>
        </div>

        <div className="assignment-upload-box">
          <div>
            <span className="assignment-type">Upload assignment</span>
            <p>Attach a completed PDF, Word document, text file, or image.</p>
          </div>
          <label className="assignment-file-picker">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
              onChange={(event) => handleAssignmentFileChange(item.title, event)}
              disabled={submittingAssignments[item.title]}
            />
            Choose file
          </label>
          {uploadedFile ? (
            <div className="assignment-file-chip">
              <span>
                {uploadedFile.name} · {formatFileSize(uploadedFile.size)}
              </span>
              <button
                type="button"
                onClick={() => clearAssignmentFile(item.title)}
                disabled={submittingAssignments[item.title]}
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>

        <div className="assignment-document-editor">
          <span className="assignment-type">Type in system</span>
          <RichTextEditor
            content={editorContent}
            onChange={(content) =>
              setDraftResponses((current) => ({
                ...current,
                [item.title]: content,
              }))
            }
            placeholder="Start typing your assignment..."
          />
        </div>

        <div className="training-resource-actions assignment-submit-row">
          <button
            type="button"
            className="btn-primary-top assignment-inline-btn"
            onClick={() => handleSubmitAssignment(item.title)}
            disabled={submittingAssignments[item.title] || !canSubmit}
          >
            {submittingAssignments[item.title] ? 'Submitting...' : 'Submit assignment'}
          </button>
        </div>
        {submissionErrors[item.title] ? (
          <div className="assignment-submit-error">{submissionErrors[item.title]}</div>
        ) : null}
        {savedSubmission ? (
          <div className="assignment-submit-success">
            Submitted in app on {formatAssignmentDate(savedSubmission.submittedAt)}
            {savedSubmission.attachmentName ? ` · ${savedSubmission.attachmentName}` : ''}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="assignments-view">
      <section className="assignments-hero-card">
        <div className="assignments-hero-copy">
          <span className="training-kicker">Assignments</span>
          <h2>Track tasks, prepare submissions, and stay ahead of deadlines</h2>
          <p>
            Everything due for your cohort lives here, with one clear place to see what is urgent,
            what is unlocked next, and what still needs review.
          </p>
        </div>

        <div className="assignments-summary-grid">
          <div className="assignment-summary-pill">
            <span>Open tasks</span>
            <strong>{isLoading ? '...' : openTasks}</strong>
          </div>
          <div className="assignment-summary-pill">
            <span>Due this week</span>
            <strong>{isLoading ? '...' : dueThisWeek}</strong>
          </div>
          <div className="assignment-summary-pill">
            <span>In review</span>
            <strong>{isLoading ? '...' : inReview}</strong>
          </div>
        </div>
      </section>

      <section className="assignments-main-grid">
        <div className="assignments-board-card">
          <div className="card-header">
            <span className="card-title">Assignment board</span>
            <span className="card-link">{isLoading ? 'Loading...' : `${visibleAssignments.length} open`}</span>
          </div>

          <div className="assignment-board-list">
            {(errorMessage
              ? [{
                  raw: null,
                  title: 'Unable to load assignments',
                  due: errorMessage,
                  status: 'scheduled',
                  type: 'API',
                  detail: 'The app could not load assignment data right now.',
                  remarks: 'No remarks available.',
                  lecturer: 'Unavailable',
                  lecturerContact: 'Unavailable',
                  badgeStyle: undefined,
                }]
              : liveAssignments.length > 0
                ? liveAssignments
                : assignments.length > 0
                  ? [{
                      raw: null,
                      title: 'All assignments submitted',
                      due: 'No open assignments right now',
                      status: 'scheduled',
                      type: 'Complete',
                      detail: 'Your submitted assignments have been recorded. New assignments will appear here when they are available.',
                      remarks: 'Recent submissions are shown in the activity panel.',
                      lecturer: 'ZETRC Academy',
                      lecturerContact: '',
                      badgeStyle: undefined,
                    }]
                  : assignmentBoard).map((item) => (
              <article className={`assignment-board-row row-${item.status}`} key={item.title}>
                <div className="assignment-board-top">
                  <div>
                    <span className="assignment-type">{item.type}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <span
                    className={`assignment-status status-${item.status}`}
                    style={'badgeStyle' in item ? item.badgeStyle : undefined}
                  >
                    {item.status === 'urgent' ? 'Due soon' : item.status === 'open' ? 'Open' : 'Scheduled'}
                  </span>
                </div>
                <p>{item.detail}</p>
                {'lecturer' in item ? (
                  <div className="training-audio-note">
                    Lecturer: {item.lecturer}
                    {item.lecturerContact ? ` · ${item.lecturerContact}` : ''}
                  </div>
                ) : null}
                {'remarks' in item ? (
                  <div className="training-audio-note">Remarks: {item.remarks}</div>
                ) : null}
                <div className="assignment-board-footer">
                  <span>{item.due}</span>
                  {'raw' in item && item.raw ? (
                    <button
                      className="btn-primary-top assignment-inline-btn"
                      type="button"
                      onClick={() => setOpenAssignmentName(item.title)}
                    >
                      Open task →
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="assignments-side-stack">
          <div className="assignments-side-card">
            <div className="card-header">
              <span className="card-title">Submission checklist</span>
            </div>
            <div className="assignment-checklist">
              {submissionChecklist.map((item) => (
                <div className="assignment-check-item" key={item}>
                  <span className="login-check">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="assignments-side-card">
            <div className="card-header">
              <span className="card-title">Recent activity</span>
            </div>
            <div className="assignment-activity-list">
              {(activityItems.length > 0 ? activityItems : assignmentActivity).map((item) => (
                <div className={`assignment-activity-row activity-${item.state}`} key={item.title}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.meta}</p>
                  </div>
                  <span className={`activity-pill pill-${item.state}`}>
                    {item.state === 'done' ? 'Done' : item.state === 'pending' ? 'Reviewing' : 'Current'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CertificatesView({
  certificates,
  learnerProfile,
}: {
  certificates: { name: string; course: string; status: string; issuedDate: string; detail: string }[];
  learnerProfile: LearnerProfile;
}) {
  const earnedCount = certificates.filter((c) => normalizeCertificateState(c.status) === 'earned').length;
  const pendingCount = certificates.filter((c) => normalizeCertificateState(c.status) === 'pending').length;
  const lockedCount = certificates.filter((c) => normalizeCertificateState(c.status) === 'locked').length;
  const stats = [
    { label: 'Earned certificates', value: String(earnedCount) },
    { label: 'In review', value: String(pendingCount) },
    { label: 'Locked', value: String(lockedCount) },
  ];
  const latestEarned = certificates.find((c) => normalizeCertificateState(c.status) === 'earned');

  return (
    <div className="certificates-view">
      <section className="certificates-hero-card">
        <div className="certificates-hero-copy">
          <span className="training-kicker">Certificates</span>
          <h2>See what you have earned and what is next on your pathway</h2>
          <p>
            Your certification progress follows your modules and verified submissions, making it
            easy to track what is complete, what is pending review, and what still needs work.
          </p>
        </div>

        <div className="certificates-summary-grid">
          {stats.map((item) => (
            <div className="certificate-summary-pill" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="certificates-main-grid">
        <div className="certificates-board-card">
          <div className="card-header">
            <span className="card-title">Certification progress</span>
            <span className="card-link">
              {certificates.length} course{certificates.length === 1 ? '' : 's'}
            </span>
          </div>

          {certificates.length === 0 ? (
            <div className="training-audio-note">
              No certificates yet. Enroll in and complete a course to start earning one.
            </div>
          ) : (
            <div className="certificate-timeline">
              {certificates.map((item) => {
                const state = normalizeCertificateState(item.status);
                const cssState = state === 'pending' ? 'review' : state;
                return (
                  <article className={`certificate-stage stage-${cssState}`} key={item.name}>
                    <div className="certificate-stage-icon">
                      {state === 'earned' ? '✓' : state === 'pending' ? '•' : '○'}
                    </div>
                    <div className="certificate-stage-copy">
                      <div className="certificate-stage-top">
                        <div>
                          <h3>{item.course}</h3>
                          <span>{certificateStatusLabel(item)}</span>
                        </div>
                        <span className={`certificate-state state-${cssState}`}>
                          {state === 'earned' ? 'Earned' : state === 'pending' ? 'In review' : 'Locked'}
                        </span>
                      </div>
                      <p>{item.detail || 'No additional details provided.'}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="certificates-side-stack">
          {latestEarned ? (
            <div className="certificates-side-card certificate-download-card">
              <div className="card-header">
                <span className="card-title">Latest certificate</span>
              </div>
              <div className="certificate-preview-tile">
                <div className="certificate-preview-mark">ZETRC</div>
                <h3>{latestEarned.course}</h3>
                <p>Issued to {learnerProfile.fullName}</p>
              </div>
              <button className="btn-primary-top certificate-download-btn">Download PDF →</button>
            </div>
          ) : null}

          <div className="certificates-side-card">
            <div className="card-header">
              <span className="card-title">How certificates work</span>
            </div>
            <div className="certificate-benefits-list">
              {certificateBenefits.map((item) => (
                <div className="certificate-benefit-item" key={item}>
                  <span className="login-check">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Dashboard({
  learnerEnrollment,
  learnerProfile,
  onLogout,
  onRequestProposal,
}: DashboardProps) {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { lessons } = useLessons();
  const {
    assignments,
    isLoading: assignmentsLoading,
    errorMessage: assignmentsError,
  } = useAssignments();
  const { modules: courseModules, isLoading: courseModulesLoading } = useCourseModules(
    learnerEnrollment?.courseName,
  );
  const { certificates: myCertificates } = useCertificates(learnerProfile.email);
  const liveModules = useMemo(
    () => buildLessonModuleRows(lessons),
    [lessons],
  );

  const earnedCertificateCount = myCertificates.filter(
    (c) => normalizeCertificateState(c.status) === 'earned',
  ).length;

  const libraryItemCount = useMemo(
    () => lessons.flatMap((lesson) => buildLessonResources(lesson)).length,
    [lessons],
  );
  const trainingBadge = lessons.length > 0 ? String(lessons.length) : undefined;
  const assignmentsBadge = assignments.length > 0 ? String(assignments.length) : undefined;
  const libraryBadge = libraryItemCount > 0 ? String(libraryItemCount) : undefined;

  const viewOrder: ViewKey[] = ['dashboard', 'mycourse', 'training', 'assignments', 'certificates', 'library'];
  const nextView = (current: ViewKey): ViewKey => {
    const index = viewOrder.indexOf(current);
    return viewOrder[(index + 1) % viewOrder.length];
  };

  const todayLong = formatTodayLong();

  const viewGreeting: Record<ViewKey, string> = {
    dashboard: `${getTimeOfDayGreeting()}, ${learnerProfile.firstName || 'Learner'}`,
    mycourse: t('myCourse'),
    training: t('myTraining'),
    assignments: t('assignments'),
    certificates: t('certificates'),
    library: t('learningLibrary'),
  };

  const viewDateLine: Record<ViewKey, string> = {
    dashboard: `${todayLong} · ${learnerEnrollment?.courseName ?? 'Pilot Training'}`,
    mycourse: learnerEnrollment
      ? `${todayLong} · ${learnerEnrollment.courseName}`
      : `${todayLong} · No course applied yet`,
    training: lessons[0]
      ? `${todayLong} · ${lessons[0].module || lessons[0].name} in progress`
      : `${todayLong} · No lessons published yet`,
    assignments: `${todayLong} · 1 assignment due this week`,
    certificates: `${todayLong} · ${earnedCertificateCount} certificate${earnedCertificateCount === 1 ? '' : 's'} earned`,
    library: `${todayLong} · Bilingual module library ready`,
  };

  const viewCtaLabel: Record<ViewKey, string> = {
    dashboard: t('dashboard'),
    mycourse: t('viewMyCourse'),
    training: t('continueTraining'),
    assignments: t('viewAssignments'),
    certificates: t('viewCertificates'),
    library: t('openLibrary'),
  };

  const openWhatsAppSupport = () => {
    openWhatsApp(t('whatsappMsgSupport'));
  };

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  return (
    <div className="dash-wrap">
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-icon-wrap"><ZetrcIcon size={20} /></div>
          <div>
            <div className="sb-name">ZETRC</div>
            <div className="sb-tagline">{t('brandSub')}</div>
          </div>
        </div>

        <div className="sb-profile">
          <div className="avatar">{learnerProfile.initials}</div>
          <div>
            <div className="profile-name">{learnerProfile.fullName}</div>
            <div className="profile-role">{learnerProfile.roleLabel}</div>
            {learnerProfile.email ? <div className="profile-meta">{learnerProfile.email}</div> : null}
          </div>
        </div>

        <nav className="sb-nav">
          <div className="nav-group-label">{t('main')}</div>
          <NavItem
            icon="grid"
            label={t('dashboard')}
            active={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
          />
          <NavItem
            icon="flag"
            label={t('myCourse')}
            active={activeView === 'mycourse'}
            onClick={() => setActiveView('mycourse')}
          />
          <NavItem
            icon="book"
            label={t('myTraining')}
            badge={trainingBadge}
            active={activeView === 'training'}
            onClick={() => setActiveView('training')}
          />
          <NavItem
            icon="clock"
            label={t('assignments')}
            badge={assignmentsBadge}
            active={activeView === 'assignments'}
            onClick={() => setActiveView('assignments')}
          />
          <NavItem
            icon="star"
            label={t('certificates')}
            badge={myCertificates.length > 0 ? String(myCertificates.length) : undefined}
            active={activeView === 'certificates'}
            onClick={() => setActiveView('certificates')}
          />
          <div className="nav-group-label" style={{ marginTop: '8px' }}>{t('resources')}</div>
          <NavItem
            icon="file"
            label={t('learningLibrary')}
            badge={libraryBadge}
            active={activeView === 'library'}
            onClick={() => setActiveView('library')}
          />
          <NavItem icon="help" label={t('support')} onClick={openWhatsAppSupport} />
        </nav>

        <div className="sb-footer">
          <button className="wa-btn" type="button" onClick={openWhatsAppSupport}>
            <WaIcon />
            {t('support')}
          </button>
          <button className="logout-btn" onClick={onLogout}>
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <div>
            <h1 className="greeting">{viewGreeting[activeView]}</h1>
            <p className="date-line">{viewDateLine[activeView]}</p>
          </div>
          <div className="top-actions">
            <div className="notification-wrap" ref={notificationsRef}>
              <button
                type="button"
                className="notification-bell-btn"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <BellIcon />
                {announcements.length > 0 && (
                  <span className="notification-badge">{announcements.length}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">Announcements</div>
                  <div className="announce-list">
                    {announcements.map((a, i) => (
                      <div className={`announce-row ${a.type === 'warn' ? 'announce-warn' : 'announce-info'}`} key={i}>
                        <div className="announce-title">{a.title}</div>
                        <div className="announce-body">{a.body}</div>
                        <div className="announce-date">{a.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="btn-ghost-top" onClick={onLogout}>{t('logout')}</button>
            <button className="btn-ghost-top" onClick={onRequestProposal}>{t('requestProposal')}</button>
            <button
              className="btn-primary-top"
              onClick={() => setActiveView(nextView(activeView))}
            >
              {viewCtaLabel[nextView(activeView)]}
            </button>
          </div>
        </div>

        {activeView === 'dashboard' ? (
          <DashboardOverview liveModules={liveModules} lessons={lessons} certificates={myCertificates} />
        ) : null}
        {activeView === 'mycourse' ? (
          <MyCourseView
            learnerEnrollment={learnerEnrollment}
            courseModules={courseModules}
            courseModulesLoading={courseModulesLoading}
          />
        ) : null}
        {activeView === 'training' ? (
          <MyTrainingView lessons={lessons} assignments={assignments} onViewAssignments={() => setActiveView('assignments')} />
        ) : null}
        {activeView === 'assignments' ? (
          <AssignmentsView
            assignments={assignments}
            isLoading={assignmentsLoading}
            errorMessage={assignmentsError}
            learnerProfile={learnerProfile}
          />
        ) : null}
        {activeView === 'certificates' ? (
          <CertificatesView certificates={myCertificates} learnerProfile={learnerProfile} />
        ) : null}
        {activeView === 'library' ? <LibraryView lessons={lessons} /> : null}
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`nav-item ${active ? 'nav-active' : ''}`} onClick={onClick}>
      <NavIcon name={icon} />
      <span>{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    grid: <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
    flag: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 1.5v13"/><path d="M3 2.5h9l-2 3 2 3H3"/></svg>,
    book: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h5a1 1 0 011 1v9a1 1 0 01-1 1H2V3z"/><path d="M14 3H9a1 1 0 00-1 1v9a1 1 0 001 1h5V3z"/></svg>,
    clock: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
    star: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.5l-3.7 1.8.7-4.1-3-2.9 4.2-.7z"/></svg>,
    file: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="1" width="10" height="14" rx="1"/><path d="M6 5h4M6 8h4M6 11h2"/></svg>,
    help: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M6.5 6a1.5 1.5 0 013 .5c0 1-1.5 1.5-1.5 2.5M8 12h.01"/></svg>,
  };
  return icons[name] || null;
}

function CertIcon({ earned }: { earned: boolean }) {
  return earned
    ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#06431f" strokeWidth="1.5"><path d="M9 1l2 4 4 .6-2.9 2.8.7 4L9 10.5 5.2 12.4l.7-4L3 5.6 7 5z"/><path d="M6 15l3 1.5 3-1.5"/></svg>
    : <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><circle cx="9" cy="9" r="7"/><path d="M9 6v3l2 2"/></svg>;
}

function WaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#d9a51f">
      <path d="M8 1C4.13 1 1 4.13 1 8c0 1.23.33 2.38.9 3.38L1 15l3.72-.87A7 7 0 108 1zm0 12.5a5.43 5.43 0 01-2.77-.76l-.2-.12-2.08.49.5-1.96-.13-.2A5.5 5.5 0 1113.5 8 5.51 5.51 0 018 13.5zm3-4.13c-.16-.08-1-.49-1.16-.55-.15-.06-.26-.08-.37.08-.11.17-.42.55-.52.66-.09.11-.19.12-.35.04-.85-.43-1.41-.76-1.97-1.73-.15-.26.15-.24.43-.8a.3.3 0 00-.01-.28c-.04-.08-.37-.88-.5-1.2-.13-.32-.27-.27-.37-.28H5.5c-.1 0-.27.04-.41.19s-.54.52-.54 1.28.55 1.48.63 1.58c.08.1 1.08 1.65 2.62 2.31.37.16.65.25.87.32.37.12.7.1.97.06.3-.05.92-.38 1.05-.74.13-.36.13-.67.09-.74-.04-.07-.15-.11-.31-.19z"/>
    </svg>
  );
}
