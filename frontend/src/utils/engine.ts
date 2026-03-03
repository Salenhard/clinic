import { ClinicalGraph, GraphEdge, GraphNode } from "../types/graph";

export type Ctx = {
  answers: Record<string, any>;
  actions: { code: string; text: string }[];
  diagnoses: { code: string; text: string }[];
  recommendations: { text: string; levelOfEvidence?: "A" | "B" | "C"; sourceSection?: string }[];
  path: { nodeId: string; label: string; type: string }[];
  lastAnswer?: any;
  lastCondition?: boolean; // результат последнего condition-узла
};

export function initCtx(): Ctx {
  return { answers: {}, actions: [], diagnoses: [], recommendations: [], path: [] };
}

export function indexGraph(g: ClinicalGraph) {
  const nodeById = new Map<string, GraphNode>();
  g.nodes.forEach((n) => nodeById.set(n.id, n));

  const outEdges = new Map<string, GraphEdge[]>();
  g.edges.forEach((e) => {
    const arr = outEdges.get(e.source) ?? [];
    arr.push(e);
    outEdges.set(e.source, arr);
  });

  return { nodeById, outEdges };
}

function safeExprEval(expr: string, ctx: any): boolean {
  // Минимально безопасный eval: функция с замкнутым ctx, без доступа к глобалам напрямую.
  // В проде лучше: jsep + собственный интерпретатор или sandbox (vm2), но для демо — так.
  // eslint-disable-next-line no-new-func
  const fn = new Function("ctx", `"use strict"; return (${expr});`);
  return Boolean(fn(ctx));
}

function matchEdgeCondition(edgeCond: string, ctx: Ctx): boolean {
  if (edgeCond === "default") return true;

  if (edgeCond === "yes") return ctx.lastAnswer === true || ctx.lastAnswer === "yes";
  if (edgeCond === "no") return ctx.lastAnswer === false || ctx.lastAnswer === "no";

  if (edgeCond.startsWith("range:")) {
    const [, minS, maxS] = edgeCond.split(":");
    const v = Number(ctx.lastAnswer);
    const min = Number(minS);
    const max = Number(maxS);
    return !Number.isNaN(v) && v >= min && v <= max;
  }

  if (edgeCond.startsWith("expr:")) {
    const expr = edgeCond.slice(5);
    return safeExprEval(expr, ctx);
  }

  return false;
}

export function applyNodeSideEffects(node: GraphNode, ctx: Ctx): Ctx {
  const next = structuredClone(ctx) as Ctx;

  next.path.push({ nodeId: node.id, label: node.label, type: node.type });

  if (node.type === "action") next.actions.push(node.action);
  if (node.type === "diagnosis") next.diagnoses.push(node.diagnosis);
  if (node.type === "recommendation") next.recommendations.push(node.recommendation);

  if (node.type === "condition") {
    next.lastCondition = safeExprEval(node.expression, next);
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
    if (matchEdgeCondition(e.condition, ctx)) return e.target;
  }
  return null;
}

export function answerQuestion(ctx: Ctx, key: string, value: any): Ctx {
  const next = structuredClone(ctx) as Ctx;
  next.answers[key] = value;
  next.lastAnswer = value;
  return next;
}