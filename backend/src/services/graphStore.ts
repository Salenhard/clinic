import fs from "node:fs";
import path from "node:path";
import { ClinicalGraph } from "../types/graph.js";

const GRAPHS_DIR = path.join(process.cwd(), "data", "graphs");

export function listGraphs() {
  const files = fs.readdirSync(GRAPHS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const p = path.join(GRAPHS_DIR, f);
    const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as ClinicalGraph;
    return { id: raw.id, name: raw.name, version: raw.version, file: f };
  });
}

export function loadGraph(graphId: string): ClinicalGraph {
  const files = fs.readdirSync(GRAPHS_DIR).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const p = path.join(GRAPHS_DIR, f);
    const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as ClinicalGraph;
    if (raw.id === graphId) return raw;
  }
  throw new Error(`Graph not found: ${graphId}`);
}