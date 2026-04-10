interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: 'accent' | 'bright';
  className?: string;
}

// 小型状态徽章，适合显示标签、进度或奖励信息。
export function StatusBadge({ children, tone = 'accent', className = '' }: StatusBadgeProps) {
  const toneClass =
    tone === 'bright'
      ? 'border-[rgba(240,193,91,0.32)] bg-[rgba(240,193,91,0.08)] text-[var(--color-accent-bright)]'
      : 'border-[rgba(195,138,51,0.3)] bg-[rgba(195,138,51,0.08)] text-[var(--color-accent)]';

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${toneClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
