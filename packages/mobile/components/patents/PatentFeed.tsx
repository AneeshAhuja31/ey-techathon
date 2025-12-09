/**
 * Patent Feed - scrollable list of patent cards
 */
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { PatentCard } from './PatentCard';
import { Patent } from '@/services/patentService';
import Colors from '@/constants/colors';

interface PatentFeedProps {
  patents: Patent[];
  isLoading: boolean;
  error: string | null;
  onPatentPress?: (patent: Patent) => void;
}

export function PatentFeed({ patents, isLoading, error, onPatentPress }: PatentFeedProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.accent.cyan} />
        <Text className="text-text-muted mt-4">Searching patents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-status-error text-center">{error}</Text>
      </View>
    );
  }

  if (patents.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-text-muted text-center">
          No patents found. Try a different search query.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-6"
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-text-muted text-sm mb-4">
        Recommended Patents
      </Text>
      {patents.map((patent) => (
        <PatentCard
          key={patent.id}
          patent={patent}
          onPress={() => onPatentPress?.(patent)}
        />
      ))}
    </ScrollView>
  );
}

export default PatentFeed;
