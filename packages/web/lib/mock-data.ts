import { Patent, MindMapNode, MindMapEdge } from "@/types";
import { Node, Edge } from "@xyflow/react";

// Mock Patents - GLP-1 Happy Path
export const mockPatents: Patent[] = [
  {
    id: "US10,456,789",
    title: "GLP-1 receptor agonist formulations for sustained release",
    abstract:
      "Novel formulations of GLP-1 receptor agonists designed for extended release delivery. The invention relates to pharmaceutical compositions comprising semaglutide or similar peptides with improved bioavailability and patient compliance.",
    filingDate: "2021-03-15",
    inventors: ["John Smith", "Maria Garcia", "David Chen"],
    assignee: "Novo Nordisk A/S",
    relevance: 94,
    claims: [
      "A pharmaceutical composition comprising a GLP-1 receptor agonist",
      "The composition of claim 1, wherein the agonist is semaglutide",
    ],
  },
  {
    id: "US11,234,567",
    title: "Methods for treating obesity using incretin mimetics",
    abstract:
      "Methods and compositions for treating obesity and metabolic disorders using incretin mimetic compounds. The disclosed methods achieve significant weight loss through appetite suppression and metabolic regulation.",
    filingDate: "2022-07-22",
    inventors: ["Emily Johnson", "Robert Williams"],
    assignee: "Eli Lilly and Company",
    relevance: 87,
    claims: [
      "A method of treating obesity comprising administering an effective amount of an incretin mimetic",
    ],
  },
  {
    id: "US1338,734,547",
    title: "Modified Peptide Therapeutics for Metabolic Disorders",
    abstract:
      "Modified peptide compounds with enhanced stability and reduced immunogenicity for treating metabolic disorders including type 2 diabetes and obesity.",
    filingDate: "2020-11-08",
    inventors: ["Sarah Lee", "Michael Brown", "Jennifer Davis"],
    assignee: "AstraZeneca PLC",
    relevance: 41,
    claims: [
      "A modified peptide compound with enhanced metabolic stability",
    ],
  },
  {
    id: "US12,345,678",
    title: "Combination therapy for diabetes and cardiovascular disease",
    abstract:
      "Combination pharmaceutical compositions comprising GLP-1 agonists and SGLT2 inhibitors for concurrent treatment of type 2 diabetes and cardiovascular complications.",
    filingDate: "2023-01-10",
    inventors: ["Thomas Anderson", "Lisa Park"],
    assignee: "Boehringer Ingelheim",
    relevance: 72,
    claims: [
      "A combination therapy comprising a GLP-1 agonist and an SGLT2 inhibitor",
    ],
  },
  {
    id: "US10,987,654",
    title: "Oral delivery systems for peptide therapeutics",
    abstract:
      "Novel oral delivery systems enabling effective absorption of peptide drugs including GLP-1 agonists. The invention overcomes gastrointestinal degradation barriers through proprietary encapsulation technology.",
    filingDate: "2021-09-30",
    inventors: ["Kevin Wu", "Amanda Taylor", "James Miller"],
    assignee: "Novo Nordisk A/S",
    relevance: 68,
    claims: [
      "An oral delivery system for peptide therapeutics comprising protective encapsulation",
    ],
  },
];

// Helper function to build hierarchical mind map data with expand/collapse support
interface HierarchicalNode {
  id: string;
  type: "disease" | "molecule" | "product";
  label: string;
  score?: number;
  childIds?: string[];
  parentId?: string;
  isExpanded?: boolean;
  hidden?: boolean;
}

