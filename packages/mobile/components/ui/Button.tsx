/**
 * Reusable Button component
 */
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-accent-cyan';
      case 'secondary':
        return 'bg-background-tertiary border border-border-default';
      case 'outline':
        return 'bg-transparent border border-accent-cyan';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-accent-cyan';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return 'text-background-primary';
      case 'secondary':
        return 'text-text-primary';
      case 'outline':
        return 'text-accent-cyan';
      case 'ghost':
        return 'text-accent-cyan';
      default:
        return 'text-background-primary';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2';
      case 'md':
        return 'px-6 py-3';
      case 'lg':
        return 'px-8 py-4';
      default:
        return 'px-6 py-3';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        flex-row items-center justify-center rounded-xl
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${disabled ? 'opacity-50' : 'active:opacity-80'}
      `}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.background.primary : Colors.accent.cyan}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            className={`font-semibold ${getTextColor()} ${getTextSize()} ${icon ? 'ml-2' : ''}`}
            style={textStyle}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export default Button;
