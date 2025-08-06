import React, { useState } from 'react';
import { NodeType, NodeCategory } from '@flowcraft/shared-types';
import { getNodeInfo } from '../utils';
import { useTranslation } from '../../../hooks/i18n';

export type OnNodeDragStart = (event: React.DragEvent, nodeType: NodeType) => void;

interface NodePaletteProps {
  categories: NodeCategory[];
  onNodeDragStart: OnNodeDragStart;
}

const getNodeColor = (nodeType: NodeType) => {
    switch (nodeType) {
      case NodeType.START: return '#10b981';
      case NodeType.END: return '#6b7280';
      case NodeType.ACTION: return '#3b82f6';
      case NodeType.CONDITION: return '#f59e0b';
      case NodeType.LOOP: return '#8b5cf6';
      case NodeType.HTTP_REQUEST: return '#06b6d4';
      case NodeType.EMAIL: return '#ec4899';
      case NodeType.SLACK: return '#8b5cf6';
      case NodeType.DATA_TRANSFORM: return '#6366f1';
      case NodeType.TIMER: return '#f97316';
      case NodeType.WEBHOOK: return '#84cc16';
      default: return '#6b7280';
    }
};

const NodePalette: React.FC<NodePaletteProps> = ({ categories, onNodeDragStart }) => {
  const { t } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<NodeType | null>(null);

  const filteredCategories = categories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false;
    return category.nodes.some(nodeType =>
      getNodeInfo(nodeType).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getNodeInfo(nodeType).description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const handleDragEnd = () => setDraggedNode(null);

  return (
    <div className="w-64 h-full flex flex-col bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Node Library</h2>
        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        />
        <div className="flex flex-wrap gap-1 mt-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 text-xs rounded ${selectedCategory === null ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {t('all')}
            </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1 text-xs rounded ${selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCategories.map(category => (
          <div key={category.id} className="mb-4">
            <h3 className="font-medium px-2 mb-2 text-gray-700">{category.name}</h3>
            <div className="space-y-1">
            {category.nodes
              .filter(nodeType => 
                getNodeInfo(nodeType).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getNodeInfo(nodeType).description.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(nodeType => {
                const nodeInfo = getNodeInfo(nodeType);
                const isDragging = draggedNode === nodeType;
                return (
                  <div
                    key={nodeType}
                    draggable
                    onDragStart={(e) => {
                      setDraggedNode(nodeType);
                      onNodeDragStart(e, nodeType);
                    }}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center p-2 rounded-md cursor-move transition-all ${isDragging ? 'opacity-50 scale-95 shadow-lg' : 'hover:bg-gray-100'}`}
                    title={nodeInfo.description}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: getNodeColor(nodeType) + '20' }}>
                      <span className="text-sm" style={{ color: getNodeColor(nodeType) }}>{nodeInfo.icon || 'N'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{nodeInfo.name}</div>
                      <div className="text-xs text-gray-500">{nodeInfo.description}</div>
                    </div>
                    <div className="text-gray-400">⋮⋮</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">{t('no_nodes_found')}</div>
        )}
      </div>
    </div>
  );
};

export default NodePalette;