// Base hierarchical data structure
export const hierarchicalMindMapData: {
  nodes: HierarchicalNode[];
  edges: { id: string; source: string; target: string }[];
} = {
  nodes: [
    // Root diseases - always visible
    {
      id: "disease-1",
      type: "disease",
      label: "Obesity",
      childIds: ["mol-1", "mol-2"],
      isExpanded: true,
    },
    {
      id: "disease-2",
      type: "disease",
      label: "Type 2 Diabetes",
      childIds: ["mol-1", "mol-3"],
      isExpanded: false,
    },
    // Molecules - children of diseases
    {
      id: "mol-1",
      type: "molecule",
      label: "Semaglutide",
      parentId: "disease-1",
      childIds: ["prod-1", "prod-2", "prod-3"],
      isExpanded: true,
    },
    {
      id: "mol-2",
      type: "molecule",
      label: "Tirzepatide",
      parentId: "disease-1",
      childIds: ["prod-4", "prod-5"],
      isExpanded: false,
      hidden: false,
    },
    {
      id: "mol-3",
      type: "molecule",
      label: "Liraglutide",
      parentId: "disease-2",
      childIds: ["prod-6", "prod-7"],
      isExpanded: false,
      hidden: true,
    },
    // Products - children of molecules
    {
      id: "prod-1",
      type: "product",
      label: "Wegovy",
      score: 97,
      parentId: "mol-1",
    },
    {
      id: "prod-2",
      type: "product",
      label: "Ozempic",
      score: 95,
      parentId: "mol-1",
    },
    {
      id: "prod-3",
      type: "product",
      label: "Rybelsus",
      score: 92,
      parentId: "mol-1",
    },
    {
      id: "prod-4",
      type: "product",
      label: "Mounjaro",
      score: 96,
      parentId: "mol-2",
      hidden: true,
    },
    {
      id: "prod-5",
      type: "product",
      label: "Zepbound",
      score: 94,
      parentId: "mol-2",
      hidden: true,
    },
    {
      id: "prod-6",
      type: "product",
      label: "Victoza",
      score: 88,
      parentId: "mol-3",
      hidden: true,
    },
    {
      id: "prod-7",
      type: "product",
      label: "Saxenda",
      score: 86,
      parentId: "mol-3",
      hidden: true,
    },
  ],
  edges: [
    // Disease to Molecule edges
    { id: "e-d1-m1", source: "disease-1", target: "mol-1" },
    { id: "e-d1-m2", source: "disease-1", target: "mol-2" },
    { id: "e-d2-m1", source: "disease-2", target: "mol-1" },
    { id: "e-d2-m3", source: "disease-2", target: "mol-3" },
    // Molecule to Product edges
    { id: "e-m1-p1", source: "mol-1", target: "prod-1" },
    { id: "e-m1-p2", source: "mol-1", target: "prod-2" },
    { id: "e-m1-p3", source: "mol-1", target: "prod-3" },
    { id: "e-m2-p4", source: "mol-2", target: "prod-4" },
    { id: "e-m2-p5", source: "mol-2", target: "prod-5" },
    { id: "e-m3-p6", source: "mol-3", target: "prod-6" },
    { id: "e-m3-p7", source: "mol-3", target: "prod-7" },
  ],
};

// Convert hierarchical data to React Flow format with positions
export function getInitialMindMapData(): { nodes: Node[]; edges: Edge[] } {
  const visibleNodes = hierarchicalMindMapData.nodes.filter((n) => !n.hidden);

  const nodes: Node[] = visibleNodes.map((node, index) => {
    // Calculate child count for expand button
    const childCount = node.childIds?.length || 0;

    return {
      id: node.id,
      type: node.type,
      position: { x: 0, y: 0 }, // Will be recalculated by layout
      data: {
        label: node.label,
        score: node.score,
        isExpanded: node.isExpanded,
        childCount: childCount,
        parentId: node.parentId,
        childIds: node.childIds,
      },
    };
  });

  // Only include edges where both source and target are visible
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const edges: Edge[] = hierarchicalMindMapData.edges
    .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
    }));

  return { nodes, edges };
}

// Legacy mock data for backward compatibility - includes childIds for expand/collapse
export const mockMindMapData: { nodes: Node[]; edges: Edge[] } = {
  nodes: [
    {
      id: "disease-1",
      type: "disease",
      position: { x: 0, y: 0 },
      data: {
        label: "Obesity",
        childCount: 2,
        childIds: ["mol-1", "mol-2"],
        isExpanded: true
      },
    },
    {
      id: "disease-2",
      type: "disease",
      position: { x: 0, y: 150 },
      data: {
        label: "Type 2 Diabetes",
        childCount: 2,
        childIds: ["mol-1", "mol-3"],
        isExpanded: false
      },
    },
    {
      id: "mol-1",
      type: "molecule",
      position: { x: 250, y: 75 },
      data: {
        label: "Semaglutide",
        childCount: 3,
        childIds: ["prod-1", "prod-2", "prod-3"],
        parentId: "disease-1",
        isExpanded: true
      },
    },
    {
      id: "prod-1",
      type: "product",
      position: { x: 500, y: 0 },
      data: { label: "Wegovy", score: 97, parentId: "mol-1" },
    },
    {
      id: "prod-2",
      type: "product",
      position: { x: 500, y: 75 },
      data: { label: "Ozempic", score: 95, parentId: "mol-1" },
    },
    {
      id: "prod-3",
      type: "product",
      position: { x: 500, y: 150 },
      data: { label: "Rybelsus", score: 92, parentId: "mol-1" },
    },
  ],
  edges: [
    {
      id: "e-d1-m1",
      source: "disease-1",
      target: "mol-1",
      animated: true,
    },
    {
      id: "e-d2-m1",
      source: "disease-2",
      target: "mol-1",
      animated: true,
    },
    {
      id: "e-m1-p1",
      source: "mol-1",
      target: "prod-1",
      animated: true,
    },
    {
      id: "e-m1-p2",
      source: "mol-1",
      target: "prod-2",
      animated: true,
    },
    {
      id: "e-m1-p3",
      source: "mol-1",
      target: "prod-3",
      animated: true,
    },
  ],
};

// Mock Worker Progress
export const mockWorkerProgress = [
  { name: "Market Research", progress: 100, status: "completed" as const },
  { name: "Patent Finder", progress: 75, status: "running" as const },
  { name: "Clinical Data", progress: 50, status: "running" as const },
  { name: "Web Intelligence", progress: 25, status: "pending" as const },
];
