import React, { useState } from 'react';
import { NodeType, NodeCategory } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';

interface NodePaletteProps {
  categories: NodeCategory[];
  onNodeDrag: (nodeType: NodeType) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({
  categories,
  onNodeDrag,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<NodeType | null>(null);

  const getNodeInfo = (nodeType: NodeType) => {
    const nodeInfo = {
      [NodeType.START]: {
        name: 'Start',
        icon: '▶',
        description: 'Workflow trigger point',
      },
      [NodeType.END]: {
        name: 'End',
        icon: '●',
        description: 'Workflow completion point',
      },
      [NodeType.ACTION]: {
        name: 'Action',
        icon: '⚡',
        description: 'Execute an action',
      },
      [NodeType.CONDITION]: {
        name: 'Condition',
        icon: '🧠',
        description: 'Conditional logic',
      },
      [NodeType.LOOP]: {
        name: 'Loop',
        icon: '🔄',
        description: 'Repeat actions',
      },
      [NodeType.HTTP_REQUEST]: {
        name: 'HTTP Request',
        icon: '🌐',
        description: 'Make HTTP requests',
      },
      [NodeType.EMAIL]: {
        name: 'Email',
        icon: '📧',
        description: 'Send emails',
      },
      [NodeType.SLACK]: {
        name: 'Slack',
        icon: '💬',
        description: 'Send Slack messages',
      },
      [NodeType.DATA_TRANSFORM]: {
        name: 'Data Transform',
        icon: '⚙️',
        description: 'Transform data',
      },
      [NodeType.TIMER]: {
        name: 'Timer',
        icon: '⏰',
        description: 'Delay or schedule',
      },
      [NodeType.WEBHOOK]: {
        name: 'Webhook',
        icon: '🔗',
        description: 'Receive webhooks',
      },
    };
    return (
      nodeInfo[nodeType] || {
        name: nodeType,
        icon: '❓',
        description: 'Unknown node type',
      }
    );
  };

  const filteredCategories = categories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false;

    const hasMatchingNodes = category.nodes.some(nodeType => {
      const nodeInfo = getNodeInfo(nodeType);
      return (
        nodeInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nodeInfo.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    return hasMatchingNodes;
  });

  const handleNodeDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: nodeType,
        position: { x: 0, y: 0 },
      })
    );

    // Set drag effect
    event.dataTransfer.effectAllowed = 'copy';

    // Set custom drag image
    const dragImage = new Image();
    dragImage.src = `data:image/svg+xml;base64,${btoa(`
      <svg width="120" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="80" fill="${getNodeColor(nodeType)}" rx="8"/>
        <text x="60" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="12">${getNodeInfo(nodeType).name}</text>
        <text x="60" y="55" text-anchor="middle" fill="white" font-family="Arial" font-size="10">${getNodeInfo(nodeType).icon}</text>
      </svg>
    `)}`;

    event.dataTransfer.setDragImage(dragImage, 60, 40);

    setDraggedNode(nodeType);
    onNodeDrag(nodeType);
  };

  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  const getNodeColor = (nodeType: NodeType) => {
    switch (nodeType) {
      case NodeType.START:
        return '#10b981'; // green
      case NodeType.END:
        return '#6b7280'; // gray
      case NodeType.ACTION:
        return '#3b82f6'; // blue
      case NodeType.CONDITION:
        return '#f59e0b'; // yellow
      case NodeType.LOOP:
        return '#8b5cf6'; // purple
      case NodeType.HTTP_REQUEST:
        return '#06b6d4'; // cyan
      case NodeType.EMAIL:
        return '#ec4899'; // pink
      case NodeType.SLACK:
        return '#8b5cf6'; // purple
      case NodeType.DATA_TRANSFORM:
        return '#6366f1'; // indigo
      case NodeType.TIMER:
        return '#f97316'; // orange
      case NodeType.WEBHOOK:
        return '#84cc16'; // lime
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Node Library
        </h2>

        {/* Search */}
        <div className="mb-3">
          <Tooltip
            content="Search nodes by name or description"
            position="bottom"
          >
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Tooltip>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1">
          <Tooltip content="Show all node categories" position="bottom">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
          </Tooltip>
          {categories.map(category => (
            <Tooltip
              key={category.id}
              content={`Show ${category.name} nodes`}
              position="bottom"
            >
              <button
                onClick={() => setSelectedCategory(category.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCategories.map(category => (
          <div key={category.id} className="mb-6">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">{category.icon}</span>
              <h3 className="font-medium text-gray-800">{category.name}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">{category.description}</p>

            <div className="grid grid-cols-1 gap-2">
              {category.nodes
                .filter(nodeType => {
                  const nodeInfo = getNodeInfo(nodeType);
                  return (
                    nodeInfo.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    nodeInfo.description
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  );
                })
                .map(nodeType => {
                  const nodeInfo = getNodeInfo(nodeType);
                  const isDragging = draggedNode === nodeType;

                  return (
                    <Tooltip
                      key={nodeType}
                      content={`Drag to add ${nodeInfo.name} node to workflow`}
                      position="right"
                      disabled={isDragging}
                    >
                      <div
                        draggable
                        onDragStart={e => handleNodeDragStart(e, nodeType)}
                        onDragEnd={handleNodeDragEnd}
                        className={`
                          flex items-center p-3 border border-gray-200 rounded-lg cursor-move
                          transition-all duration-200 ease-in-out
                          ${
                            isDragging
                              ? 'opacity-50 scale-95 shadow-lg'
                              : 'hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                          }
                          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                        `}
                        style={{
                          transform: isDragging
                            ? 'rotate(2deg)'
                            : 'rotate(0deg)',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors"
                          style={{
                            backgroundColor: getNodeColor(nodeType) + '20',
                            border: `2px solid ${getNodeColor(nodeType)}`,
                          }}
                        >
                          <span className="text-sm">{nodeInfo.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-800">
                            {nodeInfo.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {nodeInfo.description}
                          </div>
                        </div>

                        {/* Drag indicator */}
                        <div className="ml-2 opacity-60">
                          <span className="text-xs text-gray-400">⋮⋮</span>
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">🔍</div>
            <div>No nodes found</div>
            <div className="text-sm">
              Try adjusting your search or category filter
            </div>
          </div>
        )}
      </div>

      {/* Drag Status */}
      {draggedNode && (
        <div className="p-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center text-sm text-blue-700">
            <span className="mr-2">🖱️</span>
            <span>Dragging: {getNodeInfo(draggedNode).name}</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Drop on canvas to add node
          </div>
        </div>
      )}
    </div>
  );
};

export default NodePalette;
