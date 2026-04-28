import { useLessons } from '../hooks/useLessons';

type TrainingProps = {
  onApplyNow: () => void;
  onSignIn: () => void;
};

const trainingTracks = [
  {
    title: 'Climate-smart farming essentials',
    timing: 'Weeks 1–2',
    copy: 'Build a practical foundation in weather adaptation, water use, and resilient farm planning.',
  },
  {
    title: 'Soil, crop, and field management',
    timing: 'Weeks 3–4',
    copy: 'Use affordable techniques to improve soil health, planting consistency, and crop performance.',
  },
  {
    title: 'Post-harvest and income pathways',
    timing: 'Weeks 5–6',
    copy: 'Reduce losses, strengthen handling routines, and explore simple value-add opportunities.',
  },
];

const trainingBenefits = [
  'Short lessons designed for field schedules and mobile access',
  'Assignments grounded in real farm observations and local conditions',
  'Support for individuals, cooperatives, NGOs, and partner-led cohorts',
  'Progress tracking that leads directly into the academy dashboard',
];

const flowSteps = [
  {
    step: '01',
    title: 'Explore the program',
    copy: 'Review the training path, expected outcomes, and the support model before you enroll.',
  },
  {
    step: '02',
    title: 'Create your training profile',
    copy: 'Register as a trainee, cooperative leader, NGO staff member, or institutional partner.',
  },
  {
    step: '03',
    title: 'Enter your learning dashboard',
    copy: 'Access modules, assignments, certificates, and announcements in one place.',
  },
];

const snapshotItems = [
  {
    label: 'Mobile-first',
    desc: 'Short, focused lessons you can study from the field.',
  },
  {
    label: 'Assignment based',
    desc: 'Track what learners apply, not just what they watch.',
  },
  {
    label: 'Certification ready',
    desc: 'Completion status flows directly into dashboard certificates.',
  },
  {
    label: 'Partner friendly',
    desc: 'Supports onboarding and reporting across cohorts.',
  },
];

