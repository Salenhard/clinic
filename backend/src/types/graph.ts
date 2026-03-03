export type NodeType =
  | "question"
  | "condition"
  | "action"
  | "diagnosis"
  | "recommendation";

export type QuestionKind = "yesno" | "number" | "select" | "text";

export interface GraphNodeBase {
  id: string;
  type: NodeType;
  label: string;
}

export interface QuestionNode extends GraphNodeBase {
  type: "question";
  questionKind: QuestionKind;
  key: string; // ключ ответа в ctx.answers
  options?: { value: string; label: string }[]; // для select
  unit?: string; // для number
}

export interface ConditionNode extends GraphNodeBase {
  type: "condition";
  expression: string; // JS expression, доступен ctx
}

export interface ActionNode extends GraphNodeBase {
  type: "action";
  action: { code: string; text: string };
}

export interface DiagnosisNode extends GraphNodeBase {
  type: "diagnosis";
  diagnosis: { code: string; text: string };
}

export interface RecommendationNode extends GraphNodeBase {
  type: "recommendation";
  recommendation: {
    text: string;
    levelOfEvidence?: "A" | "B" | "C";
    sourceSection?: string;
  };
}

export type GraphNode =
  | QuestionNode
  | ConditionNode
  | ActionNode
  | DiagnosisNode
  | RecommendationNode;

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  condition: string; // yes/no/range:min:max/expr:.../default
}

export interface ClinicalGraph {
  id: string;
  name: string;
  version: string;
  startNodeId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}