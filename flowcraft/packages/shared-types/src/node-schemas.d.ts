/**
 * Node Data Schemas - FlowCraft Workflow Automation Platform
 *
 * This module provides default data schemas for each node type
 * to ensure consistent data flow across the workflow editor.
 */
import { DataSchema, DataField, DataType, DataPort, PortPosition, PortType } from './data-flow';
import { NodeType } from './workflow';
export declare const DEFAULT_FIELDS: {
    id: DataField;
    name: DataField;
    email: DataField;
    timestamp: DataField;
    status: DataField;
    data: DataField;
    count: DataField;
    success: DataField;
    message: DataField;
    error: DataField;
    url: DataField;
    method: DataField;
    headers: DataField;
    body: DataField;
    responseStatus: DataField;
    responseData: DataField;
    to: DataField;
    cc: DataField;
    bcc: DataField;
    subject: DataField;
    emailBody: DataField;
    attachments: DataField;
    channel: DataField;
    slackMessage: DataField;
    blocks: DataField;
    duration: DataField;
    schedule: DataField;
    transformType: DataField;
    transformConfig: DataField;
    webhookUrl: DataField;
    webhookMethod: DataField;
    webhookHeaders: DataField;
};
export declare const DEFAULT_PORTS: {
    input: DataPort;
    output: DataPort;
    success: DataPort;
    error: DataPort;
};
export declare const NODE_SCHEMAS: Record<NodeType, DataSchema>;
export declare const NODE_PORTS: Record<NodeType, DataPort[]>;
/**
 * Get the default data schema for a node type
 */
export declare function getNodeSchema(nodeType: NodeType): DataSchema;
/**
 * Get the default ports for a node type
 */
export declare function getNodePorts(nodeType: NodeType): DataPort[];
/**
 * Get input ports for a node type
 */
export declare function getNodeInputPorts(nodeType: NodeType): DataPort[];
/**
 * Get output ports for a node type
 */
export declare function getNodeOutputPorts(nodeType: NodeType): DataPort[];
/**
 * Create a custom data field
 */
export declare function createDataField(id: string, name: string, type: DataType, required?: boolean, description?: string, example?: any): DataField;
/**
 * Create a custom data port
 */
export declare function createDataPort(id: string, name: string, type: PortType, fields: DataField[], position: PortPosition, required?: boolean, description?: string): DataPort;
/**
 * Create a custom data schema
 */
export declare function createDataSchema(input: Record<string, DataField>, output: Record<string, DataField>, description?: string, version?: string): DataSchema;
//# sourceMappingURL=node-schemas.d.ts.map