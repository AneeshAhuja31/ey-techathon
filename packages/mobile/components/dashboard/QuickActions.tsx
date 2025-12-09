/**
 * Quick Actions component for Dashboard
 */
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'molecule_research',
    title: 'Molecule Research',
    icon: 'flask',
    description: 'Comprehensive analysis',
  },
  {
    id: 'patent_search',
    title: 'Patent Search',
    icon: 'document-text',
    description: 'IP landscape',
  },
  {
    id: 'market_analysis',
    title: 'Market Analysis',
    icon: 'trending-up',
    description: 'IQVIA insights',
  },
  {
    id: 'generate_report',
    title: 'Generate Report',
    icon: 'newspaper',
    description: 'Full report',
  },
];

interface QuickActionsProps {
  onAction: (actionId: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <View className="flex-row flex-wrap -mx-2">
      {QUICK_ACTIONS.map((action) => (
        <View key={action.id} className="w-1/2 px-2 mb-4">
          <Pressable
            className="bg-background-card rounded-2xl border border-border-default p-4 active:opacity-80 active:border-accent-cyan/50"
            onPress={() => onAction(action.id)}
          >
            <View className="w-12 h-12 bg-accent-cyan/10 rounded-xl items-center justify-center mb-3">
              <Ionicons
                name={action.icon as any}
                size={24}
                color={Colors.accent.cyan}
              />
            </View>
            <Text className="text-text-primary font-semibold mb-1">
              {action.title}
            </Text>
            <Text className="text-text-muted text-xs">
              {action.description}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export default QuickActions;
