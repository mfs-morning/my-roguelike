// 根据基础技能与局内修正，生成当前战斗中真正生效的技能数据。
import { applyRelicEnemySkillModifiers, applyRelicSkillModifiers } from '../relics/relics';
import { battleSkills, getEnemySkillDescription, getSkillEffectDescription } from '../skills/skills';
import { enemySkills } from '../skills/enemySkills';
import type {
  BattleSkillDefinition,
  BattleSkillId,
  BattleSkillRuntimeState,
  CharacterStats,
  EnemySkillDefinition,
  EnemySkillId,
  EnemySkillRuntimeState,
  RunRelic,
} from '../../types';

// 基于静态技能模板与局内修正，计算当前这局真正生效的技能数值。
export function getEffectiveSkill(
  skillId: BattleSkillId,
  runtimeState: BattleSkillRuntimeState = {},
  currentStats?: Pick<CharacterStats, 'strength' | 'agility'>,
  relics: RunRelic[] = [],
): BattleSkillDefinition {
  const baseSkill = battleSkills[skillId];
  const relicModifier = applyRelicSkillModifiers(skillId, baseSkill, relics);
  const runtimeModifier = runtimeState[skillId];
  const modifier = {
    cooldownOffset: (relicModifier?.cooldownOffset ?? 0) + (runtimeModifier?.cooldownOffset ?? 0),
    damageMultiplierBonus: (relicModifier?.damageMultiplierBonus ?? 0) + (runtimeModifier?.damageMultiplierBonus ?? 0),
    bonusDamage: (relicModifier?.bonusDamage ?? 0) + (runtimeModifier?.bonusDamage ?? 0),
    blockGainBonus: (relicModifier?.blockGainBonus ?? 0) + (runtimeModifier?.blockGainBonus ?? 0),
    extraEffects: [...(relicModifier?.extraEffects ?? []), ...(runtimeModifier?.extraEffects ?? [])],
  };
  const cooldown = Math.max(0, baseSkill.cooldown + (modifier?.cooldownOffset ?? 0));
  const numbers = {
    ...baseSkill.numbers,
    damageMultiplier: (baseSkill.numbers.damageMultiplier ?? 1) + (modifier?.damageMultiplierBonus ?? 0),
    bonusDamage: (baseSkill.numbers.bonusDamage ?? 0) + (modifier?.bonusDamage ?? 0),
    blockGain: (baseSkill.numbers.blockGain ?? 0) + (modifier?.blockGainBonus ?? 0),
    extraEffects: [...(baseSkill.numbers.extraEffects ?? []), ...(modifier?.extraEffects ?? [])],
  };

  return {
    ...baseSkill,
    cooldown,
    effectDescription: getSkillEffectDescription(
      {
        template: baseSkill.template,
        cooldown,
        numbers,
      },
      currentStats,
    ),
    numbers,
  };
}

export function getEffectiveEnemySkill(
  skillId: EnemySkillId,
  runtimeState: EnemySkillRuntimeState = {},
  currentStats?: Pick<CharacterStats, 'strength' | 'agility'>,
  relics: RunRelic[] = [],
): EnemySkillDefinition {
  const baseSkill = enemySkills[skillId];
  const relicModifier = applyRelicEnemySkillModifiers(skillId, baseSkill, relics);
  const runtimeModifier = runtimeState[skillId];
  const modifier = {
    cooldownOffset: (relicModifier?.cooldownOffset ?? 0) + (runtimeModifier?.cooldownOffset ?? 0),
    damageMultiplierBonus: (relicModifier?.damageMultiplierBonus ?? 0) + (runtimeModifier?.damageMultiplierBonus ?? 0),
    bonusDamage: (relicModifier?.bonusDamage ?? 0) + (runtimeModifier?.bonusDamage ?? 0),
    blockGainBonus: (relicModifier?.blockGainBonus ?? 0) + (runtimeModifier?.blockGainBonus ?? 0),
    extraEffects: [...(relicModifier?.extraEffects ?? []), ...(runtimeModifier?.extraEffects ?? [])],
  };
  const cooldown = Math.max(0, baseSkill.cooldown + (modifier?.cooldownOffset ?? 0));
  const numbers = {
    ...baseSkill.numbers,
    damageMultiplier: (baseSkill.numbers.damageMultiplier ?? 1) + (modifier?.damageMultiplierBonus ?? 0),
    bonusDamage: (baseSkill.numbers.bonusDamage ?? 0) + (modifier?.bonusDamage ?? 0),
    blockGain: (baseSkill.numbers.blockGain ?? 0) + (modifier?.blockGainBonus ?? 0),
    extraEffects: [...(baseSkill.numbers.extraEffects ?? []), ...(modifier?.extraEffects ?? [])],
  };

  return {
    ...baseSkill,
    cooldown,
    effectDescription: getEnemySkillDescription(
      {
        template: baseSkill.template,
        cooldown,
        numbers,
      },
      currentStats,
    ),
    numbers,
  };
}

// 为界面或批量逻辑生成一份当前局内的有效技能表。
export function getEffectiveSkillMap(
  runtimeState: BattleSkillRuntimeState = {},
  currentStats?: Pick<CharacterStats, 'strength' | 'agility'>,
  relics: RunRelic[] = [],
): Record<BattleSkillId, BattleSkillDefinition> {
  return Object.fromEntries(
    (Object.keys(battleSkills) as BattleSkillId[]).map((skillId) => [skillId, getEffectiveSkill(skillId, runtimeState, currentStats, relics)]),
  ) as Record<BattleSkillId, BattleSkillDefinition>;
}
