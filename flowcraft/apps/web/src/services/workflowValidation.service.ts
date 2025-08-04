import { EditorNode, NodeValidation, NodeType } from '@flowcraft/shared-types';

/**
 * Validates a single workflow node based on its type and data.
 * @param node The node to validate.
 * @returns A NodeValidation object with the validation status and errors.
 */
export function validateNode(node: EditorNode): NodeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!node.data.label || node.data.label.trim() === '') {
    errors.push('Node label is required');
  }

  // Node-specific validation
  switch (node.type) {
    case NodeType.CONDITION:
      const conditionData = node.data as any; // Cast to any for now
      const dataConditions = conditionData.dataConditions || [];
      
      // Validar que haya al menos una condición
      if (dataConditions.length === 0) {
        errors.push('At least one condition is required');
      } else {
        // Validar cada condición individual
        dataConditions.forEach((condition: any, index: number) => {
          if (!condition.field || condition.field.trim() === '') {
            errors.push(`Condition ${index + 1}: Field is required`);
          }
          if (!condition.value || condition.value.toString().trim() === '') {
            errors.push(`Condition ${index + 1}: Value is required`);
          }
        });
      }
      break;

    case NodeType.START:
      const startData = node.data as any; // Cast to any for now
      if (startData.triggerType === 'scheduled' && (!startData.schedule || startData.schedule.trim() === '')) {
        errors.push('Schedule is required for scheduled triggers');
      }
      if (startData.triggerType === 'webhook' && (!startData.webhookUrl || startData.webhookUrl.trim() === '')) {
        errors.push('Webhook URL is required for webhook triggers');
      }
      break;

    case NodeType.ACTION:
      const actionData = node.data as any; // Cast to any for now
      if (actionData.maxRetries && (actionData.maxRetries < 0 || actionData.maxRetries > 10)) {
        warnings.push('Max retries should be between 0 and 10');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dataValidation: {
      isValid: true,
      errors: [],
      warnings: []
    }
  };
}
