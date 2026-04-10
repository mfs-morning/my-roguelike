import { getEffectiveSkill } from './effectiveSkills';
import type { BattleCooldownState, BattleSkillId, BattleSkillRuntimeState } from '../types';

export function moveSkill(priority: BattleSkillId[], skillId: BattleSkillId, direction: 'up' | 'down') {
  const index = priority.indexOf(skillId);
  if (index < 0) {
    return priority;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= priority.length) {
    return priority;
  }

  const next = [...priority];
  [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
  return next;
}

export function reorderSkills(priority: BattleSkillId[], fromSkillId: BattleSkillId, toSkillId: BattleSkillId) {
  const fromIndex = priority.indexOf(fromSkillId);
  const toIndex = priority.indexOf(toSkillId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return priority;
  }

  const next = [...priority];
  const [movedSkill] = next.splice(fromIndex, 1);
  if (!movedSkill) {
    return priority;
  }

  next.splice(toIndex, 0, movedSkill);
  return next;
}

export function pickHeroSkill(priority: BattleSkillId[], cooldowns: BattleCooldownState) {
  return priority.find((skillId) => cooldowns[skillId] === 0) ?? 'attack';
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

