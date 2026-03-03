import { Router } from "express";

export const logsRouter = Router();
const inMemory: any[] = [];

logsRouter.post("/", (req, res) => {
  inMemory.push({ ts: Date.now(), payload: req.body });
  res.json({ ok: true });
});

logsRouter.get("/", (_, res) => res.json({ items: inMemory.slice(-200) }));