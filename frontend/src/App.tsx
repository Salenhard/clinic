import { useEffect, useState } from "react";
import { Box, Container, MenuItem, Select, Stack, Typography, Chip, Alert } from "@mui/material";
import { listGraphs, loadGraph } from "./api/graphs";
import { ClinicalGraph } from "./types/graph";
import ConsultationPage from "./components/ConsultationPage";

interface GraphMeta {
  id: string;
  name: string;
  version: string;
  valid: boolean;
  errors: string[];
}

export default function App() {
  const [graphs, setGraphs] = useState<GraphMeta[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [graph, setGraph] = useState<ClinicalGraph | null>(null);
  const [loadError, setLoadError] = useState<string>("");

useEffect(() => {
  listGraphs()
    .then((d) => {
      const graphsArray = Array.isArray(d) ? d : d.graphs;
      setGraphs(graphsArray);
      const first = graphsArray[0];
      if (first) setSelected(first.id);
    })
    .catch((e) => setLoadError(String(e)));
}, []);

  useEffect(() => {
    if (!selected) return;
    setGraph(null);
    setLoadError("");
    loadGraph(selected)
      .then(setGraph)
      .catch((e) => setLoadError(String(e)));
  }, [selected]);

  const selectedMeta = graphs.find((g) => g.id === selected);

  return (
    <Container maxWidth={false} sx={{ py: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Clinical Graph Consult</Typography>
        <Box flex={1} />
        <Select
          value={selected}
          onChange={(e) => setSelected(String(e.target.value))}
          size="small"
          sx={{ minWidth: 360 }}
        >
          {graphs.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{g.name} (v{g.version})</span>
                {!g.valid && <Chip label="Ошибки" color="error" size="small" />}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      {selectedMeta && !selectedMeta.valid && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Граф содержит ошибки и не может быть загружен:</Typography>
          {selectedMeta.errors.map((e, i) => (
            <Typography key={i} variant="body2">• {e}</Typography>
          ))}
        </Alert>
      )}

      {/* key={selected} — полное пересоздание компонента при смене графа */}
      {graph && <ConsultationPage key={selected} graph={graph} />}
    </Container>
  );
}
