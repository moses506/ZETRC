import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import kundaLesson01 from '../assets/kunda_lesson-01.jpeg';
import kundaLesson02 from '../assets/kunda_lesson -02.jpeg';
import kundaLesson03 from '../assets/kunda_lesson-03.jpeg';
import { useLanguage } from '../i18n/LanguageContext';
import useWindowWidth from '../hooks/useWindowWidth';
import { pageRoot, pageStyles as S } from '../styles/landingStyles';

type HomeProps = {
  onJoinPilot: () => void;
  onRequestProposal: () => void;
};

const INTERVAL = 5500;

function Home({ onJoinPilot, onRequestProposal }: HomeProps) {
  const { t } = useLanguage();
  const width = useWindowWidth();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const slides = [
    {
      img: kundaLesson01,
      alt: 'ZETRC trainer leading a practical lesson session with farmers',
      objectPosition: 'center 42%',
      tag: t('hero1Tag'),
      headline: t('hero1Headline'),
      accent: t('hero1Accent'),
      sub: t('hero1Sub'),
    },
    {
      img: kundaLesson02,
      alt: 'Farmers participating in a ZETRC hands-on training session',
      objectPosition: 'center',
      tag: t('hero2Tag'),
      headline: t('hero2Headline'),
      accent: t('hero2Accent'),
      sub: t('hero2Sub'),
    },
    {
      img: kundaLesson03,
      alt: 'ZETRC lesson session with farmers learning in the field',
      objectPosition: 'center',
      tag: t('hero3Tag'),
      headline: t('hero3Headline'),
      accent: t('hero3Accent'),
      sub: t('hero3Sub'),
    },
  ];

  const isTablet = width <= 1024;
  const isMobile = width <= 640;

  const heroWrapStyle: CSSProperties = {
    ...S.heroWrap,
    height: isMobile ? 'auto' : S.heroWrap.height,
    minHeight: isMobile ? 620 : isTablet ? 600 : S.heroWrap.minHeight,
  };
  const slideContentStyle: CSSProperties = {
    ...S.slideContent,
    gridTemplateColumns: isTablet ? '1fr' : S.slideContent.gridTemplateColumns,
    alignItems: isTablet ? 'flex-end' : S.slideContent.alignItems,
    gap: isTablet ? '1.5rem' : S.slideContent.gap,
    padding: isMobile ? '0 1rem 5rem' : isTablet ? '0 2rem 4rem' : S.slideContent.padding,
  };
  const slideHeadlineStyle: CSSProperties = {
    ...S.slideHeadline,
    fontSize: isMobile ? 'clamp(2.1rem, 12vw, 3rem)' : S.slideHeadline.fontSize,
    maxWidth: isMobile ? '100%' : S.slideHeadline.maxWidth,
  };
  const slideSubStyle: CSSProperties = {
    ...S.slideSub,
    fontSize: isMobile ? '0.98rem' : S.slideSub.fontSize,
    maxWidth: isMobile ? '100%' : S.slideSub.maxWidth,
  };
  const slideBtnsStyle: CSSProperties = {
    ...S.slideBtns,
    flexDirection: isMobile ? 'column' : 'row',
  };
  const heroButtonStyle: CSSProperties = {
    width: isMobile ? '100%' : undefined,
  };
  const statsPanelStyle: CSSProperties = {
    ...S.statsPanel,
    display: isMobile ? 'none' : 'grid',
    gridTemplateColumns: isTablet ? 'repeat(3, minmax(0, 1fr))' : undefined,
    alignItems: isTablet ? 'stretch' : S.statsPanel.alignItems,
    width: isTablet ? '100%' : undefined,
    animation: 'slideFadeIn 0.9s ease forwards',
  };
  const statCardStyle: CSSProperties = {
    ...S.statCard,
    minWidth: isTablet ? 0 : S.statCard.minWidth,
    textAlign: isTablet ? 'left' : S.statCard.textAlign,
  };

  useEffect(() => {
    const el = document.createElement('style');
    el.innerHTML = `
      @keyframes pulse {
        0%,100%{opacity:1;transform:scale(1)}
        50%{opacity:.5;transform:scale(.8)}
      }
      @keyframes kenBurns {
        0%{transform:scale(1) translateX(0)}
        100%{transform:scale(1.07) translateX(-1%)}
      }
      @keyframes slideFadeIn {
        from{opacity:0;transform:translateY(22px)}
        to{opacity:1;transform:translateY(0)}
      }
    `;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { if (styleRef.current) document.head.removeChild(styleRef.current); };
  }, []);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next]);

  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    const tick = 60;
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (tick / INTERVAL) * 100, 100));
    }, tick);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [current]);

  return (
    <div style={{ ...pageRoot, minHeight: 'auto' }}>
      <section style={heroWrapStyle} id="home">
        <div style={{ ...S.progressBar, width: `${progress}%` }} />

        {slides.map((slide, i) => (
          <div
            key={i}
            style={{
              ...S.slide,
              opacity: i === current ? 1 : 0,
              zIndex: i === current ? 1 : 0,
              pointerEvents: i === current ? 'auto' : 'none',
            }}
          >
            <img
              src={slide.img}
              alt={slide.alt}
              style={{
                ...S.slideImg,
                objectPosition: slide.objectPosition,
                animation: i === current ? 'kenBurns 6s ease-out forwards' : 'none',
              }}
            />
            <div style={S.slideOverlay} />
          </div>
        ))}

        <div style={slideContentStyle} key={`content-${current}`}>
          <div style={{ animation: 'slideFadeIn 0.7s ease forwards' }}>
            <div style={S.slideTag}>
              <span style={S.slideTagDot} />
              {slides[current].tag}
            </div>
            <h1 style={slideHeadlineStyle}>
              {slides[current].headline}{' '}
              <em style={S.slideAccent}>{slides[current].accent}</em>
            </h1>
            <p style={slideSubStyle}>{slides[current].sub}</p>
            <div style={slideBtnsStyle}>
              <button type="button" style={{ ...S.btnWhite, ...heroButtonStyle }} onClick={onRequestProposal}>
                {t('requestProposalArrow')}
              </button>
              <button type="button" style={{ ...S.btnGhost, ...heroButtonStyle }} onClick={onJoinPilot}>
                {t('joinPilotTraining')}
              </button>
            </div>
          </div>

          <div style={statsPanelStyle}>
            {[
              { n: '200+', l: t('farmersTrained') },
              { n: '6', l: t('provincesReached') },
              { n: '3', l: t('partnerOrgs') },
            ].map((s) => (
              <div key={s.l} style={statCardStyle}>
                <div style={S.statCardNum}>{s.n}</div>
                <div style={S.statCardLabel}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={prev} style={{ ...S.arrow, left: isMobile ? 12 : 24, width: isMobile ? 42 : 48, height: isMobile ? 42 : 48 }} aria-label="Previous slide">
          ‹
        </button>
        <button type="button" onClick={next} style={{ ...S.arrow, right: isMobile ? 12 : 24, width: isMobile ? 42 : 48, height: isMobile ? 42 : 48 }} aria-label="Next slide">
          ›
        </button>

        <div style={S.dotsRow}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              style={i === current ? S.dotActive : S.dot}
              role="button"
              tabIndex={0}
              aria-label={`Go to slide ${i + 1}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goTo(i); }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
