import express from "express";
import cors from "cors";
import morgan from "morgan";
import { graphsRouter } from "./routes/graphs.js";
import { logsRouter } from "./routes/logs.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/api/graphs", graphsRouter);
app.use("/api/logs", logsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`Backend listening on :${port}`));