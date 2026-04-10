interface InfoCardProps {
  label: string;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

// 用于展示一小块摘要信息，并支持向下插入额外内容。
export function InfoCard({ label, title, description, className = '', children }: InfoCardProps) {
  return (
    <div
      className={`rounded-2xl border border-[rgba(242,230,201,0.1)] bg-[rgba(242,230,201,0.04)] p-4 ${className}`.trim()}
    >
      <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">{label}</p>
      <strong className="mt-2 block text-lg text-[var(--color-text-main)]">{title}</strong>
      <p className="mt-1 mb-0 text-sm text-[var(--color-text-muted)]">{description}</p>
      {children}
    </div>
  );
}
