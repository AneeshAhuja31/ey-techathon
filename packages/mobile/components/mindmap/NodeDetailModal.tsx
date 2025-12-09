/**
 * Node Detail Modal - shows details when tapping a node
 */
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GraphNode, NodeDetail } from '@/services/graphService';
import { NodeColors } from '@/constants/colors';
import Colors from '@/constants/colors';

interface NodeDetailModalProps {
  visible: boolean;
  node: GraphNode | null;
  nodeDetail: NodeDetail | null;
  onClose: () => void;
}

export function NodeDetailModal({
  visible,
  node,
  nodeDetail,
  onClose,
}: NodeDetailModalProps) {
  if (!node) return null;

  const nodeColor = NodeColors[node.type] || Colors.accent.cyan;

  const getTypeLabel = () => {
    switch (node.type) {
      case 'disease':
        return 'Disease / Condition';
      case 'molecule':
        return 'Active Molecule';
      case 'product':
        return 'Commercial Product';
      default:
        return 'Node';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background-secondary rounded-t-3xl max-h-[70%]">
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 bg-border-default rounded-full" />
          </View>

          {/* Header */}
          <View className="px-6 pb-4 border-b border-border-default">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: nodeColor }}
                />
                <View className="flex-1">
                  <Text className="text-text-primary text-xl font-bold">
                    {node.label}
                  </Text>
                  <Text className="text-text-muted text-sm mt-0.5">
                    {getTypeLabel()}
                  </Text>
                </View>
              </View>
              <Pressable
                className="w-8 h-8 bg-background-tertiary rounded-full items-center justify-center"
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={Colors.text.secondary} />
              </Pressable>
            </View>

            {/* Match Score for Products */}
            {node.type === 'product' && node.match_score !== undefined && (
              <View className="flex-row items-center mt-3">
                <View
                  className="px-3 py-1 rounded-full mr-2"
                  style={{ backgroundColor: `${nodeColor}30` }}
                >
                  <Text style={{ color: nodeColor }} className="font-bold">
                    {node.match_score}% Match
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView className="px-6 py-4">
            {/* Node Data */}
            {node.data && Object.keys(node.data).length > 0 && (
              <View className="mb-6">
                <Text className="text-text-secondary text-sm font-semibold mb-3">
                  Details
                </Text>
                {Object.entries(node.data).map(([key, value]) => (
                  <View key={key} className="flex-row py-2 border-b border-border-default">
                    <Text className="text-text-muted text-sm flex-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text className="text-text-primary text-sm flex-1 text-right">
                      {String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Related Nodes */}
            {nodeDetail?.related_nodes && nodeDetail.related_nodes.length > 0 && (
              <View className="mb-6">
                <Text className="text-text-secondary text-sm font-semibold mb-3">
                  Related
                </Text>
                <View className="flex-row flex-wrap">
                  {nodeDetail.related_nodes.map((relatedNode) => (
                    <View
                      key={relatedNode.id}
                      className="bg-background-tertiary rounded-xl px-3 py-2 mr-2 mb-2 border border-border-default"
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: NodeColors[relatedNode.type] }}
                        />
                        <Text className="text-text-primary text-sm">
                          {relatedNode.label}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Info */}
            {nodeDetail?.additional_info && (
              <View className="mb-6">
                <Text className="text-text-secondary text-sm font-semibold mb-3">
                  Additional Information
                </Text>
                {Object.entries(nodeDetail.additional_info).map(([key, value]) => (
                  <View key={key} className="flex-row py-2 border-b border-border-default">
                    <Text className="text-text-muted text-sm flex-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text className="text-text-primary text-sm flex-1 text-right">
                      {String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View className="px-6 py-4 border-t border-border-default flex-row">
            <Pressable className="flex-1 bg-accent-cyan rounded-xl py-3 items-center mr-2">
              <Text className="text-background-primary font-semibold">
                Research More
              </Text>
            </Pressable>
            <Pressable className="flex-1 bg-background-tertiary rounded-xl py-3 items-center border border-border-default">
              <Text className="text-text-primary font-semibold">
                Find Patents
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default NodeDetailModal;
