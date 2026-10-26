import { FormEvent, useEffect, useMemo, useState } from 'react';
import qrcode from '../vendor/qrcode-generator';
import { verifyCertificate, type CertificateCheck } from '../utils/features';
import '../styles/features.css';
import '../styles/certificate.css';

/** Reads the code from #certificate/ZET-XXXX-XXXX. */
export function codeFromHash(hash: string): string {
  const [, code = ''] = hash.replace(/^#/, '').split('/');
  return decodeURIComponent(code).toUpperCase();
}

function QRCodeSvg({ text }: { text: string }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag(4, 0);
  }, [text]);
  return <div className="certpg-qr" aria-label="QR code to verify this certificate" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function formatDate(value?: string) {
  const t = Date.parse(value ?? '');
  return Number.isNaN(t)
    ? value ?? ''
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t));
}

/** Public page: verify a certificate code and print the certificate. */
function CertificatePage({ onBackHome }: { onBackHome: () => void }) {
  const [code, setCode] = useState(() => codeFromHash(window.location.hash));
  const [input, setInput] = useState(code);
  const [result, setResult] = useState<CertificateCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => {
      const next = codeFromHash(window.location.hash);
      setCode(next);
      setInput(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!code) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    verifyCertificate(code)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not check this certificate right now.'))
      .finally(() => setLoading(false));
  }, [code]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = input.trim().toUpperCase();
    if (next) window.location.hash = `#certificate/${encodeURIComponent(next)}`;
  };

  const verifyUrl = `${window.location.origin}${window.location.pathname}#certificate/${encodeURIComponent(code)}`;

  return (
    <div className="certpg-page">
      <div className="certpg-toolbar fx-no-print">
        <button type="button" className="fx-btn" onClick={onBackHome}>
          ← ZETRC home
        </button>
        <form className="fx-row" onSubmit={submit}>
          <input
            className="fx-input"
            style={{ width: 220 }}
            placeholder="Certificate code, e.g. ZET-7KQ2-9FXM"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="fx-btn fx-btn-primary">
            Verify
          </button>
        </form>
        {result?.valid ? (
          <button type="button" className="fx-btn fx-btn-primary" onClick={() => window.print()}>
            🖨 Print / save as PDF
          </button>
        ) : null}
      </div>

      {!code ? (
        <div className="certpg-message">
          <h1>Verify a ZETRC certificate</h1>
          <p>Enter the code printed on the certificate, or scan its QR code.</p>
        </div>
      ) : loading ? (
        <div className="certpg-message">Checking certificate…</div>
      ) : error ? (
        <div className="certpg-message">
          <div className="fx-alert">{error}</div>
        </div>
      ) : result && !result.valid ? (
        <div className="certpg-message">
          <div className="certpg-status certpg-status-bad">✗ Not a valid certificate</div>
          <p>
            No certificate matches <strong>{code}</strong>. Check the code and try again, or contact ZETRC.
          </p>
        </div>
      ) : result ? (
        <>
          <div className="certpg-status certpg-status-good fx-no-print">✓ Genuine ZETRC certificate</div>
          <article className="certpg-sheet">
            <div className="certpg-border">
              <header className="certpg-header">
                <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 22 12 12 22 2 12z" fill="none" stroke="#b7860f" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" fill="#b7860f" />
                </svg>
                <div>
                  <div className="certpg-org">Zambia Environmental Training &amp; Research Centre</div>
                  <div className="certpg-org-sub">ZETRC</div>
                </div>
              </header>

              <p className="certpg-kicker">Certificate of Completion</p>
              <p className="certpg-small">This is to certify that</p>
              <h1 className="certpg-name">{result.learner}</h1>
              <p className="certpg-small">has successfully completed the course</p>
              <h2 className="certpg-course">{result.course}</h2>
              {result.duration ? <p className="certpg-small">a {result.duration} programme</p> : null}
              <p className="certpg-score">
                with a continuous assessment score of <strong>{Math.round(result.ca_percent ?? 0)}%</strong>
              </p>

              <footer className="certpg-footer">
                <div className="certpg-sign">
                  <div className="certpg-sign-line" />
                  <strong>{result.lecturer || 'Course Lecturer'}</strong>
                  <span>Lecturer</span>
                </div>
                <div className="certpg-sign">
                  <div className="certpg-date">{formatDate(result.issued_date)}</div>
                  <span>Date issued</span>
                </div>
                <div className="certpg-verify">
                  <QRCodeSvg text={verifyUrl} />
                  <span>Verify: {result.code}</span>
                </div>
              </footer>
            </div>
          </article>
        </>
      ) : null}
    </div>
  );
}

export default CertificatePage;
