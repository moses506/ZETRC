import { useState } from 'react';
import AdminModelTable, { type AdminColumn } from '../../components/admin/AdminModelTable';
import { AdminIcon, ZetrcMark } from '../../components/admin/AdminIcons';
import NotificationBell from '../../components/admin/NotificationBell';
import { ToastProvider } from '../../components/admin/Toast';
import ProgressView from '../../components/admin/ProgressView';
import SubmissionsReview from '../../components/lecturer/SubmissionsReview';
import QuizManager from '../../components/staff/QuizManager';
import GradebookView from '../../components/staff/GradebookView';
import FieldJournalGallery from '../../components/staff/FieldJournalGallery';
import Discussions from '../../components/shared/Discussions';
import LecturerOverview from '../../components/lecturer/LecturerOverview';
import type { AdminProfile } from '../../utils/auth';
import '../../styles/admin.css';

const OVERVIEW_VIEW = 'overview';
const PROGRESS_VIEW = 'progress';

type LecturerSection = {
  model: string;
  label: string;
  description: string;
  columns: AdminColumn[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

const LECTURER_SECTIONS: LecturerSection[] = [
  {
    model: 'Course',
    label: 'My Courses',
    description: 'Courses assigned to you. You can update the duration and description.',
    canCreate: false,
    canDelete: false,
    columns: [
      { key: 'duration', label: 'Duration' },
      { key: 'description', label: 'Description', multiline: true },
    ],
  },
  {
    model: 'Course_Module',
    label: 'Modules',
    description: 'Break each course into modules. Sort order controls the sequence learners see.',
    columns: [
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'sort_order', label: 'Sort order' },
    ],
  },
  {
    model: 'Lesson_Content',
    label: 'Lessons',
    description: 'Lesson material for each module: notes, a PDF, audio and key points.',
    columns: [
      { key: 'module', label: 'Module', source: 'modules' },
      { key: 'introduction', label: 'Introduction', multiline: true },
      { key: 'summary', label: 'Summary', multiline: true },
      { key: 'practical_info', label: 'Practical info', multiline: true },
      { key: 'attachments', label: 'Module document (PDF)', upload: 'pdf' },
      { key: 'audio_files', label: 'Lesson audio', upload: 'audio' },
      { key: 'key_points', label: 'Key points', json: true },
    ],
  },
  {
    model: 'Assignment',
    label: 'Assignments',
    description: 'Set assignments for your courses. Your name is added as the lecturer automatically.',
    columns: [
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'submission_date', label: 'Due date' },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'remarks', label: 'Remarks', multiline: true },
      { key: 'status', label: 'Status', options: ['open', 'closed'] },
      { key: 'lecturer_name', label: 'Lecturer', readOnly: true },
    ],
  },
  {
    model: 'Assignment_Submission',
    label: 'Submissions',
    description: 'Student work for your assignments. Edit a submission to grade it and leave feedback.',
    canCreate: false,
    canDelete: false,
    columns: [
      { key: 'assignment_name', label: 'Assignment', readOnly: true },
      { key: 'student_first_name', label: 'First name', readOnly: true },
      { key: 'student_last_name', label: 'Last name', readOnly: true },
      { key: 'student', label: 'Email', readOnly: true },
      { key: 'content', label: 'Response', readOnly: true },
      { key: 'attachment', label: 'Attachment', readOnly: true },
      { key: 'status', label: 'Status', options: ['submitted', 'marked', 'returned'] },
      { key: 'grade', label: 'Grade' },
      { key: 'feedback', label: 'Feedback', multiline: true },
    ],
  },
  {
    model: 'Student_Enrollment',
    label: 'My Students',
    description: 'Learners enrolled in your courses.',
    canCreate: false,
    canEdit: false,
    canDelete: false,
    columns: [
      { key: 'first_name', label: 'First name', readOnly: true },
      { key: 'last_name', label: 'Last name', readOnly: true },
      { key: 'email', label: 'Email', readOnly: true },
      { key: 'course', label: 'Course', readOnly: true },
      { key: 'description', label: 'Why they enrolled', readOnly: true },
    ],
  },
  {
    model: 'Announcement',
    label: 'Announcements',
    description: 'Post news and reminders to one of your courses. Learners get it in-app and by SMS.',
    columns: [
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Message', multiline: true },
      { key: 'priority', label: 'Priority', options: ['info', 'important'] },
      { key: 'author_name', label: 'Posted by', readOnly: true },
    ],
  },
  {
    model: 'Certificate',
    label: 'Certificates',
    description: 'Review and issue certificates for learners in your courses.',
    columns: [
      { key: 'learner_email', label: 'Learner email' },
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'status', label: 'Status', options: ['earned', 'in_review', 'locked'] },
      { key: 'issued_date', label: 'Issued date' },
      { key: 'detail', label: 'Detail', multiline: true },
    ],
  },
];

