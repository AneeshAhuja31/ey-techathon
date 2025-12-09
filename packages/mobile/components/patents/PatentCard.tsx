/**
 * Patent Card component
 */
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RelevanceScore } from './RelevanceScore';
import { Patent } from '@/services/patentService';
import Colors from '@/constants/colors';

interface PatentCardProps {
  patent: Patent;
  onPress?: () => void;
}

export function PatentCard({ patent, onPress }: PatentCardProps) {
  return (
    <Pressable
      className="bg-background-card rounded-2xl border border-border-default p-4 mb-3 active:border-accent-cyan/30"
      onPress={onPress}
    >
      {/* Header with ID and Score */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-accent-cyan text-xs font-mono">
            {patent.patent_id}
          </Text>
          <Text className="text-text-primary font-semibold mt-1" numberOfLines={2}>
            {patent.title}
          </Text>
        </View>
        <RelevanceScore score={patent.relevance_score} />
      </View>

      {/* Abstract */}
      {patent.abstract && (
        <Text className="text-text-secondary text-sm mb-3" numberOfLines={2}>
          {patent.abstract}
        </Text>
      )}

      {/* Metadata Row */}
      <View className="flex-row items-center flex-wrap">
        {patent.assignee && (
          <View className="flex-row items-center mr-4 mb-1">
            <Ionicons name="business-outline" size={12} color={Colors.text.muted} />
            <Text className="text-text-muted text-xs ml-1">{patent.assignee}</Text>
          </View>
        )}
        {patent.filing_date && (
          <View className="flex-row items-center mr-4 mb-1">
            <Ionicons name="calendar-outline" size={12} color={Colors.text.muted} />
            <Text className="text-text-muted text-xs ml-1">{patent.filing_date}</Text>
          </View>
        )}
        {patent.molecule && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="flask-outline" size={12} color={Colors.text.muted} />
            <Text className="text-text-muted text-xs ml-1">{patent.molecule}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row mt-3 pt-3 border-t border-border-default">
        <Pressable className="flex-row items-center mr-4">
          <Ionicons name="document-outline" size={14} color={Colors.accent.cyan} />
          <Text className="text-accent-cyan text-xs ml-1">Extract Claims</Text>
        </Pressable>
        <Pressable className="flex-row items-center mr-4">
          <Ionicons name="shield-outline" size={14} color={Colors.accent.cyan} />
          <Text className="text-accent-cyan text-xs ml-1">FTO Analysis</Text>
        </Pressable>
        <Pressable className="flex-row items-center">
          <Ionicons name="search-outline" size={14} color={Colors.accent.cyan} />
          <Text className="text-accent-cyan text-xs ml-1">Prior Art</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default PatentCard;
