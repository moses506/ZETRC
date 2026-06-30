import { PageReveal, RevealItem } from '../components/PageReveal';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/impact.css';

const PILLAR_ICONS = ['🎓', '🔬', '🤝', '🌍'];

function Impact() {
  const { t, tList } = useLanguage();
  const pillars = tList('impactPillars');
  const outcomes = tList('impactOutcomes');

  const stats = [
    { value: '200+', label: t('farmersTrained') },
    { value: '6', label: t('provincesReached') },
    { value: '12+', label: t('partnerOrgs') },
  ];

  return (
    <PageReveal className="impact-page">
      <section className="impact-hero">
        <div className="impact-hero-inner">
          <RevealItem index={0}>
            <h1 className="impact-hero-title">{t('navImpact')}</h1>
            <p className="impact-hero-subtitle">{t('impactHeroSubtitle')}</p>
          </RevealItem>
        </div>
      </section>

      <section className="impact-body">
        <div className="impact-body-inner">
          <RevealItem index={1}>
            <p className="impact-intro">{t('impactIntro')}</p>
          </RevealItem>

          <RevealItem index={2} variant="scale">
            <h2 className="impact-section-title">{t('impactStatsTitle')}</h2>
            <div className="impact-stats">
              {stats.map((stat) => (
                <div className="impact-stat" key={stat.label}>
                  <div className="impact-stat-value">{stat.value}</div>
                  <div className="impact-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </RevealItem>

          <RevealItem index={3}>
            <h2 className="impact-section-title">{t('impactPillarsTitle')}</h2>
            <div className="impact-pillars">
              {pillars.map((item, index) => {
                const [title, desc] = item.split('|');
                return (
                  <article className="impact-pillar" key={title}>
                    <div className="impact-pillar-icon" aria-hidden="true">
                      {PILLAR_ICONS[index] ?? '•'}
                    </div>
                    <h3 className="impact-pillar-title">{title}</h3>
                    <p className="impact-pillar-desc">{desc}</p>
                  </article>
                );
              })}
            </div>
          </RevealItem>

          <RevealItem index={4}>
            <div className="impact-outcomes">
              <h2 className="impact-section-title">{t('impactOutcomesTitle')}</h2>
              <ul className="impact-outcomes-list">
                {outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </RevealItem>
        </div>
      </section>
    </PageReveal>
  );
}

export default Impact;
