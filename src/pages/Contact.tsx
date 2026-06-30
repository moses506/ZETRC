import type { CSSProperties } from 'react';
import { PageReveal, RevealItem } from '../components/PageReveal';
import { useLanguage } from '../i18n/LanguageContext';
import { ZAMBIA_PHONE_PREFIX } from '../utils/phone';
import { ZETRC_WHATSAPP_DISPLAY, openWhatsApp } from '../utils/whatsapp';
import useWindowWidth from '../hooks/useWindowWidth';
import { pageRoot, pageStyles as S } from '../styles/landingStyles';

function Contact() {
  const { t } = useLanguage();
  const width = useWindowWidth();
  const isTablet = width <= 1024;
  const isMobile = width <= 640;
  const sectionPadding = isMobile ? '3rem 1rem' : isTablet ? '4rem 1.5rem' : undefined;

  const contactStyle: CSSProperties = {
    ...S.contact,
    padding: sectionPadding ?? S.contact.padding,
  };
  const contactInnerStyle: CSSProperties = {
    ...S.contactInner,
    gridTemplateColumns: isTablet ? '1fr' : S.contactInner.gridTemplateColumns,
    gap: isMobile ? '2rem' : isTablet ? '3rem' : S.contactInner.gap,
  };
  const sectionTitleStyle: CSSProperties = {
    ...S.sectionTitle,
    fontSize: isMobile ? '2rem' : S.sectionTitle.fontSize,
  };
  const formRowStyle: CSSProperties = {
    ...S.formRow,
    gridTemplateColumns: isMobile ? '1fr' : S.formRow.gridTemplateColumns,
  };
  const formCardStyle: CSSProperties = {
    ...S.formCard,
    padding: isMobile ? '1.25rem' : S.formCard.padding,
    borderRadius: isMobile ? 18 : S.formCard.borderRadius,
  };

  const contactItems = [
    { icon: '✉️', label: t('email'), value: 'info@zetrc.org' },
    { icon: '📞', label: t('phone'), value: ZETRC_WHATSAPP_DISPLAY },
    {
      icon: '💬',
      label: t('footerWhatsApp'),
      value: t('messageUs'),
      onClick: () => openWhatsApp(t('whatsappMsgGeneral')),
    },
  ];

  return (
    <PageReveal style={pageRoot}>
      <section style={contactStyle}>
        <div style={contactInnerStyle}>
          <RevealItem index={0}>
            <div>
              <div style={S.sectionLabel}>{t('getInTouch')}</div>
              <div style={{ ...sectionTitleStyle, marginBottom: '1rem' }}>
                {t('workWithZetrc')}
              </div>
              <p style={S.contactDesc}>{t('contactDesc')}</p>
              <div style={S.contactLinks}>
                {contactItems.map((c, index) => (
                  <RevealItem key={c.label} index={index + 1}>
                    <div
                      style={{
                        ...S.contactLinkRow,
                        ...(c.onClick ? { cursor: 'pointer' } : {}),
                      }}
                      {...(c.onClick
                        ? {
                            role: 'button',
                            tabIndex: 0,
                            onClick: c.onClick,
                            onKeyDown: (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                c.onClick?.();
                              }
                            },
                          }
                        : {})}
                    >
                      <div style={S.contactLinkIcon}>{c.icon}</div>
                      <div>
                        <div style={S.linkLabel}>{c.label}</div>
                        <div style={S.linkValue}>{c.value}</div>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </div>
              <RevealItem index={4}>
                <button
                  type="button"
                  style={S.btnPrimary}
                  onClick={() => openWhatsApp(t('whatsappMsgGeneral'))}
                >
                  {t('contactWhatsapp')}
                </button>
              </RevealItem>
            </div>
          </RevealItem>

          <RevealItem index={1} variant="scale">
            <div style={formCardStyle}>
              <div style={S.formTitle}>{t('requestProposal')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" placeholder={t('orgFullName')} style={S.input} />
                <div style={formRowStyle}>
                  <input type="email" placeholder={t('emailAddress')} style={S.input} />
                  <div className="phone-input-group phone-input-group--light">
                    <span className="phone-input-prefix">{ZAMBIA_PHONE_PREFIX}</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder={t('phoneLocalPlaceholder')}
                      style={{ ...S.input, border: 'none', borderRadius: 0, padding: '0.95rem 1rem' }}
                    />
                  </div>
                </div>
                <textarea placeholder={t('projectNeeds')} rows={5} style={S.textarea} />
                <button type="button" style={S.submitBtn}>{t('sendInquiry')}</button>
              </div>
            </div>
          </RevealItem>
        </div>
      </section>
    </PageReveal>
  );
}

export default Contact;
