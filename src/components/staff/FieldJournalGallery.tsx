import { useEffect, useMemo, useState } from 'react';
import { resolveApiAssetUrl } from '../../utils/api';
import type { StaffScope } from '../../utils/auth';
import { fetchStaffPhotos, type FieldPhoto } from '../../utils/features';
import { errorReason } from '../admin/Toast';
import '../../styles/features.css';

export function mapLink(photo: Pick<FieldPhoto, 'latitude' | 'longitude'>) {
  if (photo.latitude === null || photo.longitude === null) return null;
  return `https://www.openstreetmap.org/?mlat=${photo.latitude}&mlon=${photo.longitude}#map=15/${photo.latitude}/${photo.longitude}`;
}

export function photoDate(photo: FieldPhoto) {
  const t = Date.parse(photo.taken_at || photo.creation);
  return Number.isNaN(t) ? '' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(t));
}

/** Staff view of learners' geotagged field photos. */
function FieldJournalGallery({ scope }: { scope: StaffScope }) {
  const [photos, setPhotos] = useState<FieldPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState('');
  const [preview, setPreview] = useState<FieldPhoto | null>(null);

  useEffect(() => {
    fetchStaffPhotos(scope)
      .then(setPhotos)
      .catch((e) => setError(errorReason(e)))
      .finally(() => setLoading(false));
  }, [scope]);

  const courses = useMemo(() => [...new Set(photos.map((p) => p.course).filter(Boolean))].sort(), [photos]);
  const visible = photos.filter((p) => !course || p.course === course);
  const geotagged = photos.filter((p) => p.latitude !== null).length;
  const learners = new Set(photos.map((p) => p.learner_email)).size;

  return (
    <div className="fx">
      <div className="fx-kpis">
        <div className="fx-kpi">
          <strong>{photos.length}</strong>
          <span>Field photos</span>
        </div>
        <div className="fx-kpi">
          <strong>{learners}</strong>
          <span>Learners contributing</span>
        </div>
        <div className="fx-kpi">
          <strong>{geotagged}</strong>
          <span>With GPS location</span>
        </div>
      </div>

      <div className="fx-row">
        <select className="fx-select" style={{ width: 'auto', minWidth: 240 }} value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="fx-alert">{error}</div> : null}
      {loading ? (
        <div className="fx-empty">Loading photos…</div>
      ) : visible.length === 0 ? (
        <div className="fx-empty">No field photos yet. Learners add them from the Field journal on their dashboard.</div>
      ) : (
        <div className="fx-gallery">
          {visible.map((p) => {
            const map = mapLink(p);
            return (
              <div key={p.id} className="fx-photo">
                <button type="button" style={{ border: 0, padding: 0, cursor: 'zoom-in', background: 'none' }} onClick={() => setPreview(p)}>
                  <img src={resolveApiAssetUrl(p.image_url)} alt={p.caption || 'Field photo'} loading="lazy" />
                </button>
                <div className="fx-photo-body">
                  <strong>{p.learner_name}</strong>
                  {p.caption ? <span>{p.caption}</span> : null}
                  <span className="fx-small fx-muted">
                    {p.course || 'No course'} · {photoDate(p)}
                  </span>
                  {map ? (
                    <a className="fx-small" href={map} target="_blank" rel="noopener noreferrer">
                      📍 View on map
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview ? (
        <div className="admin-confirm-backdrop" onMouseDown={() => setPreview(null)} role="presentation">
          <figure style={{ margin: 0, maxWidth: '92vw', maxHeight: '90vh', textAlign: 'center' }}>
            <img
              src={resolveApiAssetUrl(preview.image_url)}
              alt={preview.caption || 'Field photo'}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 14 }}
            />
            <figcaption style={{ color: '#fff', marginTop: 10 }}>
              {preview.learner_name} — {preview.caption}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}

export default FieldJournalGallery;
