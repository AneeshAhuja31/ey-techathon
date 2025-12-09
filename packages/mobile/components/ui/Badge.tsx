/**
 * Badge component for status indicators
 */
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'cyan';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-status-success/20 border-status-success/30';
      case 'warning':
        return 'bg-status-warning/20 border-status-warning/30';
      case 'error':
        return 'bg-status-error/20 border-status-error/30';
      case 'info':
        return 'bg-status-info/20 border-status-info/30';
      case 'cyan':
        return 'bg-accent-cyan/20 border-accent-cyan/30';
      default:
        return 'bg-background-tertiary border-border-default';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return 'text-status-success';
      case 'warning':
        return 'text-status-warning';
      case 'error':
        return 'text-status-error';
      case 'info':
        return 'text-status-info';
      case 'cyan':
        return 'text-accent-cyan';
      default:
        return 'text-text-secondary';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'md':
        return 'px-3 py-1 text-sm';
      default:
        return 'px-2 py-0.5 text-xs';
    }
  };

  return (
    <View className={`rounded-full border ${getVariantStyles()}`}>
      <Text className={`font-medium ${getTextColor()} ${getSizeStyles()}`}>
        {label}
      </Text>
    </View>
  );
}

export default Badge;
