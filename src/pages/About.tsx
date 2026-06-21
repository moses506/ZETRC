import type { CSSProperties } from 'react';
import { PageReveal, RevealItem } from '../components/PageReveal';
import useWindowWidth from '../hooks/useWindowWidth';
import { pageRoot, pageStyles as S } from '../styles/landingStyles';

function About() {
  const width = useWindowWidth();
  const isTablet = width <= 1024;
  const isMobile = width <= 640;
  const sectionPadding = isMobile ? '3rem 1rem' : isTablet ? '4rem 1.5rem' : undefined;

  const aboutStyle: CSSProperties = {
    ...S.about,
    padding: sectionPadding ?? S.about.padding,
  };
  const aboutInnerStyle: CSSProperties = {
    ...S.aboutInner,
    gridTemplateColumns: isTablet ? '1fr' : S.aboutInner.gridTemplateColumns,
    gap: isMobile ? '2rem' : isTablet ? '2.5rem' : S.aboutInner.gap,
  };
  const aboutTitleStyle: CSSProperties = {
    ...S.aboutTitle,
    fontSize: isMobile ? '2rem' : S.aboutTitle.fontSize,
  };

  return (
    <PageReveal style={pageRoot}>
      <section style={aboutStyle}>
        <div style={aboutInnerStyle}>
          <RevealItem index={0}>
            <div>
              <div style={S.aboutEyebrow}>
                <span style={S.aboutEyebrowDot} />
                <span style={S.aboutEyebrowText}>About Us</span>
              </div>
              <div style={aboutTitleStyle}>
                Zambia Environmental Training and{' '}
                <span style={S.aboutTitleAccent}>Research Centre</span>
              </div>
              <div style={S.aboutAcronym}>Known as ZETRC</div>
            </div>
          </RevealItem>

          <RevealItem index={1}>
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
              <RevealItem index={2}>
                <div style={S.aboutCallout}>
                  <p style={S.aboutCalloutText}>
                    By combining learning, research, innovation, and action, ZETRC serves as a platform where <span style={S.aboutCalloutAccent}>knowledge is transformed into impact</span> — where young people are empowered to shape a more resilient and sustainable future.
                  </p>
                </div>
              </RevealItem>
            </div>
          </RevealItem>
        </div>
      </section>
    </PageReveal>
  );
}

export default About;
