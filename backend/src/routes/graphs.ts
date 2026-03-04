import { Router } from "express";
import { listGraphs, loadGraph } from "../services/graphStore.js";

export const graphsRouter = Router();

graphsRouter.get("/", (_req, res) => {
  res.json({ graphs: listGraphs() });
});

graphsRouter.get("/:id", (req, res) => {
  try {
    const g = loadGraph(req.params.id);
    res.json(g);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});