import { useMemo, useState, useCallback } from "react";
import {
  Box, Button, Card, CardContent, Divider, Stack,
  Typography, Alert, AlertTitle, Chip
} from "@mui/material";
import { ClinicalGraph, DecisionNode, StartNode } from "../types/graph";
import {
  applyNode, chooseNextNodeId, indexGraph, initCtx, Ctx, validateGraph
} from "../utils/engine";
import GraphViewer from "./GraphViewer";
import RecommendationPanel from "./RecommendationPanel";
import PathPanel from "./PathPanel";

type Props = { graph: ClinicalGraph };

// Узлы, где управление передаётся пользователю
function needsUserInput(node: ReturnType<typeof Array.prototype[0]>): boolean {
  if (!node) return false;
  if (node.type === "DECISION") return true;
  if (node.type === "START" && node.question) return true;
  if (node.type === "WARNING") return true;
  return false;
}

// Проходим по авто-узлам (START без вопроса, ACTION, END) пока не дойдём до
// интерактивного или тупика. Возвращает финальный nodeId и обновлённый ctx.
function runAutoAdvance(
  startNodeId: string,
  ctx: Ctx,
  nodeById: Map<string, any>,
  outEdges: Map<string, any[]>
): { nodeId: string; ctx: Ctx } {
  let nodeId = startNodeId;
  let currentCtx = ctx;
  const visited = new Set<string>();

  while (true) {
    if (visited.has(nodeId)) break; // защита от цикла
    visited.add(nodeId);

    const node = nodeById.get(nodeId);
    if (!node) break;
    if (needsUserInput(node)) break; // ждём пользователя

    // Применяем side-effects узла
    currentCtx = applyNode(node, currentCtx);

    if (node.type === "END") break; // финиш

    // Авто-переход: ищем ребро без label
    const nextId = chooseNextNodeId(nodeId, null, outEdges);
    if (!nextId) break; // тупик

    nodeId = nextId;
  }

  return { nodeId, ctx: currentCtx };
}

export default function ConsultationPage({ graph }: Props) {
  const { nodeById, outEdges } = useMemo(() => indexGraph(graph), [graph]);
  const validation = useMemo(() => validateGraph(graph), [graph]);

  // Инициализируем состояние, сразу прогоняя авто-узлы от START
  const [state, setState] = useState<{ nodeId: string; ctx: Ctx }>(() => {
    const startId = graph.graph.nodes[0].id;
    return runAutoAdvance(startId, initCtx(), nodeById, outEdges);
  });

  const currentNode = nodeById.get(state.nodeId);
  const isFinished = currentNode?.type === "END";

  // Пользователь выбрал опцию (DECISION / START с вопросом)
  const handleOptionSelect = useCallback((edgeLabel: string) => {
    const nextId = chooseNextNodeId(state.nodeId, edgeLabel, outEdges);
    if (!nextId) return;

    // Сохраняем ответ в ctx, применяем текущий узел и прогоняем авто-цепочку
    const ctxWithAnswer: Ctx = {
      ...state.ctx,
      answers: { ...state.ctx.answers, [state.nodeId]: edgeLabel },
    };
    const ctxWithNode = applyNode(currentNode, ctxWithAnswer);
    const next = runAutoAdvance(nextId, ctxWithNode, nodeById, outEdges);
    setState(next);
  }, [state, currentNode, outEdges, nodeById]);

  // Пользователь подтвердил WARNING — идём дальше
  const handleWarningContinue = useCallback(() => {
    const ctxWithNode = applyNode(currentNode, state.ctx);
    const nextId = chooseNextNodeId(state.nodeId, null, outEdges);
    if (!nextId) {
      // нет авто-перехода — просто обновляем ctx, остаёмся
      setState({ nodeId: state.nodeId, ctx: ctxWithNode });
      return;
    }
    const next = runAutoAdvance(nextId, ctxWithNode, nodeById, outEdges);
    setState(next);
  }, [state, currentNode, outEdges, nodeById]);

  // Сброс
  const handleRestart = useCallback(() => {
    const startId = graph.graph.nodes[0].id;
    setState(runAutoAdvance(startId, initCtx(), nodeById, outEdges));
  }, [graph, nodeById, outEdges]);

  const q = (currentNode?.type === "START" || currentNode?.type === "DECISION")
    ? (currentNode as StartNode | DecisionNode)
    : null;

  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "2fr 1fr" }} gap={2} p={2}>
      <Box>

        {/* Ошибки валидации */}
        {!validation.valid && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Ошибки в структуре графа</AlertTitle>
            {validation.errors.map((e, i) => <Typography key={i} variant="body2">• {e}</Typography>)}
          </Alert>
        )}
        {validation.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Предупреждения о структуре</AlertTitle>
            {validation.warnings.map((w, i) => <Typography key={i} variant="body2">• {w}</Typography>)}
          </Alert>
        )}

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="h6" sx={{ flex: 1 }}>{graph.metadata.topic}</Typography>
              <Chip label={`v${graph.metadata.version}`} size="small" />
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {/* DECISION / START с вопросом */}
            {q && q.question && (
              <Stack spacing={2}>
                <Typography variant="h5">{q.label}</Typography>
                <Typography variant="body1" color="text.secondary">{q.question}</Typography>
                <Stack spacing={1}>
                  {q.options.map((option) => (
                    <Button
                      key={option}
                      variant="outlined"
                      fullWidth
                      onClick={() => handleOptionSelect(option)}
                      sx={{ justifyContent: "flex-start", textAlign: "left", py: 1.5 }}
                    >
                      {option}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            )}

            {/* WARNING — блокирует и ждёт подтверждения */}
            {currentNode?.type === "WARNING" && currentNode.action_details && (
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

            {/* Завершение */}
            {isFinished && (
              <Alert severity="success">
                <AlertTitle>✅ Консультация завершена</AlertTitle>
                Рекомендации сформированы и отображены ниже.
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />
            <Button variant="text" onClick={handleRestart}>↩ Начать заново</Button>
          </CardContent>
        </Card>

        <Box mt={2}><RecommendationPanel ctx={state.ctx} /></Box>
        <Box mt={2}><PathPanel ctx={state.ctx} /></Box>
      </Box>

      <Box>
        <GraphViewer
          graph={graph}
          activeNodeId={state.nodeId}
          pathNodeIds={state.ctx.path.map((p) => p.nodeId)}
        />
      </Box>
    </Box>
  );
}
