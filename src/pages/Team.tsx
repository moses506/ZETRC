import { PageReveal, RevealItem } from '../components/PageReveal';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/team.css';

const TEAM_ICONS = ['LS', 'TA', 'RI', 'CE'];

function Team() {
  const { t, tList } = useLanguage();
  const roles = tList('teamRoles');
  const values = tList('teamValues');

  return (
    <PageReveal className="team-page">
      <section className="team-hero">
        <div className="team-hero-inner">
          <RevealItem index={0}>
            <h1 className="team-hero-title">{t('navTeam')}</h1>
            <p className="team-hero-subtitle">{t('teamHeroSubtitle')}</p>
          </RevealItem>
        </div>
      </section>

      <section className="team-body">
        <div className="team-body-inner">
          <RevealItem index={1}>
            <p className="team-intro">{t('teamIntro')}</p>
          </RevealItem>

          <RevealItem index={2}>
            <h2 className="team-section-title">{t('teamUnitsTitle')}</h2>
            <div className="team-grid">
              {roles.map((item, index) => {
                const [title, role, desc] = item.split('|');
                return (
                  <article className="team-card" key={title}>
                    <div className="team-card-top">
                      <div className="team-avatar" aria-hidden="true">
                        {TEAM_ICONS[index] ?? 'ZT'}
                      </div>
                      <div>
                        <h3 className="team-card-title">{title}</h3>
                        <p className="team-card-role">{role}</p>
                      </div>
                    </div>
                    <p className="team-card-desc">{desc}</p>
                  </article>
                );
              })}
            </div>
          </RevealItem>

          <RevealItem index={3}>
            <div className="team-values">
              <h2 className="team-section-title">{t('teamValuesTitle')}</h2>
              <ul className="team-values-list">
                {values.map((item) => {
                  const [title, desc] = item.split('|');
                  return (
                    <li className="team-value-item" key={title}>
                      <strong>{title}</strong>
                      <span>{desc}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </RevealItem>
        </div>
      </section>
    </PageReveal>
  );
}

export default Team;
