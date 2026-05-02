'use client';

import { useFormStatus } from 'react-dom';

export function ToggleWinnerButton({ isWinner }: { isWinner: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dr-setup-btn" disabled={pending}>
      {pending ? '…' : isWinner ? 'Unmark' : 'Mark winner'}
    </button>
  );
}

export function StartDrawButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dr-start-btn" disabled={pending}>
      {pending ? 'Starting…' : 'Start draw →'}
    </button>
  );
}

export function CompleteDrawButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dr-complete-btn" disabled={pending}>
      {pending ? 'Locking in…' : '★ Complete draw → Start tournament'}
    </button>
  );
}

export function ResetDrawButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="dr-danger-btn"
      disabled={pending}
      onClick={(e) => {
        if (!confirm('Reset the draw? All country assignments will be cleared. Cannot be undone.')) {
          e.preventDefault();
        }
      }}
    >
      {pending ? 'Resetting…' : 'Reset draw'}
    </button>
  );
}
