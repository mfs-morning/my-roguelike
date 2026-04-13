// 生成分层地图骨架、路径连接与各层房间类型分布。
import type { GeneratedMap, MapEdge, MapNodeData, RoomKind } from '../../types';

interface MapSkeletonOptions {
  width?: number;
  height?: number;
  minNodesPerLayer?: number;
  maxNodesPerLayer?: number;
  jitter?: number;
  pathCount?: number;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }

  return next;
}

function buildLayerColumns(width: number, count: number) {
  return shuffle(Array.from({ length: width }, (_, index) => index))
    .slice(0, count)
    .sort((left, right) => left - right);
}

function getNodeId(layer: number, column: number) {
  return `node-${layer}-${column}`;
}

function getNodeLabel(kind: RoomKind, layer: number) {
  switch (kind) {
    case 'blessing':
      return '起始祝福';
    case 'elite':
      return `精英层 ${layer}`;
    case 'treasure':
      return `宝箱层 ${layer}`;
    case 'boss':
      return 'Boss';
    case 'rest':
      return '营火';
    default:
      return `第 ${layer} 层`;
  }
}

function buildNodeLookup(nodes: MapNodeData[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function getNodesByLayer(nodes: MapNodeData[]) {
  const nodesByLayer = new Map<number, MapNodeData[]>();

  for (const node of nodes) {
    const layerNodes = nodesByLayer.get(node.layer) ?? [];
    layerNodes.push(node);
    nodesByLayer.set(node.layer, layerNodes);
  }

  for (const layerNodes of nodesByLayer.values()) {
    layerNodes.sort((left, right) => left.column - right.column);
  }

  return nodesByLayer;
}

function getConnectedTargetIds(edges: MapEdge[], fromNodeId: string) {
  return new Set(edges.filter((edge) => edge.fromNodeId === fromNodeId).map((edge) => edge.toNodeId));
}

function hasCrossingEdge(
  edges: MapEdge[],
  fromNode: MapNodeData,
  toNode: MapNodeData,
  nodeLookup: Map<string, MapNodeData>,
) {
  return edges.some((edge) => {
    const edgeFrom = nodeLookup.get(edge.fromNodeId);
    const edgeTo = nodeLookup.get(edge.toNodeId);

    if (!edgeFrom || !edgeTo || edgeFrom.layer !== fromNode.layer || edgeTo.layer !== toNode.layer) {
      return false;
    }

    if (
      edgeFrom.id === fromNode.id ||
      edgeTo.id === toNode.id ||
      edgeFrom.id === toNode.id ||
      edgeTo.id === fromNode.id
    ) {
      return false;
    }

    return (edgeFrom.x - fromNode.x) * (edgeTo.x - toNode.x) < 0;
  });
}

function scoreCandidate(
  currentNode: MapNodeData,
  candidate: MapNodeData,
  pathIndex: number,
  pathCount: number,
  connectedTargetIds: Set<string>,
) {
  const centerBias = (pathIndex / Math.max(1, pathCount - 1)) * 2 - 1;
  const targetColumn = currentNode.column + centerBias * 1.4;
  const distanceScore = Math.abs(candidate.column - currentNode.column) * 4;
  const spreadScore = Math.abs(candidate.column - targetColumn) * 2;
  const reusePenalty = connectedTargetIds.has(candidate.id) ? 8 : 0;

  return distanceScore + spreadScore + reusePenalty + Math.random() * 0.35;
}

function pickNextNode(
  currentNode: MapNodeData,
  nextLayerNodes: MapNodeData[],
  edges: MapEdge[],
  nodeLookup: Map<string, MapNodeData>,
  pathIndex: number,
  pathCount: number,
) {
  const connectedTargetIds = getConnectedTargetIds(edges, currentNode.id);
  const nearbyNodes = nextLayerNodes.filter((node) => Math.abs(node.column - currentNode.column) <= 1);
  const preferredPool = nearbyNodes.length > 0 ? nearbyNodes : nextLayerNodes;

  const nonCrossingCandidates = preferredPool.filter(
    (node) => !hasCrossingEdge(edges, currentNode, node, nodeLookup),
  );

  const candidatePool = nonCrossingCandidates.length > 0
    ? nonCrossingCandidates
    : nextLayerNodes.filter((node) => !hasCrossingEdge(edges, currentNode, node, nodeLookup));

  if (candidatePool.length > 0) {
    return [...candidatePool].sort(
      (left, right) =>
        scoreCandidate(currentNode, left, pathIndex, pathCount, connectedTargetIds) -
        scoreCandidate(currentNode, right, pathIndex, pathCount, connectedTargetIds),
    )[0]!;
  }

  return null;
}

function buildPaths(nodes: MapNodeData[], width: number, height: number, pathCount: number) {
  const nodeLookup = buildNodeLookup(nodes);
  const nodesByLayer = getNodesByLayer(nodes);
  const edges: MapEdge[] = [];
  const edgeKeySet = new Set<string>();

  const startNode = nodeLookup.get(getNodeId(0, Math.floor(width / 2)));
  if (!startNode) {
    return { nodes, edges };
  }

  for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
    let currentNode = startNode;

    for (let layer = 0; layer < height - 1; layer += 1) {
      const nextLayerNodes = nodesByLayer.get(layer + 1) ?? [];
      if (nextLayerNodes.length === 0) {
        break;
      }

      const nextNode = pickNextNode(currentNode, nextLayerNodes, edges, nodeLookup, pathIndex, pathCount);
      if (!nextNode) {
        break;
      }

      const edgeKey = `${currentNode.id}->${nextNode.id}`;
      if (!edgeKeySet.has(edgeKey)) {
        edges.push({ fromNodeId: currentNode.id, toNodeId: nextNode.id });
        edgeKeySet.add(edgeKey);
      }

      currentNode = nextNode;
    }
  }

  const connectedNodeIds = new Set<string>([startNode.id]);
  for (const edge of edges) {
    connectedNodeIds.add(edge.fromNodeId);
    connectedNodeIds.add(edge.toNodeId);
  }

  const filteredNodes = nodes.filter((node) => connectedNodeIds.has(node.id));

  return { nodes: filteredNodes, edges };
}

function assignRoomKinds(nodes: MapNodeData[], height: number) {
  return nodes.map((node) => {
    if (node.layer === 0) {
      return { ...node, kind: 'blessing' as const, label: getNodeLabel('blessing', node.layer) };
    }

    if (node.layer === height - 1) {
      return { ...node, kind: 'boss' as const, label: getNodeLabel('boss', node.layer) };
    }

    if (node.layer === height - 2) {
      return { ...node, kind: 'rest' as const, label: getNodeLabel('rest', node.layer) };
    }

    if (node.layer <= 4) {
      return { ...node, kind: 'battle' as const, label: getNodeLabel('battle', node.layer) };
    }

    if (node.layer === 8) {
      return { ...node, kind: 'treasure' as const, label: getNodeLabel('treasure', node.layer) };
    }

    const roll = Math.random();
    const kind: RoomKind = roll < 0.55 ? 'battle' : roll < 0.72 ? 'event' : roll < 0.84 ? 'rest' : roll < 0.93 ? 'elite' : 'treasure';
    return { ...node, kind, label: getNodeLabel(kind, node.layer) };
  });
}

// 生成 StS 风格地图：先产出节点，再连出不交叉的基础路径，最后补房间类型。
export function generateMapSkeleton(options: MapSkeletonOptions = {}): GeneratedMap {
  const width = options.width ?? 7;
  const height = options.height ?? 16;
  const minNodesPerLayer = options.minNodesPerLayer ?? 2;
  const maxNodesPerLayer = options.maxNodesPerLayer ?? 5;
  const jitter = options.jitter ?? 0.18;
  const pathCount = options.pathCount ?? 6;

  const nodes: MapNodeData[] = [];

  for (let layer = 0; layer < height; layer += 1) {
    const isStartLayer = layer === 0;
    const isBossLayer = layer === height - 1;

    const columns = isStartLayer || isBossLayer
      ? [Math.floor(width / 2)]
      : buildLayerColumns(width, randomBetween(minNodesPerLayer, maxNodesPerLayer));

    for (const column of columns) {
      nodes.push({
        id: getNodeId(layer, column),
        layer,
        column,
        x: column + (Math.random() * 2 - 1) * jitter,
        y: layer + (Math.random() * 2 - 1) * (jitter * 0.35),
        label: `第 ${layer} 层`,
        kind: 'battle',
        cleared: false,
      });
    }
  }

  const { nodes: connectedNodes, edges } = buildPaths(nodes, width, height, pathCount);
  const taggedNodes = assignRoomKinds(connectedNodes, height);
  const startNodeId = taggedNodes.find((node) => node.layer === 0)?.id ?? getNodeId(0, Math.floor(width / 2));
  const bossNodeId = taggedNodes.find((node) => node.layer === height - 1)?.id ?? getNodeId(height - 1, Math.floor(width / 2));

  return {
    nodes: taggedNodes,
    edges,
    startNodeId,
    bossNodeId,
    width,
    height,
  };
}
