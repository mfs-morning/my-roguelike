import type { BattleCooldownState, Character, Enemy } from '../types';
import { battleSkills, defaultBattlePriority, defaultUnlockedBattleSkills } from './skills';

// 默认开局主角数据。
export const starterHero: Character = {
  id: 'hero-1',
  name: '见习冒险者',
  classId: 'warrior',
  level: 1,
  gold: 0,
  block: 0,
  statusEffects: [],
  stats: {
    hp: 24,
    maxHp: 24,
    attack: 6,
    defense: 2,
    speed: 8,
  },
};

// 默认敌人模板，进入房间后会在此基础上调整。
export const starterEnemy: Enemy = {
  id: 'slime-1',
  name: '史莱姆',
  block: 0,
  statusEffects: [],
  rewardGold: 5,
  stats: {
    hp: 18,
    maxHp: 18,
    attack: 4,
    defense: 1,
    speed: 5,
  },
};

export { battleSkills, defaultBattlePriority, defaultUnlockedBattleSkills };

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
