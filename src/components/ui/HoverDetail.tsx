interface HoverDetailProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function HoverDetail({
  trigger,
  title,
  description,
  align = 'center',
  className = '',
}: HoverDetailProps) {
  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <div className={`group relative inline-flex ${className}`.trim()}>
      {trigger}
      <div
        className={[
          'pointer-events-none absolute bottom-[calc(100%+0.65rem)] z-20 w-56 rounded-2xl border border-[rgba(240,193,91,0.2)]',
          'bg-[linear-gradient(180deg,rgba(29,22,18,0.98),rgba(14,10,9,0.98))] p-3 shadow-[0_18px_38px_rgba(0,0,0,0.42)]',
          'opacity-0 transition-all duration-150 group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:-translate-y-1 group-focus-within:opacity-100',
          alignClass,
        ].join(' ')}
        role="tooltip"
      >
        <strong className="block text-sm tracking-[0.08em] text-[var(--color-text-main)]">{title}</strong>
        <p className="mt-2 mb-0 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
        <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-[rgba(240,193,91,0.2)] bg-[rgba(14,10,9,0.98)]" />
      </div>
    </div>
  );
}

