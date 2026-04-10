import { MapNode } from '../components/MapNode';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useGameStore } from '../store/useGameStore';

export function TownView() {
  const hero = useGameStore((state) => state.hero);
  const generatedMap = useGameStore((state) => state.generatedMap);
  const setView = useGameStore((state) => state.setView);
  const resetRun = useGameStore((state) => state.resetRun);

  // 城镇里展示当前 run 的基础进度概览。
  const clearedCount = generatedMap.nodes.filter((node) => node.cleared).length;

  return (
    <Panel className="grid gap-6">
      <SectionTitle
        eyebrow="城镇"
        title="灰烬镇酒馆"
        description={`${hero.name} 正在整理背包。补给已备好，木桌上的地图已经摊开，今晚依然可以继续深入遗迹。`}
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="bright">金币 {hero.gold}</StatusBadge>
        <StatusBadge>已推进 {clearedCount}/{generatedMap.height}</StatusBadge>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setView('map')}>查看地图</Button>
        <Button variant="secondary" onClick={resetRun}>
          重新开局
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[rgba(242,230,201,0.1)] bg-[rgba(242,230,201,0.03)] p-4">
        <StatusBadge className="w-fit">出发预览</StatusBadge>
        <div className="max-w-[220px]">
          <MapNode
            room={{ id: 'town-preview', depth: 0, label: '起始祝福', kind: 'blessing', cleared: true }}
            active
          />
        </div>
      </div>
    </Panel>
  );
}
