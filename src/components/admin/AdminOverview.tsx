import { useAdminRecords, useUsers } from '../../hooks/useAdminRecords';
import '../../styles/admin.css';
import { AdminIcon } from './AdminIcons';
import type { AdminProfile } from '../../utils/auth';

type ApiRecord = Record<string, unknown>;

type AdminOverviewProps = {
  adminProfile: AdminProfile;
  onNavigate: (model: string) => void;
};

type Tone = 'green' | 'gold' | 'teal' | 'violet' | 'blue' | 'rose' | 'slate';

const MODEL_TONE: Record<string, Tone> = {
  'users:Learner': 'teal',
  'users:Lecturer': 'violet',
  Course: 'green',
  Student_Enrollment: 'teal',
  Assignment: 'gold',
  Assignment_Submission: 'blue',
  Certificate: 'violet',
  Lesson_Content: 'green',
  Course_Module: 'teal',
  Lead: 'rose',
  Inquiry: 'blue',
  Proposal_Request: 'gold',
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatusBreakdown({ counts, emptyText }: { counts: Record<string, number>; emptyText: string }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return <p className="admin-panel-empty">{emptyText}</p>;
  }

  return (
    <ul className="admin-status-list">
      {entries.map(([status, count]) => (
        <li key={status}>
          <div className="admin-status-row">
            <span className={`admin-status-dot admin-status-dot-${status}`} />
            <span className="admin-status-name">{status.replace(/_/g, ' ')}</span>
            <span className="admin-status-count">{count}</span>
          </div>
          <div className="admin-status-track">
            <span
              className={`admin-status-fill admin-status-fill-${status}`}
              style={{ width: `${Math.max(6, (count / total) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function readString(record: ApiRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function readDate(record: ApiRecord): number {
  const raw = readString(record, 'creation');
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatWhen(record: ApiRecord): string {
  const time = readDate(record);
  if (!time) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time));
}

function countByStatus(records: ApiRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const record of records) {
    const status = readString(record, 'status') || 'unspecified';
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

function AdminOverview({ adminProfile, onNavigate }: AdminOverviewProps) {
  const courses = useAdminRecords<ApiRecord>('Course');
  const courseModules = useAdminRecords<ApiRecord>('Course_Module');
  const enrollments = useAdminRecords<ApiRecord>('Student_Enrollment');
  const lessons = useAdminRecords<ApiRecord>('Lesson_Content');
  const assignments = useAdminRecords<ApiRecord>('Assignment');
  const submissions = useAdminRecords<ApiRecord>('Assignment_Submission');
  const certificates = useAdminRecords<ApiRecord>('Certificate');
  const leads = useAdminRecords<ApiRecord>('Lead');
  const inquiries = useAdminRecords<ApiRecord>('Inquiry');
  const proposals = useAdminRecords<ApiRecord>('Proposal_Request');
  const students = useUsers('Learner');
  const lecturers = useUsers('Lecturer');

  const isLoading = [
    courses,
    courseModules,
    enrollments,
    lessons,
    assignments,
    submissions,
    certificates,
    leads,
    inquiries,
    proposals,
    students,
    lecturers,
  ].some((resource) => resource.isLoading);

  const statCards = [
    { model: 'users:Learner', label: 'Students', value: students.records.length },
    { model: 'users:Lecturer', label: 'Lecturers', value: lecturers.records.length },
    { model: 'Course', label: 'Courses', value: courses.records.length },
    { model: 'Student_Enrollment', label: 'Enrollments', value: enrollments.records.length },
    { model: 'Assignment', label: 'Assignments', value: assignments.records.length },
    { model: 'Assignment_Submission', label: 'Submissions', value: submissions.records.length },
    { model: 'Certificate', label: 'Certificates', value: certificates.records.length },
    { model: 'Lesson_Content', label: 'Lesson content', value: lessons.records.length },
    { model: 'Course_Module', label: 'Course modules', value: courseModules.records.length },
    { model: 'Lead', label: 'Leads', value: leads.records.length },
    { model: 'Inquiry', label: 'Inquiries', value: inquiries.records.length },
    { model: 'Proposal_Request', label: 'Proposal requests', value: proposals.records.length },
  ];

  const certificateStatus = countByStatus(certificates.records);
  const leadStatus = countByStatus(leads.records);

  const recentActivity = [
    ...enrollments.records.map((record) => ({
      when: readDate(record),
      whenLabel: formatWhen(record),
      text: `New enrollment: ${readString(record, 'first_name')} ${readString(record, 'last_name')} → ${readString(record, 'course')}`,
      model: 'Student_Enrollment',
    })),
    ...leads.records.map((record) => ({
      when: readDate(record),
      whenLabel: formatWhen(record),
      text: `New lead: ${readString(record, 'first_name')} ${readString(record, 'last_name')} (${readString(record, 'company') || 'no company'})`,
      model: 'Lead',
    })),
    ...inquiries.records.map((record) => ({
      when: readDate(record),
      whenLabel: formatWhen(record),
      text: `New inquiry: ${readString(record, 'subject') || 'Untitled'} from ${readString(record, 'first_name')} ${readString(record, 'last_name')}`,
      model: 'Inquiry',
    })),
    ...proposals.records.map((record) => ({
      when: readDate(record),
      whenLabel: formatWhen(record),
      text: `Proposal request: ${readString(record, 'organization_name') || 'Unknown organization'}`,
      model: 'Proposal_Request',
    })),
    ...submissions.records.map((record) => ({
      when: readDate(record),
      whenLabel: formatWhen(record),
      text: `Submission: ${readString(record, 'student_first_name')} ${readString(record, 'student_last_name')} → ${readString(record, 'assignment_name')}`,
      model: 'Assignment_Submission',
    })),
  ]
    .sort((a, b) => b.when - a.when)
    .slice(0, 8);

  const show = (value: number) => (isLoading ? '–' : value);
  const inReview = certificates.records.filter((record) => readString(record, 'status') === 'in_review').length;
  const outreachTotal = leads.records.length + inquiries.records.length + proposals.records.length;

  const unassignedCourses = courses.records.filter((record) => !readString(record, 'lecturer')).length;

  const heroMetrics = [
    { label: 'Active enrollments', value: enrollments.records.length, model: 'Student_Enrollment' },
    { label: 'Submissions to mark', value: submissions.records.length, model: 'Assignment_Submission' },
    { label: 'Certificates in review', value: inReview, model: 'Certificate' },
    { label: 'Outreach contacts', value: outreachTotal, model: 'Lead' },
  ];

  return (
    <div className="admin-overview">
      <section className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-hero-eyebrow">
            <span className="admin-hero-eyebrow-dot" />
            Zambia Environmental Training &amp; Research Centre
          </span>
          <h2>
            {greeting()}, {adminProfile.firstName}
          </h2>
          <p>Here&apos;s what&apos;s happening across courses, learners and outreach today.</p>
          <div className="admin-hero-actions">
            <button type="button" className="admin-hero-btn admin-hero-btn-primary" onClick={() => onNavigate('Course')}>
              Manage courses
              <AdminIcon name="arrow" size={16} />
            </button>
            <button type="button" className="admin-hero-btn" onClick={() => onNavigate('Student_Enrollment')}>
              Review enrollments
            </button>
          </div>
        </div>
        <div className="admin-hero-metrics">
          {heroMetrics.map((metric) => (
            <button
              key={metric.label}
              type="button"
              className="admin-hero-metric"
              onClick={() => onNavigate(metric.model)}
            >
              <span className="admin-hero-metric-value">{show(metric.value)}</span>
              <span className="admin-hero-metric-label">{metric.label}</span>
            </button>
          ))}
        </div>
      </section>

      {!isLoading && unassignedCourses > 0 ? (
        <button type="button" className="admin-callout" onClick={() => onNavigate('users:Lecturer')}>
          <span className="admin-callout-icon">
            <AdminIcon name="users:Lecturer" size={18} />
          </span>
          <span>
            <strong>
              {unassignedCourses} course{unassignedCourses === 1 ? ' has' : 's have'} no lecturer yet.
            </strong>{' '}
            Assign lecturers so they can manage lessons, assignments and marking.
          </span>
          <AdminIcon name="arrow" size={16} />
        </button>
      ) : null}

      <div className="admin-section-head">
        <h3>At a glance</h3>
        <span>Click any card to manage its records</span>
      </div>

      <div className="admin-stat-grid">
        {statCards.map((card) => (
          <button
            key={card.model}
            type="button"
            className={`admin-stat-card admin-tone-${MODEL_TONE[card.model] ?? 'slate'}`}
            onClick={() => onNavigate(card.model)}
          >
            <span className="admin-stat-icon">
              <AdminIcon name={card.model} size={20} />
            </span>
            <span className="admin-stat-value">{show(card.value)}</span>
            <span className="admin-stat-label">{card.label}</span>
            <span className="admin-stat-arrow">
              <AdminIcon name="arrow" size={14} />
            </span>
          </button>
        ))}
      </div>

      <div className="admin-overview-grid">
        <div className="admin-panel admin-panel-activity">
          <div className="admin-panel-head">
            <h2>Recent activity</h2>
            <span className="admin-panel-pill">Latest {recentActivity.length}</span>
          </div>
          {recentActivity.length === 0 ? (
            <p className="admin-panel-empty">Nothing yet — new enrollments, leads, and submissions will show up here.</p>
          ) : (
            <ul className="admin-activity-list">
              {recentActivity.map((item, index) => (
                <li key={index}>
                  <span className={`admin-activity-icon admin-tone-${MODEL_TONE[item.model] ?? 'slate'}`}>
                    <AdminIcon name={item.model} size={16} />
                  </span>
                  <button type="button" className="admin-activity-link" onClick={() => onNavigate(item.model)}>
                    {item.text}
                  </button>
                  <span className="admin-activity-when">{item.whenLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-side-panels">
          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2>Certificates by status</h2>
              <button type="button" className="admin-panel-link" onClick={() => onNavigate('Certificate')}>
                View all
              </button>
            </div>
            <StatusBreakdown counts={certificateStatus} emptyText="No certificates yet." />
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2>Leads by status</h2>
              <button type="button" className="admin-panel-link" onClick={() => onNavigate('Lead')}>
                View all
              </button>
            </div>
            <StatusBreakdown counts={leadStatus} emptyText="No leads yet." />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
