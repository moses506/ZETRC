import { useState } from 'react';
import AdminModelTable, { type AdminColumn } from '../../components/admin/AdminModelTable';
import AdminOverview from '../../components/admin/AdminOverview';
import AdminUsersTable from '../../components/admin/AdminUsersTable';
import type { UserRole } from '../../utils/api';
import { AdminIcon, ZetrcMark } from '../../components/admin/AdminIcons';
import NotificationBell from '../../components/admin/NotificationBell';
import { ToastProvider } from '../../components/admin/Toast';
import ProgressView from '../../components/admin/ProgressView';
import QuizManager from '../../components/staff/QuizManager';
import GradebookView from '../../components/staff/GradebookView';
import EnrollmentReview from '../../components/staff/EnrollmentReview';
import AuditLogView from '../../components/staff/AuditLogView';
import FieldJournalGallery from '../../components/staff/FieldJournalGallery';
import ImpactDashboard from '../../components/staff/ImpactDashboard';
import Discussions from '../../components/shared/Discussions';
import type { AdminProfile } from '../../utils/auth';
import '../../styles/admin.css';

const OVERVIEW_VIEW = 'overview';
const PROGRESS_VIEW = 'progress';

type AdminSection = {
  model: string;
  label: string;
  columns: AdminColumn[];
  description?: string;
};

const PEOPLE_SECTIONS: { key: string; role: UserRole; label: string }[] = [
  { key: 'users:Learner', role: 'Learner', label: 'Students' },
  { key: 'users:Lecturer', role: 'Lecturer', label: 'Lecturers' },
  { key: 'users:Admin', role: 'Admin', label: 'Administrators' },
];

