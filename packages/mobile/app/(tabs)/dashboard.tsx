/**
 * Dashboard Screen - Quick Actions + Active Jobs
 */
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActiveJobsPanel } from '@/components/dashboard/ActiveJobsPanel';
import Colors from '@/constants/colors';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-primary">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border-default">
        <View>
          <Text className="text-2xl font-bold text-text-primary">
            Drug Discovery AI
          </Text>
          <Text className="text-text-secondary mt-1">
            Accelerate your research
          </Text>
        </View>
        <Pressable
          className="w-10 h-10 bg-background-tertiary rounded-full items-center justify-center"
          onPress={() => {}}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Quick Actions Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-text-primary mb-4">
            Quick Actions
          </Text>
          <QuickActions
            onAction={(actionId) => {
              if (actionId === 'molecule_research' || actionId === 'market_analysis') {
                router.push('/(tabs)/chat');
              } else if (actionId === 'patent_search') {
                router.push('/(tabs)/patents');
              } else if (actionId === 'generate_report') {
                router.push('/(tabs)/chat');
              }
            }}
          />
        </View>

        {/* Active Jobs Section */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-text-primary">
              Active Jobs
            </Text>
            <Pressable>
              <Text className="text-accent-cyan text-sm">View All</Text>
            </Pressable>
          </View>
          <ActiveJobsPanel />
        </View>

        {/* Recent Activity */}
        <View className="mt-8 mb-6">
          <Text className="text-lg font-semibold text-text-primary mb-4">
            Recent Activity
          </Text>
          <View className="bg-background-card rounded-2xl border border-border-default p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-accent-cyan/20 rounded-full items-center justify-center mr-3">
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.cyan} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-medium">
                  GLP-1 Market Analysis Complete
                </Text>
                <Text className="text-text-muted text-sm mt-1">
                  2 hours ago • 5 patents found
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
