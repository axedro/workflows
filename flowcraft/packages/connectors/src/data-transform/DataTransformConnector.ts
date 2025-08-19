import { BaseConnector } from '../base';
import { ConnectorConfig, ConnectorResult } from '@flowcraft/shared-types';

export interface TransformConfig {
  operations: TransformOperation[];
  outputFormat?: 'json' | 'xml' | 'csv' | 'text';
  preserveOriginal?: boolean;
  errorHandling?: 'skip' | 'fail' | 'default';
  defaultValues?: Record<string, any>;
}

export interface TransformOperation {
  type: 'map' | 'filter' | 'aggregate' | 'sort' | 'custom';
  config: any;
}

export interface TransformInput {
  data: any;
  context?: Record<string, any>;
}

export class DataTransformConnector extends BaseConnector {
  async execute(config: TransformConfig, input?: TransformInput): Promise<ConnectorResult> {
    try {
      if (!input?.data) {
        throw new Error('Input data is required');
      }

      let result = input.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Apply transformations in sequence
      for (const operation of config.operations) {
        try {
          result = await this.applyTransform(result, operation, config, input.context);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown transformation error';
          
          switch (config.errorHandling) {
            case 'skip':
              warnings.push(`Skipped operation ${operation.type}: ${errorMsg}`);
              break;
            case 'fail':
              throw error;
            case 'default':
            default:
              if (config.defaultValues && config.defaultValues[operation.type]) {
                result = config.defaultValues[operation.type];
                warnings.push(`Used default value for operation ${operation.type}: ${errorMsg}`);
              } else {
                throw error;
              }
          }
        }
      }

      // Format output
      const formattedResult = this.formatOutput(result, config.outputFormat);

      return {
        success: true,
        data: {
          transformed: formattedResult,
          original: config.preserveOriginal ? input.data : undefined,
          operations: config.operations.length,
          errors: errors.length > 0 ? errors : undefined,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
        message: 'Data transformation completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Data transformation failed',
      };
    }
  }

  private async applyTransform(data: any, operation: TransformOperation, config: TransformConfig, context?: Record<string, any>): Promise<any> {
    switch (operation.type) {
      case 'map':
        return this.mapTransform(data, operation.config);
      case 'filter':
        return this.filterTransform(data, operation.config);
      case 'aggregate':
        return this.aggregateTransform(data, operation.config);
      case 'sort':
        return this.sortTransform(data, operation.config);
      case 'custom':
        return this.customTransform(data, operation.config, context);
      default:
        throw new Error(`Unsupported transformation type: ${operation.type}`);
    }
  }

  private mapTransform(data: any, config: any): any {
    const { fieldMapping, transformations } = config;
    
    if (Array.isArray(data)) {
      return data.map(item => this.mapItem(item, fieldMapping, transformations));
    } else {
      return this.mapItem(data, fieldMapping, transformations);
    }
  }

  private mapItem(item: any, fieldMapping: Record<string, string>, transformations: Record<string, string>): any {
    const result: any = {};
    
    // Apply field mapping
    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      const value = this.getNestedValue(item, sourceField);
      result[targetField] = value;
    }
    
    // Apply transformations
    for (const [field, transform] of Object.entries(transformations)) {
      if (result[field] !== undefined) {
        result[field] = this.applyFieldTransform(result[field], transform);
      }
    }
    
    return result;
  }

  private filterTransform(data: any, config: any): any {
    const { conditions, operator = 'AND' } = config;
    
    if (!Array.isArray(data)) {
      throw new Error('Filter operation requires array input');
    }
    
    return data.filter(item => {
      const results = conditions.map((condition: any) => 
        this.evaluateCondition(item, condition)
      );
      
      return operator === 'AND' 
        ? results.every(Boolean)
        : results.some(Boolean);
    });
  }

