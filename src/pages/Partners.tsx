import partnerGcaig from '../assets/partner_gcaig.jpeg';
import partnerAycca from '../assets/partner_aycca.jpeg';
import partnerWff from '../assets/partner_wff.jpeg';
import partnerMastercard from '../assets/partner_mastercard.png';
import partnerAgreenect from '../assets/partner_agreenect.jpeg';
import { PageReveal, RevealItem } from '../components/PageReveal';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/partners.css';

type PartnerItem = {
  logo: string;
  nameKey: string;
  descKey: string;
};

const spotlightPartners: { sectionKey: string; item: PartnerItem }[] = [
  {
    sectionKey: 'partnersSectionPartners',
    item: {
      logo: partnerAgreenect,
      nameKey: 'partnerAgreetech',
      descKey: 'partnerAgreetechDesc',
    },
  },
  {
    sectionKey: 'partnersSectionFunding',
    item: {
      logo: partnerMastercard,
      nameKey: 'partnerMastercardAnzisha',
      descKey: 'partnerMastercardAnzishaDesc',
    },
  },
];

const pastPartners: PartnerItem[] = [
  {
    logo: partnerWff,
    nameKey: 'partnerWorldFoodForum',
    descKey: 'partnerWorldFoodForumDesc',
  },
  {
    logo: partnerGcaig,
    nameKey: 'partnerGlobalCentreAiGovernance',
    descKey: 'partnerGlobalCentreAiGovernanceDesc',
  },
];

const currentPartner: PartnerItem = {
  logo: partnerAycca,
  nameKey: 'partnerAyccaGhana',
  descKey: 'partnerAyccaGhanaDesc',
};

function Partners() {
  const { t } = useLanguage();

  return (
    <PageReveal className="partners-page">
      <section className="partners-hero">
        <div className="partners-hero-inner">
          <RevealItem index={0}>
            <h1 className="partners-hero-title">{t('navPartners')}</h1>
            <p className="partners-hero-subtitle">{t('partnersHeroSubtitle')}</p>
          </RevealItem>
        </div>
      </section>

      <section className="partners-body">
        <div className="partners-body-inner">
          <RevealItem index={1} variant="scale">
            <div className="partners-spotlight-grid">
              {spotlightPartners.map(({ sectionKey, item }, index) => (
                <article className="partners-spotlight-card" key={item.nameKey}>
                  <div className="partners-spotlight-top">
                    <span className="partners-spotlight-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="partners-spotlight-tag">{t(sectionKey)}</span>
                  </div>
                  <div className="partners-spotlight-logo">
                    <img src={item.logo} alt={t(item.nameKey)} />
                  </div>
                  <h2 className="partners-spotlight-name">{t(item.nameKey)}</h2>
                  <p className="partners-spotlight-desc">{t(item.descKey)}</p>
                </article>
              ))}
            </div>
          </RevealItem>

          <RevealItem index={2}>
            <div className="partners-panel">
              <div className="partners-panel-head">
                <span className="partners-panel-number">03</span>
                <div>
                  <h2 className="partners-panel-title">{t('partnersSectionWorkedWith')}</h2>
                </div>
              </div>
              <div className="partners-past-grid">
                {pastPartners.map((item) => (
                  <article className="partners-past-card" key={item.nameKey}>
                    <div className="partners-past-logo">
                      <img src={item.logo} alt={t(item.nameKey)} />
                    </div>
                    <h3 className="partners-past-name">{t(item.nameKey)}</h3>
                    <p className="partners-past-desc">{t(item.descKey)}</p>
                  </article>
                ))}
              </div>
            </div>
          </RevealItem>

          <RevealItem index={3} variant="scale">
            <div className="partners-current">
              <div className="partners-current-copy">
                <span className="partners-panel-number partners-panel-number--light">04</span>
                <span className="partners-current-badge">{t('partnersCurrentBadge')}</span>
                <h2 className="partners-current-title">{t('partnersSectionWorkingWith')}</h2>
                <h3 className="partners-current-name">{t(currentPartner.nameKey)}</h3>
                <p className="partners-current-desc">{t(currentPartner.descKey)}</p>
              </div>
              <div className="partners-current-visual">
                <div className="partners-current-logo-ring">
                  <img src={currentPartner.logo} alt={t(currentPartner.nameKey)} />
                </div>
              </div>
            </div>
          </RevealItem>
        </div>
      </section>
    </PageReveal>
  );
}

export default Partners;
