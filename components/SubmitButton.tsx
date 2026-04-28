'use client';

import { useFormStatus } from 'react-dom';
import { ReactNode, CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  loadingChildren?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

/**
 * Drop-in replacement for <button type="submit">. Automatically shows a
 * loading state when the parent form is being submitted. Greys out and
 * swaps text to "loadingChildren" (default: "..." appended).
 *
 * Usage:
 *   <SubmitButton className="auth-button">Save profile</SubmitButton>
 *
 * Custom loading text:
 *   <SubmitButton loadingChildren="Saving...">Save</SubmitButton>
 */
export default function SubmitButton({
  children,
  loadingChildren,
  className,
  style,
  disabled,
}: Props) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={className}
      style={{
        ...style,
        opacity: isDisabled ? 0.6 : (style?.opacity ?? 1),
        cursor: isDisabled ? 'wait' : (style?.cursor ?? 'pointer'),
        position: 'relative',
      }}
    >
      {pending ? (loadingChildren ?? <>{children} ...</>) : children}
    </button>
  );
}
