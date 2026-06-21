import { useState } from 'react';
import { PageReveal, RevealItem } from '../components/PageReveal';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/services.css';

type ServicesProps = {
  onJoinTraining: () => void;
};

type ServiceAreaConfig = {
  id: string;
  number: string;
  nameKey: string;
  taglineKey: string;
  panelLabelKey: string;
  focusListKey: string;
  introKeys: string[];
  outroKey: string;
  icons: string[];
  showCta?: boolean;
};

const SERVICE_AREAS: ServiceAreaConfig[] = [
  {
    id: 'academy',
    number: '01',
    nameKey: 'academyName',
    taglineKey: 'academyTagline',
    panelLabelKey: 'academyServicesLabel',
    focusListKey: 'academyFocus',
    introKeys: ['academyIntro1', 'academyTrainingIntro'],
    outroKey: 'academyOutro',
    icons: ['📦', '🏭', '🌿', '💼', '♻️', '🌱', '🤝'],
    showCta: true,
  },
  {
    id: 'climate',
    number: '02',
    nameKey: 'serviceClimateName',
    taglineKey: 'serviceClimateTagline',
    panelLabelKey: 'serviceClimateFocusLabel',
    focusListKey: 'serviceClimateFocus',
    introKeys: ['serviceClimateIntro', 'serviceClimateFocusIntro'],
    outroKey: 'serviceClimateOutro',
    icons: ['🛡️', '🌿', '⚡', '🌍', '🌳', '🤝', '💧', '💚', '📢'],
  },
  {
    id: 'research',
    number: '03',
    nameKey: 'serviceResearchName',
    taglineKey: 'serviceResearchTagline',
    panelLabelKey: 'serviceResearchFocusLabel',
    focusListKey: 'serviceResearchFocus',
    introKeys: ['serviceResearchIntro', 'serviceResearchFocusIntro'],
    outroKey: 'serviceResearchOutro',
    icons: ['🔬', '📊', '📈', '📉', '🤖', '📋', '🔗', '💡'],
  },
  {
    id: 'social',
    number: '04',
    nameKey: 'serviceSocialName',
    taglineKey: 'serviceSocialTagline',
    panelLabelKey: 'serviceSocialFocusLabel',
    focusListKey: 'serviceSocialFocus',
    introKeys: ['serviceSocialIntro', 'serviceSocialFocusIntro'],
    outroKey: 'serviceSocialOutro',
    icons: ['⚖️', '🌱', '📚', '🏛️', '🤲', '🏘️', '🔄', '📣'],
  },
];

type ServiceAreaBlockProps = {
  area: ServiceAreaConfig;
  revealIndex: number;
  expanded: boolean;
  onToggle: () => void;
  onJoinTraining?: () => void;
};

function ServiceAreaBlock({
  area,
  revealIndex,
  expanded,
  onToggle,
  onJoinTraining,
}: ServiceAreaBlockProps) {
  const { t, tList } = useLanguage();
  const focusItems = tList(area.focusListKey);
  const aboutId = `services-about-${area.id}`;

  return (
    <article className="services-block">
      <RevealItem index={revealIndex}>
        <div className="services-block-header">
          <span className="services-block-number">{area.number}</span>
          <div className="services-block-heading">
            <h2 className="services-block-name">{t(area.nameKey)}</h2>
            <p className="services-block-tagline">{t(area.taglineKey)}</p>
          </div>
          {area.showCta && onJoinTraining && (
            <button type="button" className="services-block-btn" onClick={onJoinTraining}>
              {t('exploreAcademy')}
            </button>
          )}
        </div>
      </RevealItem>

      <RevealItem index={revealIndex + 1} variant="scale">
        <div className="services-panel" aria-label={t(area.panelLabelKey)}>
          <div className="services-panel-head">
            <span className="services-panel-label">{t(area.panelLabelKey)}</span>
                <span className="services-panel-count">{focusItems.length} {t('areasLabel')}</span>
          </div>
          <ul className="services-box-grid services-box-grid--main">
            {focusItems.map((title, index) => (
              <li key={title} className="services-box">
                <span className="services-box-icon" aria-hidden="true">
                  {area.icons[index] ?? '•'}
                </span>
                <span className="services-box-title">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </RevealItem>

      <RevealItem index={revealIndex + 2}>
        <div className="services-about">
          <div
            id={aboutId}
            className={`services-about-body${expanded ? ' services-about-body--expanded' : ''}`}
            hidden={!expanded}
          >
            {area.introKeys.map((key) => (
              <p key={key} className="services-copy-text">{t(key)}</p>
            ))}
            <p className="services-copy-outro">{t(area.outroKey)}</p>
          </div>
          <button
            type="button"
            className="services-see-more"
            aria-expanded={expanded}
            aria-controls={aboutId}
            onClick={onToggle}
          >
            {expanded ? t('seeLess') : t('seeMore')}
          </button>
        </div>
      </RevealItem>
    </article>
  );
}

function Services({ onJoinTraining }: ServicesProps) {
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections((current) => ({ ...current, [id]: !current[id] }));
  };

  let revealIndex = 0;

  return (
    <PageReveal className="services-page">
      <section className="services-hero services-hero--compact">
        <div className="services-hero-inner services-hero-inner--wide">
          <RevealItem index={revealIndex++}>
            <h1 className="services-hero-title">{t('servicesStrategicTitle')}</h1>
          </RevealItem>
        </div>
      </section>

      <section className="services-content">
        <div className="services-content-inner">
          {SERVICE_AREAS.map((area) => {
            const blockStartIndex = revealIndex;
            revealIndex += 3;

            return (
              <ServiceAreaBlock
                key={area.id}
                area={area}
                revealIndex={blockStartIndex}
                expanded={Boolean(expandedSections[area.id])}
                onToggle={() => toggleSection(area.id)}
                onJoinTraining={area.showCta ? onJoinTraining : undefined}
              />
            );
          })}
        </div>
      </section>
    </PageReveal>
  );
}

export default Services;
