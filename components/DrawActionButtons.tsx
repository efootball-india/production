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

export function MoveUpButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="dr-setup-arrow"
      disabled={pending || disabled}
      aria-label="Move up"
      title="Move up"
    >
      {pending ? '…' : '▲'}
    </button>
  );
}

export function MoveDownButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="dr-setup-arrow"
      disabled={pending || disabled}
      aria-label="Move down"
      title="Move down"
    >
      {pending ? '…' : '▼'}
    </button>
  );
}

export function ShuffleOrderButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dr-setup-shuffle" disabled={pending}>
      {pending ? 'Shuffling…' : '🎲 Shuffle order'}
    </button>
  );
}

export function ResetOrderButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dr-setup-reset-order" disabled={pending}>
      {pending ? '…' : 'Reset to registration order'}
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
