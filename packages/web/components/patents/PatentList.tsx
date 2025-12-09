"use client";

import { Patent } from "@/types";
import { PatentCard } from "./PatentCard";

interface PatentListProps {
  patents: Patent[];
}

export function PatentList({ patents }: PatentListProps) {
  if (patents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No patents found</p>
        <p className="text-sm text-text-muted mt-1">
          Try a different search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {patents.map((patent) => (
        <PatentCard key={patent.id} patent={patent} />
      ))}
    </div>
  );
}
