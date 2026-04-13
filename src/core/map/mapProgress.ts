// 维护地图推进进度，计算已清理节点与当前可进入的后续节点。
import type { GeneratedMap, MapNodeData } from '../../types';

export function markNodeCleared(map: GeneratedMap, nodeId: string) {
  return {
    ...map,
    nodes: map.nodes.map((node) => (node.id === nodeId ? { ...node, cleared: true } : node)),
  };
}

export function getHighestClearedLayer(map: GeneratedMap) {
  return map.nodes.reduce((highest, node) => (node.cleared ? Math.max(highest, node.layer) : highest), -1);
}

export function getNextPlayableNodes(map: GeneratedMap) {
  const nodeLookup = new Map(map.nodes.map((node) => [node.id, node]));
  const clearedIds = new Set(map.nodes.filter((node) => node.cleared).map((node) => node.id));
  const unlocked = new Set<string>();
  const highestClearedLayer = getHighestClearedLayer(map);

  if (highestClearedLayer < 0 && !clearedIds.has(map.startNodeId)) {
    unlocked.add(map.startNodeId);
  }

  for (const edge of map.edges) {
    const nextNode = nodeLookup.get(edge.toNodeId);
    if (!nextNode) {
      continue;
    }

    if (
      clearedIds.has(edge.fromNodeId) &&
      !clearedIds.has(edge.toNodeId) &&
      nextNode.layer > highestClearedLayer
    ) {
      unlocked.add(edge.toNodeId);
    }
  }

  return [...unlocked]
    .map((nodeId) => nodeLookup.get(nodeId))
    .filter((node): node is MapNodeData => Boolean(node))
    .sort((left, right) => left.layer - right.layer || left.column - right.column);
}

