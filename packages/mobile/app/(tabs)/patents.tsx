/**
 * Patents Screen - Patent Search and Recommendations
 */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PatentFeed } from '@/components/patents/PatentFeed';
import { usePatents } from '@/hooks/usePatents';
import Colors from '@/constants/colors';

export default function PatentsScreen() {
  const { patents, isLoading, error, total, searchPatents, getRecommended, useMockData } = usePatents();
  const [searchQuery, setSearchQuery] = useState('');

  // Load recommended patents on mount
  useEffect(() => {
    getRecommended('GLP-1').catch(() => useMockData());
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchPatents(searchQuery.trim());
    } else {
      getRecommended('GLP-1');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-primary">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border-default">
        <Text className="text-2xl font-bold text-text-primary">
          Patent Intelligence
        </Text>
        <Text className="text-text-secondary mt-1">
          {total} patents found
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-4">
        <View className="flex-row items-center bg-background-tertiary rounded-xl border border-border-default">
          <TextInput
            className="flex-1 px-4 py-3 text-text-primary"
            placeholder="Search patents by molecule..."
            placeholderTextColor={Colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable
            className="px-4 py-3"
            onPress={handleSearch}
          >
            <Ionicons name="search" size={20} color={Colors.accent.cyan} />
          </Pressable>
        </View>
      </View>

      {/* Filter Chips */}
      <View className="px-6 pb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            className="bg-accent-cyan/20 px-4 py-2 rounded-full mr-2"
            onPress={() => searchPatents(undefined, 'semaglutide')}
          >
            <Text className="text-accent-cyan text-sm">Semaglutide</Text>
          </Pressable>
          <Pressable
            className="bg-background-tertiary px-4 py-2 rounded-full mr-2 border border-border-default"
            onPress={() => searchPatents(undefined, 'tirzepatide')}
          >
            <Text className="text-text-secondary text-sm">Tirzepatide</Text>
          </Pressable>
          <Pressable
            className="bg-background-tertiary px-4 py-2 rounded-full mr-2 border border-border-default"
            onPress={() => getRecommended('GLP-1')}
          >
            <Text className="text-text-secondary text-sm">GLP-1 Class</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Patent Feed */}
      <PatentFeed
        patents={patents}
        isLoading={isLoading}
        error={error}
      />
    </SafeAreaView>
  );
}
