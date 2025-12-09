"use client";

import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";

export default function MindMapPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border-default">
        <h1 className="text-2xl font-bold text-text-primary">Mind Map</h1>
        <p className="text-text-secondary mt-1">
          Visualize drug discovery relationships
        </p>
      </div>
      <div className="flex-1">
        <MindMapCanvas />
      </div>
    </div>
  );
}
