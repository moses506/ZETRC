import { useStaffRecords } from '../../hooks/useAdminRecords';
import type { AdminProfile } from '../../utils/auth';
import { AdminIcon } from '../admin/AdminIcons';
import '../../styles/admin.css';

type ApiRecord = Record<string, unknown>;

type LecturerOverviewProps = {
  profile: AdminProfile;
  onNavigate: (model: string) => void;
};

function readString(record: ApiRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function formatWhen(record: ApiRecord): string {
  const time = Date.parse(readString(record, 'creation'));
  if (Number.isNaN(time)) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(time),
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function countBy(records: ApiRecord[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    const value = readString(record, key);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function LecturerOverview({ profile, onNavigate }: LecturerOverviewProps) {
  const courses = useStaffRecords<ApiRecord>('lecturer', 'Course');
  const modules = useStaffRecords<ApiRecord>('lecturer', 'Course_Module');
  const lessons = useStaffRecords<ApiRecord>('lecturer', 'Lesson_Content');
  const assignments = useStaffRecords<ApiRecord>('lecturer', 'Assignment');
  const submissions = useStaffRecords<ApiRecord>('lecturer', 'Assignment_Submission');
  const enrollments = useStaffRecords<ApiRecord>('lecturer', 'Student_Enrollment');

  const isLoading = [courses, modules, lessons, assignments, submissions, enrollments].some((item) => item.isLoading);
  const show = (value: number) => (isLoading ? '–' : value);

  const toMark = submissions.records.filter((record) => {
    const status = readString(record, 'status');
    return status !== 'marked' && status !== 'returned';
  });

  const studentsByCourse = countBy(enrollments.records, 'course');
  const modulesByCourse = countBy(modules.records, 'course');
  const assignmentsByCourse = countBy(assignments.records, 'course');
  const uniqueStudents = new Set(enrollments.records.map((record) => readString(record, 'email').toLowerCase())).size;

  const heroMetrics = [
    { label: 'My courses', value: courses.records.length, model: 'Course' },
    { label: 'Students', value: uniqueStudents, model: 'Student_Enrollment' },
    { label: 'Submissions to mark', value: toMark.length, model: 'Assignment_Submission' },
    { label: 'Lessons published', value: lessons.records.length, model: 'Lesson_Content' },
  ];

  return (
    <div className="admin-overview">
      <section className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-hero-eyebrow">
            <span className="admin-hero-eyebrow-dot" />
            Lecturer portal
          </span>
          <h2>
            {greeting()}, {profile.firstName}
          </h2>
          <p>Keep your courses moving: add lessons, set assignments and give students feedback.</p>
          <div className="admin-hero-actions">
            <button
              type="button"
              className="admin-hero-btn admin-hero-btn-primary"
              onClick={() => onNavigate('Assignment_Submission')}
            >
              Mark submissions
              <AdminIcon name="arrow" size={16} />
            </button>
            <button type="button" className="admin-hero-btn" onClick={() => onNavigate('Lesson_Content')}>
              Add a lesson
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

      <div className="admin-section-head">
        <h3>Your courses</h3>
        <span>Assigned to you by the administrator</span>
      </div>

      {!isLoading && courses.records.length === 0 ? (
        <p className="admin-panel-empty">
          No courses are assigned to you yet. Ask the ZETRC administrator to assign you to a course.
        </p>
      ) : (
        <div className="lecturer-course-grid">
          {courses.records.map((course) => {
            const name = readString(course, 'name');
            return (
              <div key={name} className="lecturer-course-card">
                <span className="admin-stat-icon admin-tone-teal">
                  <AdminIcon name="Course" size={20} />
                </span>
                <h4>{name}</h4>
                <p>{readString(course, 'description').slice(0, 140) || 'No description yet.'}</p>
                <div className="lecturer-course-stats">
                  <span className="admin-chip admin-chip-static">{studentsByCourse[name] ?? 0} students</span>
                  <span className="admin-chip admin-chip-static">{modulesByCourse[name] ?? 0} modules</span>
                  <span className="admin-chip admin-chip-static">{assignmentsByCourse[name] ?? 0} assignments</span>
                  {readString(course, 'duration') ? (
                    <span className="admin-chip admin-chip-static">{readString(course, 'duration')}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="admin-overview-grid">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Needs marking</h2>
            <span className="admin-panel-pill">{toMark.length} waiting</span>
          </div>
          {toMark.length === 0 ? (
            <p className="admin-panel-empty">You&apos;re all caught up — no submissions waiting.</p>
          ) : (
            <ul className="admin-activity-list">
              {toMark.slice(0, 8).map((record) => (
                <li key={readString(record, 'name')}>
                  <span className="admin-activity-icon admin-tone-blue">
                    <AdminIcon name="Assignment_Submission" size={16} />
                  </span>
                  <button
                    type="button"
                    className="admin-activity-link"
                    onClick={() => onNavigate('Assignment_Submission')}
                  >
                    {readString(record, 'student_first_name')} {readString(record, 'student_last_name')} →{' '}
                    {readString(record, 'assignment_name') || readString(record, 'assignment')}
                  </button>
                  <span className="admin-activity-when">{formatWhen(record)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>New students</h2>
            <button type="button" className="admin-panel-link" onClick={() => onNavigate('Student_Enrollment')}>
              View all
            </button>
          </div>
          {enrollments.records.length === 0 ? (
            <p className="admin-panel-empty">No students have enrolled in your courses yet.</p>
          ) : (
            <ul className="admin-activity-list">
              {enrollments.records.slice(0, 6).map((record) => (
                <li key={readString(record, 'name')}>
                  <span className="admin-activity-icon admin-tone-teal">
                    <AdminIcon name="users:Learner" size={16} />
                  </span>
                  <span className="admin-activity-link">
                    {readString(record, 'first_name')} {readString(record, 'last_name')} ·{' '}
                    <span className="admin-muted">{readString(record, 'course')}</span>
                  </span>
                  <span className="admin-activity-when">{formatWhen(record)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default LecturerOverview;
