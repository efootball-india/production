// PASS-37-AVATAR-UPLOAD
'use client';

import { useState, useRef } from 'react';
import { uploadAvatar, removeAvatar } from '../app/actions/avatar';

type Props = {
  currentUrl: string | null;
  initial: string;
};

export default function AvatarUpload({ currentUrl, initial }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Max 2 MB.');
      e.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP allowed.');
      e.target.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setBusy(true);

    const fd = new FormData();
    fd.append('avatar', file);

    const result = await uploadAvatar(fd);

    setBusy(false);
    if (result.error) {
      setError(result.error);
      setPreviewUrl(currentUrl);
      URL.revokeObjectURL(localPreview);
    } else if (result.url) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(result.url);
    }

    if (inputRef.current) inputRef.current.value = '';
  }

  async function onRemove() {
    if (!confirm('Remove your profile photo?')) return;
    setBusy(true);
    setError(null);
    const result = await removeAvatar();
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setPreviewUrl(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: previewUrl
          ? `url(${previewUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,255,136,0.04))',
        border: '2px solid rgba(0,255,136,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: busy ? 0.55 : 1,
        transition: 'opacity 0.15s ease',
      }}>
        {!previewUrl && (
          <span style={{ fontSize: 50, color: 'var(--accent)', fontWeight: 800, lineHeight: 1 }}>
            {initial}
          </span>
        )}
        {busy && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            fontSize: 10,
            letterSpacing: '0.18em',
            fontWeight: 700,
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '50%',
          }}>
            UPLOADING
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        disabled={busy}
        style={{ display: 'none' }}
        id="avatar-file-input"
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label
          htmlFor="avatar-file-input"
          style={{
            fontSize: 11,
            color: 'var(--accent)',
            border: '1px solid rgba(0, 255, 136, 0.4)',
            padding: '8px 16px',
            borderRadius: 4,
            cursor: busy ? 'not-allowed' : 'pointer',
            letterSpacing: '0.12em',
            fontWeight: 700,
            opacity: busy ? 0.5 : 1,
          }}
        >
          {previewUrl ? 'CHANGE PHOTO' : '+ ADD PHOTO'}
        </label>

        {previewUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            style={{
              fontSize: 11,
              color: 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              padding: '8px 12px',
              cursor: busy ? 'not-allowed' : 'pointer',
              letterSpacing: '0.08em',
              font: 'inherit',
              opacity: busy ? 0.5 : 1,
            }}
          >
            Remove
          </button>
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', maxWidth: 240 }}>
        JPEG, PNG, or WebP · Max 2 MB · Square images look best
      </div>

      {error && (
        <div style={{
          fontSize: 12,
          color: '#ff5050',
          padding: '8px 14px',
          background: 'rgba(255,80,80,0.08)',
          border: '1px solid rgba(255,80,80,0.2)',
          borderRadius: 4,
          textAlign: 'center',
          maxWidth: 280,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
