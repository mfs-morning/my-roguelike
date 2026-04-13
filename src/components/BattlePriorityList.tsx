import { useState } from 'react';
import type { BattleCooldownState, BattleSkillDefinition, BattleSkillId, BattleTacticSlot } from '../types';
import { BattleSkillCard } from './BattleSkillCard';
import { StatusBadge } from './ui/StatusBadge';

interface BattlePriorityListProps {
  priority: BattleTacticSlot[];
  cooldowns: BattleCooldownState;
  skillsMap: Record<BattleSkillId, BattleSkillDefinition>;
  onReorder: (fromSkillId: BattleSkillId, toSkillId: BattleSkillId) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

function getConditionLabel(slot: BattleTacticSlot) {
  if (slot.condition.kind === 'always') {
    return '始终释放';
  }

  if (slot.condition.kind === 'enemy_hp_below_percent') {
    return `敌方生命 < ${slot.condition.value}%`;
  }

  return `自身生命 < ${slot.condition.value}%`;
}

export function BattlePriorityList({ priority, cooldowns, skillsMap, onReorder, onDragStateChange }: BattlePriorityListProps) {
  const [draggingSkillId, setDraggingSkillId] = useState<BattleSkillId | null>(null);
  const [hoverSkillId, setHoverSkillId] = useState<BattleSkillId | null>(null);

  return (
    <div className="rounded-2xl border border-[rgba(242,230,201,0.1)] bg-[rgba(242,230,201,0.03)] p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(242,230,201,0.12)] pb-3">
        <h3 className="m-0 text-lg font-bold tracking-[0.08em] text-[var(--color-text-main)]">战术槽顺序</h3>
        <StatusBadge>Auto Queue</StatusBadge>
      </div>

      <div className="mt-4 grid gap-3">
        {priority.map((slot) => (
          <div
            key={slot.skillId}
            className={hoverSkillId === slot.skillId && draggingSkillId !== slot.skillId ? 'rounded-2xl ring-1 ring-[rgba(240,193,91,0.35)]' : ''}
          >
            <BattleSkillCard
              skill={skillsMap[slot.skillId]}
              cooldown={cooldowns[slot.skillId]}
              footerText={getConditionLabel(slot)}
              isDragging={draggingSkillId === slot.skillId}
              onDragStart={() => {
                setDraggingSkillId(slot.skillId);
                onDragStateChange?.(true);
              }}
              onDragOver={() => setHoverSkillId(slot.skillId)}
              onDrop={() => {
                if (draggingSkillId && draggingSkillId !== slot.skillId) {
                  onReorder(draggingSkillId, slot.skillId);
                }
                setDraggingSkillId(null);
                setHoverSkillId(null);
                onDragStateChange?.(false);
              }}
              onDragEnd={() => {
                setDraggingSkillId(null);
                setHoverSkillId(null);
                onDragStateChange?.(false);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
