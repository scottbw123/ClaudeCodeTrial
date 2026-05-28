"use client";

import { useMemo } from "react";
import { Layer, Rectangle, ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { ChartBox } from "../components/ChartBox";

const MAX_STEPS = 5;
const PER_STEP = 8;
const INTAKE_NODE = "Intake form";

function normPath(url: string): string {
  try {
    const u = new URL(url);
    return (u.pathname || "/") + (u.hash || "");
  } catch {
    return url;
  }
}

function shortLabel(s: string): string {
  if (s.length <= 28) return s;
  return s.slice(0, 25) + "…";
}

interface SankeyNode { name: string; label: string }
interface SankeyLink { source: number; target: number; value: number }

function buildSankey(paths: string[][]): { nodes: SankeyNode[]; links: SankeyLink[] } {
  if (paths.length === 0) return { nodes: [], links: [] };

  // Tally page popularity per step so we can bucket the long tail.
  const perStep: Map<number, Map<string, number>> = new Map();
  for (let s = 1; s <= MAX_STEPS; s++) perStep.set(s, new Map());

  for (const path of paths) {
    for (let i = 0; i < Math.min(path.length, MAX_STEPS); i++) {
      const norm = normPath(path[i]);
      const m = perStep.get(i + 1)!;
      m.set(norm, (m.get(norm) ?? 0) + 1);
    }
  }

  const topPerStep: Map<number, Set<string>> = new Map();
  for (const [step, m] of perStep) {
    const top = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, PER_STEP).map((e) => e[0]);
    topPerStep.set(step, new Set(top));
  }

  function nodeKey(step: number, page: string): string {
    if (topPerStep.get(step)!.has(page)) return `${step}|${page}`;
    return `${step}|__OTHER__`;
  }

  const linkCounts = new Map<string, number>();
  const nodeKeys = new Set<string>();

  for (const path of paths) {
    const truncated = path.slice(0, MAX_STEPS).map(normPath);
    for (let i = 0; i < truncated.length - 1; i++) {
      const from = nodeKey(i + 1, truncated[i]);
      const to = nodeKey(i + 2, truncated[i + 1]);
      nodeKeys.add(from); nodeKeys.add(to);
      const k = `${from}>>${to}`;
      linkCounts.set(k, (linkCounts.get(k) ?? 0) + 1);
    }
    if (truncated.length > 0) {
      const lastStep = Math.min(truncated.length, MAX_STEPS);
      const from = nodeKey(lastStep, truncated[truncated.length - 1]);
      nodeKeys.add(from); nodeKeys.add(INTAKE_NODE);
      const k = `${from}>>${INTAKE_NODE}`;
      linkCounts.set(k, (linkCounts.get(k) ?? 0) + 1);
    }
  }

  const orderedKeys = Array.from(nodeKeys).sort((a, b) => {
    const stepA = a === INTAKE_NODE ? MAX_STEPS + 1 : Number(a.split("|")[0]);
    const stepB = b === INTAKE_NODE ? MAX_STEPS + 1 : Number(b.split("|")[0]);
    return stepA - stepB;
  });
  const indexOf = new Map(orderedKeys.map((k, i) => [k, i] as const));

  const nodes: SankeyNode[] = orderedKeys.map((k) => {
    if (k === INTAKE_NODE) return { name: INTAKE_NODE, label: INTAKE_NODE };
    const [, page] = k.split("|");
    const label = page === "__OTHER__" ? "Other" : shortLabel(page);
    return { name: k, label };
  });
  const links: SankeyLink[] = Array.from(linkCounts.entries()).map(([k, v]) => {
    const [from, to] = k.split(">>");
    return { source: indexOf.get(from)!, target: indexOf.get(to)!, value: v };
  });

  return { nodes, links };
}

interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: { name: string; label?: string; value: number };
  containerWidth?: number;
}

function PathNode(props: CustomNodeProps) {
  const { x, y, width, height, payload, containerWidth = 800 } = props;
  const isIntake = payload.name === INTAKE_NODE;
  const fill = isIntake ? "#7c3aed" : "#1d4ed8";
  const textAnchor = x + width > containerWidth - 140 ? "end" : "start";
  const textX = textAnchor === "end" ? x - 6 : x + width + 6;
  return (
    <Layer>
      <Rectangle x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.9} />
      <text x={textX} y={y + height / 2} textAnchor={textAnchor} dominantBaseline="middle" fontSize={11} fill="#111827">
        {payload.label ?? payload.name}
      </text>
      <text x={textX} y={y + height / 2 + 12} textAnchor={textAnchor} dominantBaseline="middle" fontSize={10} fill="#6b7280">
        {payload.value.toLocaleString()} sessions
      </text>
    </Layer>
  );
}

export function UserPaths({ paths }: { paths: string[][] }) {
  const data = useMemo(() => buildSankey(paths), [paths]);

  if (data.nodes.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Configure funnel start pages and an end event in the controls above to see path flow.
      </p>
    );
  }

  return (
    <ChartBox className="h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={<PathNode x={0} y={0} width={0} height={0} index={0} payload={{ name: "", value: 0 }} />}
          link={{ stroke: "#c7d2fe", strokeOpacity: 0.4 }}
          nodePadding={18}
          nodeWidth={12}
          margin={{ top: 8, right: 160, bottom: 8, left: 8 }}
        >
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
            formatter={(v) => `${Number(v).toLocaleString()} sessions`}
          />
        </Sankey>
      </ResponsiveContainer>
    </ChartBox>
  );
}
