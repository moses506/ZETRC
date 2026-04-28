type HomeProps = {
  onJoinPilot: () => void;
  onRequestProposal: () => void;
};

function Home({ onJoinPilot, onRequestProposal }: HomeProps) {
  return (
    <div className="page-home">

      {/* ── HERO ── */}
      <section className="hero" id="home">
        {/* Ambient orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="hero-inner">
          <div className="hero-left">
            <span className="hero-badge">
              <span className="badge-dot" />
              Practical. Local. Actionable.
            </span>

            <h1 className="hero-h1">
              Turning Agricultural<br />
              Knowledge Into<br />
              <span className="hero-accent">Real-World Impact</span>
            </h1>

            <p className="hero-p">
              ZETRC helps farmers, NGOs, companies, and public institutions implement
              climate-resilient agriculture solutions that improve productivity and income.
            </p>

            <div className="hero-actions">
              <button className="btn-hero-outline" onClick={onJoinPilot}>Join Pilot Training</button>
              <button className="btn-hero-teal" onClick={onRequestProposal}>Request Proposal →</button>
            </div>

            <div className="hero-stats">
              {[
                { n: '200+', l: 'Farmers trained' },
                { n: '3', l: 'Partner orgs' },
                { n: '6', l: 'Provinces reached' },
              ].map(s => (
                <div className="stat" key={s.n}>
                  <span className="stat-n">{s.n}</span>
                  <span className="stat-l">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <div className="what-card glass-card">
              <div className="card-tag">What We Do</div>
              <p>We bridge the gap between technical knowledge and field implementation in agriculture and environmental sustainability.</p>
            </div>

            <div className="mini-cards">
              <div className="mini-card glass-card">
                <span className="mini-label">Training</span>
                <strong>Climate-smart farming programs</strong>
                <div className="mini-arrow">→</div>
              </div>
              <div className="mini-card glass-card">
                <span className="mini-label">Consultancy</span>
                <strong>Risk and sustainability advisory</strong>
                <div className="mini-arrow">→</div>
              </div>
            </div>

            <div className="trust-bar glass-card">
              <span className="trust-dot" />
              <span>Trusted by NGOs, cooperatives &amp; government institutions across Zambia</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO / ACADEMY / WORK WITH US ── */}
      <section className="info-strip" id="services">
        <div className="info-card light-card" data-index="0">
          <div className="info-icon">👥</div>
          <h3>Who This Is For</h3>
          <ul className="info-list">
            {['Small-scale farmers','Youth in agriculture','Cooperatives and farmer groups','NGOs and development organizations'].map(i => (
              <li key={i}><span className="list-check">✓</span>{i}</li>
            ))}
          </ul>
        </div>

        <div className="info-card light-card academy-card" data-index="1">
          <div className="info-icon">🎓</div>
          <h3>ZETRC Academy</h3>
          <p>Digital learning platform with structured modules, certifications, and mobile access.</p>
          <div className="academy-pills">
            <span className="pill">Self-paced</span>
            <span className="pill">Certified</span>
            <span className="pill">Mobile-first</span>
          </div>
          <a href="#academy" className="link-teal">Get Early Access →</a>
        </div>

        <div className="info-card dark-card" data-index="2">
          <div className="info-icon">🤝</div>
          <h3>Work With Us</h3>
          <p>Need implementation support, training delivery, or environmental advisory?</p>
          <button className="btn-teal" style={{width:'100%', marginBottom:'0.75rem', padding:'0.8rem'}} onClick={onRequestProposal}>
            Request Proposal
          </button>
          <button className="btn-wa">
            <span>💬</span> WhatsApp Us
          </button>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="contact-section" id="contact">
        <div className="contact-left">
          <div className="section-eyebrow">Get in touch</div>
          <h2>Work With ZETRC</h2>
          <p>We partner with farmers, NGOs, private companies, and government institutions through training, consultancy, and climate advisory support.</p>

          <div className="contact-items">
            {[
              { icon: '✉', label: 'Email', value: 'info@zetrc.org' },
              { icon: '📞', label: 'Phone', value: '+260 97 9885086' },
              { icon: '💬', label: 'WhatsApp', value: 'WhatsApp Us' },
            ].map(c => (
              <div className="contact-item" key={c.label}>
                <div className="contact-icon-wrap">{c.icon}</div>
                <div>
                  <span className="contact-label">{c.label}</span>
                  <span className="contact-value">{c.value}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-wa-lg">Contact us on WhatsApp →</button>
        </div>

        <div className="contact-right">
          <div className="proposal-card">
            <h2>Request a Proposal</h2>
            <div className="form-grid">
              <input className="form-input span-2" type="text" placeholder="Organization / Full Name" />
              <input className="form-input" type="email" placeholder="Email Address" />
              <input className="form-input" type="tel" placeholder="Phone Number" />
              <textarea className="form-input span-2" placeholder="Tell us your project needs" rows={5} />
              <button className="btn-submit span-2">Send Inquiry</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
