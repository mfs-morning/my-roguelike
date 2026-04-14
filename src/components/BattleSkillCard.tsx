import { HoverDetail } from './ui/HoverDetail';
import { StatusBadge } from './ui/StatusBadge';
import type { BattleSkillDefinition } from '../types';

interface BattleSkillCardProps {
  skill: BattleSkillDefinition;
  cooldown: number;
  footerText?: string;
  isDragging?: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export function BattleSkillCard({
  skill,
  cooldown,
  footerText,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: BattleSkillCardProps) {
  const ready = cooldown === 0;
  const hoverDescription = `${skill.description} ${skill.effectDescription}`.trim();

  return (
    <HoverDetail
      align="right"
      title={skill.label}
      description={hoverDescription}
      className="w-full"
      trigger={
        <div
          draggable
          onDragStart={onDragStart}
          onDragOver={(event) => {
            event.preventDefault();
            onDragOver();
          }}
          onDrop={(event) => {
            event.preventDefault();
            onDrop();
          }}
          onDragEnd={onDragEnd}
          className={[
            'grid w-full gap-3 rounded-2xl border px-4 py-3 transition-all duration-150',
            isDragging
              ? 'scale-[0.985] border-[rgba(240,193,91,0.32)] bg-[rgba(240,193,91,0.08)] opacity-70'
              : 'border-[rgba(242,230,201,0.1)] bg-[rgba(0,0,0,0.16)] hover:border-[rgba(240,193,91,0.24)] hover:bg-[rgba(242,230,201,0.05)]',
          ].join(' ')}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <strong className="truncate text-sm tracking-[0.06em] text-[var(--color-text-main)]">
                {skill.label}
              </strong>
              <StatusBadge tone={ready ? 'accent' : 'bright'} className="shrink-0 px-2.5 py-0.5 text-[10px]">
                {ready ? '就绪' : `冷却 ${cooldown}`}
              </StatusBadge>
            </div>

            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[rgba(242,230,201,0.12)] bg-[rgba(242,230,201,0.04)] text-base leading-none text-[var(--color-text-muted)]">
              ⋮⋮
            </span>
          </div>

          {footerText ? <p className="m-0 text-xs text-[var(--color-accent-bright)]">{footerText}</p> : null}
        </div>
      }
    />
  );
}
