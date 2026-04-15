// 负责结算完整战斗回合，包括技能效果、持续伤害、格挡与胜负结果。
import { skillTemplates } from '../skills/skillTemplates';
import { pickEnemySkill, updateEnemyCooldowns } from './battlePriority';
import { getEffectiveEnemySkill, getEffectiveSkill } from './effectiveSkills';
import { applySkillStatusEffects, resolveStartOfTurnStatusEffects } from './statusEffects';
import type { BattleLogEntry, BattleRoundResult, BattleSkillId, BattleSkillRuntimeState, Character, Enemy, EnemySkillId } from '../../types';

// 计算本次攻击的基础伤害，至少造成 1 点。
function getBaseDamage(strength: number, agility: number) {
  return Math.max(1, strength - agility);
}

// 先由格挡吸收伤害，再结算生命与剩余格挡。
function applyDamage(currentHp: number, currentBlock: number, incomingDamage: number) {
  const absorbed = Math.min(currentBlock, incomingDamage);
  const damageTaken = Math.max(0, incomingDamage - absorbed);

  return {
    absorbed,
    remainingHp: Math.max(0, currentHp - damageTaken),
    remainingBlock: Math.max(0, currentBlock - incomingDamage),
    damageTaken,
  };
}

function resolveEnemySkill(hero: Character, enemy: Enemy, enemySkillId: EnemySkillId) {
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

  const logs: Omit<BattleLogEntry, 'id'>[] = [
    {
      kind: 'enemy_action',
      actor: enemy.name,
      text: `${enemy.name} 使用${enemySkill.label}，${formatDamageOutcome(hero.name, effect.heroDamage, heroAfterEnemyHit.damageTaken, heroAfterEnemyHit.absorbed)}。`,
    },
    ...effectApplication.logs,
  ];

  if (effect.heroBlockGain > 0) {
    logs.push({
      kind: 'status',
      actor: enemy.name,
      text: `${enemy.name} 当前获得 ${effect.heroBlockGain} 点格挡。`,
    });
  }

  return {
    nextHero,
    nextEnemy,
    enemyDamageTaken: heroAfterEnemyHit.damageTaken,
    logs,
  };
}

function resolveSingleEnemyTurn(hero: Character, enemy: Enemy) {
  const enemySkillId = pickEnemySkill(enemy.tacticsProfile.tactics, enemy.enemyCooldowns, hero, enemy);
  const actionResult = enemySkillId
    ? resolveEnemySkill(hero, enemy, enemySkillId)
    : {
        nextHero: hero,
        nextEnemy: enemy,
        enemyDamageTaken: 0,
        logs: [] as Omit<BattleLogEntry, 'id'>[],
      };

  return {
    enemySkillId,
    nextHero: actionResult.nextHero,
    nextEnemy: {
      ...actionResult.nextEnemy,
      enemyCooldowns: updateEnemyCooldowns(enemy.enemyCooldowns, enemySkillId, enemy.enemySkillRuntimeState),
    },
    damageTaken: actionResult.enemyDamageTaken,
    logs: actionResult.logs,
  };
}

function collapseFormation(frontEnemy: Enemy | null, backEnemy: Enemy | null) {
  if (frontEnemy && frontEnemy.stats.hp > 0) {
    return { frontEnemy, backEnemy: backEnemy && backEnemy.stats.hp > 0 ? backEnemy : null, promoted: false };
  }

  if (backEnemy && backEnemy.stats.hp > 0) {
    return { frontEnemy: backEnemy, backEnemy: null, promoted: true };
  }

  return { frontEnemy: null, backEnemy: null, promoted: false };
}

