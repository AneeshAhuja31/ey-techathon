/**
 * Zoom Controls for Mind Map
 */
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel?: number;
}

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel = 100,
}: ZoomControlsProps) {
  return (
    <View className="absolute bottom-6 right-6 bg-background-card rounded-xl border border-border-default overflow-hidden">
      <Pressable
        className="p-3 border-b border-border-default active:bg-background-tertiary"
        onPress={onZoomIn}
      >
        <Ionicons name="add" size={20} color={Colors.text.primary} />
      </Pressable>

      <View className="px-3 py-2 items-center border-b border-border-default">
        <Text className="text-text-muted text-xs">{zoomLevel}%</Text>
      </View>

      <Pressable
        className="p-3 border-b border-border-default active:bg-background-tertiary"
        onPress={onZoomOut}
      >
        <Ionicons name="remove" size={20} color={Colors.text.primary} />
      </Pressable>

      <Pressable
        className="p-3 active:bg-background-tertiary"
        onPress={onReset}
      >
        <Ionicons name="scan-outline" size={20} color={Colors.text.primary} />
      </Pressable>
    </View>
  );
}

export default ZoomControls;
