import { ClinicalGraph } from "../types/graph";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export interface GraphMeta {
  id: string;
  name: string;
  version: string;
  valid: boolean;
  errors: string[];
}

export async function listGraphs(): Promise<{ graphs: GraphMeta[] }> {
  const r = await fetch(`${BASE}/api/graphs`);
  if (!r.ok) throw new Error(`Не удалось загрузить список графов (${r.status})`);
  return r.json();
}

export async function loadGraph(id: string): Promise<ClinicalGraph> {
  const r = await fetch(`${BASE}/api/graphs/${id}`);
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error ?? `Не удалось загрузить граф '${id}' (${r.status})`);
  }
  return r.json();
}
