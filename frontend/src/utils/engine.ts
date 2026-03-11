import { ClinicalGraph, GraphEdge, GraphNode, GraphValidationResult } from "../types/graph";

// ─── Контекст сессии ──────────────────────────────────────────────────────────

export interface ActionRecord {
  procedure: string;
  implant?: string | null;
  timing?: string | null;
  evidence_level?: string;
  contraindications?: string[];
  notes?: string;
  nodeLabel: string;
}

export type Ctx = {
  answers: Record<string, string>; // nodeId → выбранный label ребра
  actions: ActionRecord[];
  warnings: ActionRecord[];
  path: { nodeId: string; label: string; type: string }[];
};

export function initCtx(): Ctx {
  return { answers: {}, actions: [], warnings: [], path: [] };
}

// ─── Индексация графа ─────────────────────────────────────────────────────────

export function indexGraph(g: ClinicalGraph) {
  const nodeById = new Map<string, GraphNode>();
  g.graph.nodes.forEach((n) => nodeById.set(n.id, n));

  // Для каждого узла — список исходящих рёбер
  const outEdges = new Map<string, GraphEdge[]>();
  g.graph.edges.forEach((e) => {
    const arr = outEdges.get(e.from) ?? [];
    arr.push(e);
    outEdges.set(e.from, arr);
  });

  return { nodeById, outEdges };
}

// ─── Выбор следующего узла ────────────────────────────────────────────────────

/**
 * Логика выбора ребра:
 * 1. Если у ребра есть label и он совпадает с ответом пользователя на текущий узел → берём
 * 2. Если у ребра label == null/undefined/пустой → безусловное ребро (автопереход)
 *    НО только если пользователь уже "прошёл" этот узел (он не DECISION/START-с-вопросом)
 */
export function chooseNextNodeId(
  currentNodeId: string,
  userAnswer: string | null, // label выбранного пользователем ребра, или null для авто
  outEdges: Map<string, GraphEdge[]>
): string | null {
  const edges = outEdges.get(currentNodeId) ?? [];

  if (userAnswer !== null) {
    // Пользователь что-то выбрал — ищем ребро с совпадающим label
    const match = edges.find((e) => e.label === userAnswer);
    return match?.to ?? null;
  } else {
    // Авто-переход — берём первое безусловное ребро (label null/undefined/"")
    const auto = edges.find((e) => !e.label);
    return auto?.to ?? null;
  }
}

// ─── Применение side-effects узла ────────────────────────────────────────────

export function applyNode(node: GraphNode, ctx: Ctx): Ctx {
  const next: Ctx = {
    answers: { ...ctx.answers },
    actions: [...ctx.actions],
    warnings: [...ctx.warnings],
    path: [...ctx.path, { nodeId: node.id, label: node.label, type: node.type }],
  };

  if (node.type === "ACTION" && node.action_details) {
    next.actions.push({ ...node.action_details, nodeLabel: node.label });
  }
  if (node.type === "WARNING" && node.action_details) {
    next.warnings.push({ ...node.action_details, nodeLabel: node.label });
  }

  return next;
}

// ─── Валидация графа ──────────────────────────────────────────────────────────

export function validateGraph(g: ClinicalGraph): GraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!g.metadata) errors.push("Отсутствует блок metadata");
  if (!g.graph) { errors.push("Отсутствует блок graph"); return { valid: false, errors, warnings }; }
  if (!Array.isArray(g.graph.nodes) || g.graph.nodes.length === 0) errors.push("nodes пуст или не является массивом");
  if (!Array.isArray(g.graph.edges)) errors.push("edges не является массивом");

  if (errors.length > 0) return { valid: false, errors, warnings };

  const nodeIds = new Set(g.graph.nodes.map((n) => n.id));

  // Проверяем наличие START
  const startNodes = g.graph.nodes.filter((n) => n.type === "START");
  if (startNodes.length === 0) errors.push("Нет узла типа START");
  if (startNodes.length > 1) warnings.push(`Найдено ${startNodes.length} узлов START, будет использован первый`);

  // Проверяем наличие END
  const endNodes = g.graph.nodes.filter((n) => n.type === "END");
  if (endNodes.length === 0) warnings.push("Нет узла типа END — граф не имеет явного завершения");

  // Проверяем рёбра
  g.graph.edges.forEach((e, i) => {
    if (!e.from) errors.push(`Ребро #${i}: отсутствует поле 'from'`);
    if (!e.to) errors.push(`Ребро #${i}: отсутствует поле 'to'`);
    if (e.from && !nodeIds.has(e.from)) errors.push(`Ребро #${i}: узел from='${e.from}' не существует`);
    if (e.to && !nodeIds.has(e.to)) errors.push(`Ребро #${i}: узел to='${e.to}' не существует`);
  });

  // Проверяем DECISION-узлы: у них должны быть options и исходящие рёбра с label
  const outEdgeMap = new Map<string, GraphEdge[]>();
  g.graph.edges.forEach((e) => {
    const arr = outEdgeMap.get(e.from) ?? [];
    arr.push(e);
    outEdgeMap.set(e.from, arr);
  });

  g.graph.nodes.forEach((n) => {
    if (n.type === "DECISION") {
      if (!n.options || n.options.length === 0) {
        warnings.push(`DECISION узел '${n.id}' не имеет options`);
      }
      const edges = outEdgeMap.get(n.id) ?? [];
      const labeledEdges = edges.filter((e) => e.label);
      if (labeledEdges.length === 0) {
        errors.push(`DECISION узел '${n.id}' не имеет исходящих рёбер с label`);
      }
      // Проверяем соответствие options и рёбер
      if (n.options && n.options.length > 0) {
        const edgeLabels = new Set(labeledEdges.map((e) => e.label));
        n.options.forEach((opt) => {
          if (!edgeLabels.has(opt)) {
            warnings.push(`DECISION '${n.id}': option '${opt}' не имеет соответствующего ребра`);
          }
        });
      }
    }

    if (n.type === "ACTION" && !n.action_details) {
      warnings.push(`ACTION узел '${n.id}' не имеет action_details`);
    }
    if (n.type === "WARNING" && !n.action_details) {
      warnings.push(`WARNING узел '${n.id}' не имеет action_details`);
    }

    // Узлы без исходящих рёбер (кроме END)
    if (n.type !== "END") {
      const edges = outEdgeMap.get(n.id) ?? [];
      if (edges.length === 0) {
        warnings.push(`Узел '${n.id}' (${n.type}) не имеет исходящих рёбер — тупик`);
      }
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}
