import fs from "node:fs";
import path from "node:path";
import { ClinicalGraph } from "../types/graph.js";

const GRAPHS_DIR = path.join(process.cwd(), "data", "graphs");

function validateGraphStructure(raw: any, filename: string): string[] {
  const errors: string[] = [];

  if (!raw.metadata) errors.push("Отсутствует блок metadata");
  if (!raw.graph) { errors.push("Отсутствует блок graph"); return errors; }
  if (!Array.isArray(raw.graph.nodes) || raw.graph.nodes.length === 0)
    errors.push("graph.nodes пуст или не массив");
  if (!Array.isArray(raw.graph.edges))
    errors.push("graph.edges не является массивом");

  if (errors.length > 0) return errors;

  const nodeIds = new Set(raw.graph.nodes.map((n: any) => n.id).filter(Boolean));

  const startNodes = raw.graph.nodes.filter((n: any) => n.type === "START");
  if (startNodes.length === 0) errors.push("Нет узла типа START");

  raw.graph.edges.forEach((e: any, i: number) => {
    if (!e.from) errors.push(`Ребро #${i}: нет поля 'from'`);
    if (!e.to) errors.push(`Ребро #${i}: нет поля 'to'`);
    if (e.from && !nodeIds.has(e.from)) errors.push(`Ребро #${i}: from='${e.from}' не существует`);
    if (e.to && !nodeIds.has(e.to)) errors.push(`Ребро #${i}: to='${e.to}' не существует`);
  });

  return errors;
}

export function listGraphs() {
  if (!fs.existsSync(GRAPHS_DIR)) {
    fs.mkdirSync(GRAPHS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(GRAPHS_DIR).filter((f) => f.endsWith(".json"));
  const result = [];

  for (const f of files) {
    const p = path.join(GRAPHS_DIR, f);
    try {
      const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
      const errors = validateGraphStructure(raw, f);
      result.push({
        id: f.replace(".json", ""),
        name: raw.metadata?.topic || f.replace(".json", ""),
        version: raw.metadata?.version || "?",
        file: f,
        valid: errors.length === 0,
        errors,
      });
    } catch (e: any) {
      result.push({
        id: f.replace(".json", ""),
        name: f.replace(".json", ""),
        version: "?",
        file: f,
        valid: false,
        errors: [`Ошибка парсинга JSON: ${e.message}`],
      });
    }
  }

  return result;
}

export function loadGraph(graphId: string): ClinicalGraph {
  if (!fs.existsSync(GRAPHS_DIR)) {
    throw new Error("Директория graphs не найдена");
  }

  const files = fs.readdirSync(GRAPHS_DIR).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    if (f.replace(".json", "") === graphId) {
      const p = path.join(GRAPHS_DIR, f);
      let raw: any;
      try {
        raw = JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch (e: any) {
        throw new Error(`Ошибка парсинга JSON файла '${f}': ${e.message}`);
      }

      const errors = validateGraphStructure(raw, f);
      if (errors.length > 0) {
        throw new Error(`Граф '${graphId}' содержит ошибки:\n${errors.join("\n")}`);
      }

      return raw as ClinicalGraph;
    }
  }
  throw new Error(`Граф не найден: ${graphId}`);
}
