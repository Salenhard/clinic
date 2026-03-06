import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { GraphNode } from "../types/graph";

type Props = {
  node: GraphNode;
  isActive?: boolean;
};

const typeLabels: Record<string, string> = {
  START: "Начало",
  DECISION: "Решение",
  ACTION: "Процедура",
  WARNING: "Предостережение",
  END: "Конец"
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

        {(node.type === "START" || node.type === "DECISION") && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Вопрос:</strong> {node.question}
            </Typography>
            {node.options.length > 0 && (
              <Stack spacing={0.5}>
                {node.options.map((opt) => (
                  <Typography key={opt} variant="caption" sx={{ ml: 2 }}>
                    • {opt}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {(node.type === "ACTION" || node.type === "WARNING") && node.action_details && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Процедура:</strong> {node.action_details.procedure}
            </Typography>
            {node.action_details.implant && (
              <Typography variant="body2">
                <strong>Имплант:</strong> {node.action_details.implant}
              </Typography>
            )}
            {node.action_details.timing && (
              <Typography variant="body2">
                <strong>Время:</strong> {node.action_details.timing}
              </Typography>
            )}
            {node.action_details.evidence_level && (
              <Chip size="small" label={`УДД: ${node.action_details.evidence_level}`} />
            )}
            {node.action_details.notes && (
              <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                {node.action_details.notes}
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}