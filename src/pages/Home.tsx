// Add to your index.css or global stylesheet:
// @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import kundaLesson01 from "../assets/kunda_lesson-01.jpeg";
import kundaLesson02 from "../assets/kunda_lesson -02.jpeg";
import kundaLesson03 from "../assets/kunda_lesson-03.jpeg";
import partnerGcaig from "../assets/partner_gcaig.jpeg";
import partnerAycca from "../assets/partner_aycca.jpeg";
import partnerWff from "../assets/partner_wff.jpeg";
import partnerMastercard from "../assets/partner_mastercard.png";
import partnerAgreenect from "../assets/partner_agreenect.jpeg";
import { useLanguage } from "../i18n/LanguageContext";
import useWindowWidth from "../hooks/useWindowWidth";

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

  // ABOUT
  about: { padding: "6rem 5rem", background: "#fff" },
  aboutInner: { display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "4rem", alignItems: "start" },
  aboutEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
    padding: "6px 16px 6px 10px",
    borderRadius: 999,
    marginBottom: 18,
  },
  aboutEyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#06431F",
    display: "inline-block",
    flexShrink: 0,
  },
  aboutEyebrowText: {
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#06431F",
    textTransform: "uppercase" as const,
  },
  aboutTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.5rem",
    fontWeight: 900,
    color: "#032B14",
    lineHeight: 1.18,
  },
  aboutTitleAccent: { color: "#06431F", fontStyle: "italic" },
  aboutAcronym: {
    marginTop: "1.5rem",
    fontSize: 13,
    fontWeight: 600,
    color: "#5A7A67",
    letterSpacing: "0.02em",
  },
  aboutBody: { display: "flex", flexDirection: "column" as const, gap: "1.4rem" },
  aboutP: {
    fontSize: 15,
    lineHeight: 1.85,
    color: "#5A7A67",
    fontWeight: 300,
  },
  aboutCallout: {
    background: "#032B14",
    borderRadius: 20,
    padding: "1.75rem 2rem",
    marginTop: "0.25rem",
  },
  aboutCalloutText: {
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: "1.15rem",
    lineHeight: 1.6,
    color: "#fff",
  },
  aboutCalloutAccent: { color: "#F5C542" },

  audience: { padding: "6rem 5rem", background: "#EFF8E4" },
  audienceHeader: { textAlign: "left" as const, marginBottom: "3.5rem", maxWidth: 520 },
  audienceLabelRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    background: "#FFF3C4",
    border: "1px solid #F0C84A",
    padding: "6px 16px 6px 10px",
    borderRadius: 999,
  },
  audienceLabelDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#06431F",
    display: "inline-block",
    flexShrink: 0,
  },
  audienceLabel: {
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#6B4A00",
    textTransform: "uppercase" as const,
  },
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
  audienceTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.75rem",
    fontWeight: 900,
    color: "#032B14",
    lineHeight: 1.12,
    marginBottom: "1.25rem",
  },
  audienceTitleAccent: {
    color: "#06431F",
    fontStyle: "italic",
  },
  audienceSubtitleRow: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  audienceSubtitleIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    flexShrink: 0,
    marginTop: 2,
  },
  audienceSubtitle: {
    color: "#5A7A67",
    maxWidth: 400,
    fontWeight: 300,
    fontSize: "1.08rem",
    lineHeight: 1.75,
  },
  audienceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 20,
    maxWidth: 1100,
    margin: "0 auto",
  },
  audienceCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "2rem 1.5rem",
    border: "1px solid rgba(30,125,69,0.15)",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 14,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  audienceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
  },
  audienceCheck: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#06431F",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  audienceCardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#032B14",
  },

  // ZETRC ACADEMY / SERVICES
  academySection: { padding: "6rem 5rem", background: "#fff" },
  academyHeader: { textAlign: "left" as const, marginTop: "4rem", marginBottom: "3rem", maxWidth: 560 },
  academyEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
    padding: "6px 16px 6px 10px",
    borderRadius: 999,
    marginBottom: 18,
  },
  academyEyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#06431F",
    display: "inline-block",
    flexShrink: 0,
  },
  academyEyebrowText: {
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#06431F",
    textTransform: "uppercase" as const,
  },
  academySectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.6rem",
    fontWeight: 900,
    color: "#032B14",
    lineHeight: 1.15,
    marginBottom: "0.5rem",
  },
  academyNumberBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "#032B14",
    color: "#F5C542",
    fontFamily: "'Playfair Display', serif",
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
  },
  academyCard: {
    background: "#EFF8E4",
    border: "1px solid #BFE8B4",
    borderRadius: 28,
    padding: "3rem",
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "3rem",
    alignItems: "start",
  },
  academyCardTitleRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 14 },
  academyCardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "#032B14",
  },
  academyCardTagline: {
    fontSize: 14.5,
    fontWeight: 600,
    color: "#06431F",
    marginBottom: 14,
  },
  academyCardDesc: {
    fontSize: 14.5,
    lineHeight: 1.8,
    color: "#5A7A67",
    fontWeight: 300,
    marginBottom: 14,
  },
  academyCardIntro: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "#032B14",
    marginBottom: 14,
  },
  academyList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 16px",
  },
  academyListItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13.5,
    color: "#032B14",
    fontWeight: 500,
    lineHeight: 1.5,
  },
  academyOutro: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#5A7A67",
    fontWeight: 300,
    background: "#fff",
    border: "1px solid rgba(30,125,69,0.15)",
    borderRadius: 18,
    padding: "1.5rem",
  },
  academyOutroLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#06431F",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },

  // ARTICLES
  articlesSection: { padding: "6rem 5rem", background: "#032B14" },
  articlesHeader: { textAlign: "left" as const, marginBottom: "2.5rem", maxWidth: 620 },
  articlesEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
    padding: "6px 16px 6px 10px",
    borderRadius: 999,
    marginBottom: 16,
  },
  articlesEyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#06431F",
    display: "inline-block",
    flexShrink: 0,
  },
  articlesEyebrowText: {
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#06431F",
    textTransform: "uppercase" as const,
  },
  articlesSectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.5rem",
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.15,
    marginBottom: "0.6rem",
  },
  articlesSubtitle: {
    color: "#5A7A67",
    fontWeight: 300,
    fontSize: "1.02rem",
    lineHeight: 1.7,
  },
  articlesWriteCard: {
    background: "#fff",
    border: "1px solid rgba(30,125,69,0.15)",
    borderRadius: 22,
    padding: "2rem",
    boxShadow: "0 4px 28px rgba(30,125,69,0.06)",
    marginBottom: "2.5rem",
  },
  articlesWriteTitle: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 800,
    fontSize: "1.2rem",
    color: "#032B14",
    marginBottom: 16,
  },
  articlesFormRow: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 },
  articlesUploadRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
    marginBottom: 18,
  },
  articlesUploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13.5,
    fontWeight: 600,
    color: "#06431F",
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
    padding: "10px 16px",
    borderRadius: 999,
    cursor: "pointer",
  },
  articlesUploadPreview: {
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: "cover" as const,
    border: "1px solid #BFE8B4",
  },
  articlesList: { display: "flex", flexDirection: "column" as const, gap: 24 },
  articleCard: {
    background: "#fff",
    border: "1px solid rgba(30,125,69,0.15)",
    borderRadius: 22,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    maxHeight: 320,
    objectFit: "cover" as const,
    display: "block",
  },
  articleBody: { padding: "1.75rem 2rem 2rem" },
  articleMeta: {
    fontSize: 12,
    fontWeight: 600,
    color: "#8FAD9A",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 8,
  },
  articleTitle: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 800,
    fontSize: "1.4rem",
    color: "#032B14",
    marginBottom: 10,
    lineHeight: 1.3,
  },
  articleContent: {
    fontSize: 14.5,
    lineHeight: 1.8,
    color: "#5A7A67",
    fontWeight: 300,
    marginBottom: "1.5rem",
  },
  reactionsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    marginBottom: "1.5rem",
  },
  reactionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#F5F9F1",
    border: "1px solid #E2EFD9",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13.5,
    fontWeight: 600,
    color: "#5A7A67",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "transform 0.15s ease, background 0.15s ease",
  },
  reactionBtnActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#EAF7DE",
    border: "1px solid #06431F",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13.5,
    fontWeight: 700,
    color: "#06431F",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transform: "scale(1.05)",
  },
  commentsBlock: {
    borderTop: "1px solid #EAF7DE",
    paddingTop: "1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
  },
  commentsLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#032B14",
  },
  commentItem: { display: "flex", gap: 12, alignItems: "flex-start" },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#EAF7DE",
    border: "1px solid #BFE8B4",
    color: "#06431F",
    fontWeight: 700,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  commentName: { fontSize: 13.5, fontWeight: 700, color: "#032B14" },
  commentDate: { fontWeight: 400, color: "#8FAD9A", fontSize: 12 },
  commentText: { fontSize: 13.5, color: "#5A7A67", fontWeight: 400, marginTop: 2, lineHeight: 1.55 },
  commentForm: { display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 4 },
  commentSubmitBtn: {
    background: "#032B14",
    color: "#fff",
    border: "none",
    padding: "0 20px",
    borderRadius: 12,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },

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

  // OUR PARTNERS
  partnersStrip: { background: "#032B14", padding: "5rem" },
  partnersHeader: { textAlign: "center" as const, marginBottom: "3rem" },
  partnersLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#BFE8B4",
    textTransform: "uppercase" as const,
    marginBottom: 10,
  },
  partnersTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.2rem",
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
  },
  partnersDesc: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 16,
    fontWeight: 300,
    fontSize: "1rem",
    lineHeight: 1.75,
    maxWidth: 560,
    margin: "16px auto 0",
  },
  partnersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 20,
    maxWidth: 1200,
    margin: "0 auto",
  },
  partnerCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: "2rem 1.5rem",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 14,
  },
  partnerLogoCircle: {
    width: 84,
    height: 84,
    borderRadius: "50%",
    background: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 6,
  },
  partnerLogoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "50%",
  },
  partnerName: { fontWeight: 600, color: "#fff", fontSize: 15.5 },
  partnerDesc: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontWeight: 300 },

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

