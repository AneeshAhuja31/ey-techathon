/**
 * 404 Not Found screen
 */
import { View, Text, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 bg-background-primary items-center justify-center p-6">
        <Text className="text-3xl font-bold text-text-primary mb-4">
          Page Not Found
        </Text>
        <Text className="text-text-secondary mb-8 text-center">
          The screen you're looking for doesn't exist.
        </Text>
        <Link href="/" asChild>
          <Pressable className="bg-accent-cyan px-6 py-3 rounded-xl">
            <Text className="text-background-primary font-semibold">
              Go to Home
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