function Training({ onApplyNow, onSignIn }: TrainingProps) {
  const { lessons, isLoading, errorMessage } = useLessons();
  const uniqueModules = [...new Set(lessons.map((lesson) => lesson.module).filter(Boolean))];
  const firstLesson = lessons[0] ?? null;
  const trainingTracks = lessons.slice(0, 4).map((lesson, index) => ({
    title: lesson.module || lesson.name,
    timing: `Lesson ${index + 1}`,
    copy: lesson.introduction || lesson.summary || 'Lesson content is available for this module.',
  }));
  const trainingBenefits = firstLesson?.keyPoints?.length
    ? firstLesson.keyPoints.slice(0, 4)
    : [
        'Short lessons designed for field schedules and mobile access',
        'Assignments grounded in real farm observations and local conditions',
        'Support for individuals, cooperatives, NGOs, and partner-led cohorts',
        'Progress tracking that leads directly into the academy dashboard',
      ];
  const snapshotItems = [
    {
      label: 'Live lessons',
      desc: `${lessons.length || 0} lesson${lessons.length === 1 ? '' : 's'} available now.`,
    },
    {
      label: 'Modules',
      desc: `${uniqueModules.length || 0} learning module${uniqueModules.length === 1 ? '' : 's'} in the system.`,
    },
    {
      label: 'Audio ready',
      desc: `${lessons.filter((lesson) => lesson.audioFiles).length} lesson audio file${lessons.filter((lesson) => lesson.audioFiles).length === 1 ? '' : 's'} linked.`,
    },
    {
      label: 'Attachments',
      desc: `${lessons.filter((lesson) => lesson.attachments).length} lesson attachment${lessons.filter((lesson) => lesson.attachments).length === 1 ? '' : 's'} available.`,
    },
  ];

  return (
    <div className="training-page-view">

      {/* ── HERO ── */}
      <div className="training-hero-card">
        <div className="training-hero-copy">
          <span className="training-kicker">Training Journey</span>
          <h2>
            A practical path into<br />
            the ZETRC Academy
          </h2>
          <p>
            {firstLesson?.introduction ||
              'This training page bridges the public website into registration, onboarding, and the academy dashboard without breaking the visual experience.'}
          </p>

          <div className="training-hero-actions">
            <button className="btn-primary-top" onClick={onApplyNow}>
              Apply for Training →
            </button>
            <button className="btn-ghost-top training-ghost-inverse" onClick={() => onSignIn()}>
              I already have access
            </button>
          </div>

          <div className="training-meta-row">
            <div className="training-meta-pill">
              <span>Live lessons</span>
              <strong>{lessons.length || 0}</strong>
            </div>
            <div className="training-meta-pill">
              <span>Modules</span>
              <strong>{uniqueModules.length || 0}</strong>
            </div>
            <div className="training-meta-pill">
              <span>Current focus</span>
              <strong>{firstLesson?.module || 'Training'}</strong>
            </div>
          </div>
        </div>

        {/* Snapshot card */}
        <div className="training-snapshot-panel">
          <div className="training-snapshot-header">
            <span className="card-tagline">Program snapshot</span>
            <span className="training-pilot-badge">Pilot intake</span>
          </div>
          <div className="training-snapshot-grid">
            {snapshotItems.map((item) => (
              <div className="training-snapshot-cell" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
          <div className="training-snapshot-footer">
            <span className="training-trust-dot" />
            <span>Consistent with landing, registration, and dashboard screens</span>
          </div>
        </div>
      </div>

      {/* ── HOW IT FLOWS ── */}
      <div className="card training-flow-section">
        <div className="card-header">
          <div>
            <p className="training-section-eyebrow">How it flows</p>
            <h3 className="card-title training-section-title">
              One clear journey from interest to active learning
            </h3>
          </div>
        </div>
        <p className="training-section-lead">
          {errorMessage
            ? errorMessage
            : isLoading
              ? 'Loading lesson content from the training API...'
              : 'The page introduces the program, helps users self-identify, and channels them into either registration or sign-in with no abrupt handoff.'}
        </p>

        <div className="training-flow-grid">
          {flowSteps.map((item) => (
            <div className="training-flow-card" key={item.step}>
              <span className="training-flow-step">{item.step}</span>
              <h4 className="training-flow-title">{item.title}</h4>
              <p className="training-flow-copy">{item.copy}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROGRAM + BENEFITS ── */}
      <div className="training-content-grid">

        {/* Program structure */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="training-section-eyebrow">Program structure</p>
              <span className="card-title">Modules that feel practical and local</span>
            </div>
          </div>
          <div className="training-track-list">
            {(trainingTracks.length > 0 ? trainingTracks : [{
              title: 'Training content coming soon',
              timing: 'Pending',
              copy: 'No live lesson content has been published yet.',
            }]).map((track) => (
              <div className="training-track-row" key={track.title}>
                <span className="training-track-badge">{track.timing}</span>
                <div className="training-track-copy">
                  <h4 className="training-track-name">{track.title}</h4>
                  <p className="training-track-desc">{track.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why it works + CTA */}
        <div className="training-benefits-stack">
          <div className="card">
            <div className="card-header">
              <div>
                <p className="training-section-eyebrow">Why it works</p>
                <span className="card-title">Designed around real delivery conditions</span>
              </div>
            </div>
            <div className="training-benefits-list">
              {trainingBenefits.map((benefit) => (
                <div className="training-benefit-item" key={benefit}>
                  <span className="training-check-dot">✓</span>
                  <span className="training-benefit-text">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <div className="training-cta-panel">
            <p className="training-cta-kicker">Ready to move forward?</p>
            <p className="training-cta-copy">
              Start with registration if you are new, or sign in if your cohort already has access.
            </p>
            <div className="training-cta-actions">
              <button className="btn-primary-top" onClick={onApplyNow}>
                Register now
              </button>
              <button className="btn-ghost-top training-ghost-inverse" onClick={() => onSignIn()}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Training;
