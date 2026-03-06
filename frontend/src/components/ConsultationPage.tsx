import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { Box, Button, Card, CardContent, Divider, Stack, Typography, Alert, AlertTitle } from "@mui/material";
import { ClinicalGraph, StartNode, DecisionNode } from "../types/graph";
import { answerQuestion, applyNodeSideEffects, chooseNextNodeId, indexGraph, initCtx, Ctx, getQuestionKey } from "../utils/engine";
import GraphViewer from "./GraphViewer";
import RecommendationPanel from "./RecommendationPanel";
import PathPanel from "./PathPanel";

type Props = { graph: ClinicalGraph; onRestart?: () => void };

function isAutoNode(node: any): boolean {
  if (!node) return false;
  if (node.type === "ACTION") return true;
  if (node.type === "END") return true;
  if (node.type === "START" && !node.question) return true;
  return false;
}

export default function ConsultationPage({ graph, onRestart }: Props) {
  const { nodeById, outEdges } = useMemo(() => indexGraph(graph), [graph]);
  const [ctx, setCtx] = useState<Ctx>(() => initCtx());
  const [currentNodeId, setCurrentNodeId] = useState(graph.graph.nodes[0].id);

  const currentNode = nodeById.get(currentNodeId);
  const processedNodes = useRef<Set<string>>(new Set());

  useLayoutEffect(() => {
    if (!currentNode) return;
    if (processedNodes.current.has(currentNode.id)) return;
    if (!isAutoNode(currentNode)) return;

    processedNodes.current.add(currentNode.id);
    const ctx2 = applyNodeSideEffects(currentNode, ctx);
    setCtx(ctx2);

    if (currentNode.type !== "END") {
      const nextId = chooseNextNodeId(currentNode.id, ctx2, outEdges);
      if (nextId) setCurrentNodeId(nextId);
    }
  }, [currentNode]);

  useEffect(() => {
    if (!currentNode) return;
    if (!isAutoNode(currentNode)) return;

    const ctx2 = applyNodeSideEffects(currentNode, ctx);
    setCtx(ctx2);

    if (currentNode.type !== "END") {
      const nextId = chooseNextNodeId(currentNode.id, ctx2, outEdges);
      if (nextId) setCurrentNodeId(nextId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId]);

  if (!currentNode) {
    return (
      <Box p={2}>
        <Typography color="error">Текущий узел не найден: {currentNodeId}</Typography>
      </Box>
    );
  }

  const isFinished = currentNode.type === "END";

  const handleOptionSelect = (option: string) => {
    const node = currentNode as StartNode | DecisionNode;
    const questionKey = getQuestionKey(node);
    const ctx2 = answerQuestion(ctx, questionKey, option);
    setCtx(ctx2);
    const nextId = chooseNextNodeId(currentNode.id, ctx2, outEdges);
    if (nextId) setCurrentNodeId(nextId);
  };

  // WARNING: сохраняем в ctx и идём дальше — предупреждение остаётся в RecommendationPanel
  const handleWarningContinue = () => {
    const ctx2 = applyNodeSideEffects(currentNode, ctx);
    setCtx(ctx2);
    const nextId = chooseNextNodeId(currentNode.id, ctx2, outEdges);
    if (nextId) setCurrentNodeId(nextId);
  };

  const restart = () => {
    processedNodes.current.clear();
    setCtx(initCtx());
    setCurrentNodeId(graph.graph.nodes[0].id);
    onRestart?.();
  };

  const q = (currentNode.type === "START" || currentNode.type === "DECISION")
    ? (currentNode as StartNode | DecisionNode)
    : null;

  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "2fr 1fr" }} gap={2} p={2}>
      <Box>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {graph.metadata.topic}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* DECISION / START с вопросом */}
            {q && q.question && (
              <Stack spacing={2}>
                <Typography variant="h5">{q.label}</Typography>
                <Typography variant="body1">{q.question}</Typography>
                {q.options && q.options.length > 0 && (
                  <Stack spacing={1}>
                    {q.options.map((option) => (
                      <Button
                        key={option}
                        variant="outlined"
                        fullWidth
                        onClick={() => handleOptionSelect(option)}
                        sx={{ justifyContent: "flex-start", textAlign: "left" }}
                      >
                        {option}
                      </Button>
                    ))}
                  </Stack>
                )}
              </Stack>
            )}

            {/* START без вопроса */}
            {q && !q.question && (
              <Stack spacing={2}>
                <Typography variant="h5">{q.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Автоматический переход...
                </Typography>
              </Stack>
            )}

            {/* WARNING — показываем, ждём подтверждения. После — уходит в панель снизу */}
            {currentNode.type === "WARNING" && currentNode.action_details && (
              <Stack spacing={2}>
                <Alert severity="warning" variant="filled">
                  <AlertTitle sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    ⚠️ {currentNode.label}
                  </AlertTitle>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Процедура:</strong> {currentNode.action_details.procedure}
                  </Typography>
                  {currentNode.action_details.implant && (
                    <Typography variant="body2">
                      <strong>Имплант:</strong> {currentNode.action_details.implant}
                    </Typography>
                  )}
                  {currentNode.action_details.timing && (
                    <Typography variant="body2">
                      <strong>Время:</strong> {currentNode.action_details.timing}
                    </Typography>
                  )}
                  {currentNode.action_details.evidence_level && (
                    <Typography variant="body2">
                      <strong>Уровень доказательств:</strong> {currentNode.action_details.evidence_level}
                    </Typography>
                  )}
                  {currentNode.action_details.contraindications && currentNode.action_details.contraindications.length > 0 && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: "rgba(0,0,0,0.15)", borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>🚫 Противопоказания:</Typography>
                      {currentNode.action_details.contraindications.map((c, i) => (
                        <Typography key={i} variant="body2" sx={{ ml: 1 }}>• {c}</Typography>
                      ))}
                    </Box>
                  )}
                  {currentNode.action_details.notes && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                      📝 {currentNode.action_details.notes}
                    </Typography>
                  )}
                </Alert>
                <Button variant="contained" color="warning" onClick={handleWarningContinue} fullWidth>
                  Принято, продолжить
                </Button>
              </Stack>
            )}

            {/* ACTION */}
            {currentNode.type === "ACTION" && currentNode.action_details && (
              <Stack spacing={2}>
                <Typography variant="h6">{currentNode.label}</Typography>
                <Box sx={{ bgcolor: "info.light", p: 2, borderRadius: 1 }}>
                  <Typography variant="body2"><strong>Процедура:</strong> {currentNode.action_details.procedure}</Typography>
                  {currentNode.action_details.implant && (
                    <Typography variant="body2"><strong>Имплант:</strong> {currentNode.action_details.implant}</Typography>
                  )}
                  {currentNode.action_details.timing && (
                    <Typography variant="body2"><strong>Время:</strong> {currentNode.action_details.timing}</Typography>
                  )}
                  {currentNode.action_details.evidence_level && (
                    <Typography variant="body2"><strong>Уровень доказательств:</strong> {currentNode.action_details.evidence_level}</Typography>
                  )}
                  {currentNode.action_details.notes && (
                    <Typography variant="body2"><strong>Примечания:</strong> {currentNode.action_details.notes}</Typography>
                  )}
                  {currentNode.action_details.contraindications && currentNode.action_details.contraindications.length > 0 && (
                    <Typography variant="body2">
                      <strong>Противопоказания:</strong> {currentNode.action_details.contraindications.join(", ")}
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}

            {/* END */}
            {isFinished && (
              <Typography variant="h6" color="success.main">
                ✅ Консультация завершена
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2}>
              <Button onClick={restart}>Начать заново</Button>
            </Stack>
          </CardContent>
        </Card>

        <Box mt={2}>
          <RecommendationPanel ctx={ctx} />
        </Box>
        <Box mt={2}>
          <PathPanel ctx={ctx} />
        </Box>
      </Box>

      <Box>
        <GraphViewer graph={graph} activeNodeId={currentNodeId} pathNodeIds={ctx.path.map(p => p.nodeId)} />
      </Box>
    </Box>
  );
}
