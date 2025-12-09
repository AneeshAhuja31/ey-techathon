/**
 * Relevance Score visual indicator
 */
import { View, Text } from 'react-native';
import Colors from '@/constants/colors';

interface RelevanceScoreProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export function RelevanceScore({ score, size = 'md' }: RelevanceScoreProps) {
  const getColor = () => {
    if (score >= 80) return Colors.status.success;
    if (score >= 50) return Colors.status.warning;
    return Colors.status.error;
  };

  const getBackgroundColor = () => {
    if (score >= 80) return 'rgba(16, 185, 129, 0.2)';
    if (score >= 50) return 'rgba(245, 158, 11, 0.2)';
    return 'rgba(239, 68, 68, 0.2)';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: 4, fontSize: 10 };
      case 'md':
        return { padding: 8, fontSize: 14 };
      case 'lg':
        return { padding: 12, fontSize: 18 };
      default:
        return { padding: 8, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      className="rounded-xl items-center justify-center"
      style={{
        backgroundColor: getBackgroundColor(),
        padding: sizeStyles.padding,
        minWidth: size === 'lg' ? 60 : 50,
      }}
    >
      <Text
        className="font-bold"
        style={{ color: getColor(), fontSize: sizeStyles.fontSize }}
      >
        {score}%
      </Text>
    </View>
  );
}

export default RelevanceScore;
