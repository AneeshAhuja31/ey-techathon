"use client";

import { Patent } from "@/types";
import { cn } from "@/lib/utils";
import { FileText, Calendar, Users, Building, ChevronRight } from "lucide-react";

interface PatentCardProps {
  patent: Patent;
}

export function PatentCard({ patent }: PatentCardProps) {
  const getRelevanceColor = (score: number) => {
    if (score >= 80) return "text-accent-green bg-accent-green/10";
    if (score >= 50) return "text-accent-cyan bg-accent-cyan/10";
    return "text-text-muted bg-text-muted/10";
  };

  return (
    <div className="bg-background-card border border-border-default rounded-xl p-5 hover:border-border-hover transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-accent-cyan font-mono text-sm">
              {patent.id}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                getRelevanceColor(patent.relevance)
              )}
            >
              {patent.relevance}% relevance
            </span>
          </div>

          <h3 className="text-lg font-medium text-text-primary mb-2">
            {patent.title}
          </h3>

          <p className="text-sm text-text-secondary line-clamp-2 mb-4">
            {patent.abstract}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(patent.filingDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {patent.inventors.slice(0, 2).join(", ")}
              {patent.inventors.length > 2 && ` +${patent.inventors.length - 2}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="w-4 h-4" />
              {patent.assignee}
            </span>
          </div>
        </div>

        {/* Relevance Indicator */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-background-tertiary"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className={cn(
                  patent.relevance >= 80
                    ? "stroke-accent-green"
                    : patent.relevance >= 50
                    ? "stroke-accent-cyan"
                    : "stroke-text-muted"
                )}
                strokeWidth="3"
                strokeDasharray={`${patent.relevance}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-text-primary">
              {patent.relevance}%
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border-default">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-accent-cyan transition-colors">
          <FileText className="w-4 h-4" />
          Extract Claims
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-accent-cyan transition-colors">
          FTO Analysis
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-accent-cyan transition-colors">
          Prior Art Search
        </button>
        <button className="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors">
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
