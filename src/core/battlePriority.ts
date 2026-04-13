import { getEffectiveSkill } from './effectiveSkills';
import type {
  BattleCooldownState,
  BattleSkillId,
  BattleSkillRuntimeState,
  BattleTacticCondition,
  BattleTacticSlot,
  Character,
  Enemy,
} from '../types';

function getHpPercent(currentHp: number, maxHp: number) {
  if (maxHp <= 0) {
    return 0;
  }

  return (currentHp / maxHp) * 100;
}

export function doesTacticConditionMatch(
  condition: BattleTacticCondition,
  hero: Character,
  enemy: Enemy,
) {
  if (condition.kind === 'always') {
    return true;
  }

  if (condition.kind === 'enemy_hp_below_percent') {
    return getHpPercent(enemy.stats.hp, enemy.stats.maxHp) < condition.value;
  }

  return getHpPercent(hero.stats.hp, hero.stats.maxHp) < condition.value;
}

export function moveSkill(tactics: BattleTacticSlot[], skillId: BattleSkillId, direction: 'up' | 'down') {
  const index = tactics.findIndex((slot) => slot.skillId === skillId);
  if (index < 0) {
    return tactics;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= tactics.length) {
    return tactics;
  }

  const next = [...tactics];
  [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
  return next;
}

export function reorderSkills(tactics: BattleTacticSlot[], fromSkillId: BattleSkillId, toSkillId: BattleSkillId) {
  const fromIndex = tactics.findIndex((slot) => slot.skillId === fromSkillId);
  const toIndex = tactics.findIndex((slot) => slot.skillId === toSkillId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return tactics;
  }

  const next = [...tactics];
  const [movedSkill] = next.splice(fromIndex, 1);
  if (!movedSkill) {
    return tactics;
  }

  next.splice(toIndex, 0, movedSkill);
  return next;
}

export function pickHeroSkill(
  tactics: BattleTacticSlot[],
  cooldowns: BattleCooldownState,
  hero: Character,
  enemy: Enemy,
) {
  return (
    tactics.find((slot) => cooldowns[slot.skillId] === 0 && doesTacticConditionMatch(slot.condition, hero, enemy))?.skillId ??
    'attack'
  );
}

// 根据当前局内技能配置更新冷却，支持升级后冷却减少等效果。
export function updateCooldowns(
  cooldowns: BattleCooldownState,
  usedSkillId: BattleSkillId,
  runtimeState: BattleSkillRuntimeState = {},
) {
  const next = Object.fromEntries(
    Object.entries(cooldowns).map(([skillId, value]) => [skillId, Math.max(0, value - 1)]),
  ) as BattleCooldownState;

  next[usedSkillId] = getEffectiveSkill(usedSkillId, runtimeState).cooldown;
  return next;
}
