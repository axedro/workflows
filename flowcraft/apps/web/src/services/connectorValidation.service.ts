/**
 * Connector Validation Service - FlowCraft Workflow Automation Platform
 * 
 * This service provides specific validation for different connector types
 * to ensure proper configuration and data flow.
 */

import { DataField, DataType, ValidationResult } from '@flowcraft/shared-types';

export interface ConnectorValidationConfig {
  connectorType: string;
  fields: Record<string, any>;
  schema: Record<string, DataField>;
}

export interface ConnectorValidationRule {
  field: string;
  validator: (value: any, config?: any) => ValidationResult;
  config?: any;
}

// ===== VALIDATION RULES =====

const HTTP_REQUEST_VALIDATION_RULES: ConnectorValidationRule[] = [
  {
    field: 'url',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value) {
        errors.push('URL is required');
        return { isValid: false, errors, warnings };
      }

      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('URL must use HTTP or HTTPS protocol');
        }
      } catch {
        errors.push('Invalid URL format');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'method',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value) {
        errors.push('HTTP method is required');
        return { isValid: false, errors, warnings };
      }

      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!validMethods.includes(value.toUpperCase())) {
        errors.push(`Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`);
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'headers',
    validator: (value: any) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (value && typeof value !== 'object') {
        errors.push('Headers must be an object');
      }

      if (value && Array.isArray(value)) {
        errors.push('Headers must be an object, not an array');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  }
];

const EMAIL_VALIDATION_RULES: ConnectorValidationRule[] = [
  {
    field: 'to',
    validator: (value: string[]) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value || !Array.isArray(value) || value.length === 0) {
        errors.push('At least one recipient email is required');
        return { isValid: false, errors, warnings };
      }

      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
      value.forEach((email, index) => {
        if (!emailRegex.test(email)) {
          errors.push(`Invalid email format at position ${index + 1}: ${email}`);
        }
      });

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'subject',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value || value.trim().length === 0) {
        errors.push('Email subject is required');
        return { isValid: false, errors, warnings };
      }

      if (value.length > 255) {
        warnings.push('Email subject is very long (max 255 characters recommended)');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'emailBody',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value || value.trim().length === 0) {
        errors.push('Email body is required');
        return { isValid: false, errors, warnings };
      }

      if (value.length > 10000) {
        warnings.push('Email body is very long (max 10,000 characters recommended)');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  }
];

const SLACK_VALIDATION_RULES: ConnectorValidationRule[] = [
  {
    field: 'channel',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value || value.trim().length === 0) {
        errors.push('Slack channel is required');
        return { isValid: false, errors, warnings };
      }

      if (!value.startsWith('#') && !value.startsWith('@')) {
        warnings.push('Channel should start with # (public channel) or @ (user)');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'slackMessage',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value || value.trim().length === 0) {
        errors.push('Slack message is required');
        return { isValid: false, errors, warnings };
      }

      if (value.length > 3000) {
        warnings.push('Slack message is very long (max 3,000 characters recommended)');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  }
];

