'use client';

import { useFormStatus } from 'react-dom';

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
      <DangerSubmitInner
        className={className}
        confirmMessage={confirmMessage}
        label={label}
      />
    </form>
  );
}

function DangerSubmitInner({
  className,
  confirmMessage,
  label,
}: {
  className: string;
  confirmMessage: string;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? 'Working…' : label}
    </button>
  );
}
