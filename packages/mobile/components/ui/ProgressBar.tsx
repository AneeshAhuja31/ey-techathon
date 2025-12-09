/**
 * Progress Bar component for job status
 */
import { View, Text } from 'react-native';
import Colors from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function ProgressBar({
  progress,
  showLabel = false,
  size = 'md',
  color = Colors.accent.cyan,
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'md':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  return (
    <View className={className}>
      {showLabel && (
        <View className="flex-row justify-between mb-1">
          <Text className="text-text-muted text-xs">Progress</Text>
          <Text className="text-text-secondary text-xs font-medium">
            {clampedProgress}%
          </Text>
        </View>
      )}
      <View className={`${getHeight()} bg-background-tertiary rounded-full overflow-hidden`}>
        <View
          className={`${getHeight()} rounded-full`}
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

export default ProgressBar;
