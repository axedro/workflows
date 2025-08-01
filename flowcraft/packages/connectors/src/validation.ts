import { ConnectorConfig, ConnectorInput } from '@flowcraft/shared-types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConnectorValidator {
  static validateConfig(config: ConnectorConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!config.id) {
      errors.push('Connector config must have an id');
    }

    if (!config.name) {
      errors.push('Connector config must have a name');
    }

    if (!config.version) {
      errors.push('Connector config must have a version');
    }

    if (!config.description) {
      errors.push('Connector config must have a description');
    }

    if (!config.category) {
      errors.push('Connector config must have a category');
    }

    // Validate inputs
    if (!Array.isArray(config.inputs)) {
      errors.push('Connector config must have inputs array');
    } else {
      config.inputs.forEach((input: ConnectorInput, index: number) => {
        if (!input.name) {
          errors.push(`Input ${index} must have a name`);
        }
        if (!input.type) {
          errors.push(`Input ${index} must have a type`);
        }
        if (typeof input.required !== 'boolean') {
          errors.push(`Input ${index} must have a required boolean flag`);
        }
      });
    }

    // Validate outputs
    if (!Array.isArray(config.outputs)) {
      errors.push('Connector config must have outputs array');
    } else {
      config.outputs.forEach((output, index) => {
        if (!output.name) {
          errors.push(`Output ${index} must have a name`);
        }
        if (!output.type) {
          errors.push(`Output ${index} must have a type`);
        }
      });
    }

    // Validate config schema
    if (!config.configSchema || typeof config.configSchema !== 'object') {
      errors.push('Connector config must have a configSchema object');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateInputs(inputs: Record<string, any>, expectedInputs: ConnectorInput[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    expectedInputs.forEach((expectedInput) => {
      if (expectedInput.required && !(expectedInput.name in inputs)) {
        errors.push(`Required input '${expectedInput.name}' is missing`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
} 