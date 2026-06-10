// Add to your index.css or global stylesheet:
// @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import kundaLesson01 from "../assets/kunda_lesson-01.jpeg";
import kundaLesson02 from "../assets/kunda_lesson -02.jpeg";
import kundaLesson03 from "../assets/kunda_lesson-03.jpeg";
import { useLanguage } from "../i18n/LanguageContext";

type HomeProps = {
  onJoinPilot: () => void;
  onRequestProposal: () => void;
};

// ── SLIDES ──────────────────────────────────────────────────────────────────
// ── STYLES ──────────────────────────────────────────────────────────────────
const S: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#EFF8E4",
    color: "#032B14",
    minHeight: "100vh",
    overflowX: "hidden",
  },

  // NAV
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 200,
    background: "rgba(3,43,20,0.94)",
    backdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(30,125,69,0.14)",
    padding: "0 3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 68,
  },
  navLogo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#F5C542",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  navDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#F5C542",
    display: "inline-block",
    flexShrink: 0,
  },
  navLinks: { display: "flex", gap: "2rem", alignItems: "center" },
  navLink: { textDecoration: "none", fontSize: 14, fontWeight: 500, color: "#5A7A67" },
  navCta: {
    background: "#032B14",
    color: "#fff",
    border: "none",
    padding: "10px 22px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },

  // HERO SLIDER
  heroWrap: {
    position: "relative",
    width: "100%",
    height: "min(720px, 72vh)",
    minHeight: 560,
    overflow: "hidden",
    background: "#032B14",
  },
  slide: {
    position: "absolute",
    inset: 0,
    transition: "opacity 0.9s cubic-bezier(0.4,0,0.2,1)",
  },
  slideImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
  },
  slideOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(5,20,10,0.88) 0%, rgba(5,20,10,0.45) 50%, rgba(5,20,10,0.15) 100%)",
  },
  slideContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "0 6rem 4rem",
    zIndex: 10,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "flex-end",
    gap: "3rem",
  },
  slideTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "5px 14px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    marginBottom: 18,
    width: "fit-content",
  },
  slideTagDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#F5C542",
    display: "inline-block",
    animation: "pulse 2s infinite",
  },
  slideHeadline: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(2.8rem, 5vw, 3.7rem)",
    fontWeight: 900,
    lineHeight: 1.1,
    color: "#fff",
    marginBottom: "1.25rem",
    maxWidth: 680,
    textShadow: "0 2px 24px rgba(0,0,0,0.3)",
  },
  slideAccent: {
    color: "#F5C542",
    fontStyle: "italic",
  },
  slideSub: {
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.75,
    maxWidth: 560,
    fontWeight: 300,
    marginBottom: "1.8rem",
  },
  slideBtns: { display: "flex", gap: 12, flexWrap: "wrap" as const },
  btnWhite: {
    background: "#fff",
    color: "#032B14",
    border: "none",
    padding: "13px 28px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.01em",
  },
  btnGhost: {
    background: "transparent",
    color: "#fff",
    border: "2px solid rgba(255,255,255,0.5)",
    padding: "13px 28px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  statsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    alignItems: "flex-end",
  },
  statCard: {
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 16,
    padding: "14px 22px",
    textAlign: "right" as const,
    minWidth: 130,
  },
  statCardNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2rem",
    fontWeight: 900,
    color: "#F5C542",
    lineHeight: 1,
  },
  statCardLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: 500,
    marginTop: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "#fff",
    fontSize: 22,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    position: "absolute",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 20,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    height: 4,
    width: 14,
    borderRadius: 999,
    background: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    transition: "width 0.35s, background 0.35s",
  },
  dotActive: {
    height: 4,
    width: 28,
    borderRadius: 999,
    background: "#F5C542",
    cursor: "pointer",
    transition: "width 0.35s, background 0.35s",
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 3,
    background: "#F5C542",
    zIndex: 30,
    transition: "width 0.1s linear",
  },

  // SERVICES
  services: { padding: "6rem 5rem", background: "#EFF8E4" },
  servicesHeader: { textAlign: "center" as const, marginBottom: "3.5rem" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#06431F",
    textTransform: "uppercase" as const,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.4rem",
    fontWeight: 900,
    color: "#032B14",
    lineHeight: 1.2,
    marginBottom: "1rem",
  },
  servicesSubtitle: {
    color: "#5A7A67",
    maxWidth: 500,
    margin: "0 auto",
    fontWeight: 300,
    fontSize: "1.05rem",
  },
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 },
  cardLight: {
    background: "#fff",
    borderRadius: 20,
    padding: "2rem",
    border: "1px solid rgba(30,125,69,0.15)",
  },
  cardPale: {
    background: "#EAF7DE",
    borderRadius: 20,
    padding: "2rem",
    border: "1px solid #BFE8B4",
  },
  cardDark: {
    background: "#032B14",
    borderRadius: 20,
    padding: "2rem",
    border: "1px solid transparent",
  },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    marginBottom: "1.25rem",
  },
  iconGreenBg: { background: "#EAF7DE", border: "1px solid #BFE8B4" },
  iconGoldBg: { background: "#FDF5E0", border: "1px solid rgba(212,168,67,0.25)" },
  iconDarkBg: { background: "rgba(255,255,255,0.1)" },
  serviceTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: 10,
    color: "#032B14",
  },
  serviceTitleWhite: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: 10,
    color: "#fff",
  },
  serviceDesc: { fontSize: 14, lineHeight: 1.7, fontWeight: 300, color: "#5A7A67" },
  serviceDescMuted: { fontSize: 14, lineHeight: 1.7, fontWeight: 300, color: "rgba(255,255,255,0.65)" },
  serviceList: {
    listStyle: "none",
    padding: 0,
    margin: "14px 0 0",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  serviceListItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13.5,
    color: "#5A7A67",
    fontWeight: 400,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    color: "#06431F",
    flexShrink: 0,
  },
  academyPills: { display: "flex", flexWrap: "wrap" as const, gap: 6, margin: "14px 0 18px" },
  pillPurple: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "#FFF3C4",
    color: "#6B4A00",
    border: "1px solid #F0C84A",
  },
  academyLink: { fontSize: 14, fontWeight: 600, color: "#06431F", textDecoration: "none" },
  cardBtnGreen: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    background: "#032B14",
    color: "#fff",
    marginTop: "1.5rem",
  },
  cardBtnPale: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    background: "#BFE8B4",
    color: "#032B14",
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  // WHY STRIP
  whyStrip: { background: "#032B14", padding: "5rem" },
  whyInner: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "5rem", alignItems: "center" },
  whySectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#BFE8B4",
    textTransform: "uppercase" as const,
    marginBottom: 10,
  },
  whySectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.2rem",
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
  },
  whyDesc: { color: "rgba(255,255,255,0.6)", marginTop: 16, fontWeight: 300, fontSize: "1rem", lineHeight: 1.75 },
  whyItems: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  whyItem: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: "1.5rem",
  },
  whyItemIcon: { fontSize: 24, marginBottom: 12 },
  whyItemTitle: { fontWeight: 600, color: "#fff", fontSize: 15, marginBottom: 6 },
  whyItemDesc: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontWeight: 300 },

  // CONTACT
  contact: { padding: "6rem 5rem", background: "#EAF7DE", borderTop: "1px solid #BFE8B4" },
  contactInner: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "flex-start" },
  contactDesc: { color: "#5A7A67", lineHeight: 1.8, fontWeight: 300, marginBottom: "2rem" },
  contactLinks: { display: "flex", flexDirection: "column" as const, gap: 14, marginBottom: "2rem" },
  contactLinkRow: { display: "flex", alignItems: "center", gap: 14 },
  contactLinkIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    background: "#fff",
    border: "1px solid #BFE8B4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    flexShrink: 0,
  },
  linkLabel: { fontSize: 11, fontWeight: 700, color: "#8FAD9A", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  linkValue: { fontSize: 14, fontWeight: 600, color: "#032B14" },
  formCard: {
    background: "#fff",
    borderRadius: 24,
    border: "1px solid rgba(30,125,69,0.15)",
    padding: "2.25rem",
    boxShadow: "0 4px 32px rgba(30,125,69,0.07)",
  },
  formTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#032B14",
    marginBottom: "1.5rem",
  },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  input: {
    padding: "12px 15px",
    borderRadius: 12,
    border: "1.5px solid #E2E8F0",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#032B14",
    background: "#F8FAFB",
    outline: "none",
    width: "100%",
  },
  textarea: {
    padding: "12px 15px",
    borderRadius: 12,
    border: "1.5px solid #E2E8F0",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#032B14",
    background: "#F8FAFB",
    outline: "none",
    resize: "vertical" as const,
    width: "100%",
  },
  submitBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    background: "#032B14",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    marginTop: 4,
    letterSpacing: "0.02em",
  },
  btnPrimary: {
    background: "#032B14",
    color: "#fff",
    border: "none",
    padding: "14px 30px",
    borderRadius: 999,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.01em",
  },

  // FOOTER
  footer: {
    background: "#032B14",
    padding: "2.5rem 5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  footerLogo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.3rem",
    fontWeight: 900,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  footerText: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 300 },
  footerTagline: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
};

