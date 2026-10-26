import { useEffect, useState } from 'react';
import { fetchMe, fetchMyEnrollments, updateMe, type MyEnrollment, type Profile } from '../../utils/features';
import { Spinner, ToastProvider, errorReason, useToast } from '../admin/Toast';
import '../../styles/features.css';

const ZAMBIAN_DISTRICTS = [
  'Chibombo', 'Chingola', 'Chipata', 'Chinsali', 'Choma', 'Kabwe', 'Kafue', 'Kalomo', 'Kaoma', 'Kasama', 'Kitwe',
  'Livingstone', 'Luanshya', 'Lundazi', 'Lusaka', 'Mansa', 'Mazabuka', 'Mkushi', 'Mongu', 'Monze', 'Mpika',
  'Mumbwa', 'Mwinilunga', 'Ndola', 'Nyimba', 'Petauke', 'Samfya', 'Senanga', 'Serenje', 'Sesheke', 'Solwezi',
];

function Inner() {
  const toast = useToast();
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ gender: '', district: '', cooperative: '', contact_no: '', sms_opt_in: true });
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetchMyEnrollments().then(setEnrollments).catch(() => undefined);
    fetchMe()
      .then((me) => {
        setProfile(me);
        setForm({
          gender: me.gender || '',
          district: me.district || '',
          cooperative: me.cooperative || '',
          contact_no: me.contact_no || '',
          sms_opt_in: me.sms_opt_in !== false,
        });
      })
      .catch(() => undefined);
  }, []);

  const pending = enrollments.filter((e) => e.status === 'pending');
  const rejected = enrollments.filter((e) => e.status === 'rejected');
  const needsProfile = profile && (!profile.gender || !profile.district);

  const save = async () => {
    setSaving(true);
    try {
      const me = await updateMe(form);
      setProfile(me);
      toast.success('Profile saved', form.sms_opt_in ? 'You will get SMS updates on your phone.' : undefined);
    } catch (error) {
      toast.error('Could not save profile', errorReason(error));
    } finally {
      setSaving(false);
    }
  };

  if (!pending.length && !rejected.length && (!needsProfile || hidden)) return null;

  return (
    <div className="fx" style={{ marginBottom: 18 }}>
      {pending.map((e) => (
        <div key={e.name} className="fx-alert fx-alert-warn">
          ⏳ Your application for <strong>{e.course}</strong> is being reviewed. You'll get an SMS as soon as it's approved.
        </div>
      ))}
      {rejected.map((e) => (
        <div key={e.name} className="fx-alert">
          Your application for <strong>{e.course}</strong> wasn't approved{e.review_note ? `: ${e.review_note}` : '.'} Contact
          support if you have questions.
        </div>
      ))}
      {needsProfile && !hidden ? (
        <div className="fx-card fx" style={{ gap: 12 }}>
          <div className="fx-spread">
            <h3>Complete your profile</h3>
            <button type="button" className="fx-btn fx-btn-small" onClick={() => setHidden(true)}>
              Later
            </button>
          </div>
          <p className="fx-muted" style={{ margin: 0 }}>
            This helps ZETRC report its reach to partners and lets us send you SMS updates about marks and new lessons.
          </p>
          <div className="fx-grid-2">
            <label className="fx-field">
              Gender
              <select className="fx-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">— Select —</option>
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </select>
            </label>
            <label className="fx-field">
              District
              <input
                className="fx-input"
                list="zm-districts"
                value={form.district}
                placeholder="e.g. Chibombo"
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
              <datalist id="zm-districts">
                {ZAMBIAN_DISTRICTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </label>
            <label className="fx-field">
              Cooperative / group (optional)
              <input className="fx-input" value={form.cooperative} onChange={(e) => setForm({ ...form, cooperative: e.target.value })} />
            </label>
            <label className="fx-field">
              Phone for SMS
              <input
                className="fx-input"
                value={form.contact_no}
                placeholder="e.g. 0971 234 567"
                onChange={(e) => setForm({ ...form, contact_no: e.target.value })}
              />
            </label>
          </div>
          <label className="fx-row fx-small">
            <input type="checkbox" checked={form.sms_opt_in} onChange={(e) => setForm({ ...form, sms_opt_in: e.target.checked })} />
            Send me SMS updates (marks, new lessons, announcements)
          </label>
          <button type="button" className="fx-btn fx-btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => void save()} disabled={saving}>
            {saving ? <Spinner /> : null} Save profile
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Enrollment status banners and the "complete your profile" card. */
function LearnerStatusCards() {
  return (
    <ToastProvider>
      <Inner />
    </ToastProvider>
  );
}

export default LearnerStatusCards;
