import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActiveJobsPanel } from "@/components/dashboard/ActiveJobsPanel";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Welcome to the Drug Discovery Platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <QuickActions />
          <ActiveJobsPanel />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
