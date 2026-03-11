import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Ctx } from "../utils/engine";

const typeColors: Record<string, "default" | "success" | "primary" | "warning" | "error" | "secondary"> = {
  START: "success",
  DECISION: "primary",
  ACTION: "warning",
  WARNING: "error",
  END: "secondary",
};

export default function PathPanel({ ctx }: { ctx: Ctx }) {
  if (ctx.path.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Путь консультации</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {ctx.path.map((p, i) => (
            <Chip
              key={i}
              label={p.label}
              color={typeColors[p.type] ?? "default"}
              size="small"
              variant="outlined"
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
