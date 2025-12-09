/**
 * Reusable Card component
 */
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', className = '', style }: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-background-card shadow-lg';
      case 'outlined':
        return 'bg-transparent border-2 border-border-light';
      default:
        return 'bg-background-card border border-border-default';
    }
  };

  return (
    <View
      className={`rounded-2xl p-4 ${getVariantStyles()} ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}

export default Card;
