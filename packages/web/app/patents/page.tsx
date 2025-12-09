"use client";

import { useState } from "react";
import { PatentSearchBar } from "@/components/patents/PatentSearchBar";
import { PatentList } from "@/components/patents/PatentList";
import { mockPatents } from "@/lib/mock-data";
import { Patent } from "@/types";

export default function PatentsPage() {
  const [patents, setPatents] = useState<Patent[]>(mockPatents);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In real app, this would call the API
    // For now, filter mock data
    if (query) {
      const filtered = mockPatents.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.abstract.toLowerCase().includes(query.toLowerCase())
      );
      setPatents(filtered);
    } else {
      setPatents(mockPatents);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border-default">
        <h1 className="text-2xl font-bold text-text-primary">
          Patent Intelligence
        </h1>
        <p className="text-text-secondary mt-1">
          Search and analyze patent landscape
        </p>
      </div>

      <div className="p-6 border-b border-border-default">
        <PatentSearchBar onSearch={handleSearch} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <PatentList patents={patents} />
      </div>
    </div>
  );
}