const TIMER_VALIDATION_RULES: ConnectorValidationRule[] = [
  {
    field: 'duration',
    validator: (value: number) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value || typeof value !== 'number') {
        errors.push('Duration must be a number');
        return { isValid: false, errors, warnings };
      }

      if (value < 1000) {
        errors.push('Duration must be at least 1,000 milliseconds (1 second)');
      }

      if (value > 86400000) {
        errors.push('Duration cannot exceed 24 hours (86,400,000 milliseconds)');
      }

      if (value > 3600000) {
        warnings.push('Long duration detected (over 1 hour)');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'schedule',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (value && value.trim().length > 0) {
        // Basic cron expression validation
        const cronParts = value.split(' ');
        if (cronParts.length !== 5) {
          errors.push('Cron expression must have exactly 5 parts (minute hour day month weekday)');
        } else {
          // Validate each part
          const [minute, hour] = cronParts;
          
          if (!/^(\*|[0-5]?[0-9](-[0-5]?[0-9])?(,\d+)*|\*\/[0-5]?[0-9])$/.test(minute)) {
            errors.push('Invalid minute format in cron expression');
          }
          
          if (!/^(\*|1?[0-9]|2[0-3](-1?[0-9]|2[0-3])?(,\d+)*|\*\/1?[0-9]|2[0-3])$/.test(hour)) {
            errors.push('Invalid hour format in cron expression');
          }
        }
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  }
];

const WEBHOOK_VALIDATION_RULES: ConnectorValidationRule[] = [
  {
    field: 'webhookUrl',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value) {
        errors.push('Webhook URL is required');
        return { isValid: false, errors, warnings };
      }

      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('Webhook URL must use HTTP or HTTPS protocol');
        }
      } catch {
        errors.push('Invalid webhook URL format');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'webhookMethod',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value) {
        errors.push('Webhook method is required');
        return { isValid: false, errors, warnings };
      }

      const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      if (!validMethods.includes(value.toUpperCase())) {
        errors.push(`Invalid webhook method. Must be one of: ${validMethods.join(', ')}`);
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  }
];

const DATA_TRANSFORM_VALIDATION_RULES: ConnectorValidationRule[] = [
  {
    field: 'transformType',
    validator: (value: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value) {
        errors.push('Transform type is required');
        return { isValid: false, errors, warnings };
      }

      const validTypes = ['map', 'filter', 'aggregate', 'sort', 'custom'];
      if (!validTypes.includes(value)) {
        errors.push(`Invalid transform type. Must be one of: ${validTypes.join(', ')}`);
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  },
  {
    field: 'transformConfig',
    validator: (value: any) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!value || typeof value !== 'object') {
        errors.push('Transform configuration must be an object');
        return { isValid: false, errors, warnings };
      }

      if (Object.keys(value).length === 0) {
        errors.push('Transform configuration cannot be empty');
      }

      return { isValid: errors.length === 0, errors, warnings };
    }
  }
];

// ===== VALIDATION SERVICE =====

export class ConnectorValidationService {
  private static validationRules: Record<string, ConnectorValidationRule[]> = {
    'HTTP_REQUEST': HTTP_REQUEST_VALIDATION_RULES,
    'EMAIL': EMAIL_VALIDATION_RULES,
    'SLACK': SLACK_VALIDATION_RULES,
    'TIMER': TIMER_VALIDATION_RULES,
    'WEBHOOK': WEBHOOK_VALIDATION_RULES,
    'DATA_TRANSFORM': DATA_TRANSFORM_VALIDATION_RULES
  };

  /**
   * Validate a connector configuration
   */
  static validateConnector(config: ConnectorValidationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    // Get validation rules for this connector type
    const rules = this.validationRules[config.connectorType] || [];

    // Apply validation rules
    rules.forEach(rule => {
      const fieldValue = config.fields[rule.field];
      const result = rule.validator(fieldValue, rule.config);
      
      if (!result.isValid) {
        isValid = false;
      }
      
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });

    // Validate required fields from schema
    Object.entries(config.schema).forEach(([fieldId, field]) => {
      if (field.required && (!config.fields[fieldId] || config.fields[fieldId] === '')) {
        isValid = false;
        errors.push(`Required field '${field.name}' is missing`);
      }
    });

    // Type validation
    Object.entries(config.schema).forEach(([fieldId, field]) => {
      const value = config.fields[fieldId];
      if (value !== undefined && value !== null) {
        const typeResult = this.validateFieldType(field, value);
        if (!typeResult.isValid) {
          isValid = false;
          errors.push(...typeResult.errors);
        }
        warnings.push(...typeResult.warnings);
      }
    });

    return {
      isValid,
      errors,
      warnings,
      details: {
        connectorType: config.connectorType,
        fieldsValidated: Object.keys(config.fields).length,
        schemaFields: Object.keys(config.schema).length
      }
    };
  }

