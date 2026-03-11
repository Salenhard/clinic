export type NodeType = "START" | "DECISION" | "ACTION" | "WARNING" | "END";

export interface ActionDetails {
  procedure: string;
  implant?: string | null;
  timing?: string | null;
  evidence_level?: string;
  contraindications?: string[];
  notes?: string;
}

export interface GraphNodeBase {
  id: string;
  type: NodeType;
  label: string;
}

export interface StartNode extends GraphNodeBase {
  type: "START";
  question: string | null;
  options: string[];
  action_details: null;
}

export interface DecisionNode extends GraphNodeBase {
  type: "DECISION";
  question: string;
  options: string[];
  action_details: null;
}

export interface ActionNode extends GraphNodeBase {
  type: "ACTION";
  question?: string | null;
  options?: string[];
  action_details: ActionDetails;
}

export interface WarningNode extends GraphNodeBase {
  type: "WARNING";
  question?: string | null;
  options?: string[];
  action_details: ActionDetails;
}

export interface EndNode extends GraphNodeBase {
  type: "END";
  question?: string | null;
  options?: string[];
  action_details: null;
}

export type GraphNode = StartNode | DecisionNode | ActionNode | WarningNode | EndNode;

export interface EdgeCondition {
  field: string;
  operator: "==" | "!=" | "<" | ">" | "<=" | ">=";
  value: string | number;
}

export interface GraphEdge {
  id?: string;
  from: string;
  to: string;
  label?: string | null;
  condition?: EdgeCondition | null;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ClinicalGraph {
  metadata: {
    source_document: string;
    created_at: string;
    version: string;
    topic: string;
    pipeline_version?: string;
  };
  graph: GraphData;
  changelog?: Array<{
    action: string;
    element: string;
    id: string;
    reason: string;
  }>;
}

// Результат валидации графа
export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
