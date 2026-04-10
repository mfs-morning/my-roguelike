interface SectionTitleProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

// 统一页面标题区，减少视图层重复排版。
export function SectionTitle({ eyebrow, title, description, className = '' }: SectionTitleProps) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="m-0 text-3xl font-bold tracking-[0.08em] text-[var(--color-text-main)]">
        {title}
      </h2>
      {description ? (
        <p className="m-0 text-sm leading-7 text-[var(--color-text-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