const audienceList = [
  { icon: "🌾", title: "Small-scale farmers" },
  { icon: "🌱", title: "Youth in agriculture" },
  { icon: "🤝", title: "Cooperatives & farmer groups" },
  { icon: "🏢", title: "NGOs & development organizations" },
];

type ArticleComment = {
  id: string;
  name: string;
  text: string;
  date: string;
};

type Article = {
  id: string;
  title: string;
  author: string;
  date: string;
  content: string;
  image?: string;
  comments: ArticleComment[];
  reactions: Record<string, number>;
};

const REACTION_TYPES: { emoji: string; label: string }[] = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "💡", label: "Insightful" },
  { emoji: "👏", label: "Clap" },
];

const seedArticles: Article[] = [
  {
    id: "seed-1",
    title: "Why Post-Harvest Loss Is Costing Zambian Farmers More Than They Think",
    author: "ZETRC Team",
    date: "Jun 12, 2026",
    content:
      "Across our pilot districts, we've seen firsthand how much value is lost between harvest and market. In this piece, we break down the most common causes of post-harvest loss and the simple, low-cost practices that are helping farmers in our training program cut waste and increase income.",
    comments: [
      { id: "c1", name: "Mwansa B.", text: "This matches exactly what we're seeing in Mkushi. Would love a follow-up on storage solutions.", date: "Jun 13, 2026" },
    ],
    reactions: { "👍": 18, "❤️": 7, "💡": 9, "👏": 4 },
  },
  {
    id: "seed-2",
    title: "Inside Our First Climate-Smart Agriculture Cohort",
    author: "ZETRC Team",
    date: "May 28, 2026",
    content:
      "Forty participants, six provinces, one shared goal — building resilience into how Zambia farms. We sat down with three graduates of our first climate-smart agriculture cohort to hear how the training is already changing the way they plan their seasons.",
    comments: [
      { id: "c2", name: "Chanda M.", text: "Proud to have been part of this cohort. Already applying the soil moisture techniques on my plot.", date: "May 29, 2026" },
      { id: "c3", name: "Bwalya K.", text: "Is there a waitlist for the next intake?", date: "May 30, 2026" },
    ],
    reactions: { "👍": 24, "❤️": 12, "💡": 6, "👏": 11 },
  },
  {
    id: "seed-3",
    title: "Youth, Agribusiness, and the Case for Starting Small",
    author: "ZETRC Team",
    date: "May 14, 2026",
    content:
      "Not every agribusiness needs to start big. In this article, we look at how some of our youngest trainees turned small demonstration plots into viable side incomes — and what that means for youth employment across rural Zambia.",
    comments: [],
    reactions: { "👍": 9, "❤️": 3, "💡": 5, "👏": 2 },
  },
];


