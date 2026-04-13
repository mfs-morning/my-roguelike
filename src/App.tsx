import { useState } from 'react';
import { StatsCard } from './components/StatsCard';
import { RewardView } from './views/RewardView';
import { BattleView } from './views/BattleView';
import { MapView } from './views/MapView';
import { TownView } from './views/TownView';
import { SectionTitle } from './components/ui/SectionTitle';
import { getEffectiveSkillMap } from './core/battle/effectiveSkills';
import { useGameStore } from './store/useGameStore';

function App() {
  const [isReordering, setIsReordering] = useState(false);
  const currentView = useGameStore((state) => state.currentView);
  const hero = useGameStore((state) => state.hero);
  const battleTactics = useGameStore((state) => state.battleTactics);
  const unlockedBattleSkills = useGameStore((state) => state.unlockedBattleSkills);
  const battleCooldowns = useGameStore((state) => state.battleCooldowns);
  const battleSkillRuntimeState = useGameStore((state) => state.battleSkillRuntimeState);
  const reorderBattlePriority = useGameStore((state) => state.reorderBattlePriority);
  const setBattleTacticCondition = useGameStore((state) => state.setBattleTacticCondition);
  const enableBattleSkill = useGameStore((state) => state.enableBattleSkill);
  const disableBattleSkill = useGameStore((state) => state.disableBattleSkill);
  const effectiveSkillsMap = getEffectiveSkillMap(battleSkillRuntimeState, hero.stats);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-[var(--color-text-main)] sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[24px] border border-[var(--color-border-soft)] bg-[linear-gradient(180deg,rgba(32,24,20,0.92),rgba(15,11,10,0.86))] px-6 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle
            eyebrow="React + TypeScript + Zustand"
            title="My Roguelike"
            description="保持轻量结构，先把最小可玩闭环跑通，再慢慢往上叠系统。"
            className="max-w-md"
          />
        </div>
      </header>

      <section className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <StatsCard
            title="冒险者面板"
            character={hero}
            battleTactics={battleTactics}
            availableSkillIds={unlockedBattleSkills}
            battleCooldowns={battleCooldowns}
            battleSkillsMap={effectiveSkillsMap}
            onDragStateChange={setIsReordering}
            onReorderBattlePriority={reorderBattlePriority}
            onSetBattleTacticCondition={setBattleTacticCondition}
            onEnableBattleSkill={enableBattleSkill}
            onDisableBattleSkill={disableBattleSkill}
          />
        </aside>

        {currentView === 'town' && <TownView />}
        {currentView === 'map' && <MapView />}
        {currentView === 'battle' && <BattleView isReordering={isReordering} />}
        {currentView === 'reward' && <RewardView />}
      </section>
    </main>
  );
}

export default App;
