/**
 * Chat Screen - Master Chatbot Interface
 */
import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import Colors from '@/constants/colors';

export default function ChatScreen() {
  const { messages, isLoading, currentJobId, jobStatus, sendMessage, clearMessages } = useChat();
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (text.trim()) {
      await sendMessage(text.trim());
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-primary">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border-default">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-accent-cyan/20 rounded-full items-center justify-center mr-3">
            <Ionicons name="flask" size={20} color={Colors.accent.cyan} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-text-primary">
              Research Assistant
            </Text>
            <Text className="text-text-muted text-xs">
              {currentJobId ? `Job: ${currentJobId}` : 'Ready to analyze'}
            </Text>
          </View>
        </View>
        <Pressable
          className="w-10 h-10 bg-background-tertiary rounded-full items-center justify-center"
          onPress={clearMessages}
        >
          <Ionicons name="refresh-outline" size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>

      {/* Chat Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <ChatContainer
          messages={messages}
          jobStatus={jobStatus}
          isLoading={isLoading}
          scrollViewRef={scrollViewRef}
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          placeholder="Ask about molecules, patents, trials..."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