const partnersList = [
  { logo: partnerGcaig, name: "Global Center on AI Governance", desc: "Exploring how responsible AI and data practices can support smarter agriculture." },
  { logo: partnerAycca, name: "Alliance for Youth in Climate Change Action (AYCCA)", desc: "Mobilizing young people across Zambia to lead on climate-smart agriculture." },
  { logo: partnerWff, name: "World Food Forum — Powered by Global Youth", desc: "Connecting ZETRC's work to a global youth movement for healthy diets and a healthy planet." },
  { logo: partnerMastercard, name: "Mastercard Foundation", desc: "Supporting economic opportunity for young people through skills and enterprise development." },
  { logo: partnerAgreenect, name: "AgreeNect", desc: "Connecting farmers and agribusinesses through digital tools and shared agricultural knowledge." },
];

function Home({ onJoinPilot, onRequestProposal }: HomeProps) {
  const { t } = useLanguage();
  const width = useWindowWidth();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [articles, setArticles] = useState<Article[]>(seedArticles);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, { name: string; text: string }>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});

  const handleToggleReaction = (articleId: string, emoji: string) => {
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id !== articleId) return a;
        const current = myReactions[articleId];
        const reactions = { ...a.reactions };
        if (current === emoji) {
          reactions[emoji] = Math.max(0, (reactions[emoji] || 0) - 1);
        } else {
          if (current) reactions[current] = Math.max(0, (reactions[current] || 0) - 1);
          reactions[emoji] = (reactions[emoji] || 0) + 1;
        }
        return { ...a, reactions };
      })
    );
    setMyReactions((prev) => ({
      ...prev,
      [articleId]: prev[articleId] === emoji ? null : emoji,
    }));
  };

  const updateCommentDraft = (articleId: string, field: "name" | "text", value: string) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [articleId]: { name: prev[articleId]?.name || "", text: prev[articleId]?.text || "", [field]: value },
    }));
  };

  const handleAddComment = (articleId: string) => {
    const draft = commentDrafts[articleId];
    if (!draft?.text?.trim()) return;
    const newComment: ArticleComment = {
      id: `c-${Date.now()}`,
      name: draft.name.trim() || "Anonymous",
      text: draft.text.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, comments: [...a.comments, newComment] } : a))
    );
    setCommentDrafts((prev) => ({ ...prev, [articleId]: { name: draft.name, text: "" } }));
  };

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
  const isTablet = width <= 1024;
  const isMobile = width <= 640;
  const heroWrapStyle: CSSProperties = {
    ...S.heroWrap,
    height: isMobile ? "auto" : S.heroWrap.height,
    minHeight: isMobile ? 620 : isTablet ? 600 : S.heroWrap.minHeight,
  };
  const slideContentStyle: CSSProperties = {
    ...S.slideContent,
    gridTemplateColumns: isTablet ? "1fr" : S.slideContent.gridTemplateColumns,
    alignItems: isTablet ? "flex-end" : S.slideContent.alignItems,
    gap: isTablet ? "1.5rem" : S.slideContent.gap,
    padding: isMobile ? "0 1rem 5rem" : isTablet ? "0 2rem 4rem" : S.slideContent.padding,
  };
  const slideHeadlineStyle: CSSProperties = {
    ...S.slideHeadline,
    fontSize: isMobile ? "clamp(2.1rem, 12vw, 3rem)" : S.slideHeadline.fontSize,
    maxWidth: isMobile ? "100%" : S.slideHeadline.maxWidth,
  };
  const slideSubStyle: CSSProperties = {
    ...S.slideSub,
    fontSize: isMobile ? "0.98rem" : S.slideSub.fontSize,
    maxWidth: isMobile ? "100%" : S.slideSub.maxWidth,
  };
  const slideBtnsStyle: CSSProperties = {
    ...S.slideBtns,
    flexDirection: isMobile ? "column" : "row",
  };
  const heroButtonStyle: CSSProperties = {
    width: isMobile ? "100%" : undefined,
  };
  const statsPanelStyle: CSSProperties = {
    ...S.statsPanel,
    display: isMobile ? "none" : "grid",
    gridTemplateColumns: isTablet ? "repeat(3, minmax(0, 1fr))" : undefined,
    alignItems: isTablet ? "stretch" : S.statsPanel.alignItems,
    width: isTablet ? "100%" : undefined,
    animation: "slideFadeIn 0.9s ease forwards",
  };
  const statCardStyle: CSSProperties = {
    ...S.statCard,
    minWidth: isTablet ? 0 : S.statCard.minWidth,
    textAlign: isTablet ? "left" : S.statCard.textAlign,
  };
  const sectionPadding = isMobile ? "3rem 1rem" : isTablet ? "4rem 1.5rem" : undefined;
  const audienceStyle: CSSProperties = {
    ...S.audience,
    padding: sectionPadding ?? S.audience.padding,
  };
  const aboutStyle: CSSProperties = {
    ...S.about,
    padding: sectionPadding ?? S.about.padding,
  };
  const articlesSectionStyle: CSSProperties = {
    ...S.articlesSection,
    padding: sectionPadding ?? S.articlesSection.padding,
  };
  const aboutInnerStyle: CSSProperties = {
    ...S.aboutInner,
    gridTemplateColumns: isTablet ? "1fr" : S.aboutInner.gridTemplateColumns,
    gap: isMobile ? "2rem" : isTablet ? "2.5rem" : S.aboutInner.gap,
  };
  const aboutTitleStyle: CSSProperties = {
    ...S.aboutTitle,
    fontSize: isMobile ? "2rem" : S.aboutTitle.fontSize,
  };
  const audienceGridStyle: CSSProperties = {
    ...S.audienceGrid,
    gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, minmax(0, 1fr))" : S.audienceGrid.gridTemplateColumns,
  };
  const sectionTitleStyle: CSSProperties = {
    ...S.sectionTitle,
    fontSize: isMobile ? "2rem" : S.sectionTitle.fontSize,
  };
  const partnersStripStyle: CSSProperties = {
    ...S.partnersStrip,
    padding: isMobile ? "3rem 1rem" : isTablet ? "4rem 1.5rem" : S.partnersStrip.padding,
  };
  const partnersGridStyle: CSSProperties = {
    ...S.partnersGrid,
    gridTemplateColumns: isMobile ? "1fr" : S.partnersGrid.gridTemplateColumns,
  };
  const contactStyle: CSSProperties = {
    ...S.contact,
    padding: sectionPadding ?? S.contact.padding,
  };
  const contactInnerStyle: CSSProperties = {
    ...S.contactInner,
    gridTemplateColumns: isTablet ? "1fr" : S.contactInner.gridTemplateColumns,
    gap: isMobile ? "2rem" : isTablet ? "3rem" : S.contactInner.gap,
  };
  const formRowStyle: CSSProperties = {
    ...S.formRow,
    gridTemplateColumns: isMobile ? "1fr" : S.formRow.gridTemplateColumns,
  };
  const formCardStyle: CSSProperties = {
    ...S.formCard,
    padding: isMobile ? "1.25rem" : S.formCard.padding,
    borderRadius: isMobile ? 18 : S.formCard.borderRadius,
  };

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
      <section style={heroWrapStyle} id="home">

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
        <div style={slideContentStyle} key={`content-${current}`}>
          {/* Left: headline + buttons */}
          <div style={{ animation: "slideFadeIn 0.7s ease forwards" }}>
            <div style={S.slideTag}>
              <span style={S.slideTagDot} />
              {slides[current].tag}
            </div>
            <h1 style={slideHeadlineStyle}>
              {slides[current].headline}{" "}
              <em style={S.slideAccent}>{slides[current].accent}</em>
            </h1>
            <p style={slideSubStyle}>{slides[current].sub}</p>
            <div style={slideBtnsStyle}>
              <button style={{ ...S.btnWhite, ...heroButtonStyle }} onClick={onRequestProposal}>
                {t("requestProposalArrow")}
              </button>
              <button style={{ ...S.btnGhost, ...heroButtonStyle }} onClick={onJoinPilot}>
                {t("joinPilotTraining")}
              </button>
            </div>
          </div>

          {/* Right: frosted glass stat cards */}
          <div style={statsPanelStyle}>
            {[
              { n: "200+", l: t("farmersTrained") },
              { n: "6", l: t("provincesReached") },
              { n: "3", l: t("partnerOrgs") },
            ].map((s) => (
              <div key={s.l} style={statCardStyle}>
                <div style={S.statCardNum}>{s.n}</div>
                <div style={S.statCardLabel}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button onClick={prev} style={{ ...S.arrow, left: isMobile ? 12 : 24, width: isMobile ? 42 : 48, height: isMobile ? 42 : 48 }} aria-label="Previous slide">
          ‹
        </button>
        <button onClick={next} style={{ ...S.arrow, right: isMobile ? 12 : 24, width: isMobile ? 42 : 48, height: isMobile ? 42 : 48 }} aria-label="Next slide">
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

      {/* ── ABOUT ── */}
      <section style={aboutStyle} id="about">
        <div style={aboutInnerStyle}>
          <div>
            <div style={S.aboutEyebrow}>
              <span style={S.aboutEyebrowDot} />
              <span style={S.aboutEyebrowText}>About Us</span>
            </div>
            <div style={aboutTitleStyle}>
              Zambia Environmental Training and{" "}
              <span style={S.aboutTitleAccent}>Research Centre</span>
            </div>
            <div style={S.aboutAcronym}>Known as ZETRC</div>
          </div>

          <div style={S.aboutBody}>
            <p style={S.aboutP}>
              ZETRC is a youth-led training, research, and innovation institution committed to building the next generation of leaders, entrepreneurs, and professionals in agriculture, climate resilience, environmental sustainability, and social development.
            </p>
            <p style={S.aboutP}>
              We believe that young people are not only beneficiaries of development but also powerful drivers of innovation and change. Through practical training, applied research, community engagement, and evidence-based solutions, ZETRC equips youth, communities, organisations, and institutions with the knowledge and skills needed to address emerging environmental, agricultural, and socio-economic challenges.
            </p>
            <p style={S.aboutP}>
              Our work focuses on strengthening sustainable livelihoods, promoting climate resilience, advancing inclusive development, and generating practical solutions that contribute to national and global development priorities.
            </p>
            <div style={S.aboutCallout}>
              <p style={S.aboutCalloutText}>
                By combining learning, research, innovation, and action, ZETRC serves as a platform where <span style={S.aboutCalloutAccent}>knowledge is transformed into impact</span> — where young people are empowered to shape a more resilient and sustainable future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR SERVICES & STRATEGIC AREAS ── */}
      <section style={audienceStyle} id="services">
        <div style={S.audienceHeader}>
          <div style={S.audienceLabelRow}>
            <span style={S.audienceLabelDot} />
            <span style={S.audienceLabel}>{t("whatWeOffer")}</span>
          </div>
          <div style={S.audienceTitle}>
            Who <span style={S.audienceTitleAccent}>This Is For</span>
          </div>
          <div style={S.audienceSubtitleRow}>
            <span style={S.audienceSubtitleIcon}>🌍</span>
            <p style={S.audienceSubtitle}>
              ZETRC training and resources are built for the people driving agriculture forward in Zambia.
            </p>
          </div>
        </div>

        <div style={audienceGridStyle}>
          {audienceList.map((item) => (
            <div
              key={item.title}
              style={S.audienceCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(3,43,20,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={S.audienceIcon}>{item.icon}</div>
              <div style={S.audienceCardTitle}>{item.title}</div>
              <div style={S.audienceCheck}>✓</div>
            </div>
          ))}
        </div>

      </section>

      {/* ── ARTICLES ── */}
      <section style={articlesSectionStyle}>
        <div style={S.articlesHeader}>
          <div style={S.articlesSectionTitle}>Articles</div>
        </div>

        <div style={S.articlesList}>
          {articles.map((article) => (
            <div key={article.id} style={S.articleCard}>
              {article.image && (
                <img src={article.image} alt={article.title} style={S.articleImage} />
              )}
              <div style={S.articleBody}>
                <div style={S.articleMeta}>
                  {article.author} · {article.date}
                </div>
                <div style={S.articleTitle}>{article.title}</div>
                <p style={S.articleContent}>{article.content}</p>

                <div style={S.reactionsRow}>
                  {REACTION_TYPES.map((r) => {
                    const active = myReactions[article.id] === r.emoji;
                    return (
                      <button
                        key={r.emoji}
                        onClick={() => handleToggleReaction(article.id, r.emoji)}
                        style={active ? S.reactionBtnActive : S.reactionBtn}
                        title={r.label}
                      >
                        <span>{r.emoji}</span>
                        <span>{article.reactions[r.emoji] || 0}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={S.commentsBlock}>
                  <div style={S.commentsLabel}>
                    💬 {article.comments.length} {article.comments.length === 1 ? "Comment" : "Comments"}
                  </div>
                  {article.comments.map((c) => (
                    <div key={c.id} style={S.commentItem}>
                      <div style={S.commentAvatar}>{c.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={S.commentName}>
                          {c.name} <span style={S.commentDate}>{c.date}</span>
                        </div>
                        <div style={S.commentText}>{c.text}</div>
                      </div>
                    </div>
                  ))}
                  <div style={S.commentForm}>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={commentDrafts[article.id]?.name || ""}
                      onChange={(e) => updateCommentDraft(article.id, "name", e.target.value)}
                      style={{ ...S.input, maxWidth: 160 }}
                    />
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentDrafts[article.id]?.text || ""}
                      onChange={(e) => updateCommentDraft(article.id, "text", e.target.value)}
                      style={S.input}
                    />
                    <button style={S.commentSubmitBtn} onClick={() => handleAddComment(article.id)}>
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OUR PARTNERS ── */}
      <section style={partnersStripStyle}>
        <div style={S.partnersHeader}>
          <div style={S.partnersLabel}>Our Partners</div>
          <div style={S.partnersTitle}>Grounded in Local Context</div>
          <p style={S.partnersDesc}>
            We work hand-in-hand with government, NGO, and academic partners to keep every training relevant, credible, and rooted in the realities of Zambian agriculture.
          </p>
        </div>
        <div style={partnersGridStyle}>
          {partnersList.map((p) => (
            <div key={p.name} style={S.partnerCard}>
              <div style={S.partnerLogoCircle}>
                <img src={p.logo} alt={p.name} style={S.partnerLogoImg} />
              </div>
              <div style={S.partnerName}>{p.name}</div>
              <div style={S.partnerDesc}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={contactStyle} id="contact">
        <div style={contactInnerStyle}>
          <div>
            <div style={S.sectionLabel}>{t("getInTouch")}</div>
            <div style={{ ...sectionTitleStyle, marginBottom: "1rem" }}>
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

          <div style={formCardStyle}>
            <div style={S.formTitle}>{t("requestProposal")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder={t("orgFullName")} style={S.input} />
              <div style={formRowStyle}>
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