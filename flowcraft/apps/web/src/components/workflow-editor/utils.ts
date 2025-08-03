// Extracted helper functions to keep the component clean
import {
    NodeType,
} from '@flowcraft/shared-types';

export const getNodeInfo = (nodeType: NodeType) => {
    const nodeInfo = {
      [NodeType.START]: { name: 'Start', description: 'Workflow trigger', icon: '▶' },
      [NodeType.END]: { name: 'End', description: 'Workflow endpoint', icon: '■' },
      [NodeType.ACTION]: { name: 'Action', description: 'Perform an action', icon: '⚡' },
      [NodeType.CONDITION]: { name: 'Condition', description: 'Branch logic', icon: '?' },
      [NodeType.LOOP]: { name: 'Loop', description: 'Iterate over items', icon: '↻' },
      [NodeType.HTTP_REQUEST]: { name: 'HTTP Request', description: 'Call an API', icon: '🌐' },
      [NodeType.EMAIL]: { name: 'Email', description: 'Send an email', icon: '✉️' },
      [NodeType.SLACK]: { name: 'Slack', description: 'Send a Slack message', icon: '#' },
      [NodeType.DATA_TRANSFORM]: { name: 'Data Transform', description: 'Modify data', icon: '∬' },
      [NodeType.TIMER]: { name: 'Timer', description: 'Delay execution', icon: '🕒' },
      [NodeType.WEBHOOK]: { name: 'Webhook', description: 'Listen for webhooks', icon: '🔗' },
    };
    return nodeInfo[nodeType] || { name: 'Unknown', description: 'Unknown node', icon: '?' };
};
  
export const getNodeDimensions = (nodeType: NodeType) => {
    const dimensions = {
        [NodeType.START]: { width: 120, height: 100 },
        [NodeType.END]: { width: 120, height: 100 },
        [NodeType.ACTION]: { width: 140, height: 120 },
        [NodeType.CONDITION]: { width: 140, height: 120 },
        [NodeType.LOOP]: { width: 140, height: 120 },
        [NodeType.HTTP_REQUEST]: { width: 160, height: 140 },
        [NodeType.EMAIL]: { width: 140, height: 120 },
        [NodeType.SLACK]: { width: 140, height: 120 },
        [NodeType.DATA_TRANSFORM]: { width: 160, height: 140 },
        [NodeType.TIMER]: { width: 140, height: 120 },
        [NodeType.WEBHOOK]: { width: 160, height: 140 },
    };
    return dimensions[nodeType] || { width: 120, height: 100 };
};
