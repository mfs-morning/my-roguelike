import { HoverDetail } from './ui/HoverDetail';
import { StatusBadge } from './ui/StatusBadge';
import type { BattleSkillDefinition, BattleSkillExtraEffect } from '../types';

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

function formatExtraEffect(effect: BattleSkillExtraEffect) {
  const kindLabel = effect.kind === 'poison' ? '中毒' : '流血';
  const targetLabel = effect.target === 'enemy' ? '敌方' : '自身';
  const durationText = effect.duration ? `，持续 ${effect.duration} 回合` : '';
  return `${targetLabel}附加${kindLabel} ${effect.value} 点${durationText}`;
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
  const extraEffectText = skill.numbers.extraEffects?.map(formatExtraEffect).join('；');

  return (
    <HoverDetail
      align="right"
      title={skill.label}
      description={extraEffectText ? `${skill.description} ${extraEffectText}` : skill.description}
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
