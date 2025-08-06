/**
 * Dynamic Schema Calculation - FlowCraft Workflow Automation Platform
 *
 * This module provides functions to calculate node input/output schemas
 * dynamically based on workflow connections and data flow transformations.
 */
import { DataField } from './data-flow';
import { EditorNode, EditorEdge } from './workflow';
/**
 * Calculate the actual input schema for a node based on incoming connections
 */
export declare function calculateNodeInputSchema(nodeId: string, nodes: EditorNode[], edges: EditorEdge[]): Record<string, DataField>;
/**
 * Calculate the actual output schema for a node based on its type and input
 */
export declare function calculateNodeOutputSchema(nodeId: string, nodes: EditorNode[], edges: EditorEdge[]): Record<string, DataField>;
/**
 * Get the dynamic input schema for a node
 */
export declare function getNodeInputSchema(nodeId: string, nodes: EditorNode[], edges: EditorEdge[]): Record<string, DataField>;
/**
 * Get the dynamic output schema for a node
 */
export declare function getNodeOutputSchema(nodeId: string, nodes: EditorNode[], edges: EditorEdge[]): Record<string, DataField>;
/**
 * Check if a node has any incoming connections
 */
export declare function hasIncomingConnections(nodeId: string, edges: EditorEdge[]): boolean;
/**
 * Check if a node has any outgoing connections
 */
export declare function hasOutgoingConnections(nodeId: string, edges: EditorEdge[]): boolean;
//# sourceMappingURL=dynamic-schemas.d.ts.map