import { skillTemplates } from './skillTemplates';
import { getEffectiveSkill } from './effectiveSkills';
import { applySkillStatusEffects, resolveStartOfTurnStatusEffects } from './statusEffects';
import type { BattleRoundResult, BattleSkillId, BattleSkillRuntimeState, Character, Enemy } from '../types';

// 计算本次攻击的基础伤害，至少造成 1 点。
function getBaseDamage(attack: number, defense: number) {
  return Math.max(1, attack - defense);
}

// 先由格挡吸收伤害，再结算生命与剩余格挡。
function applyDamage(currentHp: number, currentBlock: number, incomingDamage: number) {
  const absorbed = Math.min(currentBlock, incomingDamage);
  const damageTaken = Math.max(0, incomingDamage - absorbed);

  return {
    remainingHp: Math.max(0, currentHp - damageTaken),
    remainingBlock: Math.max(0, currentBlock - incomingDamage),
    damageTaken,
  };
}

// 统一处理敌方反击伤害修正，方便后续接入减伤或易伤类效果。
function getModifiedEnemyDamage(baseEnemyDamage: number, effect: ReturnType<(typeof skillTemplates)[keyof typeof skillTemplates]>) {
  const enemyDamageMultiplier = effect.enemyDamageMultiplier ?? 1;
  const enemyBonusDamage = effect.enemyBonusDamage ?? 0;

  return Math.max(0, Math.floor(baseEnemyDamage * enemyDamageMultiplier) + enemyBonusDamage);
}

// 根据当前编排自动选择英雄动作，再结算一轮互相攻击与 DOT。
export function simulateBattleRound(
  hero: Character,
  enemy: Enemy,
  heroSkillId: BattleSkillId,
  runtimeState: BattleSkillRuntimeState = {},
): BattleRoundResult {
  const logs: string[] = [];

  const heroStatusResult = resolveStartOfTurnStatusEffects({
    actorName: hero.name,
    statusEffects: hero.statusEffects,
    currentHp: hero.stats.hp,
    currentBlock: hero.block,
  });
  logs.push(...heroStatusResult.logs);

  if (heroStatusResult.remainingHp <= 0) {
    logs.push(`${hero.name} 因持续伤害倒下。`);

    return {
      heroSkillId,
      heroDamage: 0,
      enemyDamage: 0,
      heroBlockGain: 0,
      heroRemainingHp: heroStatusResult.remainingHp,
      enemyRemainingHp: enemy.stats.hp,
      heroRemainingBlock: heroStatusResult.remainingBlock,
      enemyRemainingBlock: enemy.block,
      heroStatusEffects: heroStatusResult.statusEffects,
      enemyStatusEffects: enemy.statusEffects,
      actionSummary: '未能行动',
      logTexts: logs,
    };
  }

  const heroAfterStatus: Character = {
    ...hero,
    block: heroStatusResult.remainingBlock,
    statusEffects: heroStatusResult.statusEffects,
    stats: {
      ...hero.stats,
      hp: heroStatusResult.remainingHp,
    },
  };

  const baseHeroDamage = getBaseDamage(heroAfterStatus.stats.attack, enemy.stats.defense);
  const baseEnemyDamage = getBaseDamage(enemy.stats.attack, heroAfterStatus.stats.defense);
  const skill = getEffectiveSkill(heroSkillId, runtimeState);
  const effect = skillTemplates[skill.template](
    {
      hero: heroAfterStatus,
      enemy,
      baseHeroDamage,
      baseEnemyDamage,
    },
    skill,
  );

  const enemyAfterHeroHit = applyDamage(enemy.stats.hp, enemy.block, effect.heroDamage);
  const effectApplication = applySkillStatusEffects({
    hero: heroAfterStatus,
    enemy: {
      ...enemy,
      block: enemyAfterHeroHit.remainingBlock,
      stats: {
        ...enemy.stats,
        hp: enemyAfterHeroHit.remainingHp,
      },
    },
    effects: (effect.extraEffects ?? []).filter((extraEffect) => extraEffect.target === 'hero' || enemyAfterHeroHit.remainingHp > 0),
  });

  const heroStatusAfterSkill = effectApplication.heroStatusEffects;
  const enemyStatusAfterSkill = effectApplication.enemyStatusEffects;

  logs.push(...effectApplication.logs);

  const enemyStatusResult = resolveStartOfTurnStatusEffects({
    actorName: enemy.name,
    statusEffects: enemyStatusAfterSkill,
    currentHp: enemyAfterHeroHit.remainingHp,
    currentBlock: enemyAfterHeroHit.remainingBlock,
  });
  logs.push(...enemyStatusResult.logs);

  const enemyCanAct = enemyStatusResult.remainingHp > 0;
  const enemyDamage = enemyCanAct ? getModifiedEnemyDamage(baseEnemyDamage, effect) : 0;
  const heroAfterEnemyHit = applyDamage(
    heroAfterStatus.stats.hp,
    heroAfterStatus.block + effect.heroBlockGain,
    enemyDamage,
  );

  logs.unshift(
    enemyDamage > 0
      ? `${hero.name} ${effect.summary}，造成 ${effect.heroDamage} 点伤害，承受 ${heroAfterEnemyHit.damageTaken} 点伤害。`
      : `${hero.name} ${effect.summary}，造成 ${effect.heroDamage} 点伤害。`,
  );

  if (effect.heroBlockGain > 0) {
    logs.push(`${hero.name} 当前剩余 ${heroAfterEnemyHit.remainingBlock} 点格挡。`);
  }

  if (!enemyCanAct && enemyStatusResult.remainingHp <= 0 && enemyAfterHeroHit.remainingHp > 0) {
    logs.push(`${enemy.name} 因持续伤害倒下。`);
  }

  return {
    heroSkillId,
    heroDamage: effect.heroDamage,
    enemyDamage: heroAfterEnemyHit.damageTaken,
    heroBlockGain: effect.heroBlockGain,
    heroRemainingHp: heroAfterEnemyHit.remainingHp,
    enemyRemainingHp: enemyStatusResult.remainingHp,
    heroRemainingBlock: heroAfterEnemyHit.remainingBlock,
    enemyRemainingBlock: enemyStatusResult.remainingBlock,
    heroStatusEffects: heroStatusAfterSkill,
    enemyStatusEffects: enemyStatusResult.statusEffects,
    actionSummary: effect.summary,
    logTexts: logs,
  };
}
