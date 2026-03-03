import React, { useEffect, useState } from "react";
import { Box, Container, MenuItem, Select, Stack, Typography } from "@mui/material";
import { listGraphs, loadGraph } from "./api/graphs";
import { ClinicalGraph } from "./types/graph";
import ConsultationPage from "./components/ConsultationPage";

export default function App() {
  const [graphs, setGraphs] = useState<{ id: string; name: string; version: string }[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [graph, setGraph] = useState<ClinicalGraph | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    listGraphs()
      .then((d) => {
        setGraphs(d.graphs);
        if (d.graphs[0]) setSelected(d.graphs[0].id);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadGraph(selected)
      .then(setGraph)
      .catch((e) => setError(String(e)));
  }, [selected]);

  return (
    <Container maxWidth={false} sx={{ py: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Clinical Graph Consult</Typography>
        <Box flex={1} />
        <Select value={selected} onChange={(e) => setSelected(String(e.target.value))} size="small" sx={{ minWidth: 360 }}>
          {graphs.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.name} (v{g.version})
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {error && <Typography color="error">{error}</Typography>}
      {graph && <ConsultationPage graph={graph} />}
    </Container>
  );
}