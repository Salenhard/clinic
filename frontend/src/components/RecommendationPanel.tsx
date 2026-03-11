import { Alert, AlertTitle, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Ctx } from "../utils/engine";

export default function RecommendationPanel({ ctx }: { ctx: Ctx }) {
  if (ctx.actions.length === 0 && ctx.warnings.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Рекомендации</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Пройдите алгоритм для получения рекомендаций.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Рекомендации</Typography>

        {ctx.actions.length > 0 && (
          <Stack spacing={2}>
            {ctx.actions.map((a, i) => (
              <Box key={i} sx={{ p: 1.5, bgcolor: "info.lighter", borderRadius: 1, border: "1px solid", borderColor: "info.light" }}>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>{a.nodeLabel}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{a.procedure}</Typography>
                {a.implant && (
                  <Typography variant="body2"><strong>Имплант:</strong> {a.implant}</Typography>
                )}
                {a.timing && (
                  <Typography variant="body2"><strong>Время:</strong> {a.timing}</Typography>
                )}
                {a.evidence_level && (
                  <Chip label={`УДД: ${a.evidence_level}`} size="small" sx={{ mt: 0.5 }} />
                )}
                {a.notes && (
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5 }}>{a.notes}</Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}

        {/* Warnings остаются до сброса контекста */}
        {ctx.warnings.length > 0 && (
          <Stack spacing={2} sx={{ mt: ctx.actions.length > 0 ? 3 : 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>⚠️ Предостережения</Typography>
            {ctx.warnings.map((w, i) => (
              <Alert key={i} severity="warning" variant="outlined">
                <AlertTitle sx={{ fontWeight: "bold" }}>{w.nodeLabel}</AlertTitle>
                <Typography variant="body2">{w.procedure}</Typography>
                {w.implant && (
                  <Typography variant="body2"><strong>Имплант:</strong> {w.implant}</Typography>
                )}
                {w.timing && (
                  <Typography variant="body2"><strong>Время:</strong> {w.timing}</Typography>
                )}
                {w.evidence_level && (
                  <Chip label={`УДД: ${w.evidence_level}`} size="small" sx={{ mt: 0.5, mb: 0.5 }} />
                )}
                {w.contraindications && w.contraindications.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>🚫 Противопоказания:</Typography>
                    {w.contraindications.map((c, j) => (
                      <Typography key={j} variant="body2" sx={{ ml: 1 }}>• {c}</Typography>
                    ))}
                  </Box>
                )}
                {w.notes && (
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>📝 {w.notes}</Typography>
                )}
              </Alert>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
