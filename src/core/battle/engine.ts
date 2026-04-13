// 负责结算完整战斗回合，包括技能效果、持续伤害、格挡与胜负结果。
import { skillTemplates } from '../skills/skillTemplates';
import { pickEnemySkill, updateEnemyCooldowns } from './battlePriority';
import { getEffectiveEnemySkill, getEffectiveSkill } from './effectiveSkills';
import { applySkillStatusEffects, resolveStartOfTurnStatusEffects } from './statusEffects';
import type { BattleRoundResult, BattleSkillId, BattleSkillRuntimeState, Character, Enemy } from '../../types';

// 计算本次攻击的基础伤害，至少造成 1 点。
function getBaseDamage(strength: number, agility: number) {
  return Math.max(1, strength - agility);
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

function resolveEnemySkill(hero: Character, enemy: Enemy, enemySkillId: NonNullable<BattleRoundResult['enemySkillId']>) {
  const enemySkill = getEffectiveEnemySkill(enemySkillId, enemy.enemySkillRuntimeState, enemy.stats);
  const baseEnemyDamage = getBaseDamage(enemy.stats.strength, hero.stats.agility);
  const effect = skillTemplates[enemySkill.template](
    {
      hero,
      enemy,
      baseHeroDamage: getBaseDamage(hero.stats.strength, enemy.stats.agility),
      baseEnemyDamage,
    },
    {
      ...enemySkill,
      id: 'attack',
      classId: 'warrior',
      tags: ['warrior', 'strike'],
      availableConditions: ['always'],
    },
  );

  const heroAfterEnemyHit = applyDamage(hero.stats.hp, hero.block, effect.heroDamage);
  const effectApplication = applySkillStatusEffects({
    hero: {
      ...hero,
      block: heroAfterEnemyHit.remainingBlock,
      stats: {
        ...hero.stats,
        hp: heroAfterEnemyHit.remainingHp,
      },
    },
    enemy,
    effects: effect.extraEffects ?? [],
  });

  const nextEnemy: Enemy = {
    ...enemy,
    block: enemy.block + effect.heroBlockGain,
    statusEffects: effectApplication.enemyStatusEffects,
  };
  const nextHero: Character = {
    ...hero,
    block: heroAfterEnemyHit.remainingBlock,
    statusEffects: effectApplication.heroStatusEffects,
    stats: {
      ...hero.stats,
      hp: heroAfterEnemyHit.remainingHp,
    },
  };

  const logs = [
    effect.heroDamage > 0
      ? `${enemy.name} 使用${enemySkill.label}，造成 ${heroAfterEnemyHit.damageTaken} 点伤害。`
      : `${enemy.name} 使用${enemySkill.label}。`,
    ...effectApplication.logs,
  ];

  if (effect.heroBlockGain > 0) {
    logs.push(`${enemy.name} 当前获得 ${effect.heroBlockGain} 点格挡。`);
  }

  return {
    nextHero,
    nextEnemy,
    enemyDamageTaken: heroAfterEnemyHit.damageTaken,
    logs,
  };
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
      enemySkillId: null,
      nextEnemyCooldowns: enemy.enemyCooldowns,
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

  const baseHeroDamage = getBaseDamage(heroAfterStatus.stats.strength, enemy.stats.agility);
  const baseEnemyDamage = getBaseDamage(enemy.stats.strength, heroAfterStatus.stats.agility);
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
  const heroWithBlock: Character = {
    ...heroAfterStatus,
    block: heroAfterStatus.block + effect.heroBlockGain,
    statusEffects: heroStatusAfterSkill,
  };
  const enemyReady: Enemy = {
    ...enemy,
    block: enemyStatusResult.remainingBlock,
    statusEffects: enemyStatusResult.statusEffects,
    stats: {
      ...enemy.stats,
      hp: enemyStatusResult.remainingHp,
    },
  };
  const enemySkillId = enemyCanAct
    ? pickEnemySkill(enemy.tacticsProfile.tactics, enemy.enemyCooldowns, heroWithBlock, enemyReady)
    : null;
  const enemyActionResult = enemyCanAct && enemySkillId
    ? resolveEnemySkill(heroWithBlock, enemyReady, enemySkillId)
    : {
        nextHero: heroWithBlock,
        nextEnemy: enemyReady,
        enemyDamageTaken: 0,
        logs: [] as string[],
      };
  const nextEnemyCooldowns = updateEnemyCooldowns(enemy.enemyCooldowns, enemySkillId, enemy.enemySkillRuntimeState);

  logs.unshift(
    enemyActionResult.enemyDamageTaken > 0
      ? `${hero.name} ${effect.summary}，造成 ${effect.heroDamage} 点伤害，承受 ${enemyActionResult.enemyDamageTaken} 点伤害。`
      : `${hero.name} ${effect.summary}，造成 ${effect.heroDamage} 点伤害。`,
  );
  logs.push(...enemyActionResult.logs);

  if (effect.heroBlockGain > 0 || enemyActionResult.nextHero.block > 0) {
    logs.push(`${hero.name} 当前剩余 ${enemyActionResult.nextHero.block} 点格挡。`);
  }

  if (!enemyCanAct && enemyStatusResult.remainingHp <= 0 && enemyAfterHeroHit.remainingHp > 0) {
    logs.push(`${enemy.name} 因持续伤害倒下。`);
  }

  return {
    heroSkillId,
    enemySkillId,
    nextEnemyCooldowns,
    heroDamage: effect.heroDamage,
    enemyDamage: enemyActionResult.enemyDamageTaken,
    heroBlockGain: effect.heroBlockGain,
    heroRemainingHp: enemyActionResult.nextHero.stats.hp,
    enemyRemainingHp: enemyActionResult.nextEnemy.stats.hp,
    heroRemainingBlock: enemyActionResult.nextHero.block,
    enemyRemainingBlock: enemyActionResult.nextEnemy.block,
    heroStatusEffects: enemyActionResult.nextHero.statusEffects,
    enemyStatusEffects: enemyActionResult.nextEnemy.statusEffects,
    actionSummary: effect.summary,
    logTexts: logs,
  };
}
