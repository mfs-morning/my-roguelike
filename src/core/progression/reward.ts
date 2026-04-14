// 处理战斗奖励、技能掉落候选与各类房间奖励内容生成。
import { battleSkills, mockBattleSkillDropPool } from '../skills/skills';
import type { BattleReward, BattleSkillId, MapNodeData, RewardChoice } from '../../types';

export const INITIAL_SKILL_DROP_CHANCE = 0.15;
export const SKILL_DROP_CHANCE_STEP = 0.1;
export const MAX_SKILL_DROP_CHANCE = 0.75;

interface BuildRewardOptions {
  grantedSkillId?: BattleSkillId;
  grantedSkillChoices?: BattleSkillId[];
}

function buildChoice(
  id: string,
  label: string,
  description: string,
  partial: Omit<RewardChoice, 'id' | 'label' | 'description'>,
): RewardChoice {
  return {
    id,
    label,
    description,
    ...partial,
  };
}

export function rollBattleSkillDropChoices(
  node: MapNodeData,
  unlockedSkillIds: BattleSkillId[],
  clearedBattleCount: number,
  dropChance: number,
): BattleSkillId[] {
  const remainingSkills = mockBattleSkillDropPool.filter((skillId) => !unlockedSkillIds.includes(skillId));
  if (remainingSkills.length === 0) {
    return [];
  }

  if (node.kind !== 'battle' && node.kind !== 'elite' && node.kind !== 'boss') {
    return [];
  }

  const guaranteedDrop = node.kind === 'elite' || node.kind === 'boss' || clearedBattleCount < 3;
  const randomDrop = Math.random() < dropChance;

  if (!guaranteedDrop && !randomDrop) {
    return [];
  }

  const shuffledSkills = [...remainingSkills].sort(() => Math.random() - 0.5);
  const choiceCount = Math.min(node.kind === 'boss' ? 3 : 2, shuffledSkills.length);
  return shuffledSkills.slice(0, choiceCount);
}

export function buildReward(node: MapNodeData, options: BuildRewardOptions = {}): BattleReward {
  if (node.kind === 'treasure') {
    return {
      outcome: 'victory',
      nodeId: node.id,
      kind: node.kind,
      title: '打开宝箱',
      description: '宝箱里有几件能立刻派上用场的小收获，选一样带走。',
      gold: 0,
      maxHpBoost: 0,
      strengthBoost: 0,
      heal: 0,
      choices: [
        buildChoice('gold-cache', '金币袋', '立即获得 16 金币。', { gold: 16, maxHpBoost: 0, strengthBoost: 0, heal: 0 }),
        buildChoice('iron-edge', '磨亮刀锋', '力量 +2。', { gold: 0, maxHpBoost: 0, strengthBoost: 2, heal: 0 }),
      ],
    };
  }

  if (node.kind === 'blessing') {
    return {
      outcome: 'victory',
      nodeId: node.id,
      kind: node.kind,
      title: '接受祝福',
      description: '祝福之火给出两种不同方向的强化。',
      gold: 0,
      maxHpBoost: 0,
      strengthBoost: 0,
      heal: 0,
      choices: [
        buildChoice('god-mode', '仙人模式', '请输入文本', { gold: 999, maxHpBoost: 999, strengthBoost: 999, heal: 0 }),
        buildChoice('vital-blessing', '生命祝福', '生命上限 +5，并回复 5 点生命。', { gold: 0, maxHpBoost: 5, strengthBoost: 0, heal: 5 }),
        buildChoice('fury-blessing', '锋锐祝福', '力量 +2。', { gold: 0, maxHpBoost: 0, strengthBoost: 2, heal: 0 }),
      ],
    };
  }

  if (node.kind === 'event') {
    return {
      outcome: 'victory',
      nodeId: node.id,
      kind: node.kind,
      title: '遭遇事件',
      description: '你在废墟里碰到一段插曲，只能挑一个结果带走。',
      gold: 0,
      maxHpBoost: 0,
      strengthBoost: 0,
      heal: 0,
      choices: [
        buildChoice('event-gold', '捡走散币', '获得 10 金币。', { gold: 10, maxHpBoost: 0, strengthBoost: 0, heal: 0 }),
        buildChoice('event-rest', '短暂整备', '回复 6 点生命。', { gold: 0, maxHpBoost: 0, strengthBoost: 0, heal: 6 }),
        buildChoice('fury-blessing', '锋锐祝福', '力量 +2。', { gold: 0, maxHpBoost: 0, strengthBoost: 2, heal: 0 }),
      ],
    };
  }

  const skillText = options.grantedSkillChoices?.length
    ? ` 你可以从 ${options.grantedSkillChoices.length} 个技能中选择一个带走。`
    : options.grantedSkillId
      ? ` 你还缴获了技能【${battleSkills[options.grantedSkillId].label}】。`
      : '';
  const battleRewardBase = {
    outcome: 'victory' as const,
    nodeId: node.id,
    kind: node.kind,
    title: node.kind === 'elite' ? '精英胜利' : node.kind === 'boss' ? 'Boss 胜利' : '战斗胜利',
    description:
      (node.kind === 'elite'
        ? '强敌已被击溃，你缴获了更多战利品。'
        : node.kind === 'boss'
          ? '守关者倒下了，你夺回了遗迹深处的宝藏。'
          : '你拿下了当前房间。') + skillText,
    gold: node.kind === 'elite' ? 12 : node.kind === 'boss' ? 20 : 5,
    maxHpBoost: 0,
    strengthBoost: 0,
    heal: 0,
  };

  if (options.grantedSkillChoices?.length) {
    return {
      ...battleRewardBase,
      choices: options.grantedSkillChoices.map((skillId) =>
        buildChoice(
          `skill-${skillId}`,
          battleSkills[skillId].label,
          battleSkills[skillId].description,
          {
            gold: 0,
            maxHpBoost: 0,
            strengthBoost: 0,
            heal: 0,
            grantedSkillId: skillId,
          },
        ),
      ),
    };
  }

  return options.grantedSkillId
    ? {
        ...battleRewardBase,
        grantedSkillId: options.grantedSkillId,
      }
    : battleRewardBase;
}
