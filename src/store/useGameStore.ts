// Zustand 主 store 入口，负责拼装状态、动作与各类状态迁移函数。
import { create } from 'zustand';
import { INITIAL_SKILL_DROP_CHANCE, buildReward } from '../core/progression/reward';
import { getNextPlayableNodes } from '../core/map/mapProgress';
import { moveSkill, reorderSkills } from '../core/battle/battlePriority';
import { buildInitialState } from './gameStateFactory';
import { createBattleEntryState, buildRestReward, resolveBattleRoundState } from './battleStateTransitions';
import { resolveRewardClaimState } from './rewardStateTransitions';
import {
  disableSkillFromPriority,
  enableSkillToPriority,
  mergeSkillModifier,
  updateTacticCondition,
} from './battleTacticsState';
import type { GameState } from './types';

export const useGameStore = create<GameState>((set) => ({
  ...buildInitialState(INITIAL_SKILL_DROP_CHANCE),
  setView: (view) => set({ currentView: view }),
  resetRun: () => set(buildInitialState(INITIAL_SKILL_DROP_CHANCE)),
  moveBattlePriority: (skillId, direction) =>
    set((state) => ({
      battleTactics: moveSkill(state.battleTactics, skillId, direction),
    })),
  reorderBattlePriority: (fromSkillId, toSkillId) =>
    set((state) => ({
      battleTactics: reorderSkills(state.battleTactics, fromSkillId, toSkillId),
    })),
  setBattleTacticCondition: (skillId, condition) =>
    set((state) => ({
      battleTactics: updateTacticCondition(state.battleTactics, skillId, condition),
    })),
  enableBattleSkill: (skillId) =>
    set((state) => {
      if (!state.unlockedBattleSkills.includes(skillId)) {
        return state;
      }

      return {
        battleTactics: enableSkillToPriority(state.battleTactics, skillId),
      };
    }),
  disableBattleSkill: (skillId) =>
    set((state) => {
      if (state.battleTactics.length <= 1 || !state.battleTactics.some((slot) => slot.skillId === skillId)) {
        return state;
      }

      return {
        battleTactics: disableSkillFromPriority(state.battleTactics, skillId),
      };
    }),
  upgradeBattleSkill: (skillId, modifier) =>
    set((state) => ({
      battleSkillRuntimeState: mergeSkillModifier(state.battleSkillRuntimeState, skillId, modifier),
    })),
  selectRoom: (roomId) =>
    set((state) => {
      const room = state.generatedMap.nodes.find((item) => item.id === roomId);
      const selectableIds = new Set(getNextPlayableNodes(state.generatedMap).map((node) => node.id));
      if (!room || room.cleared || !selectableIds.has(roomId)) {
        return state;
      }

      if (room.kind === 'treasure' || room.kind === 'blessing' || room.kind === 'rest' || room.kind === 'event') {
        return {
          activeRoomId: room.id,
          pendingReward: room.kind === 'rest' ? buildRestReward(room.id) : buildReward(room),
          battleSummary: null,
          currentView: 'reward',
          battleLog: [{ id: crypto.randomUUID(), kind: 'system', text: `${room.label} 触发了特殊效果。` }],
        };
      }

      return createBattleEntryState(state, roomId, room);
    }),
  runBattleRound: () =>
    set((state) => {
      const patch = resolveBattleRoundState(state);
      return patch ?? state;
    }),
  claimReward: (choiceId) =>
    set((state) => {
      const patch = resolveRewardClaimState(state, choiceId);
      return patch ?? state;
    }),
}));
