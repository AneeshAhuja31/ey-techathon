/**
 * Worker Progress List - shows individual worker statuses
 */
import { View, Text } from 'react-native';
import Colors, { StatusColors } from '@/constants/colors';

interface Worker {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
}

interface WorkerProgressListProps {
  workers: Worker[];
}

export function WorkerProgressList({ workers }: WorkerProgressListProps) {
  const getStatusColor = (status: Worker['status']) => {
    return StatusColors[status] || Colors.text.muted;
  };

  const getProgressBar = (progress: number) => {
    const filled = Math.floor(progress / 25);
    const empty = 4 - filled;
    return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
  };

  return (
    <View className="space-y-2">
      {workers.map((worker, index) => (
        <View key={index} className="flex-row items-center">
          {/* Status Indicator */}
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: getStatusColor(worker.status) }}
          />

          {/* Worker Name */}
          <Text className="text-text-secondary text-xs flex-1">
            {worker.name}
          </Text>

          {/* Progress Bar (text-based like in spec) */}
          <Text className="text-text-muted text-xs font-mono mr-2">
            {getProgressBar(worker.progress)}
          </Text>

          {/* Percentage */}
          <Text
            className="text-xs font-medium w-10 text-right"
            style={{ color: getStatusColor(worker.status) }}
          >
            {worker.progress}%
          </Text>
        </View>
      ))}
    </View>
  );
}

export default WorkerProgressList;