  /**
   * Validate a single field's type
   */
  private static validateFieldType(field: DataField, value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (field.type) {
      case DataType.STRING:
        if (typeof value !== 'string') {
          errors.push(`Field '${field.name}' must be a string`);
        }
        break;

      case DataType.NUMBER:
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Field '${field.name}' must be a number`);
        }
        break;

      case DataType.BOOLEAN:
        if (typeof value !== 'boolean') {
          errors.push(`Field '${field.name}' must be a boolean`);
        }
        break;

      case DataType.ARRAY:
        if (!Array.isArray(value)) {
          errors.push(`Field '${field.name}' must be an array`);
        }
        break;

      case DataType.OBJECT:
      case DataType.JSON:
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`Field '${field.name}' must be an object`);
        }
        break;

      case DataType.DATE:
        if (isNaN(Date.parse(value))) {
          errors.push(`Field '${field.name}' must be a valid date`);
        }
        break;

      case DataType.EMAIL:
        if (typeof value !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
          errors.push(`Field '${field.name}' must be a valid email address`);
        }
        break;

      case DataType.URL:
        if (typeof value !== 'string') {
          errors.push(`Field '${field.name}' must be a string`);
        } else {
          try {
            new URL(value);
          } catch {
            errors.push(`Field '${field.name}' must be a valid URL`);
          }
        }
        break;
    }

    // Apply field-specific validation rules
    if (field.validation) {
      if (field.validation.minLength && typeof value === 'string' && value.length < field.validation.minLength) {
        errors.push(`Field '${field.name}' must be at least ${field.validation.minLength} characters long`);
      }

      if (field.validation.maxLength && typeof value === 'string' && value.length > field.validation.maxLength) {
        errors.push(`Field '${field.name}' must be no more than ${field.validation.maxLength} characters long`);
      }

      if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
        errors.push(`Field '${field.name}' must be at least ${field.validation.min}`);
      }

      if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
        errors.push(`Field '${field.name}' must be no more than ${field.validation.max}`);
      }

      if (field.validation.pattern && typeof value === 'string' && !new RegExp(field.validation.pattern).test(value)) {
        errors.push(`Field '${field.name}' does not match the required pattern`);
      }

      if (field.validation.enum && !field.validation.enum.includes(value)) {
        errors.push(`Field '${field.name}' must be one of: ${field.validation.enum.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get validation suggestions for a field
   */
  static getValidationSuggestions(field: DataField): string[] {
    const suggestions: string[] = [];

    if (field.validation) {
      if (field.validation.enum) {
        suggestions.push(`Valid values: ${field.validation.enum.join(', ')}`);
      }

      if (field.validation.pattern) {
        suggestions.push(`Must match pattern: ${field.validation.pattern}`);
      }

      if (field.validation.minLength) {
        suggestions.push(`Minimum length: ${field.validation.minLength} characters`);
      }

      if (field.validation.maxLength) {
        suggestions.push(`Maximum length: ${field.validation.maxLength} characters`);
      }

      if (field.validation.min !== undefined) {
        suggestions.push(`Minimum value: ${field.validation.min}`);
      }

      if (field.validation.max !== undefined) {
        suggestions.push(`Maximum value: ${field.validation.max}`);
      }
    }

    if (field.example) {
      suggestions.push(`Example: ${JSON.stringify(field.example)}`);
    }

    return suggestions;
  }

  /**
   * Export connector configuration
   */
  static exportConnectorConfig(config: ConnectorValidationConfig): string {
    return JSON.stringify({
      connectorType: config.connectorType,
      fields: config.fields,
      schema: config.schema,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import connector configuration
   */
  static importConnectorConfig(configString: string): ConnectorValidationConfig {
    try {
      const config = JSON.parse(configString);
      
      // Validate imported config structure
      if (!config.connectorType || !config.fields || !config.schema) {
        throw new Error('Invalid configuration format');
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ConnectorValidationService; 