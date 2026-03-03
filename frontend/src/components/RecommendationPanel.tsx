import React from "react";
import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Ctx } from "../utils/engine";

export default function RecommendationPanel({ ctx }: { ctx: Ctx }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Итоговые рекомендации</Typography>

        {ctx.recommendations.length === 0 ? (
          <Typography variant="body2" sx={{ mt: 1 }}>Пока нет финальных рекомендаций.</Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {ctx.recommendations.map((r, i) => (
              <Stack key={i} spacing={1}>
                <Typography variant="body1">{r.text}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {r.levelOfEvidence && <Chip label={`LoE: ${r.levelOfEvidence}`} size="small" />}
                  {r.sourceSection && <Chip label={`Раздел: ${r.sourceSection}`} size="small" variant="outlined" />}
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}

        {ctx.actions.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 3 }}>Назначения/ограничения</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {ctx.actions.map((a, i) => (
                <Typography key={i} variant="body2">• {a.text}</Typography>
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}