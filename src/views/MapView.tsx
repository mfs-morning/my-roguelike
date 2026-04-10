import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useGameStore } from '../store/useGameStore';

const DEBUG_CELL = 72;
const DEBUG_PADDING = 24;

const kindColorMap = {
  battle: '#c38a33',
  elite: '#ef4444',
  event: '#94a3b8',
  treasure: '#eab308',
  blessing: '#22c55e',
  boss: '#a855f7',
  rest: '#60a5fa',
} as const;

const kindIconMap = {
  battle: '⚔',
  elite: '✦',
  event: '?',
  treasure: '◆',
  blessing: '✚',
  boss: '♛',
  rest: '⌂',
} as const;

const kindLabelMap = {
  battle: '战斗',
  elite: '精英',
  event: '事件',
  treasure: '宝箱',
  blessing: '祝福',
  boss: 'Boss',
  rest: '休整',
} as const;

export function MapView() {
  const generatedMap = useGameStore((state) => state.generatedMap);
  const activeRoomId = useGameStore((state) => state.activeRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);
  const setView = useGameStore((state) => state.setView);

  const nodeLookup = new Map(generatedMap.nodes.map((node) => [node.id, node]));
  const clearedIds = new Set(generatedMap.nodes.filter((node) => node.cleared).map((node) => node.id));
  const highestClearedLayer = generatedMap.nodes.reduce(
    (highest, node) => (node.cleared ? Math.max(highest, node.layer) : highest),
    -1,
  );
  const unlockedIds = new Set<string>();

  if (highestClearedLayer < 0 && !clearedIds.has(generatedMap.startNodeId)) {
    unlockedIds.add(generatedMap.startNodeId);
  }

  for (const edge of generatedMap.edges) {
    const nextNode = nodeLookup.get(edge.toNodeId);
    if (!nextNode) {
      continue;
    }

    if (
      clearedIds.has(edge.fromNodeId) &&
      !clearedIds.has(edge.toNodeId) &&
      nextNode.layer > highestClearedLayer
    ) {
      unlockedIds.add(edge.toNodeId);
    }
  }

  const nextNodes = [...unlockedIds]
    .map((nodeId) => nodeLookup.get(nodeId))
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .sort((left, right) => left.layer - right.layer || left.column - right.column);

  const missedIds = new Set(
    generatedMap.nodes
      .filter((node) => !node.cleared && !unlockedIds.has(node.id) && node.layer <= highestClearedLayer)
      .map((node) => node.id),
  );

  const debugWidth = (generatedMap.width - 1) * DEBUG_CELL + DEBUG_PADDING * 2;
  const debugHeight = (generatedMap.height - 1) * DEBUG_CELL + DEBUG_PADDING * 2;

  return (
    <Panel className="grid gap-6">
      <SectionTitle
        eyebrow="地图"
        title="遗迹路径"
        description="直接点击节点图标前进；已越过的低层分支会被标成失效，不能再回头清理。"
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge>下一目标：{nextNodes[0]?.label ?? '已清空'}</StatusBadge>
        <StatusBadge tone="bright">当前进度层 {Math.max(0, highestClearedLayer)}</StatusBadge>
        <StatusBadge tone="bright">可选节点 {nextNodes.length}</StatusBadge>
        {missedIds.size > 0 ? <StatusBadge tone="bright">失效分支 {missedIds.size}</StatusBadge> : null}
        {activeRoomId ? <StatusBadge tone="bright">已锁定房间</StatusBadge> : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[rgba(242,230,201,0.08)] bg-[rgba(0,0,0,0.18)] p-4">
        <svg viewBox={`0 0 ${debugWidth} ${debugHeight}`} className="min-w-[620px] w-full">
          {generatedMap.edges.map((edge) => {
            const fromNode = nodeLookup.get(edge.fromNodeId);
            const toNode = nodeLookup.get(edge.toNodeId);
            if (!fromNode || !toNode) {
              return null;
            }

            const fromMissed = missedIds.has(fromNode.id);
            const toMissed = missedIds.has(toNode.id);
            const edgeUnlocked = unlockedIds.has(edge.toNodeId);
            const edgeCleared = clearedIds.has(edge.fromNodeId) && clearedIds.has(edge.toNodeId);
            const x1 = DEBUG_PADDING + fromNode.x * DEBUG_CELL;
            const y1 = DEBUG_PADDING + fromNode.y * DEBUG_CELL;
            const x2 = DEBUG_PADDING + toNode.x * DEBUG_CELL;
            const y2 = DEBUG_PADDING + toNode.y * DEBUG_CELL;

            return (
              <line
                key={`${edge.fromNodeId}-${edge.toNodeId}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  fromMissed || toMissed
                    ? 'rgba(239,68,68,0.28)'
                    : edgeUnlocked
                      ? 'rgba(240,193,91,0.9)'
                      : edgeCleared
                        ? 'rgba(242,230,201,0.24)'
                        : 'rgba(242,230,201,0.35)'
                }
                strokeDasharray={fromMissed || toMissed ? '6 5' : undefined}
                strokeWidth={edgeUnlocked ? 3 : 2}
              />
            );
          })}

          {generatedMap.nodes.map((node) => {
            const cx = DEBUG_PADDING + node.x * DEBUG_CELL;
            const cy = DEBUG_PADDING + node.y * DEBUG_CELL;
            const selectable = unlockedIds.has(node.id);
            const missed = missedIds.has(node.id);
            const active = activeRoomId === node.id;
            const baseFill = kindColorMap[node.kind];

            return (
              <g
                key={node.id}
                role={selectable ? 'button' : undefined}
                tabIndex={selectable ? 0 : -1}
                className={selectable ? 'cursor-pointer' : undefined}
                onClick={selectable ? () => selectRoom(node.id) : undefined}
                onKeyDown={
                  selectable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          selectRoom(node.id);
                        }
                      }
                    : undefined
                }
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={selectable ? 18 : 15}
                  fill={missed ? 'rgba(36,36,36,0.95)' : baseFill}
                  opacity={node.cleared ? 0.42 : missed ? 0.78 : selectable || active ? 1 : 0.92}
                  stroke={
                    active
                      ? '#f0c15b'
                      : selectable
                        ? '#f2e6c9'
                        : missed
                          ? 'rgba(239,68,68,0.5)'
                          : 'rgba(242,230,201,0.4)'
                  }
                  strokeWidth={active ? 3 : selectable ? 2.5 : 1.5}
                />
                {missed ? (
                  <line
                    x1={cx - 10}
                    y1={cy - 10}
                    x2={cx + 10}
                    y2={cy + 10}
                    stroke="rgba(248,113,113,0.95)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                ) : null}
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill={missed ? 'rgba(248,113,113,0.95)' : '#090909'}
                  className="font-bold select-none"
                >
                  {kindIconMap[node.kind]}
                </text>
                <text
                  x={cx}
                  y={cy + 29}
                  textAnchor="middle"
                  fontSize="10"
                  fill={missed ? 'rgba(248,113,113,0.72)' : 'rgba(242,230,201,0.85)'}
                  className="select-none"
                >
                  {`${node.layer} · ${kindLabelMap[node.kind]}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
        <span className="rounded-full border border-[rgba(242,230,201,0.12)] bg-[rgba(242,230,201,0.05)] px-3 py-1">
          金边节点：当前可前进
        </span>
        <span className="rounded-full border border-[rgba(242,230,201,0.12)] bg-[rgba(242,230,201,0.05)] px-3 py-1">
          半透明节点：已清理
        </span>
        <span className="rounded-full border border-[rgba(239,68,68,0.18)] bg-[rgba(127,29,29,0.18)] px-3 py-1 text-[rgba(252,165,165,0.92)]">
          红叉节点：已错过
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setView('town')}>
          返回城镇
        </Button>
      </div>
    </Panel>
  );
}
