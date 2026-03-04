import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { GraphNode } from "../types/graph";

type Props = {
  node: GraphNode;
  isActive?: boolean;
};

const typeLabels: Record<string, string> = {
  question: "Вопрос",
  condition: "Условие",
  action: "Действие",
  diagnosis: "Диагноз",
  recommendation: "Рекомендация"
};

export default function NodeCard({ node, isActive }: Props) {
  return (
    <Card variant="outlined" sx={{ borderWidth: isActive ? 2 : 1 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={typeLabels[node.type] ?? node.type} />
            {isActive && <Chip size="small" color="primary" label="Текущий" />}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {node.id}
          </Typography>
        </Stack>

        <Typography variant="h6" sx={{ mt: 1 }}>
          {node.label}
        </Typography>

        {node.type === "question" && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Тип ответа: {node.questionKind}
            {node.unit ? ` (${node.unit})` : ""}
          </Typography>
        )}

        {node.type === "condition" && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontFamily: "monospace", whiteSpace: "pre-wrap" }}
          >
            {node.expression}
          </Typography>
        )}

        {node.type === "action" && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            • {node.action.text}
          </Typography>
        )}

        {node.type === "diagnosis" && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            • {node.diagnosis.text}
          </Typography>
        )}

        {node.type === "recommendation" && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">• {node.recommendation.text}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {node.recommendation.levelOfEvidence && (
                <Chip size="small" label={`LoE: ${node.recommendation.levelOfEvidence}`} />
              )}
              {node.recommendation.sourceSection && (
                <Chip size="small" variant="outlined" label={`Раздел: ${node.recommendation.sourceSection}`} />
              )}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}