// ── COMPONENT ────────────────────────────────────────────────────────────────
const INTERVAL = 5500;

function Home({ onJoinPilot, onRequestProposal }: HomeProps) {
  const { t, tList } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const slides = [
    {
      img: kundaLesson01,
      alt: "ZETRC trainer leading a practical lesson session with farmers",
      objectPosition: "center 42%",
      tag: t("hero1Tag"),
      headline: t("hero1Headline"),
      accent: t("hero1Accent"),
      sub: t("hero1Sub"),
    },
    {
      img: kundaLesson02,
      alt: "Farmers participating in a ZETRC hands-on training session",
      objectPosition: "center",
      tag: t("hero2Tag"),
      headline: t("hero2Headline"),
      accent: t("hero2Accent"),
      sub: t("hero2Sub"),
    },
    {
      img: kundaLesson03,
      alt: "ZETRC lesson session with farmers learning in the field",
      objectPosition: "center",
      tag: t("hero3Tag"),
      headline: t("hero3Headline"),
      accent: t("hero3Accent"),
      sub: t("hero3Sub"),
    },
  ];

  useEffect(() => {
    const el = document.createElement("style");
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
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
    setProgress(0);
  }, []);

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
    <div style={S.root}>

      

      {/* ── HERO SLIDER ── */}
      <section style={S.heroWrap} id="home">

        {/* Green progress bar at top */}
        <div style={{ ...S.progressBar, width: `${progress}%` }} />

        {/* All slides stacked, only active is visible */}
        {slides.map((slide, i) => (
          <div
            key={i}
            style={{
              ...S.slide,
              opacity: i === current ? 1 : 0,
              zIndex: i === current ? 1 : 0,
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            <img
              src={slide.img}
              alt={slide.alt}
              style={{
                ...S.slideImg,
                objectPosition: slide.objectPosition,
                animation: i === current ? "kenBurns 6s ease-out forwards" : "none",
              }}
            />
            <div style={S.slideOverlay} />
          </div>
        ))}

        {/* Slide text content — re-mounts on current change to retrigger animation */}
        <div style={S.slideContent} key={`content-${current}`}>
          {/* Left: headline + buttons */}
          <div style={{ animation: "slideFadeIn 0.7s ease forwards" }}>
            <div style={S.slideTag}>
              <span style={S.slideTagDot} />
              {slides[current].tag}
            </div>
            <h1 style={S.slideHeadline}>
              {slides[current].headline}{" "}
              <em style={S.slideAccent}>{slides[current].accent}</em>
            </h1>
            <p style={S.slideSub}>{slides[current].sub}</p>
            <div style={S.slideBtns}>
              <button style={S.btnWhite} onClick={onRequestProposal}>
                {t("requestProposalArrow")}
              </button>
              <button style={S.btnGhost} onClick={onJoinPilot}>
                {t("joinPilotTraining")}
              </button>
            </div>
          </div>

          {/* Right: frosted glass stat cards */}
          <div style={{ ...S.statsPanel, animation: "slideFadeIn 0.9s ease forwards" }}>
            {[
              { n: "200+", l: t("farmersTrained") },
              { n: "6", l: t("provincesReached") },
              { n: "3", l: t("partnerOrgs") },
            ].map((s) => (
              <div key={s.l} style={S.statCard}>
                <div style={S.statCardNum}>{s.n}</div>
                <div style={S.statCardLabel}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button onClick={prev} style={{ ...S.arrow, left: 24 }} aria-label="Previous slide">
          ‹
        </button>
        <button onClick={next} style={{ ...S.arrow, right: 24 }} aria-label="Next slide">
          ›
        </button>

        {/* Dot indicators */}
        <div style={S.dotsRow}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              style={i === current ? S.dotActive : S.dot}
            />
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={S.services} id="services">
        <div style={S.servicesHeader}>
          <div style={S.sectionLabel}>{t("whatWeOffer")}</div>
          <div style={S.sectionTitle}>
            {t("servicesTitle")}
          </div>
          <p style={S.servicesSubtitle}>
            {t("servicesSubtitle")}
          </p>
        </div>

        <div style={S.servicesGrid}>
          <div style={S.cardLight}>
            <div style={{ ...S.serviceIcon, ...S.iconGreenBg }}>👥</div>
            <div style={S.serviceTitle}>{t("whoThisIsFor")}</div>
            <ul style={S.serviceList}>
              {tList("audienceList").map((item) => (
                <li key={item} style={S.serviceListItem}>
                  <span style={S.checkBadge}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={S.cardPale} id="academy">
            <div style={{ ...S.serviceIcon, ...S.iconGoldBg }}>🎓</div>
            <div style={S.serviceTitle}>ZETRC Academy</div>
            <div style={S.serviceDesc}>
              {t("academyDesc")}
            </div>
            <div style={S.academyPills}>
              {tList("academyPills").map((pill) => (
                <span key={pill} style={S.pillPurple}>{pill}</span>
              ))}
            </div>
            <a href="#academy" style={S.academyLink}>{t("getEarlyAccess")}</a>
          </div>

          <div style={S.cardDark}>
            <div style={{ ...S.serviceIcon, ...S.iconDarkBg }}>🤝</div>
            <div style={S.serviceTitleWhite}>{t("workWithUs")}</div>
            <div style={S.serviceDescMuted}>
              {t("workWithUsDesc")}
            </div>
            <button style={S.cardBtnGreen} onClick={onRequestProposal}>
              {t("requestProposal")}
            </button>
            <button style={S.cardBtnPale}>
              <span>💬</span> {t("whatsappUs")}
            </button>
          </div>
        </div>
      </section>

      {/* ── WHY ZETRC ── */}
      <section style={S.whyStrip}>
        <div style={S.whyInner}>
          <div>
            <div style={S.whySectionLabel}>{t("whyZetrc")}</div>
            <div style={S.whySectionTitle}>
              {t("localContext")}
            </div>
            <p style={S.whyDesc}>
              {t("whyDesc")}
            </p>
          </div>
          <div style={S.whyItems}>
            {tList("whyItems").map((entry, index) => {
              const [title, desc] = entry.split("|");
              const icons = ["📍", "📊", "🌿", "🤝"];

              return (
              <div key={title} style={S.whyItem}>
                <div style={S.whyItemIcon}>{icons[index]}</div>
                <div style={S.whyItemTitle}>{title}</div>
                <div style={S.whyItemDesc}>{desc}</div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={S.contact} id="contact">
        <div style={S.contactInner}>
          <div>
            <div style={S.sectionLabel}>{t("getInTouch")}</div>
            <div style={{ ...S.sectionTitle, fontSize: "2.4rem", marginBottom: "1rem" }}>
              {t("workWithZetrc")}
            </div>
            <p style={S.contactDesc}>
              {t("contactDesc")}
            </p>
            <div style={S.contactLinks}>
              {[
                { icon: "✉️", label: t("email"), value: "info@zetrc.org" },
                { icon: "📞", label: t("phone"), value: "+260 97 9885086" },
                { icon: "💬", label: "WhatsApp", value: t("messageUs") },
              ].map((c) => (
                <div key={c.label} style={S.contactLinkRow}>
                  <div style={S.contactLinkIcon}>{c.icon}</div>
                  <div>
                    <div style={S.linkLabel}>{c.label}</div>
                    <div style={S.linkValue}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <button style={S.btnPrimary}>{t("contactWhatsapp")}</button>
          </div>

          <div style={S.formCard}>
            <div style={S.formTitle}>{t("requestProposal")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder={t("orgFullName")} style={S.input} />
              <div style={S.formRow}>
                <input type="email" placeholder={t("emailAddress")} style={S.input} />
                <input type="tel" placeholder={t("phoneNumber")} style={S.input} />
              </div>
              <textarea
                placeholder={t("projectNeeds")}
                rows={5}
                style={S.textarea}
              />
              <button style={S.submitBtn}>{t("sendInquiry")}</button>
            </div>
          </div>
        </div>
      </section>

     
    </div>
  );
}

export default Home;
