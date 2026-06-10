import { useLessons } from '../hooks/useLessons';
import trainingSessionPhoto from '../assets/kunda_lesson -02.jpeg';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t, tList } = useLanguage();
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
        ...tList('trainingBenefits'),
      ];
  const snapshotItems = [
    {
      label: t('liveLessons'),
      desc: `${lessons.length || 0} ${t('lessonsAvailable')}`,
    },
    {
      label: t('modules'),
      desc: `${uniqueModules.length || 0} ${t('learningModules')}`,
    },
    {
      label: 'Audio ready',
      desc: `${lessons.filter((lesson) => lesson.audioFiles).length} ${t('audioLinked')}`,
    },
    {
      label: 'Attachments',
      desc: `${lessons.filter((lesson) => lesson.attachments).length} ${t('attachmentsAvailable')}`,
    },
  ];

  return (
    <div className="training-page-view">

      {/* ── HERO ── */}
      <div className="training-hero-card">
        <div className="training-hero-copy">
          <span className="training-kicker">{t('trainingJourney')}</span>
          <h2>
            {t('trainingHeroTitle')}
          </h2>
          <p>
            {firstLesson?.introduction ||
              t('trainingHeroFallback')}
          </p>

          <div className="training-hero-actions">
            <button className="btn-primary-top" onClick={onApplyNow}>
              {t('applyTraining')}
            </button>
            <button className="btn-ghost-top training-ghost-inverse" onClick={() => onSignIn()}>
              {t('alreadyHaveAccess')}
            </button>
          </div>

          <div className="training-meta-row">
            <div className="training-meta-pill">
              <span>{t('liveLessons')}</span>
              <strong>{lessons.length || 0}</strong>
            </div>
            <div className="training-meta-pill">
              <span>{t('modules')}</span>
              <strong>{uniqueModules.length || 0}</strong>
            </div>
            <div className="training-meta-pill">
              <span>{t('currentFocus')}</span>
              <strong>{firstLesson?.module || 'Training'}</strong>
            </div>
          </div>
        </div>

        {/* Snapshot card */}
        <div className="training-snapshot-panel">
          <img
            className="training-snapshot-photo"
            src={trainingSessionPhoto}
            alt="Farmers attending a ZETRC lesson session"
          />
          <div className="training-snapshot-header">
            <span className="card-tagline">{t('programSnapshot')}</span>
            <span className="training-pilot-badge">{t('pilotIntake')}</span>
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
            <span>{t('snapshotFooter')}</span>
          </div>
        </div>
      </div>

      {/* ── HOW IT FLOWS ── */}
      <div className="card training-flow-section">
        <div className="card-header">
          <div>
            <p className="training-section-eyebrow">{t('howItFlows')}</p>
            <h3 className="card-title training-section-title">
              {t('journeyTitle')}
            </h3>
          </div>
        </div>
        <p className="training-section-lead">
          {errorMessage
            ? errorMessage
            : isLoading
              ? t('trainingLoading')
              : t('journeyLead')}
        </p>

        <div className="training-flow-grid">
          {tList('flowSteps').map((entry, index) => {
            const [title, copy] = entry.split('|');

            return (
            <div className="training-flow-card" key={title}>
              <span className="training-flow-step">{String(index + 1).padStart(2, '0')}</span>
              <h4 className="training-flow-title">{title}</h4>
              <p className="training-flow-copy">{copy}</p>
            </div>
            );
          })}
        </div>
      </div>

      {/* ── PROGRAM + BENEFITS ── */}
      <div className="training-content-grid">

        {/* Program structure */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="training-section-eyebrow">{t('programStructure')}</p>
              <span className="card-title">{t('modulesPractical')}</span>
            </div>
          </div>
          <div className="training-track-list">
            {(trainingTracks.length > 0 ? trainingTracks : [{
              title: t('comingSoon'),
              timing: t('pending'),
              copy: t('noLessons'),
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
                <p className="training-section-eyebrow">{t('whyItWorks')}</p>
                <span className="card-title">{t('deliveryConditions')}</span>
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
            <p className="training-cta-kicker">{t('readyForward')}</p>
            <p className="training-cta-copy">
              {t('readyForwardCopy')}
            </p>
            <div className="training-cta-actions">
              <button className="btn-primary-top" onClick={onApplyNow}>
                {t('registerNow')}
              </button>
              <button className="btn-ghost-top training-ghost-inverse" onClick={() => onSignIn()}>
                {t('signIn')}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Training;
