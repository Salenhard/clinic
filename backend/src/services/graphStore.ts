import fs from "node:fs";
import path from "node:path";
import { ClinicalGraph } from "../types/graph.js";

const GRAPHS_DIR = path.join(process.cwd(), "data", "graphs");

export function listGraphs() {
  const files = fs.readdirSync(GRAPHS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const p = path.join(GRAPHS_DIR, f);
    const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as ClinicalGraph;
    return { 
      id: f.replace(".json", ""), 
      name: raw.metadata?.topic || "Clinical Guidelines",
      version: raw.metadata?.version || "1.0",
      file: f 
    };
  });
}

export function loadGraph(graphId: string): ClinicalGraph {
  const files = fs.readdirSync(GRAPHS_DIR).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    if (f.replace(".json", "") === graphId) {
      const p = path.join(GRAPHS_DIR, f);
      const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as ClinicalGraph;
      return raw;
    }
  }
  throw new Error(`Graph not found: ${graphId}`);
}