import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { Ctx } from "../utils/engine";

export default function PathPanel({ ctx }: { ctx: Ctx }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Путь принятия решения</Typography>
        <Divider sx={{ my: 1 }} />
        {ctx.path.length === 0 ? (
          <Typography variant="body2">Путь пока пуст.</Typography>
        ) : (
          <Stack spacing={0.5}>
            {ctx.path.map((p, idx) => (
              <Typography key={idx} variant="caption">
                {idx + 1}. [{p.type}] {p.label} ({p.nodeId})
              </Typography>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}