/** Views with their own component rather than a record table. */
const CUSTOM_VIEWS: Record<string, { label: string; icon: string }> = {
  [PROGRESS_VIEW]: { label: 'Learner Progress', icon: 'progress' },
  quizzes: { label: 'Quizzes', icon: 'quizzes' },
  gradebook: { label: 'Gradebook', icon: 'gradebook' },
  discussions: { label: 'Discussions', icon: 'discussions' },
  journal: { label: 'Field Journal', icon: 'journal' },
};

const NAV_GROUPS: { title: string; models: string[] }[] = [
  { title: 'Teaching', models: ['Course', 'Course_Module', 'Lesson_Content', 'Announcement'] },
  { title: 'Assessment', models: ['Assignment', 'Assignment_Submission', 'quizzes', 'gradebook', 'Certificate'] },
  { title: 'Learners', models: [PROGRESS_VIEW, 'Student_Enrollment', 'discussions', 'journal'] },
];

const NAV_ICON: Record<string, string> = {
  Student_Enrollment: 'users:Learner',
};

type LecturerDashboardProps = {
  profile: AdminProfile;
  onLogout: () => void;
};

function LecturerDashboard({ profile, onLogout }: LecturerDashboardProps) {
  const [activeView, setActiveView] = useState<string>(OVERVIEW_VIEW);
  const activeSection = LECTURER_SECTIONS.find((section) => section.model === activeView) ?? null;
  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const activeCustom = CUSTOM_VIEWS[activeView] ?? null;

  const renderNavItem = (model: string, label: string) => (
    <button
      key={model}
      type="button"
      className={`admin-nav-item${model === activeView ? ' admin-nav-item-active' : ''}`}
      onClick={() => setActiveView(model)}
    >
      <span className="admin-nav-icon">
        <AdminIcon name={CUSTOM_VIEWS[model]?.icon ?? NAV_ICON[model] ?? model} />
      </span>
      <span>{label}</span>
    </button>
  );

  return (
    <ToastProvider>
    <div className="admin-shell lecturer-theme">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-logo">
            <ZetrcMark />
          </span>
          <span className="admin-brand-text">
            <span className="admin-brand-mark">ZETRC</span>
            <span className="admin-brand-sub">Lecturer portal</span>
          </span>
        </div>

        <nav className="admin-nav">
          <span className="admin-nav-heading">Main</span>
          {renderNavItem(OVERVIEW_VIEW, 'Overview')}
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="admin-nav-group">
              <span className="admin-nav-heading">{group.title}</span>
              {group.models.map((model) => {
                if (CUSTOM_VIEWS[model]) return renderNavItem(model, CUSTOM_VIEWS[model].label);
                const section = LECTURER_SECTIONS.find((item) => item.model === model);
                return section ? renderNavItem(section.model, section.label) : null;
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile">
            <span className="admin-avatar">{profile.initials}</span>
            <span className="admin-profile-text">
              <span className="admin-profile-name">{profile.fullName}</span>
              <span className="admin-profile-email">{profile.email}</span>
            </span>
          </div>
          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            <AdminIcon name="logout" size={16} />
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar-kicker">
              {activeSection || activeCustom ? 'Lecturer portal' : 'Welcome back'}
            </p>
            <h1 className="admin-topbar-title">
              {activeCustom ? activeCustom.label : activeSection ? activeSection.label : 'Overview'}
            </h1>
          </div>
          <div className="admin-topbar-meta">
            <NotificationBell scope="lecturer" email={profile.email} onNavigate={setActiveView} />
            <span className="admin-topbar-date">
              <AdminIcon name="calendar" size={16} />
              {today}
            </span>
            <a className="admin-topbar-link" href="#home">
              View site
              <AdminIcon name="external" size={14} />
            </a>
          </div>
        </header>

        {activeView === PROGRESS_VIEW ? (
          <ProgressView scope="lecturer" />
        ) : activeView === 'quizzes' ? (
          <QuizManager scope="lecturer" />
        ) : activeView === 'gradebook' ? (
          <GradebookView scope="lecturer" />
        ) : activeView === 'discussions' ? (
          <Discussions actor="lecturer" myEmail={profile.email} />
        ) : activeView === 'journal' ? (
          <FieldJournalGallery scope="lecturer" />
        ) : activeView === 'Assignment_Submission' ? (
          <SubmissionsReview scope="lecturer" />
        ) : activeSection ? (
          <AdminModelTable
            key={activeSection.model}
            scope="lecturer"
            model={activeSection.model}
            title={activeSection.label}
            description={activeSection.description}
            columns={activeSection.columns}
            canCreate={activeSection.canCreate}
            canEdit={activeSection.canEdit}
            canDelete={activeSection.canDelete}
          />
        ) : (
          <LecturerOverview profile={profile} onNavigate={setActiveView} />
        )}
      </main>
    </div>
    </ToastProvider>
  );
}

export default LecturerDashboard;
