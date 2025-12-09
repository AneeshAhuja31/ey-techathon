/**
 * Job Status Card - embedded in chat to show worker progress
 */
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { WorkerProgressList } from './WorkerProgressList';
import Colors from '@/constants/colors';
import { MOCK_JOB_PROGRESS } from '@/constants/mockData';

interface JobStatusCardProps {
  jobId: string;
  jobStatus: any;
}

export function JobStatusCard({ jobId, jobStatus }: JobStatusCardProps) {
  // Use real status or fallback to mock
  const status = jobStatus || MOCK_JOB_PROGRESS;
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <View className="bg-background-tertiary rounded-2xl p-4 my-3 border border-accent-cyan/30">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : isFailed ? 'alert-circle' : 'sync'}
            size={18}
            color={isCompleted ? Colors.status.success : isFailed ? Colors.status.error : Colors.accent.cyan}
          />
          <Text className="text-text-primary font-semibold ml-2">
            Job Created
          </Text>
        </View>
        <Badge
          label={status.status?.toUpperCase() || 'PROCESSING'}
          variant={isCompleted ? 'success' : isFailed ? 'error' : 'cyan'}
        />
      </View>

      {/* Query */}
      <Text className="text-text-secondary text-sm mb-3" numberOfLines={2}>
        "{status.query}"
      </Text>

      {/* Overall Progress */}
      {!isCompleted && !isFailed && (
        <ProgressBar
          progress={status.progress || 0}
          showLabel
          size="md"
          className="mb-4"
        />
      )}

      {/* Worker Progress */}
      <WorkerProgressList workers={status.workers || []} />

      {/* Completion Message */}
      {isCompleted && (
        <View className="mt-3 pt-3 border-t border-border-default">
          <Text className="text-status-success text-sm">
            Analysis complete. Results are ready.
          </Text>
        </View>
      )}
    </View>
  );
}

export default JobStatusCard;