// 根据当前编排自动选择英雄动作，再结算一轮互相攻击与 DOT。
export function simulateBattleRound(
  hero: Character,
  enemy: Enemy,
  backEnemy: Enemy | null,
  heroSkillId: BattleSkillId,
  runtimeState: BattleSkillRuntimeState = {},
): BattleRoundResult {
  const logs: Omit<BattleLogEntry, 'id'>[] = [];

  const heroStatusResult = resolveStartOfTurnStatusEffects({
    actorName: hero.name,
    statusEffects: hero.statusEffects,
    currentHp: hero.stats.hp,
    currentBlock: hero.block,
  });
  logs.push(...heroStatusResult.logs);

  if (heroStatusResult.remainingHp <= 0) {
    logs.push({
      kind: 'result',
      actor: hero.name,
      text: `${hero.name} 因持续伤害倒下。`,
    });

    return {
      heroSkillId,
      enemySkillIds: [],
      nextEnemyCooldowns: enemy.enemyCooldowns,
      nextBackEnemyCooldowns: backEnemy?.enemyCooldowns ?? null,
      heroDamage: 0,
      enemyDamage: 0,
      heroBlockGain: 0,
      nextEnemy: enemy,
      nextBackEnemy: backEnemy,
      heroRemainingHp: heroStatusResult.remainingHp,
      heroRemainingBlock: heroStatusResult.remainingBlock,
      heroStatusEffects: heroStatusResult.statusEffects,
      actionSummary: '未能行动',
      logEntries: logs,
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

  logs.push({
    kind: 'hero_action',
    actor: hero.name,
    text: `${hero.name} ${effect.summary}，${formatDamageOutcome(enemy.name, effect.heroDamage, enemyAfterHeroHit.damageTaken, enemyAfterHeroHit.absorbed)}${totalSuffix(effect.heroBlockGain)}。`,
  });
  logs.push(...effectApplication.logs);

  const frontStatusResult = resolveStartOfTurnStatusEffects({
    actorName: enemy.name,
    statusEffects: effectApplication.enemyStatusEffects,
    currentHp: enemyAfterHeroHit.remainingHp,
    currentBlock: enemyAfterHeroHit.remainingBlock,
  });
  logs.push(...frontStatusResult.logs);

  let nextFrontEnemy: Enemy | null = {
    ...enemy,
    block: frontStatusResult.remainingBlock,
    statusEffects: frontStatusResult.statusEffects,
    stats: {
      ...enemy.stats,
      hp: frontStatusResult.remainingHp,
    },
  };

  let nextBackEnemy: Enemy | null = backEnemy;
  if (backEnemy) {
    const backStatusResult = resolveStartOfTurnStatusEffects({
      actorName: backEnemy.name,
      statusEffects: backEnemy.statusEffects,
      currentHp: backEnemy.stats.hp,
      currentBlock: backEnemy.block,
    });
    logs.push(...backStatusResult.logs);
    nextBackEnemy = {
      ...backEnemy,
      block: backStatusResult.remainingBlock,
      statusEffects: backStatusResult.statusEffects,
      stats: {
        ...backEnemy.stats,
        hp: backStatusResult.remainingHp,
      },
    };
  }

  const collapsedAfterHero = collapseFormation(nextFrontEnemy, nextBackEnemy);
  nextFrontEnemy = collapsedAfterHero.frontEnemy;
  nextBackEnemy = collapsedAfterHero.backEnemy;
  if (collapsedAfterHero.promoted && nextFrontEnemy) {
    logs.push({
      kind: 'status',
      actor: nextFrontEnemy.name,
      text: `${nextFrontEnemy.name} 从后排前移，顶上了前线。`,
    });
  }

  let heroAfterEnemyTurns: Character = {
    ...heroAfterStatus,
    block: heroAfterStatus.block + effect.heroBlockGain,
    statusEffects: effectApplication.heroStatusEffects,
  };
  let totalEnemyDamage = 0;
  const enemySkillIds: EnemySkillId[] = [];

  if (nextFrontEnemy && nextFrontEnemy.stats.hp > 0) {
    const frontTurn = resolveSingleEnemyTurn(heroAfterEnemyTurns, nextFrontEnemy);
    heroAfterEnemyTurns = frontTurn.nextHero;
    nextFrontEnemy = frontTurn.nextEnemy;
    totalEnemyDamage += frontTurn.damageTaken;
    if (frontTurn.enemySkillId) {
      enemySkillIds.push(frontTurn.enemySkillId);
    }
    logs.push(...frontTurn.logs);
  }

  if (nextBackEnemy && nextBackEnemy.stats.hp > 0) {
    const backTurn = resolveSingleEnemyTurn(heroAfterEnemyTurns, nextBackEnemy);
    heroAfterEnemyTurns = backTurn.nextHero;
    nextBackEnemy = backTurn.nextEnemy;
    totalEnemyDamage += backTurn.damageTaken;
    if (backTurn.enemySkillId) {
      enemySkillIds.push(backTurn.enemySkillId);
    }
    logs.push(...backTurn.logs);
  }

  const collapsedAfterEnemyTurns = collapseFormation(nextFrontEnemy, nextBackEnemy);
  nextFrontEnemy = collapsedAfterEnemyTurns.frontEnemy;
  nextBackEnemy = collapsedAfterEnemyTurns.backEnemy;
  if (collapsedAfterEnemyTurns.promoted && nextFrontEnemy) {
    logs.push({
      kind: 'status',
      actor: nextFrontEnemy.name,
      text: `${nextFrontEnemy.name} 从后排前移，顶上了前线。`,
    });
  }

  if (effect.heroBlockGain > 0 || heroAfterEnemyTurns.block > 0) {
    logs.push({
      kind: 'status',
      actor: hero.name,
      text: `${hero.name} 当前剩余 ${heroAfterEnemyTurns.block} 点格挡。`,
    });
  }

  if (totalEnemyDamage > 0) {
    logs.push({
      kind: 'status',
      actor: hero.name,
      text: `${hero.name} 本回合累计承受 ${totalEnemyDamage} 点伤害。`,
    });
  }

  return {
    heroSkillId,
    enemySkillIds,
    nextEnemyCooldowns: nextFrontEnemy?.enemyCooldowns ?? enemy.enemyCooldowns,
    nextBackEnemyCooldowns: nextBackEnemy?.enemyCooldowns ?? null,
    heroDamage: effect.heroDamage,
    enemyDamage: totalEnemyDamage,
    heroBlockGain: effect.heroBlockGain,
    nextEnemy: nextFrontEnemy,
    nextBackEnemy: nextBackEnemy,
    heroRemainingHp: heroAfterEnemyTurns.stats.hp,
    heroRemainingBlock: heroAfterEnemyTurns.block,
    heroStatusEffects: heroAfterEnemyTurns.statusEffects,
    actionSummary: effect.summary,
    logEntries: logs,
  };
}

function totalSuffix(heroBlockGain: number) {
  return heroBlockGain > 0 ? `，获得 ${heroBlockGain} 点格挡` : '';
}

function formatDamageOutcome(targetName: string, attemptedDamage: number, damageTaken: number, absorbed: number) {
  if (attemptedDamage <= 0) {
    return `${targetName}未受到伤害`;
  }

  if (damageTaken > 0 && absorbed > 0) {
    return `${targetName}受到 ${damageTaken} 点伤害（格挡 ${absorbed}）`;
  }

  if (damageTaken > 0) {
    return `${targetName}受到 ${damageTaken} 点伤害`;
  }

  if (absorbed > 0) {
    return `伤害被格挡 ${absorbed}`;
  }

  return `${targetName}未受到伤害`;
}
