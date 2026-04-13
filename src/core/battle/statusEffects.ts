// 处理流血、中毒等状态效果的施加、叠加与回合开始结算。
import type { BattleSkillExtraEffect, BattleStatusEffect, Character, Enemy } from '../../types';

interface ApplyStatusPayload {
  hero: Character;
  enemy: Enemy;
  effects: BattleSkillExtraEffect[];
}

interface ResolveStatusPayload {
  actorName: string;
  statusEffects: BattleStatusEffect[];
  currentHp: number;
  currentBlock: number;
}

interface ResolveStatusResult {
  remainingHp: number;
  remainingBlock: number;
  statusEffects: BattleStatusEffect[];
  totalDamage: number;
  logs: string[];
}

const statusLabels: Record<BattleStatusEffect['kind'], string> = {
  poison: '中毒',
  bleed: '流血',
};

function applyDirectDamage(currentHp: number, currentBlock: number, damage: number) {
  const absorbed = Math.min(currentBlock, damage);
  const damageTaken = Math.max(0, damage - absorbed);

  return {
    remainingHp: Math.max(0, currentHp - damageTaken),
    remainingBlock: Math.max(0, currentBlock - damage),
    damageTaken,
  };
}

// 将技能附带的状态效果施加到目标单位上；同类状态简单叠加层数与持续回合。
export function applySkillStatusEffects({ hero, enemy, effects }: ApplyStatusPayload) {
  const nextHeroStatusEffects = [...hero.statusEffects];
  const nextEnemyStatusEffects = [...enemy.statusEffects];
  const logs: string[] = [];

  for (const effect of effects) {
    const targetEffects = effect.target === 'hero' ? nextHeroStatusEffects : nextEnemyStatusEffects;
    const targetName = effect.target === 'hero' ? hero.name : enemy.name;
    const duration = effect.duration ?? 1;
    const existingEffect = targetEffects.find((status) => status.kind === effect.kind);

    if (existingEffect) {
      existingEffect.value += effect.value;
      existingEffect.duration = Math.max(existingEffect.duration, duration);
    } else {
      targetEffects.push({
        kind: effect.kind,
        value: effect.value,
        duration,
      });
    }

    logs.push(`${targetName} 陷入${statusLabels[effect.kind]} ${effect.value} 点，持续 ${duration} 回合。`);
  }

  return {
    heroStatusEffects: nextHeroStatusEffects,
    enemyStatusEffects: nextEnemyStatusEffects,
    logs,
  };
}

// 在回合开始时结算 DOT，并衰减持续时间；这里只处理中毒和流血这类持续伤害。
export function resolveStartOfTurnStatusEffects({
  actorName,
  statusEffects,
  currentHp,
  currentBlock,
}: ResolveStatusPayload): ResolveStatusResult {
  let remainingHp = currentHp;
  let remainingBlock = currentBlock;
  let totalDamage = 0;
  const nextStatusEffects: BattleStatusEffect[] = [];
  const logs: string[] = [];

  for (const effect of statusEffects) {
    const damageResult = applyDirectDamage(remainingHp, remainingBlock, effect.value);
    remainingHp = damageResult.remainingHp;
    remainingBlock = damageResult.remainingBlock;
    totalDamage += damageResult.damageTaken;
    logs.push(`${actorName} 的${statusLabels[effect.kind]}生效，受到 ${damageResult.damageTaken} 点伤害。`);

    if (effect.duration > 1) {
      nextStatusEffects.push({
        ...effect,
        duration: effect.duration - 1,
      });
    }
  }

  return {
    remainingHp,
    remainingBlock,
    statusEffects: nextStatusEffects,
    totalDamage,
    logs,
  };
}