  private aggregateTransform(data: any, config: any): any {
    const { groupBy, aggregations } = config;
    
    if (!Array.isArray(data)) {
      throw new Error('Aggregate operation requires array input');
    }
    
    const groups: Record<string, any[]> = {};
    
    // Group data
    data.forEach(item => {
      const groupKey = groupBy ? this.getNestedValue(item, groupBy) : 'default';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    // Apply aggregations
    const result: any[] = [];
    for (const [groupKey, groupData] of Object.entries(groups)) {
      const aggregated: any = { group: groupKey };
      
      for (const aggregation of aggregations) {
        const { field, operation, alias } = aggregation;
        const values = groupData.map(item => this.getNestedValue(item, field)).filter(v => v !== undefined);
        
        aggregated[alias || `${operation}_${field}`] = this.calculateAggregation(values, operation);
      }
      
      result.push(aggregated);
    }
    
    return result;
  }

  private sortTransform(data: any, config: any): any {
    const { fields } = config;
    
    if (!Array.isArray(data)) {
      throw new Error('Sort operation requires array input');
    }
    
    return [...data].sort((a, b) => {
      for (const field of fields) {
        const { path, order = 'asc' } = field;
        const aValue = this.getNestedValue(a, path);
        const bValue = this.getNestedValue(b, path);
        
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private customTransform(data: any, config: any, context?: Record<string, any>): any {
    const { function: customFunction, parameters } = config;
    
    // In a real implementation, this would execute custom JavaScript functions
    // For now, we'll provide some built-in functions
    switch (customFunction) {
      case 'uppercase':
        return typeof data === 'string' ? data.toUpperCase() : data;
      case 'lowercase':
        return typeof data === 'string' ? data.toLowerCase() : data;
      case 'trim':
        return typeof data === 'string' ? data.trim() : data;
      case 'replace':
        const { search, replace } = parameters || {};
        return typeof data === 'string' ? data.replace(new RegExp(search, 'g'), replace) : data;
      case 'split':
        const { separator } = parameters || {};
        return typeof data === 'string' ? data.split(separator || ',') : data;
      case 'join':
        const { joinChar } = parameters || {};
        return Array.isArray(data) ? data.join(joinChar || ',') : data;
      default:
        throw new Error(`Unknown custom function: ${customFunction}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(item: any, condition: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(item, field);
    
    switch (operator) {
      case 'eq': return fieldValue === value;
      case 'ne': return fieldValue !== value;
      case 'gt': return fieldValue > value;
      case 'gte': return fieldValue >= value;
      case 'lt': return fieldValue < value;
      case 'lte': return fieldValue <= value;
      case 'contains': return String(fieldValue).includes(String(value));
      case 'startsWith': return String(fieldValue).startsWith(String(value));
      case 'endsWith': return String(fieldValue).endsWith(String(value));
      case 'in': return Array.isArray(value) && value.includes(fieldValue);
      case 'exists': return fieldValue !== undefined && fieldValue !== null;
      default: return false;
    }
  }

  private applyFieldTransform(value: any, transform: string): any {
    switch (transform) {
      case 'string': return String(value);
      case 'number': return Number(value);
      case 'boolean': return Boolean(value);
      case 'date': return new Date(value).toISOString();
      case 'uppercase': return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase': return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim': return typeof value === 'string' ? value.trim() : value;
      default: return value;
    }
  }

  private calculateAggregation(values: any[], operation: string): any {
    switch (operation) {
      case 'sum': return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
      case 'avg': return values.length > 0 ? values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length : 0;
      case 'min': return Math.min(...values.map(v => Number(v) || Infinity));
      case 'max': return Math.max(...values.map(v => Number(v) || -Infinity));
      case 'count': return values.length;
      case 'distinct': return [...new Set(values)].length;
      case 'first': return values[0];
      case 'last': return values[values.length - 1];
      default: return values;
    }
  }

  private formatOutput(data: any, format?: string): any {
    switch (format) {
      case 'xml':
        return this.toXML(data);
      case 'csv':
        return this.toCSV(data);
      case 'text':
        return JSON.stringify(data, null, 2);
      case 'json':
      default:
        return data;
    }
  }

  private toXML(data: any): string {
    // Simplified XML conversion
    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data);
      if (entries.length === 0) return '<root/>';
      
      const xmlParts = entries.map(([key, value]) => {
        const xmlValue = typeof value === 'object' ? this.toXML(value) : String(value);
        return `<${key}>${xmlValue}</${key}>`;
      });
      
      return `<root>${xmlParts.join('')}</root>`;
    }
    return String(data);
  }

  private toCSV(data: any): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ];
    
    return csvRows.join('\n');
  }

  async test(config: TransformConfig): Promise<ConnectorResult> {
    try {
      const testInput: TransformInput = {
        data: [
          { id: 1, name: 'John', age: 30, city: 'New York' },
          { id: 2, name: 'Jane', age: 25, city: 'Los Angeles' },
          { id: 3, name: 'Bob', age: 35, city: 'New York' },
        ],
      };

      return await this.execute(config, testInput);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Data transform connector test failed',
      };
    }
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          title: 'Transform Operations',
          description: 'List of transformation operations to apply',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                title: 'Operation Type',
                enum: ['map', 'filter', 'aggregate', 'sort', 'custom'],
              },
              config: {
                type: 'object',
                title: 'Operation Configuration',
                description: 'Configuration specific to the operation type',
              },
            },
            required: ['type', 'config'],
          },
          minItems: 1,
        },
        outputFormat: {
          type: 'string',
          title: 'Output Format',
          description: 'Format for the transformed data',
          enum: ['json', 'xml', 'csv', 'text'],
          default: 'json',
        },
        preserveOriginal: {
          type: 'boolean',
          title: 'Preserve Original',
          description: 'Include original data in output',
          default: false,
        },
        errorHandling: {
          type: 'string',
          title: 'Error Handling',
          description: 'How to handle transformation errors',
          enum: ['skip', 'fail', 'default'],
          default: 'fail',
        },
        defaultValues: {
          type: 'object',
          title: 'Default Values',
          description: 'Default values for failed operations',
          additionalProperties: true,
        },
      },
      required: ['operations'],
    };
  }

  getInputSchema(): any {
    return {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          title: 'Input Data',
          description: 'Data to transform',
          additionalProperties: true,
        },
        context: {
          type: 'object',
          title: 'Context',
          description: 'Additional context for transformations',
          additionalProperties: true,
        },
      },
      required: ['data'],
    };
  }

  getOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        transformed: {
          type: 'object',
          title: 'Transformed Data',
          description: 'The transformed data',
          additionalProperties: true,
        },
        original: {
          type: 'object',
          title: 'Original Data',
          description: 'Original input data (if preserved)',
          additionalProperties: true,
        },
        operations: {
          type: 'number',
          title: 'Operations Count',
          description: 'Number of operations applied',
        },
        errors: {
          type: 'array',
          title: 'Errors',
          description: 'List of errors encountered',
          items: {
            type: 'string',
          },
        },
        warnings: {
          type: 'array',
          title: 'Warnings',
          description: 'List of warnings encountered',
          items: {
            type: 'string',
          },
        },
      },
    };
  }
}
