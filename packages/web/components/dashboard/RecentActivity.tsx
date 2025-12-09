"use client";

import { FileText, Search, Beaker, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const recentActivities = [
  {
    id: "1",
    type: "research",
    title: "GLP-1 Agonist Analysis",
    time: "2 hours ago",
    icon: Beaker,
  },
  {
    id: "2",
    type: "patent",
    title: "Patent US10,456,789 reviewed",
    time: "4 hours ago",
    icon: FileText,
  },
  {
    id: "3",
    type: "search",
    title: "Searched: Semaglutide formulations",
    time: "Yesterday",
    icon: Search,
  },
  {
    id: "4",
    type: "research",
    title: "Obesity treatment compounds",
    time: "Yesterday",
    icon: Beaker,
  },
  {
    id: "5",
    type: "patent",
    title: "Patent landscape report generated",
    time: "2 days ago",
    icon: FileText,
  },
];

const typeColors = {
  research: "text-accent-purple bg-accent-purple/10",
  patent: "text-accent-cyan bg-accent-cyan/10",
  search: "text-accent-blue bg-accent-blue/10",
};

export function RecentActivity() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Recent Activity
      </h2>
      <div className="bg-background-card border border-border-default rounded-xl p-4">
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-border-default last:border-0 last:pb-0"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    typeColors[activity.type as keyof typeof typeColors]
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
