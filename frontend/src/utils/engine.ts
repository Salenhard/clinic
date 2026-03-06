import { ClinicalGraph, GraphEdge, GraphNode, EdgeCondition, StartNode, DecisionNode } from "../types/graph";

export type Ctx = {
  answers: Record<string, any>;
  actions: { procedure: string; implant?: string; timing?: string; evidence_level?: string; contraindications?: string[]; notes?: string }[];
  warnings: { procedure: string; implant?: string; timing?: string; evidence_level?: string; contraindications?: string[]; notes?: string }[];
  path: { nodeId: string; label: string; type: string }[];
  lastAnswer?: any;
};

export function initCtx(): Ctx {
  return { answers: {}, actions: [], warnings: [], path: [] };
}

export function indexGraph(g: ClinicalGraph) {
  const nodeById = new Map<string, GraphNode>();
  g.graph.nodes.forEach((n) => nodeById.set(n.id, n));

  const outEdges = new Map<string, GraphEdge[]>();
  g.graph.edges.forEach((e) => {
    const arr = outEdges.get(e.from) ?? [];
    arr.push(e);
    outEdges.set(e.from, arr);
  });

  return { nodeById, outEdges };
}

function evaluateCondition(condition: EdgeCondition, answers: Record<string, any>): boolean {
  const fieldValue = answers[condition.field];
  const condValue = condition.value;

  switch (condition.operator) {
    case "==": return fieldValue === condValue;
    case "!=": return fieldValue !== condValue;
    case "<":  return Number(fieldValue) < Number(condValue);
    case ">":  return Number(fieldValue) > Number(condValue);
    case "<=": return Number(fieldValue) <= Number(condValue);
    case ">=": return Number(fieldValue) >= Number(condValue);
    default:   return false;
  }
}

function matchEdge(edge: GraphEdge, ctx: Ctx): boolean {
  // 1. Если есть condition — проверяем его
  if (edge.condition) {
    return evaluateCondition(edge.condition, ctx.answers);
  }
  // 2. Новый формат: совпадение label с lastAnswer
  if (edge.label && ctx.lastAnswer !== undefined) {
    return edge.label === ctx.lastAnswer;
  }
  // 3. Нет ни condition, ни label — автопереход (безусловное ребро)
  if (!edge.label && !edge.condition) {
    return true;
  }
  return false;
}

export function applyNodeSideEffects(node: GraphNode, ctx: Ctx): Ctx {
  const next = structuredClone(ctx) as Ctx;
  next.path.push({ nodeId: node.id, label: node.label, type: node.type });

  if (node.type === "ACTION" && node.action_details) {
    next.actions.push(node.action_details);
  }
  if (node.type === "WARNING" && node.action_details) {
    next.warnings.push(node.action_details);
  }
  return next;
}

export function chooseNextNodeId(
  currentNodeId: string,
  ctx: Ctx,
  outEdges: Map<string, GraphEdge[]>
): string | null {
  const edges = outEdges.get(currentNodeId) ?? [];
  for (const e of edges) {
    if (matchEdge(e, ctx)) return e.to;
  }
  return null;
}

export function getQuestionKey(node: StartNode | DecisionNode): string {
  return node.id;
}

export function answerQuestion(ctx: Ctx, key: string, value: any): Ctx {
  const next = structuredClone(ctx) as Ctx;
  next.answers[key] = value;
  next.lastAnswer = value;
  return next;
}
