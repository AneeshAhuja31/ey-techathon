/**
 * Chat Input component with send button
 */
import { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View className="px-4 py-3 bg-background-secondary border-t border-border-default">
      <View className="flex-row items-end bg-background-tertiary rounded-2xl border border-border-default">
        <TextInput
          className="flex-1 px-4 py-3 text-text-primary max-h-24"
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          multiline
          editable={!isLoading}
          returnKeyType="send"
        />
        <Pressable
          className={`p-3 m-1 rounded-xl ${
            text.trim() && !isLoading ? 'bg-accent-cyan' : 'bg-background-card'
          }`}
          onPress={handleSend}
          disabled={!text.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.text.muted} />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={text.trim() ? Colors.background.primary : Colors.text.muted}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default ChatInput;
