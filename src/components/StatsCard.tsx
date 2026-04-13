import { useMemo, useState } from 'react';
import { BattlePriorityList } from './BattlePriorityList';
import { SkillManagerButton } from './SkillManagerButton';
import { SkillManagerModal } from './SkillManagerModal';
import type {
  BattleCooldownState,
  BattleSkillDefinition,
  BattleSkillId,
  BattleTacticCondition,
  BattleTacticSlot,
  Character,
} from '../types';
import { battleSkills } from '../core/constants';
import { HealthBar } from './ui/HealthBar';
import { Panel } from './ui/Panel';
import { StatusBadge } from './ui/StatusBadge';

interface StatsCardProps {
  title: string;
  character: Character;
  battleTactics?: BattleTacticSlot[];
  availableSkillIds?: BattleSkillId[];
  battleCooldowns?: BattleCooldownState;
  battleSkillsMap?: Record<BattleSkillId, BattleSkillDefinition>;
  onReorderBattlePriority?: (fromSkillId: BattleSkillId, toSkillId: BattleSkillId) => void;
  onSetBattleTacticCondition?: (skillId: BattleSkillId, condition: BattleTacticCondition) => void;
  onEnableBattleSkill?: (skillId: BattleSkillId) => void;
  onDisableBattleSkill?: (skillId: BattleSkillId) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function StatsCard({
  title,
  character,
  battleTactics = [],
  availableSkillIds,
  battleCooldowns,
  battleSkillsMap,
  onReorderBattlePriority,
  onSetBattleTacticCondition,
  onEnableBattleSkill,
  onDisableBattleSkill,
  onDragStateChange,
}: StatsCardProps) {
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const { stats } = character;
  const canEditPriority = battleTactics.length > 0 && battleCooldowns && onReorderBattlePriority;
  const canManageSkills = battleCooldowns && onEnableBattleSkill && onDisableBattleSkill && onReorderBattlePriority && onSetBattleTacticCondition;
  const effectiveSkillsMap = battleSkillsMap ?? battleSkills;
  const allSkillIds = useMemo(
    () => availableSkillIds ?? (Object.keys(effectiveSkillsMap) as BattleSkillId[]),
    [availableSkillIds, effectiveSkillsMap],
  );

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(242,230,201,0.12)] pb-4">
        <h3 className="m-0 text-lg font-bold tracking-[0.08em] text-[var(--color-text-main)]">
          {title}
        </h3>
        <StatusBadge tone="bright">Lv.{character.level}</StatusBadge>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <p className="m-0 text-xl font-bold text-[var(--color-text-main)]">{character.name}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">准备深入遗迹的见习冒险者</p>
        </div>

        <HealthBar value={stats.hp} max={stats.maxHp} />

        <ul className="grid list-none gap-2 p-0 text-sm text-[var(--color-text-muted)]">
          <li className="flex items-center justify-between rounded-xl bg-[rgba(242,230,201,0.04)] px-3 py-2">
            <span>力量</span>
            <span className="font-bold text-[var(--color-text-main)]">{stats.strength}</span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[rgba(242,230,201,0.04)] px-3 py-2">
            <span>敏捷</span>
            <span className="font-bold text-[var(--color-text-main)]">{stats.agility}</span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[rgba(96,165,250,0.08)] px-3 py-2">
            <span>格挡</span>
            <span className="font-bold text-sky-300">{character.block}</span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[rgba(195,138,51,0.08)] px-3 py-2">
            <span>金币</span>
            <span className="font-bold text-[var(--color-accent-bright)]">{character.gold}</span>
          </li>
        </ul>

        {canManageSkills ? (
          <SkillManagerButton
            activeCount={battleTactics.length}
            totalCount={allSkillIds.length}
            onClick={() => setIsSkillModalOpen(true)}
          />
        ) : null}

        {canEditPriority ? (
          <BattlePriorityList
            priority={battleTactics}
            cooldowns={battleCooldowns}
            skillsMap={effectiveSkillsMap}
            onReorder={onReorderBattlePriority}
            {...(onDragStateChange ? { onDragStateChange } : {})}
          />
        ) : null}

        {canManageSkills ? (
          <SkillManagerModal
            isOpen={isSkillModalOpen}
            priority={battleTactics}
            availableSkills={allSkillIds}
            skillsMap={effectiveSkillsMap}
            onClose={() => setIsSkillModalOpen(false)}
            onSetCondition={onSetBattleTacticCondition}
            onEnableSkill={onEnableBattleSkill}
            onDisableSkill={onDisableBattleSkill}
            onReorderSkill={onReorderBattlePriority}
          />
        ) : null}
      </div>
    </Panel>
  );
}
