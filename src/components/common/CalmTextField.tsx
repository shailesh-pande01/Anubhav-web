import React from 'react';

export interface CalmTextFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  singleLine?: boolean;
  multiline?: boolean;
  minRows?: number;
  rows?: number;
  maxRows?: number;
  isError?: boolean;
  errorMessage?: string | null;
  trailingIcon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  id?: string;
}

export const CalmTextField: React.FC<CalmTextFieldProps> = ({
  label,
  placeholder = '',
  value,
  onChange,
  type = 'text',
  singleLine = true,
  multiline = false,
  minRows = 3,
  rows,
  isError = false,
  errorMessage,
  trailingIcon,
  disabled = false,
  required = false,
  autoComplete,
  className = '',
  id,
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isSingleLine = multiline ? false : singleLine;
  const effectiveRows = rows || minRows;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex w-full flex-col ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 text-[12px] font-medium tracking-[0.2px] text-[var(--calm-text-secondary)]"
        >
          {label}
        </label>
      )}

      <div className="relative flex w-full items-center">
        {isSingleLine ? (
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            className={`w-full rounded-[10px] border bg-[var(--calm-surface)] px-3.5 py-3 text-[15px] text-[var(--calm-text-primary)] placeholder:text-[var(--calm-text-tertiary)] transition-colors focus:outline-none ${
              isError
                ? 'border-red-500 focus:border-red-500'
                : 'border-[var(--calm-border)] focus:border-[var(--calm-primary)]'
            } ${trailingIcon ? 'pr-11' : ''} disabled:opacity-50`}
          />
        ) : (
          <textarea
            id={inputId}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={effectiveRows}
            disabled={disabled}
            required={required}
            className={`w-full resize-y rounded-[10px] border bg-[var(--calm-surface)] px-3.5 py-3 text-[15px] leading-relaxed text-[var(--calm-text-primary)] placeholder:text-[var(--calm-text-tertiary)] transition-colors focus:outline-none ${
              isError
                ? 'border-red-500 focus:border-red-500'
                : 'border-[var(--calm-border)] focus:border-[var(--calm-primary)]'
            } disabled:opacity-50`}
          />
        )}

        {trailingIcon && (
          <div className="absolute right-3 flex items-center justify-center text-[var(--calm-text-secondary)]">
            {trailingIcon}
          </div>
        )}
      </div>

      {isError && errorMessage && (
        <span className="mt-1 text-[12px] text-red-500 font-medium">{errorMessage}</span>
      )}
    </div>
  );
};
