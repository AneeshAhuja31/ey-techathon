/**
 * Chat Message Bubble component
 */
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface MessageBubbleProps {
  type: 'user' | 'assistant' | 'system' | 'job_status';
  content: string;
  timestamp: Date;
}

export function MessageBubble({ type, content, timestamp }: MessageBubbleProps) {
  const isUser = type === 'user';
  const isSystem = type === 'system';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isSystem) {
    return (
      <View className="flex-row items-center justify-center py-2">
        <Ionicons name="information-circle" size={14} color={Colors.text.muted} />
        <Text className="text-text-muted text-xs ml-1">{content}</Text>
      </View>
    );
  }

  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-accent-cyan rounded-br-sm'
            : 'bg-background-tertiary border border-border-default rounded-bl-sm'
        }`}
      >
        <Text className={`${isUser ? 'text-background-primary' : 'text-text-primary'}`}>
          {content}
        </Text>
      </View>
      <Text className="text-text-muted text-xs mt-1 px-1">
        {formatTime(timestamp)}
      </Text>
    </View>
  );
}

export default MessageBubble;
