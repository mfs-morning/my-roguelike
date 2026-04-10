interface HealthBarProps {
  value: number;
  max: number;
  tone?: 'hero' | 'enemy';
  className?: string;
}

// 用于展示角色或敌人的当前生命值进度。
export function HealthBar({ value, max, tone = 'hero', className = '' }: HealthBarProps) {
  const safeMax = Math.max(1, max);
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const fillClass = tone === 'enemy' ? 'from-rose-500 to-red-700' : 'from-emerald-400 to-lime-500';

  return (
    <div className={`grid gap-2 ${className}`.trim()}>
      <div className="h-3 overflow-hidden rounded-full bg-[rgba(242,230,201,0.08)]">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-300 ${fillClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="m-0 text-xs text-[var(--color-text-muted)]">
        HP {value}/{max}
      </p>
    </div>
  );
}
