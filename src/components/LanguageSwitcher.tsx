import { languages, useLanguage, type LanguageCode } from '../i18n/LanguageContext';

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M2.5 8h11M8 2.5c1.8 1.6 2.75 3.85 2.75 5.5S9.8 11.9 8 13.5M8 2.5C6.2 4.1 5.25 6.35 5.25 8S6.2 11.9 8 13.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-switcher" aria-label={t('language')}>
      <div className="language-switcher-icon" aria-hidden="true">
        <GlobeIcon />
      </div>

      <div className="language-switcher-track" role="group" aria-label={t('language')}>
        {languages.map((item) => {
          const isActive = language === item.code;

          return (
            <button
              key={item.code}
              type="button"
              className={`language-segment${isActive ? ' language-segment--active' : ''}`}
              onClick={() => setLanguage(item.code as LanguageCode)}
              aria-pressed={isActive}
              aria-label={item.label}
              title={item.label}
            >
              <span className="language-segment-code">{item.shortLabel}</span>
              <span className="language-segment-name">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
