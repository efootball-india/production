'use client';

import { ReactNode } from 'react';

type Props = {
  formAction: (formData: FormData) => void;
  slug: string;
  confirmMessage: string;
  label: string;
  className?: string;
  disabled?: boolean;
  disabledLabel?: string;
};

export default function DangerActionButton({
  formAction,
  slug,
  confirmMessage,
  label,
  className = 'mg-danger-btn',
  disabled = false,
  disabledLabel,
}: Props) {
  if (disabled) {
    return (
      <button type="button" className="mg-danger-btn mg-danger-btn-disabled" disabled>
        {disabledLabel ?? label}
      </button>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className={className}
        onClick={(e) => {
          if (!confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        {label}
      </button>
    </form>
  );
}
