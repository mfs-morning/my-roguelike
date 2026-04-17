import type {
  BattleLogEntry,
  BattleSkillDefinition,
  BattleSkillModifier,
  BattleSkillRuntimeState,
  Enemy,
  EnemySkillDefinition,
  EnemySkillId,
  EnemySkillRuntimeState,
  RelicDefinition,
  RelicId,
  RunRelic,
} from '../../types';

export const relicDefinitions: Record<RelicId, RelicDefinition> = {
  weatheredCharm: {
    id: 'weatheredCharm',
    label: '风化护符',
    description: '一枚磨损严重的旧护符，目前还没有显现出任何力量。',
    hooks: {},
  },
};

function mergeBattleSkillModifier(
  base: BattleSkillModifier | undefined,
  extra: BattleSkillModifier | null | undefined,
): BattleSkillModifier | undefined {
  if (!extra) {
    return base;
  }

  return {
    cooldownOffset: (base?.cooldownOffset ?? 0) + (extra.cooldownOffset ?? 0),
    damageMultiplierBonus: (base?.damageMultiplierBonus ?? 0) + (extra.damageMultiplierBonus ?? 0),
    bonusDamage: (base?.bonusDamage ?? 0) + (extra.bonusDamage ?? 0),
    blockGainBonus: (base?.blockGainBonus ?? 0) + (extra.blockGainBonus ?? 0),
    extraEffects: [...(base?.extraEffects ?? []), ...(extra.extraEffects ?? [])],
  };
}

export function applyRelicSkillModifiers(
  skillId: BattleSkillDefinition['id'],
  definition: BattleSkillDefinition,
  relics: RunRelic[] = [],
): BattleSkillModifier | undefined {
  return relics.reduce<BattleSkillModifier | undefined>((modifier, relic) => {
    const relicDefinition = relicDefinitions[relic.id];
    const extraModifier = relicDefinition.hooks?.modifyHeroSkill?.({
      relic,
      skillId,
      definition,
    });
    return mergeBattleSkillModifier(modifier, extraModifier);
  }, undefined);
}

export function applyRelicEnemySkillModifiers(
  skillId: EnemySkillId,
  definition: EnemySkillDefinition,
  relics: RunRelic[] = [],
): BattleSkillModifier | undefined {
  return relics.reduce<BattleSkillModifier | undefined>((modifier, relic) => {
    const relicDefinition = relicDefinitions[relic.id];
    const extraModifier = relicDefinition.hooks?.modifyEnemySkill?.({
      relic,
      skillId,
      definition,
    });
    return mergeBattleSkillModifier(modifier, extraModifier);
  }, undefined);
}

export function applyRelicsOnBattleStart(params: {
  hero: import('../../types').Character;
  enemy: Enemy;
  backEnemy: Enemy | null;
  battleSkillRuntimeState: BattleSkillRuntimeState;
  relics: RunRelic[];
}) {
  const logs: Omit<BattleLogEntry, 'id'>[] = [];
  let nextHero = params.hero;
  let nextEnemy = params.enemy;
  let nextBackEnemy = params.backEnemy;
  let nextBattleSkillRuntimeState = params.battleSkillRuntimeState;

  for (const relic of params.relics) {
    const relicDefinition = relicDefinitions[relic.id];
    const result = relicDefinition.hooks?.onBattleStart?.({
      relic,
      hero: nextHero,
      enemy: nextEnemy,
      backEnemy: nextBackEnemy,
      battleSkillRuntimeState: nextBattleSkillRuntimeState,
    });

    if (!result) {
      continue;
    }

    nextHero = result.hero ?? nextHero;
    nextEnemy = result.enemy ?? nextEnemy;
    nextBackEnemy = result.backEnemy === undefined ? nextBackEnemy : result.backEnemy;
    nextBattleSkillRuntimeState = result.battleSkillRuntimeState ?? nextBattleSkillRuntimeState;
    if (result.logs?.length) {
      logs.push(...result.logs);
    }
  }

  return {
    hero: nextHero,
    enemy: nextEnemy,
    backEnemy: nextBackEnemy,
    battleSkillRuntimeState: nextBattleSkillRuntimeState,
    logs,
  };
}

export function createStarterRelics(): RunRelic[] {
  return [{ id: 'weatheredCharm' }];
}

