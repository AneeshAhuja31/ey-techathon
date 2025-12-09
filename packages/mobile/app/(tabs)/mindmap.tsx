/**
 * Mind Map Screen - Graph Visualization
 */
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { NodeDetailModal } from '@/components/mindmap/NodeDetailModal';
import { useMindMap } from '@/hooks/useMindMap';
import Colors from '@/constants/colors';

export default function MindMapScreen() {
  const {
    graphData,
    selectedNode,
    nodeDetail,
    isLoading,
    error,
    loadGraph,
    selectNode,
    getNodeDetails,
    useMockData,
  } = useMindMap();

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Load graph on mount
  useEffect(() => {
    loadGraph('GLP-1').catch(() => useMockData());
  }, []);

  const handleNodePress = async (nodeId: string) => {
    const node = graphData?.nodes.find((n) => n.id === nodeId);
    if (node) {
      selectNode(node);
      await getNodeDetails(nodeId);
      setIsModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    selectNode(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-primary">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border-default">
        <View>
          <Text className="text-2xl font-bold text-text-primary">
            Mind Map
          </Text>
          <Text className="text-text-secondary mt-1">
            {graphData?.context || 'GLP-1'} Landscape
          </Text>
        </View>
        <View className="flex-row">
          <Pressable
            className="w-10 h-10 bg-background-tertiary rounded-full items-center justify-center mr-2"
            onPress={() => loadGraph('GLP-1')}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.text.secondary} />
          </Pressable>
          <Pressable
            className="w-10 h-10 bg-background-tertiary rounded-full items-center justify-center"
          >
            <Ionicons name="expand-outline" size={20} color={Colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Legend */}
      <View className="px-6 py-3 flex-row items-center border-b border-border-default">
        <View className="flex-row items-center mr-4">
          <View className="w-3 h-3 rounded-full bg-node-disease mr-2" />
          <Text className="text-text-muted text-xs">Disease</Text>
        </View>
        <View className="flex-row items-center mr-4">
          <View className="w-3 h-3 rounded-full bg-node-molecule mr-2" />
          <Text className="text-text-muted text-xs">Molecule</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-node-product mr-2" />
          <Text className="text-text-muted text-xs">Product</Text>
        </View>
      </View>

      {/* Mind Map Canvas */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-text-muted">Loading graph...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-status-error text-center mb-4">{error}</Text>
            <Pressable
              className="bg-accent-cyan px-6 py-3 rounded-xl"
              onPress={useMockData}
            >
              <Text className="text-background-primary font-semibold">Load Demo Data</Text>
            </Pressable>
          </View>
        ) : graphData ? (
          <MindMapCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodePress={handleNodePress}
          />
        ) : null}
      </View>

      {/* Stats Footer */}
      <View className="px-6 py-4 border-t border-border-default flex-row justify-around">
        <View className="items-center">
          <Text className="text-text-primary font-bold text-lg">
            {graphData?.metadata?.total_nodes || 0}
          </Text>
          <Text className="text-text-muted text-xs">Nodes</Text>
        </View>
        <View className="items-center">
          <Text className="text-text-primary font-bold text-lg">
            {graphData?.metadata?.total_edges || 0}
          </Text>
          <Text className="text-text-muted text-xs">Connections</Text>
        </View>
        <View className="items-center">
          <Text className="text-accent-cyan font-bold text-lg">
            {graphData?.nodes.filter((n) => n.type === 'product').length || 0}
          </Text>
          <Text className="text-text-muted text-xs">Products</Text>
        </View>
      </View>

      {/* Node Detail Modal */}
      <NodeDetailModal
        visible={isModalVisible}
        node={selectedNode}
        nodeDetail={nodeDetail}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}
