// 提供可复用的技能模板实现，按模板类型生成基础技能效果。
import type {
  BattleSkillDefinition,
  BattleSkillEffectContext,
  BattleSkillEffectResult,
  BattleSkillTemplateId,
} from '../../types';

function buildAttackResult(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
  damageMultiplier = definition.numbers.damageMultiplier ?? 1,
  bonusDamage = definition.numbers.bonusDamage ?? 0,
): BattleSkillEffectResult {
  return {
    heroDamage: Math.max(1, Math.floor(context.baseHeroDamage * damageMultiplier) + bonusDamage),
    heroBlockGain: definition.numbers.blockGain ?? 0,
    splashDamage: 0,
    ignoreFrontTargeting: false,
    enemyDamageMultiplier: 1,
    enemyBonusDamage: 0,
    extraEffects: definition.numbers.extraEffects ?? [],
    summary: `使用${definition.label}`,
  };
}

// 普通进攻模板：根据倍率和附加值计算英雄伤害。
function attackTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  return buildAttackResult(context, definition);
}

// 防御模板：主要提供格挡，也允许保留少量固定伤害扩展位。
function gainBlockTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const blockMultiplier = 1;
  const blockGain = Math.max(0, Math.floor(context.hero.stats.agility * blockMultiplier) + (definition.numbers.blockGain ?? 0));

  return {
    heroDamage: Math.max(0, definition.numbers.bonusDamage ?? 0),
    heroBlockGain: blockGain,
    splashDamage: 0,
    ignoreFrontTargeting: false,
    enemyDamageMultiplier: 1,
    enemyBonusDamage: 0,
    extraEffects: definition.numbers.extraEffects ?? [],
    summary: `使用${definition.label}，获得 ${blockGain} 点格挡`,
  };
}

// 范围模板：对所有目标造成相同伤害。
function aoeTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const attackResult = buildAttackResult(context, definition);

  return {
    ...attackResult,
    splashDamage: attackResult.heroDamage,
    summary: `使用${definition.label}，打击全体敌人`,
  };
}

// 溅射突刺模板：优先打前排，但会把部分伤害溅到后排。
function splashStrikeTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const primaryDamageMultiplier = definition.numbers.primaryDamageMultiplier ?? definition.numbers.damageMultiplier ?? 1;
  const primaryBonusDamage = definition.numbers.primaryBonusDamage ?? definition.numbers.bonusDamage ?? 0;
  const attackResult = buildAttackResult(context, definition, primaryDamageMultiplier, primaryBonusDamage);
  const splashDamageMultiplier = definition.numbers.splashDamageMultiplier ?? 0.35;
  const splashBonusDamage = definition.numbers.splashBonusDamage ?? 0;

  return {
    ...attackResult,
    splashDamage: Math.max(0, Math.floor(context.baseHeroDamage * splashDamageMultiplier) + splashBonusDamage),
    summary: `使用${definition.label}，将冲击传到后排`,
  };
}

// 处决模板：敌人血量低于阈值时额外增伤。
function executeTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const threshold = definition.numbers.executeThresholdPercent ?? 35;
  const executeMultiplier = definition.numbers.executeDamageMultiplier ?? 1.75;
  const enemyHpPercent = context.enemy.stats.maxHp > 0 ? (context.enemy.stats.hp / context.enemy.stats.maxHp) * 100 : 0;
  const triggered = enemyHpPercent <= threshold;

  return {
    ...buildAttackResult(
      context,
      definition,
      triggered ? executeMultiplier : definition.numbers.damageMultiplier ?? 1,
      definition.numbers.bonusDamage ?? 0,
    ),
    summary: triggered ? `使用${definition.label}，命中处决区间` : `使用${definition.label}`,
  };
}

// 攻防一体模板：造成伤害并同时获取格挡。
function gainBlockAttackTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const attackResult = buildAttackResult(context, definition);
  const blockGain = Math.max(0, Math.floor(context.hero.stats.agility * 0.6) + (definition.numbers.blockGain ?? 0));

  return {
    ...attackResult,
    heroBlockGain: blockGain,
    summary: `使用${definition.label}，同时稳住防线`,
  };
}

// 状态爆发模板：根据目标已有流血/中毒层数追加伤害。
function statusBurstTemplate(
  context: BattleSkillEffectContext,
  definition: BattleSkillDefinition,
): BattleSkillEffectResult {
  const baseResult = buildAttackResult(context, definition);
  const statusBurstPerStack = definition.numbers.statusBurstPerStack ?? 1;
  const totalStatusStacks = context.enemy.statusEffects.reduce((sum, effect) => sum + effect.value, 0);

  return {
    ...baseResult,
    heroDamage: baseResult.heroDamage + totalStatusStacks * statusBurstPerStack,
    summary: totalStatusStacks > 0 ? `使用${definition.label}，引爆目标身上的异常状态` : `使用${definition.label}`,
  };
}

export const skillTemplates: Record<
  BattleSkillTemplateId,
  (context: BattleSkillEffectContext, definition: BattleSkillDefinition) => BattleSkillEffectResult
> = {
  attack: attackTemplate,
  gainBlock: gainBlockTemplate,
  aoe: aoeTemplate,
  splashStrike: splashStrikeTemplate,
  execute: executeTemplate,
  gainBlockAttack: gainBlockAttackTemplate,
  statusBurst: statusBurstTemplate,
};
