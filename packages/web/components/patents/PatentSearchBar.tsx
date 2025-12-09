"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";

interface PatentSearchBarProps {
  onSearch: (query: string) => void;
}

export function PatentSearchBar({ onSearch }: PatentSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patents by molecule, keyword, or patent ID..."
          className="w-full bg-background-card border border-border-default rounded-xl pl-12 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors"
        />
      </div>
      <button
        type="button"
        className="px-4 py-3 bg-background-card border border-border-default rounded-xl text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors flex items-center gap-2"
      >
        <Filter className="w-5 h-5" />
        Filters
      </button>
      <button
        type="submit"
        className="px-6 py-3 bg-accent-cyan text-white rounded-xl hover:bg-accent-cyan/90 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
