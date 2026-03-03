import React, { useEffect, useMemo, useRef } from "react";
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
    const nodes = graph.nodes.map((n) => ({
      data: { id: n.id, label: `${n.label}`, type: n.type }
    }));
    const edges = graph.edges.map((e, idx) => ({
      data: { id: e.id ?? `e${idx}`, source: e.source, target: e.target, condition: e.condition }
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
        { selector: "node", style: { "label": "data(label)", "font-size": 8, "text-wrap": "wrap", "text-max-width": 120, "border-width": 1 } },
        { selector: "edge", style: { "curve-style": "bezier", "target-arrow-shape": "triangle", "width": 1, "label": "data(condition)", "font-size": 7 } },

        { selector: 'node[type="question"]', style: { "shape": "round-rectangle" } },
        { selector: 'node[type="condition"]', style: { "shape": "diamond" } },
        { selector: 'node[type="recommendation"]', style: { "shape": "round-rectangle", "border-width": 2 } },
        { selector: ".inPath", style: { "border-width": 3 } },
        { selector: ".active", style: { "border-width": 4 } }
      ],
      layout: { name: "fcose", quality: "default", animate: false }
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