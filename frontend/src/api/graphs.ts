import { ClinicalGraph } from "../types/graph";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export async function listGraphs() {
  const r = await fetch(`${BASE}/api/graphs`);
  if (!r.ok) throw new Error("Failed to list graphs");
  return r.json() as Promise<{ graphs: { id: string; name: string; version: string }[] }>;
}

export async function loadGraph(id: string) {
  const r = await fetch(`${BASE}/api/graphs/${id}`);
  if (!r.ok) throw new Error("Failed to load graph");
  return r.json() as Promise<ClinicalGraph>;
}