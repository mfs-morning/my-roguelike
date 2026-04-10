import type {
  BattleSkillDefinition,
  BattleSkillEffectContext,
  BattleSkillEffectResult,
  BattleSkillTemplateId,
} from '../types';

// 普通进攻模板：根据倍率和附加值计算英雄伤害。
function attackTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const damageMultiplier = definition.numbers.damageMultiplier ?? 1;
  const bonusDamage = definition.numbers.bonusDamage ?? 0;

  return {
    heroDamage: Math.max(1, Math.floor(context.baseHeroDamage * damageMultiplier) + bonusDamage),
    heroBlockGain: definition.numbers.blockGain ?? 0,
    enemyDamageMultiplier: 1,
    enemyBonusDamage: 0,
    extraEffects: definition.numbers.extraEffects ?? [],
    summary: `使用${definition.label}`,
  };
}

// 防御模板：主要提供格挡，也允许保留少量固定伤害扩展位。
function gainBlockTemplate(
  _context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const blockGain = definition.numbers.blockGain ?? 0;

  return {
    heroDamage: Math.max(0, definition.numbers.bonusDamage ?? 0),
    heroBlockGain: blockGain,
    enemyDamageMultiplier: 1,
    enemyBonusDamage: 0,
    extraEffects: definition.numbers.extraEffects ?? [],
    summary: `使用${definition.label}，获得 ${blockGain} 点格挡`,
  };
}

export const skillTemplates: Record<
  BattleSkillTemplateId,
  (context: BattleSkillEffectContext, definition: BattleSkillDefinition) => BattleSkillEffectResult
> = {
  attack: attackTemplate,
  gainBlock: gainBlockTemplate,
};

