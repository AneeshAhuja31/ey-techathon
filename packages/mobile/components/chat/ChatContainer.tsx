/**
 * Chat Container - displays chat messages and job status
 */
import { ScrollView, View, Text } from 'react-native';
import { MessageBubble } from './MessageBubble';
import { JobStatusCard } from './JobStatusCard';
import { ChatMessage } from '@/hooks/useChat';

interface ChatContainerProps {
  messages: ChatMessage[];
  jobStatus: any;
  isLoading: boolean;
  scrollViewRef: React.RefObject<ScrollView>;
}

export function ChatContainer({
  messages,
  jobStatus,
  isLoading,
  scrollViewRef,
}: ChatContainerProps) {
  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-text-primary text-xl font-semibold mb-2">
          Start Your Research
        </Text>
        <Text className="text-text-muted text-center">
          Ask me to analyze molecules, search patents, review clinical trials,
          or generate market reports.
        </Text>
        <View className="mt-6 space-y-2">
          <Text className="text-text-secondary text-sm">Try asking:</Text>
          <View className="bg-background-tertiary rounded-xl px-4 py-2 mt-2">
            <Text className="text-accent-cyan text-sm">
              "Research GLP-1 agonists for obesity treatment"
            </Text>
          </View>
          <View className="bg-background-tertiary rounded-xl px-4 py-2 mt-2">
            <Text className="text-accent-cyan text-sm">
              "Find patents related to semaglutide"
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 px-4"
      contentContainerStyle={{ paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((message) => {
        if (message.type === 'job_status' && message.jobId) {
          return (
            <JobStatusCard
              key={message.id}
              jobId={message.jobId}
              jobStatus={jobStatus}
            />
          );
        }

        return (
          <MessageBubble
            key={message.id}
            type={message.type}
            content={message.content}
            timestamp={message.timestamp}
          />
        );
      })}

      {isLoading && (
        <View className="flex-row items-center py-4">
          <View className="flex-row space-x-1">
            <View className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
            <View className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <View className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </View>
          <Text className="text-text-muted text-sm ml-3">Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

export default ChatContainer;