const ADMIN_SECTIONS: AdminSection[] = [
  {
    model: 'Course',
    label: 'Courses',
    description: 'The course name is its title. Assign a lecturer to give them access to the course.',
    columns: [
      { key: 'lecturer', label: 'Lecturer', source: 'lecturers' },
      { key: 'duration', label: 'Duration' },
      { key: 'description', label: 'Description', multiline: true },
    ],
  },
  {
    model: 'Course_Module',
    label: 'Course Modules',
    columns: [
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'sort_order', label: 'Sort order' },
    ],
  },
  {
    model: 'Student_Enrollment',
    label: 'Enrollments',
    columns: [
      { key: 'first_name', label: 'First name' },
      { key: 'last_name', label: 'Last name' },
      { key: 'email', label: 'Email' },
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'duration', label: 'Duration' },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'documents', label: 'Documents', json: true },
    ],
  },
  {
    model: 'Lesson_Content',
    label: 'Lesson Content',
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
    columns: [
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'submission_date', label: 'Due date' },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'remarks', label: 'Remarks', multiline: true },
      { key: 'status', label: 'Status' },
      { key: 'lecturer_name', label: 'Lecturer' },
    ],
  },
  {
    model: 'Assignment_Submission',
    label: 'Assignment Submissions',
    columns: [
      { key: 'assignment_name', label: 'Assignment' },
      { key: 'student_first_name', label: 'Student first name' },
      { key: 'student_last_name', label: 'Student last name' },
      { key: 'student', label: 'Student email' },
      { key: 'content', label: 'Response', multiline: true },
      { key: 'attachment', label: 'Attachment URL' },
      { key: 'status', label: 'Status', options: ['submitted', 'marked', 'returned'] },
      { key: 'score', label: 'Score', number: true },
      { key: 'max_score', label: 'Out of', number: true },
      { key: 'grade', label: 'Grade label' },
      { key: 'feedback', label: 'Feedback', multiline: true },
    ],
  },
  {
    model: 'Certificate',
    label: 'Certificates',
    columns: [
      { key: 'learner_email', label: 'Learner email' },
      { key: 'course', label: 'Course', source: 'courses' },
      { key: 'status', label: 'Status', options: ['earned', 'in_review', 'locked'] },
      { key: 'issued_date', label: 'Issued date' },
      { key: 'detail', label: 'Detail', multiline: true },
    ],
  },
  {
    model: 'Announcement',
    label: 'Announcements',
    description: 'Leave the course empty to announce to every learner. Learners get it in-app and by SMS.',
    columns: [
      { key: 'course', label: 'Course (empty = everyone)', source: 'courses' },
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Message', multiline: true },
      { key: 'priority', label: 'Priority', options: ['info', 'important'] },
      { key: 'author_name', label: 'Posted by', readOnly: true },
    ],
  },
  {
    model: 'Lead',
    label: 'Leads',
    columns: [
      { key: 'first_name', label: 'First name' },
      { key: 'last_name', label: 'Last name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'message', label: 'Message', multiline: true },
    ],
  },
  {
    model: 'Inquiry',
    label: 'Inquiries',
    columns: [
      { key: 'first_name', label: 'First name' },
      { key: 'last_name', label: 'Last name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'subject', label: 'Subject' },
      { key: 'message', label: 'Message', multiline: true },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    model: 'Proposal_Request',
    label: 'Proposal Requests',
    columns: [
      { key: 'organization_name', label: 'Organization' },
      { key: 'contact_person', label: 'Contact person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'project_description', label: 'Project description', multiline: true },
      { key: 'budget', label: 'Budget' },
      { key: 'timeline', label: 'Timeline' },
      { key: 'status', label: 'Status' },
    ],
  },
];

/** Views that render their own component instead of a record table. */
const CUSTOM_VIEWS: Record<string, { label: string; icon: string; kicker: string }> = {
  impact: { label: 'Impact Report', icon: 'impact', kicker: 'Reporting' },
  [PROGRESS_VIEW]: { label: 'Learner Progress', icon: 'progress', kicker: 'Learning' },
  enrollments: { label: 'Enrollment Review', icon: 'review', kicker: 'Learning' },
  quizzes: { label: 'Quizzes', icon: 'quizzes', kicker: 'Assessment' },
  gradebook: { label: 'Gradebook', icon: 'gradebook', kicker: 'Assessment' },
  discussions: { label: 'Discussions', icon: 'discussions', kicker: 'Community' },
  journal: { label: 'Field Journal', icon: 'journal', kicker: 'Community' },
  audit: { label: 'Audit Log', icon: 'audit', kicker: 'System' },
};

const NAV_GROUPS: { title: string; models: string[] }[] = [
  { title: 'People', models: PEOPLE_SECTIONS.map((section) => section.key) },
  {
    title: 'Learning',
    models: [PROGRESS_VIEW, 'Course', 'Course_Module', 'Lesson_Content', 'enrollments', 'Announcement'],
  },
  { title: 'Assessment', models: ['Assignment', 'Assignment_Submission', 'quizzes', 'gradebook', 'Certificate'] },
  { title: 'Community', models: ['discussions', 'journal'] },
  { title: 'Outreach', models: ['Lead', 'Inquiry', 'Proposal_Request'] },
  { title: 'System', models: ['audit'] },
];

type AdminDashboardProps = {
  adminProfile: AdminProfile;
  onLogout: () => void;
};

function AdminDashboard({ adminProfile, onLogout }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<string>(OVERVIEW_VIEW);
  const activeSection = ADMIN_SECTIONS.find((section) => section.model === activeView) ?? null;
  const activePeople = PEOPLE_SECTIONS.find((section) => section.key === activeView) ?? null;
  const activeCustom = CUSTOM_VIEWS[activeView] ?? null;
  const activeLabel = activeCustom?.label ?? activeSection?.label ?? activePeople?.label ?? 'Overview';
  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Old links (e.g. notifications) to the raw enrollment table open the review screen.
  const navigate = (view: string) => setActiveView(view === 'Student_Enrollment' ? 'enrollments' : view);

  const renderNavItem = (model: string, label: string, icon = model) => (
    <button
      key={model}
      type="button"
      className={`admin-nav-item${model === activeView ? ' admin-nav-item-active' : ''}`}
      onClick={() => setActiveView(model)}
    >
      <span className="admin-nav-icon">
        <AdminIcon name={icon} />
      </span>
      <span>{label}</span>
    </button>
  );

  const renderCustom = () => {
    switch (activeView) {
      case 'impact':
        return <ImpactDashboard />;
      case PROGRESS_VIEW:
        return <ProgressView scope="admin" />;
      case 'enrollments':
        return <EnrollmentReview />;
      case 'quizzes':
        return <QuizManager scope="admin" />;
      case 'gradebook':
        return <GradebookView scope="admin" />;
      case 'discussions':
        return <Discussions actor="admin" myEmail={adminProfile.email} />;
      case 'journal':
        return <FieldJournalGallery scope="admin" />;
      case 'audit':
        return <AuditLogView />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-logo">
            <ZetrcMark />
          </span>
          <span className="admin-brand-text">
            <span className="admin-brand-mark">ZETRC</span>
            <span className="admin-brand-sub">Admin console</span>
          </span>
        </div>

        <nav className="admin-nav">
          <span className="admin-nav-heading">Main</span>
          {renderNavItem(OVERVIEW_VIEW, 'Overview')}
          {renderNavItem('impact', CUSTOM_VIEWS.impact.label, 'impact')}
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="admin-nav-group">
              <span className="admin-nav-heading">{group.title}</span>
              {group.models.map((model) => {
                const custom = CUSTOM_VIEWS[model];
                if (custom) return renderNavItem(model, custom.label, custom.icon);
                const label =
                  ADMIN_SECTIONS.find((item) => item.model === model)?.label ??
                  PEOPLE_SECTIONS.find((item) => item.key === model)?.label;
                return label ? renderNavItem(model, label) : null;
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile">
            <span className="admin-avatar">{adminProfile.initials}</span>
            <span className="admin-profile-text">
              <span className="admin-profile-name">{adminProfile.fullName}</span>
              <span className="admin-profile-email">{adminProfile.email}</span>
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
              {activeCustom?.kicker ?? (activePeople ? 'People management' : activeSection ? 'Manage records' : 'Admin console')}
            </p>
            <h1 className="admin-topbar-title">{activeLabel}</h1>
          </div>
          <div className="admin-topbar-meta">
            <NotificationBell scope="admin" email={adminProfile.email} onNavigate={navigate} />
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

        {activeCustom ? (
          renderCustom()
        ) : activePeople ? (
          <AdminUsersTable key={activePeople.key} role={activePeople.role} adminProfile={adminProfile} />
        ) : activeSection ? (
          <AdminModelTable
            key={activeSection.model}
            model={activeSection.model}
            title={activeSection.label}
            columns={activeSection.columns}
            description={activeSection.description}
          />
        ) : (
          <AdminOverview adminProfile={adminProfile} onNavigate={navigate} />
        )}
      </main>
    </div>
    </ToastProvider>
  );
}

export default AdminDashboard;
