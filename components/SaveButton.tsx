'use client';

import { useFormStatus } from 'react-dom';

export default function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="pe-save" disabled={pending}>
      {pending ? (
        <span className="pe-save-loading">
          <span className="pe-save-spinner" />
          Saving…
        </span>
      ) : (
        'Save changes →'
      )}
    </button>
  );
}
