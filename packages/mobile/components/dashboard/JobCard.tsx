/**
 * Job Card component for displaying job status
 */
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import Colors from '@/constants/colors';

interface JobCardProps {
  jobId: string;
  query: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  onPress?: () => void;
}

export function JobCard({ jobId, query, status, progress, onPress }: JobCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge label="Completed" variant="success" />;
      case 'processing':
        return <Badge label="Running" variant="cyan" />;
      case 'failed':
        return <Badge label="Failed" variant="error" />;
      default:
        return <Badge label="Pending" variant="default" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />;
      case 'processing':
        return <Ionicons name="sync" size={20} color={Colors.accent.cyan} />;
      case 'failed':
        return <Ionicons name="alert-circle" size={20} color={Colors.status.error} />;
      default:
        return <Ionicons name="time" size={20} color={Colors.text.muted} />;
    }
  };

  return (
    <Pressable
      className="bg-background-card rounded-2xl border border-border-default p-4 active:border-accent-cyan/30"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="mr-3">{getStatusIcon()}</View>
          <View className="flex-1">
            <Text className="text-text-primary font-medium" numberOfLines={1}>
              {query}
            </Text>
            <Text className="text-text-muted text-xs mt-0.5">
              {jobId}
            </Text>
          </View>
        </View>
        {getStatusBadge()}
      </View>

      {status === 'processing' && (
        <ProgressBar progress={progress} showLabel size="sm" />
      )}

      {status === 'completed' && (
        <View className="flex-row items-center mt-2">
          <Text className="text-status-success text-xs">
            Analysis complete
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={Colors.status.success}
            style={{ marginLeft: 4 }}
          />
        </View>
      )}
    </Pressable>
  );
}

export default JobCard;
