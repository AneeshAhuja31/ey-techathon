/**
 * Active Jobs Panel for Dashboard
 */
import { View, Text } from 'react-native';
import { JobCard } from './JobCard';
import { MOCK_ACTIVE_JOBS } from '@/constants/mockData';

export function ActiveJobsPanel() {
  const jobs = MOCK_ACTIVE_JOBS;

  if (jobs.length === 0) {
    return (
      <View className="bg-background-card rounded-2xl border border-border-default p-6 items-center">
        <Text className="text-text-muted text-center">
          No active jobs. Start a new analysis to see progress here.
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-3">
      {jobs.map((job) => (
        <JobCard
          key={job.job_id}
          jobId={job.job_id}
          query={job.query}
          status={job.status as 'pending' | 'processing' | 'completed' | 'failed'}
          progress={job.progress}
        />
      ))}
    </View>
  );
}

export default ActiveJobsPanel;
