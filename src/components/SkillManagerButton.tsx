interface SkillManagerButtonProps {
  activeCount: number;
  totalCount: number;
  onClick: () => void;
}

export function SkillManagerButton({ activeCount, totalCount, onClick }: SkillManagerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-[rgba(240,193,91,0.18)] bg-[linear-gradient(180deg,rgba(240,193,91,0.1),rgba(240,193,91,0.04))] p-4 text-left transition-all duration-200 hover:border-[rgba(240,193,91,0.32)] hover:bg-[linear-gradient(180deg,rgba(240,193,91,0.14),rgba(240,193,91,0.07))]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-bold tracking-[0.08em] text-[var(--color-text-main)]">技能编组</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">启用 ⇄ 待命</p>
        </div>
        <span className="rounded-full border border-[rgba(240,193,91,0.22)] bg-[rgba(240,193,91,0.08)] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-[var(--color-accent-bright)]">
          {activeCount}/{totalCount}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-end text-sm text-[var(--color-text-main)] transition-transform duration-200 group-hover:translate-x-0.5">
        ↔
      </div>
    </button>
  );
}

