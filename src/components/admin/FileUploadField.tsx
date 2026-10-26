import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { resolveApiAssetUrl, uploadStaffFile } from '../../utils/api';
import type { StaffScope } from '../../utils/auth';
import { AdminIcon } from './AdminIcons';
import { errorReason, useToast } from './Toast';

export type UploadKind = 'pdf' | 'audio';

const KINDS: Record<UploadKind, { accept: string; extensions: string[]; hint: string; noun: string }> = {
  pdf: {
    accept: '.pdf,.doc,.docx,application/pdf',
    extensions: ['.pdf', '.doc', '.docx'],
    hint: 'PDF or Word document',
    noun: 'document',
  },
  audio: {
    accept: '.mp3,.wav,.m4a,.aac,.ogg,.amr,audio/*',
    extensions: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.amr'],
    hint: 'MP3, M4A, WAV, OGG, AAC or AMR voice note',
    noun: 'audio',
  },
};

const MAX_MB = 50;

type FileUploadFieldProps = {
  scope: StaffScope;
  kind: UploadKind;
  value: string;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

function fileNameFrom(url: string) {
  return decodeURIComponent(url.split('/').pop() ?? url);
}

/** Upload a lesson file from the computer, with drag & drop and a progress bar. */
function FileUploadField({ scope, kind, value, onChange, onBusyChange }: FileUploadFieldProps) {
  const config = KINDS[kind];
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileLabel, setFileLabel] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const upload = async (file: File) => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!config.extensions.includes(ext)) {
      toast.error('Wrong file type', `Please choose a ${config.hint}. "${file.name}" isn't supported here.`);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error('File too large', `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_MB} MB.`);
      return;
    }

    setFileLabel(file.name);
    setProgress(0);
    onBusyChange?.(true);
    try {
      const uploaded = await uploadStaffFile(scope, file, setProgress);
      onChange(uploaded.url);
      toast.success('File uploaded', `${file.name} — remember to Save.`);
    } catch (error) {
      toast.error('Upload failed', errorReason(error));
    } finally {
      setProgress(null);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void upload(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const uploading = progress !== null;
  const href = value ? resolveApiAssetUrl(value) : '';

  return (
    <div className="upload-field">
      {value && !uploading ? (
        <div className="upload-current">
          <span className={`upload-icon upload-icon-${kind}`}>
            <AdminIcon name={kind === 'audio' ? 'Lesson_Content' : 'Proposal_Request'} size={18} />
          </span>
          <div className="upload-current-info">
            <strong>{fileNameFrom(value)}</strong>
            {kind === 'audio' ? (
              <audio controls preload="none" src={href} />
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                Open current {config.noun}
              </a>
            )}
          </div>
          <div className="upload-current-actions">
            <button type="button" className="admin-btn admin-btn-small" onClick={() => inputRef.current?.click()}>
              Replace
            </button>
            <button type="button" className="admin-btn admin-btn-small admin-btn-danger" onClick={() => onChange('')}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`upload-drop${dragging ? ' upload-drop-active' : ''}${uploading ? ' upload-drop-busy' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !uploading) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {uploading ? (
            <div className="upload-progress">
              <span className="upload-progress-name">
                Uploading {fileLabel}… {progress}%
              </span>
              <div className="upload-progress-track">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <span className={`upload-icon upload-icon-${kind}`}>
                <AdminIcon name="Assignment_Submission" size={18} />
              </span>
              <span className="upload-drop-text">
                <strong>Click to upload</strong> or drag a file here
                <small>
                  {config.hint} · up to {MAX_MB} MB
                </small>
              </span>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept={config.accept} hidden onChange={handlePick} />

      <button type="button" className="upload-link-toggle" onClick={() => setShowLink((v) => !v)}>
        {showLink ? 'Hide link field' : 'Or paste a link instead'}
      </button>
      {showLink ? (
        <input
          type="url"
          className="upload-link-input"
          placeholder="https://… or /uploads/…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
    </div>
  );
}

export default FileUploadField;
