import { useState } from 'react';
import type { BattleCooldownState, BattleSkillDefinition, BattleSkillId } from '../types';
import { BattleSkillCard } from './BattleSkillCard';
import { StatusBadge } from './ui/StatusBadge';

interface BattlePriorityListProps {
  priority: BattleSkillId[];
  cooldowns: BattleCooldownState;
  skillsMap: Record<BattleSkillId, BattleSkillDefinition>;
  onReorder: (fromSkillId: BattleSkillId, toSkillId: BattleSkillId) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function BattlePriorityList({ priority, cooldowns, skillsMap, onReorder, onDragStateChange }: BattlePriorityListProps) {
  const [draggingSkillId, setDraggingSkillId] = useState<BattleSkillId | null>(null);
  const [hoverSkillId, setHoverSkillId] = useState<BattleSkillId | null>(null);

  return (
    <div className="rounded-2xl border border-[rgba(242,230,201,0.1)] bg-[rgba(242,230,201,0.03)] p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(242,230,201,0.12)] pb-3">
        <h3 className="m-0 text-lg font-bold tracking-[0.08em] text-[var(--color-text-main)]">技能优先级</h3>
        <StatusBadge>Auto Queue</StatusBadge>
      </div>

      <div className="mt-4 grid gap-3">
        {priority.map((skillId, index) => (
          <div
            key={skillId}
            className={hoverSkillId === skillId && draggingSkillId !== skillId ? 'rounded-2xl ring-1 ring-[rgba(240,193,91,0.35)]' : ''}
          >
            <BattleSkillCard
              skill={skillsMap[skillId]}
              cooldown={cooldowns[skillId]}
              isDragging={draggingSkillId === skillId}
              onDragStart={() => {
                setDraggingSkillId(skillId);
                onDragStateChange?.(true);
              }}
              onDragOver={() => setHoverSkillId(skillId)}
              onDrop={() => {
                if (draggingSkillId && draggingSkillId !== skillId) {
                  onReorder(draggingSkillId, skillId);
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

