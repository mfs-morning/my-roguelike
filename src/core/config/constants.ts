// 集中定义开局角色、敌人模板与默认技能配置等全局常量。
import type { BattleCooldownState, Character, Enemy } from '../../types';
import { createEnemyCooldownState, enemyTacticsProfiles } from '../battle/enemyTactics';
import { battleSkills, defaultBattleTactics, defaultUnlockedBattleSkills } from '../skills/skills';

// 默认开局主角数据。
export const starterHero: Character = {
  id: 'hero-1',
  name: '战士',
  classId: 'warrior',
  level: 1,
  gold: 0,
  block: 0,
  statusEffects: [],
  stats: {
    hp: 32,
    maxHp: 32,
    strength: 7,
    agility: 2,
  },
};

// 默认敌人模板，进入房间后会在此基础上调整。
export const starterEnemy: Enemy = {
  id: 'slime-1',
  name: '史莱姆',
  block: 0,
  statusEffects: [],
  rewardGold: 5,
  tacticsProfile: enemyTacticsProfiles.slime,
  enemyCooldowns: createEnemyCooldownState(['oozeSlam', 'oozeBurst', 'oozeGuard']),
  enemySkillRuntimeState: {},
  stats: {
    hp: 18,
    maxHp: 18,
    strength: 4,
    agility: 0,
  },
};

export { battleSkills, defaultBattleTactics, defaultUnlockedBattleSkills };

export function createBattleCooldownState(): BattleCooldownState {
  return {
    attack: 0,
    attackPlus2: 0,
    attackPlus3: 0,
    attackPlus4: 0,
    heavyStrike: 0,
    guard: 0,
    rend: 0,
  };
}
