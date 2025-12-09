"use client";

import Link from "next/link";
import { Beaker, Search, TrendingUp, FileOutput } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    title: "Molecule Research",
    description: "Analyze molecular structures",
    icon: Beaker,
    href: "/chat?action=molecule",
    color: "bg-accent-purple",
  },
  {
    title: "Patent Search",
    description: "Search patent landscape",
    icon: Search,
    href: "/patents",
    color: "bg-accent-cyan",
  },
  {
    title: "Market Analysis",
    description: "Explore market data",
    icon: TrendingUp,
    href: "/chat?action=market",
    color: "bg-accent-blue",
  },
  {
    title: "Generate Report",
    description: "Create comprehensive reports",
    icon: FileOutput,
    href: "/chat?action=report",
    color: "bg-accent-green",
  },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group p-4 bg-background-card border border-border-default rounded-xl hover:border-border-hover transition-all"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                  action.color
                )}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-medium text-text-primary group-hover:text-accent-cyan transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
