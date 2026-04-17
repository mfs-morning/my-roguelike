import type { RunRelic } from '../../types';

interface RelicBadgeProps {
  relic: RunRelic;
  label: string;
}

function getRelicGlyph(relic: RunRelic) {
  if (relic.id === 'weatheredCharm') {
    return '✦';
  }

  return '◆';
}

export function RelicBadge({ relic, label }: RelicBadgeProps) {
  return (
    <button
      type="button"
      className="group flex min-w-[84px] items-center gap-2 rounded-2xl border border-[rgba(240,193,91,0.18)] bg-[linear-gradient(180deg,rgba(240,193,91,0.12),rgba(82,52,16,0.18))] px-3 py-2 text-left shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(240,193,91,0.38)] hover:shadow-[0_16px_34px_rgba(0,0,0,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-bright)]"
      aria-label={label}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(242,230,201,0.16)] bg-[rgba(17,12,10,0.72)] text-lg text-[var(--color-accent-bright)]">
        {getRelicGlyph(relic)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-main)]">
          {label}
        </span>
        <span className="block text-[11px] tracking-[0.12em] text-[var(--color-text-muted)]">
          {relic.stacks && relic.stacks > 1 ? `层数 ${relic.stacks}` : '已装备'}
        </span>
      </span>
    </button>
  );
}

