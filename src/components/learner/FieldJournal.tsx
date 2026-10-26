import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { resolveApiAssetUrl, uploadLearnerFile } from '../../utils/api';
import { addPhoto, deletePhoto, fetchMyEnrollments, fetchMyPhotos, type FieldPhoto } from '../../utils/features';
import ConfirmDialog from '../admin/ConfirmDialog';
import { Spinner, ToastProvider, errorReason, useToast } from '../admin/Toast';
import { mapLink, photoDate } from '../staff/FieldJournalGallery';
import '../../styles/features.css';

type Coords = { latitude: number; longitude: number } | null;

function JournalInner() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<FieldPhoto[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [course, setCourse] = useState('');
  const [coords, setCoords] = useState<Coords>(null);
  const [locating, setLocating] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<FieldPhoto | null>(null);

  const load = useCallback(async () => {
    try {
      const [mine, enrollments] = await Promise.all([fetchMyPhotos(), fetchMyEnrollments()]);
      setPhotos(mine);
      const names = [...new Set(enrollments.filter((e) => e.status !== 'rejected').map((e) => e.course))];
      setCourses(names);
      setCourse((c) => c || names[0] || '');
    } catch (error) {
      toast.error('Could not load your journal', errorReason(error));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: +pos.coords.latitude.toFixed(6), longitude: +pos.coords.longitude.toFixed(6) });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.info('No location added', 'Allow location access to pin the photo on a map (optional).');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (!chosen) return;
    if (!/^image\/(jpeg|png|webp)$/.test(chosen.type)) {
      toast.error('Unsupported photo', 'Please use a JPG, PNG or WEBP photo.');
      return;
    }
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
    locate();
  };

  const save = async () => {
    if (!file) return;
    setProgress(0);
    try {
      const uploaded = await uploadLearnerFile(file, setProgress);
      await addPhoto({
        image_url: uploaded.url,
        caption: caption.trim(),
        course,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        taken_at: new Date(file.lastModified || Date.now()).toISOString(),
      });
      toast.success('Photo added to your journal', coords ? 'Location saved too.' : undefined);
      setFile(null);
      setPreview('');
      setCaption('');
      setCoords(null);
      void load();
    } catch (error) {
      toast.error('Could not save photo', errorReason(error));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await deletePhoto(toDelete.id);
      toast.success('Photo removed');
      setToDelete(null);
      void load();
    } catch (error) {
      toast.error('Could not remove photo', errorReason(error));
    }
  };

  return (
    <div className="fx">
      <div className="fx-card fx" style={{ gap: 12 }}>
        <h3>Add a field photo</h3>
        <p className="fx-muted" style={{ margin: 0 }}>
          Document your plot through the season — planting, growth, problems you spot and results. Your lecturer can see these.
        </p>
        {!file ? (
          <button type="button" className="fx-btn fx-btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => inputRef.current?.click()}>
            📷 Take or choose a photo
          </button>
        ) : (
          <div className="fx-grid-2" style={{ alignItems: 'start' }}>
            <img src={preview} alt="Selected field" style={{ width: '100%', borderRadius: 14, maxHeight: 280, objectFit: 'cover' }} />
            <div className="fx" style={{ gap: 10 }}>
              <label className="fx-field">
                What does this photo show?
                <textarea
                  className="fx-textarea"
                  placeholder="e.g. Maize at 6 weeks after planting with basins"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </label>
              {courses.length ? (
                <label className="fx-field">
                  Course
                  <select className="fx-select" value={course} onChange={(e) => setCourse(e.target.value)}>
                    {courses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <span className="fx-small">
                {locating ? 'Getting your location…' : coords ? `📍 ${coords.latitude}, ${coords.longitude}` : 'No location'}
                {!locating && !coords ? (
                  <button type="button" className="fx-btn fx-btn-small" style={{ marginLeft: 8 }} onClick={locate}>
                    Add location
                  </button>
                ) : null}
              </span>
              {progress !== null ? (
                <div className="fx-bar-track">
                  <div className="fx-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              ) : null}
              <div className="fx-row">
                <button type="button" className="fx-btn" onClick={() => (setFile(null), setPreview(''))} disabled={progress !== null}>
                  Cancel
                </button>
                <button type="button" className="fx-btn fx-btn-primary" onClick={() => void save()} disabled={progress !== null}>
                  {progress !== null ? (
                    <>
                      <Spinner /> Saving {progress}%
                    </>
                  ) : (
                    'Save to journal'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={pick} />
      </div>

      {loading ? (
        <div className="fx-empty">
          <Spinner /> Loading…
        </div>
      ) : photos.length === 0 ? (
        <div className="fx-empty">Your journal is empty. Add your first photo from the field!</div>
      ) : (
        <div className="fx-gallery">
          {photos.map((p) => {
            const map = mapLink(p);
            return (
              <div key={p.id} className="fx-photo">
                <img src={resolveApiAssetUrl(p.image_url)} alt={p.caption || 'Field photo'} loading="lazy" />
                <div className="fx-photo-body">
                  {p.caption ? <strong>{p.caption}</strong> : null}
                  <span className="fx-small fx-muted">
                    {p.course || 'No course'} · {photoDate(p)}
                  </span>
                  <div className="fx-spread">
                    {map ? (
                      <a className="fx-small" href={map} target="_blank" rel="noopener noreferrer">
                        📍 Map
                      </a>
                    ) : (
                      <span />
                    )}
                    <button type="button" className="fx-btn fx-btn-small fx-btn-danger" onClick={() => setToDelete(p)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        tone="danger"
        title="Remove this photo?"
        confirmLabel="Remove"
        onCancel={() => setToDelete(null)}
        onConfirm={() => void remove()}
      >
        <p>It will be removed from your journal and your lecturer won't see it any more.</p>
      </ConfirmDialog>
    </div>
  );
}

/** Learner's geotagged photo journal of their field work. */
function FieldJournal() {
  return (
    <ToastProvider>
      <JournalInner />
    </ToastProvider>
  );
}

export default FieldJournal;
