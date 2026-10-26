import { useEffect, useRef, useState } from 'react';
import { resolveApiAssetUrl, uploadLearnerFile } from '../../utils/api';
import '../../styles/features.css';

type VoiceRecorderProps = {
  /** URL of the uploaded recording, or '' when none. */
  value: string;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

function pickMimeType() {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return options.find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ?? '';
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Record a spoken answer in the browser and upload it. */
function VoiceRecorder({ value, onChange, onBusyChange }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => void finish(recorder.mimeType || mimeType || 'audio/webm');
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setState('recording');
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= 300) recorderRef.current?.stop(); // 5-minute limit
          return s + 1;
        });
      }, 1000);
    } catch {
      setError('Microphone access was blocked. Allow the microphone in your browser settings and try again.');
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  };

  const finish = async (mimeType: string) => {
    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const file = new File(chunksRef.current, `voice-answer-${Date.now()}.${ext}`, { type: mimeType });
    setState('uploading');
    onBusyChange?.(true);
    try {
      const uploaded = await uploadLearnerFile(file);
      onChange(uploaded.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload your recording.');
    } finally {
      setState('idle');
      onBusyChange?.(false);
    }
  };

  if (!supported) {
    return <p className="fx-small fx-muted">Voice answers aren't supported in this browser.</p>;
  }

  return (
    <div className="fx-recorder">
      {state === 'recording' ? (
        <>
          <span className="fx-rec-dot" aria-hidden="true" />
          <strong>Recording… {fmt(seconds)}</strong>
          <button type="button" className="fx-btn fx-btn-small fx-btn-danger" onClick={stop}>
            ■ Stop
          </button>
        </>
      ) : state === 'uploading' ? (
        <span className="fx-muted">Saving your recording…</span>
      ) : value ? (
        <>
          <span>🎙️ Voice answer ready</span>
          <audio controls src={resolveApiAssetUrl(value)} style={{ height: 36, maxWidth: 260 }} />
          <button type="button" className="fx-btn fx-btn-small" onClick={() => void start()}>
            Re-record
          </button>
          <button type="button" className="fx-btn fx-btn-small fx-btn-danger" onClick={() => onChange('')}>
            Remove
          </button>
        </>
      ) : (
        <>
          <button type="button" className="fx-btn fx-btn-small" onClick={() => void start()}>
            🎙️ Record a voice answer
          </button>
          <span className="fx-small fx-muted">Prefer talking to typing? Record up to 5 minutes.</span>
        </>
      )}
      {error ? <div className="fx-alert" style={{ width: '100%' }}>{error}</div> : null}
    </div>
  );
}

export default VoiceRecorder;
