import { useEffect, useMemo, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import { Card, CardContent, Typography } from "@mui/material";
import { ClinicalGraph } from "../types/graph";

cytoscape.use(fcose);

type Props = {
  graph: ClinicalGraph;
  activeNodeId: string;
  pathNodeIds: string[];
};

export default function GraphViewer({ graph, activeNodeId, pathNodeIds }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const elements = useMemo(() => {
    const nodes = graph.graph.nodes.map((n) => ({
      data: { id: n.id, label: `${n.label}`, type: n.type }
    }));
    const edges = graph.graph.edges.map((e, idx) => ({
      data: { id: e.id ?? `e${idx}`, source: e.from, target: e.to, label: e.label }
    }));
    return [...nodes, ...edges];
  }, [graph]);

  useEffect(() => {
    if (!ref.current) return;

    if (cyRef.current) cyRef.current.destroy();

    const cy = cytoscape({
      container: ref.current,
      elements,
      style: [
        { selector: "node", style: { "label": "data(label)", "font-size": "10", "text-wrap": "wrap", "text-max-width": "120", "border-width": "2", "padding": "10px" } },
        { selector: "edge", style: { "curve-style": "bezier", "target-arrow-shape": "triangle", "width": "1", "label": "data(label)", "font-size": "8" } },

        { selector: 'node[type="START"]', style: { "shape": "round-rectangle", "background-color": "#4CAF50", "color": "white" } },
        { selector: 'node[type="DECISION"]', style: { "shape": "diamond", "background-color": "#2196F3", "color": "white" } },
        { selector: 'node[type="ACTION"]', style: { "shape": "round-rectangle", "background-color": "#FF9800", "color": "white" } },
        { selector: 'node[type="WARNING"]', style: { "shape": "round-rectangle", "background-color": "#F44336", "color": "white" } },
        { selector: 'node[type="END"]', style: { "shape": "round-rectangle", "background-color": "#9C27B0", "color": "white" } },

        { selector: ".inPath", style: { "border-width": "3", "border-color": "#FFC107" } },
        { selector: ".active", style: { "border-width": "4", "border-color": "#FF5722" } }
      ],
      layout: { name: "fcose"}
    });

    cyRef.current = cy;
    return () => cy.destroy();
  }, [elements]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass("active").removeClass("inPath");

    for (const id of pathNodeIds) cy.getElementById(id).addClass("inPath");
    cy.getElementById(activeNodeId).addClass("active");
  }, [activeNodeId, pathNodeIds]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>Граф консультации</Typography>
        <div ref={ref} style={{ width: "100%", height: 600 }} />
      </CardContent>
    </Card>
  );
}