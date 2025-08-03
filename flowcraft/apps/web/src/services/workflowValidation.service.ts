import { EditorNode, NodeType, NodeValidation } from '@flowcraft/shared-types';

/**
 * Validates a single workflow node based on its type and data.
 * @param node The node to validate.
 * @returns A NodeValidation object with the validation status and errors.
 */
export const validateNode = (node: EditorNode): NodeValidation => {
  const errors: string[] = [];

  // General validations for all nodes
  if (!node.data.label || node.data.label.trim() === '') {
    errors.push('Node label cannot be empty.');
  }

  // Type-specific validations
  switch (node.type) {
    case NodeType.CONDITION:
      if (!node.data.condition?.variable || node.data.condition.variable.trim() === '') {
        errors.push('"Variable" field cannot be empty.');
      }
      if (!node.data.condition?.value || node.data.condition.value.trim() === '') {
        errors.push('"Value" field cannot be empty.');
      }
      break;

    // Add cases for other node types here...
    // case NodeType.HTTP_REQUEST:
    //   ...
    //   break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [], // Warnings can be implemented later
  };
};
