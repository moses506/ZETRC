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
  summaryKey: string;
  panelLabelKey: string;
  focusListKey: string;
  icons: string[];
  showCta?: boolean;
};

const SERVICE_AREAS: ServiceAreaConfig[] = [
  {
    id: 'academy',
    number: '01',
    nameKey: 'academyName',
    taglineKey: 'academyTagline',
    summaryKey: 'academyIntro1',
    panelLabelKey: 'academyServicesLabel',
    focusListKey: 'academyFocus',
    icons: ['📦', '🏭', '🌿', '💼', '♻️', '🌱', '🤝'],
    showCta: true,
  },
  {
    id: 'climate',
    number: '02',
    nameKey: 'serviceClimateName',
    taglineKey: 'serviceClimateTagline',
    summaryKey: 'serviceClimateIntro',
    panelLabelKey: 'serviceClimateFocusLabel',
    focusListKey: 'serviceClimateFocus',
    icons: ['🛡️', '🌿', '⚡', '🌍', '🌳', '🤝', '💧', '💚', '📢'],
  },
  {
    id: 'research',
    number: '03',
    nameKey: 'serviceResearchName',
    taglineKey: 'serviceResearchTagline',
    summaryKey: 'serviceResearchIntro',
    panelLabelKey: 'serviceResearchFocusLabel',
    focusListKey: 'serviceResearchFocus',
    icons: ['🔬', '📊', '📈', '📉', '🤖', '📋', '🔗', '💡'],
  },
  {
    id: 'social',
    number: '04',
    nameKey: 'serviceSocialName',
    taglineKey: 'serviceSocialTagline',
    summaryKey: 'serviceSocialIntro',
    panelLabelKey: 'serviceSocialFocusLabel',
    focusListKey: 'serviceSocialFocus',
    icons: ['⚖️', '🌱', '📚', '🏛️', '🤲', '🏘️', '🔄', '📣'],
  },
];

type ServiceAreaBlockProps = {
  area: ServiceAreaConfig;
  revealIndex: number;
  onJoinTraining?: () => void;
};

function ServiceAreaBlock({
  area,
  revealIndex,
  onJoinTraining,
}: ServiceAreaBlockProps) {
  const { t, tList } = useLanguage();
  const focusItems = tList(area.focusListKey);

  return (
    <article className="services-block">
      <RevealItem index={revealIndex}>
        <div className="services-block-header">
          <span className="services-block-number">{area.number}</span>
          <div className="services-block-heading">
            <h2 className="services-block-name">{t(area.nameKey)}</h2>
            <p className="services-block-tagline">{t(area.taglineKey)}</p>
            <p className="services-block-summary">{t(area.summaryKey)}</p>
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
    </article>
  );
}

function Services({ onJoinTraining }: ServicesProps) {
  const { t } = useLanguage();

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
            revealIndex += 2;

            return (
              <ServiceAreaBlock
                key={area.id}
                area={area}
                revealIndex={blockStartIndex}
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
