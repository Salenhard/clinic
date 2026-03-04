import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Divider, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { ClinicalGraph, QuestionNode } from "../types/graph";
import { answerQuestion, applyNodeSideEffects, chooseNextNodeId, indexGraph, initCtx, Ctx } from "../utils/engine";
import GraphViewer from "./GraphViewer";
import RecommendationPanel from "./RecommendationPanel";
import PathPanel from "./PathPanel";

type Props = { graph: ClinicalGraph; onRestart?: () => void };

export default function ConsultationPage({ graph, onRestart }: Props) {
  const { nodeById, outEdges } = useMemo(() => indexGraph(graph), [graph]);
  const [ctx, setCtx] = useState<Ctx>(() => initCtx());
  const [currentNodeId, setCurrentNodeId] = useState(graph.startNodeId);
  const [inputValue, setInputValue] = useState<any>("");

  const currentNode = nodeById.get(currentNodeId);

  useEffect(() => {
    // Автопроход по condition/action/diagnosis/recommendation без вопросов
    if (!currentNode) return;

    if (currentNode.type !== "question") {
      const ctx2 = applyNodeSideEffects(currentNode, ctx);
      setCtx(ctx2);

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

//  const isFinished = currentNode.type === "question" ? false : false; // рекомендации добавляются в ctx.recommendations

  const handleYesNo = (v: boolean) => {
    const q = currentNode as QuestionNode;
    const ctx2 = answerQuestion(ctx, q.key, v);
    setCtx(ctx2);
    const nextId = chooseNextNodeId(currentNode.id, ctx2, outEdges);
    if (nextId) setCurrentNodeId(nextId);
  };

  const handleSubmitValue = () => {
    const q = currentNode as QuestionNode;
    const val = q.questionKind === "number" ? Number(inputValue) : inputValue;
    const ctx2 = answerQuestion(ctx, q.key, val);
    setCtx(ctx2);
    const nextId = chooseNextNodeId(currentNode.id, ctx2, outEdges);
    if (nextId) setCurrentNodeId(nextId);
  };

  const restart = () => {
    setCtx(initCtx());
    setCurrentNodeId(graph.startNodeId);
    setInputValue("");
    onRestart?.();
  };

  const q = currentNode.type === "question" ? (currentNode as QuestionNode) : null;

  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "2fr 1fr" }} gap={2} p={2}>
      <Box>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {graph.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {q && (
              <Stack spacing={2}>
                <Typography variant="h5">{q.label}</Typography>

                {q.questionKind === "yesno" && (
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" onClick={() => handleYesNo(true)}>Да</Button>
                    <Button variant="outlined" onClick={() => handleYesNo(false)}>Нет</Button>
                  </Stack>
                )}

                {q.questionKind === "number" && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                    <TextField
                      label={q.unit ? `Значение (${q.unit})` : "Значение"}
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      fullWidth
                    />
                    <Button variant="contained" onClick={handleSubmitValue}>Далее</Button>
                  </Stack>
                )}

                {q.questionKind === "text" && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                    <TextField
                      label="Введите"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      fullWidth
                    />
                    <Button variant="contained" onClick={handleSubmitValue}>Далее</Button>
                  </Stack>
                )}

                {q.questionKind === "select" && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                    <Select
                      value={inputValue}
                      displayEmpty
                      onChange={(e) => setInputValue(e.target.value)}
                      fullWidth
                    >
                      <MenuItem value=""><em>Выберите...</em></MenuItem>
                      {(q.options ?? []).map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                    <Button variant="contained" onClick={handleSubmitValue} disabled={!inputValue}>
                      Далее
                    </Button>
                  </Stack>
                )}
              </Stack>
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