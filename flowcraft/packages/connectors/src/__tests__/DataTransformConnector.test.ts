import { DataTransformConnector, TransformConfig, TransformInput } from '../data-transform/DataTransformConnector';
import { ConnectorResult } from '@flowcraft/shared-types';

describe('DataTransformConnector', () => {
  let connector: DataTransformConnector;

  const sampleData = [
    { id: 1, name: 'John Doe', age: 30, city: 'New York', salary: 50000 },
    { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles', salary: 60000 },
    { id: 3, name: 'Bob Johnson', age: 35, city: 'New York', salary: 55000 },
    { id: 4, name: 'Alice Brown', age: 28, city: 'Chicago', salary: 52000 },
  ];

  beforeEach(() => {
    connector = new DataTransformConnector();
  });

  describe('execute', () => {
    it('should require input data', async () => {
      const config: TransformConfig = {
        operations: []
      };

      const result = await connector.execute(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Input data is required');
    });

    it('should execute map transformation', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'map',
          config: {
            fieldMapping: {
              'name': 'fullName',
              'age': 'years',
              'city': 'location'
            },
            transformations: {
              'fullName': 'uppercase'
            }
          }
        }]
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toHaveLength(4);
      expect(result.data?.transformed[0]).toEqual({
        fullName: 'JOHN DOE',
        years: 30,
        location: 'New York'
      });
    });

    it('should execute filter transformation', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'filter',
          config: {
            conditions: [
              { field: 'age', operator: 'gte', value: 30 },
              { field: 'city', operator: 'eq', value: 'New York' }
            ],
            operator: 'AND'
          }
        }]
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toHaveLength(2);
      expect(result.data?.transformed[0].name).toBe('John Doe');
      expect(result.data?.transformed[1].name).toBe('Bob Johnson');
    });

    it('should execute filter transformation with OR operator', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'filter',
          config: {
            conditions: [
              { field: 'age', operator: 'lt', value: 26 },
              { field: 'city', operator: 'eq', value: 'Chicago' }
            ],
            operator: 'OR'
          }
        }]
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toHaveLength(2);
      expect(result.data?.transformed.some((item: any) => item.name === 'Jane Smith')).toBe(true);
      expect(result.data?.transformed.some((item: any) => item.name === 'Alice Brown')).toBe(true);
    });

    it('should execute aggregate transformation', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'aggregate',
          config: {
            groupBy: 'city',
            aggregations: [
              { field: 'salary', operation: 'avg', alias: 'avgSalary' },
              { field: 'age', operation: 'max', alias: 'maxAge' },
              { field: 'id', operation: 'count', alias: 'totalPeople' }
            ]
          }
        }]
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toHaveLength(3);
      
      const nyGroup = result.data?.transformed.find((g: any) => g.group === 'New York');
      expect(nyGroup).toBeDefined();
      expect(nyGroup.avgSalary).toBe(52500);
      expect(nyGroup.maxAge).toBe(35);
      expect(nyGroup.totalPeople).toBe(2);
    });

    it('should execute sort transformation', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'sort',
          config: {
            fields: [
              { path: 'age', order: 'desc' },
              { path: 'name', order: 'asc' }
            ]
          }
        }]
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toHaveLength(4);
      expect(result.data?.transformed[0].name).toBe('Bob Johnson'); // age 35
      expect(result.data?.transformed[1].name).toBe('John Doe'); // age 30
      expect(result.data?.transformed[2].name).toBe('Alice Brown'); // age 28
      expect(result.data?.transformed[3].name).toBe('Jane Smith'); // age 25
    });

    it('should execute custom transformations', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'custom',
          config: {
            function: 'replace',
            parameters: {
              search: 'John',
              replace: 'Jonathan'
            }
          }
        }]
      };

      const input: TransformInput = { data: 'John Doe and John Smith' };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toBe('Jonathan Doe and Jonathan Smith');
    });

    it('should handle multiple operations in sequence', async () => {
      const config: TransformConfig = {
        operations: [
          {
            type: 'filter',
            config: {
              conditions: [{ field: 'age', operator: 'gte', value: 28 }]
            }
          },
          {
            type: 'map',
            config: {
              fieldMapping: { 'name': 'fullName', 'age': 'years' },
              transformations: { 'fullName': 'uppercase' }
            }
          },
          {
            type: 'sort',
            config: {
              fields: [{ path: 'years', order: 'asc' }]
            }
          }
        ]
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toHaveLength(3);
      expect(result.data?.transformed[0].fullName).toBe('ALICE BROWN');
      expect(result.data?.transformed[0].years).toBe(28);
    });

    it('should preserve original data when requested', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'map',
          config: {
            fieldMapping: { 'name': 'fullName' },
            transformations: {}
          }
        }],
        preserveOriginal: true
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.original).toEqual(sampleData);
      expect(result.data?.transformed).toBeDefined();
    });

    it('should handle error handling - skip mode', async () => {
      const config: TransformConfig = {
        operations: [
          {
            type: 'filter',
            config: {
              conditions: [{ field: 'age', operator: 'gte', value: 30 }]
            }
          },
          {
            type: 'aggregate', // Will fail because filter doesn't produce grouped data
            config: {
              groupBy: 'nonexistent',
              aggregations: []
            }
          }
        ],
        errorHandling: 'skip'
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.warnings).toBeDefined();
      expect(result.data?.warnings?.length).toBeGreaterThan(0);
    });

    it('should handle error handling - fail mode', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'invalid' as any,
          config: {}
        }],
        errorHandling: 'fail'
      };

      const input: TransformInput = { data: sampleData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported transformation type');
    });

    it('should format output as JSON (default)', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'map',
          config: {
            fieldMapping: { 'name': 'fullName' },
            transformations: {}
          }
        }],
        outputFormat: 'json'
      };

      const input: TransformInput = { data: [{ name: 'John' }] };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toEqual([{ fullName: 'John' }]);
    });

    it('should format output as XML', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'map',
          config: {
            fieldMapping: { 'name': 'fullName' },
            transformations: {}
          }
        }],
        outputFormat: 'xml'
      };

      const input: TransformInput = { data: { name: 'John' } };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(typeof result.data?.transformed).toBe('string');
      expect(result.data?.transformed).toContain('<root>');
      expect(result.data?.transformed).toContain('<fullName>John</fullName>');
    });

    it('should format output as CSV', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'map',
          config: {
            fieldMapping: { 'name': 'fullName', 'age': 'years' },
            transformations: {}
          }
        }],
        outputFormat: 'csv'
      };

      const input: TransformInput = { data: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }] };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(typeof result.data?.transformed).toBe('string');
      expect(result.data?.transformed).toContain('fullName,years');
      expect(result.data?.transformed).toContain('"John",30');
      expect(result.data?.transformed).toContain('"Jane",25');
    });

    it('should format output as text', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'map',
          config: {
            fieldMapping: { 'name': 'fullName' },
            transformations: {}
          }
        }],
        outputFormat: 'text'
      };

      const input: TransformInput = { data: { name: 'John' } };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      expect(typeof result.data?.transformed).toBe('string');
      expect(result.data?.transformed).toContain('"fullName": "John"');
    });
  });

  describe('custom transformations', () => {
    it('should handle string transformations', async () => {
      const testCases = [
        { func: 'uppercase', input: 'hello', expected: 'HELLO' },
        { func: 'lowercase', input: 'HELLO', expected: 'hello' },
        { func: 'trim', input: '  hello  ', expected: 'hello' }
      ];

      for (const testCase of testCases) {
        const config: TransformConfig = {
          operations: [{
            type: 'custom',
            config: { function: testCase.func }
          }]
        };

        const input: TransformInput = { data: testCase.input };
        const result = await connector.execute(config, input);

        expect(result.success).toBe(true);
        expect(result.data?.transformed).toBe(testCase.expected);
      }
    });

    it('should handle split and join transformations', async () => {
      const splitConfig: TransformConfig = {
        operations: [{
          type: 'custom',
          config: {
            function: 'split',
            parameters: { separator: ',' }
          }
        }]
      };

      const splitInput: TransformInput = { data: 'a,b,c,d' };
      const splitResult = await connector.execute(splitConfig, splitInput);

      expect(splitResult.success).toBe(true);
      expect(splitResult.data?.transformed).toEqual(['a', 'b', 'c', 'd']);

      const joinConfig: TransformConfig = {
        operations: [{
          type: 'custom',
          config: {
            function: 'join',
            parameters: { joinChar: ' | ' }
          }
        }]
      };

      const joinInput: TransformInput = { data: ['a', 'b', 'c', 'd'] };
      const joinResult = await connector.execute(joinConfig, joinInput);

      expect(joinResult.success).toBe(true);
      expect(joinResult.data?.transformed).toBe('a | b | c | d');
    });

    it('should handle unknown custom functions', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'custom',
          config: { function: 'unknownFunction' }
        }]
      };

      const input: TransformInput = { data: 'test' };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown custom function: unknownFunction');
    });
  });

  describe('aggregation functions', () => {
    const numericData = [
      { group: 'A', value: 10 },
      { group: 'A', value: 20 },
      { group: 'B', value: 5 },
      { group: 'B', value: 15 },
      { group: 'B', value: 25 }
    ];

    it('should calculate sum aggregation', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'aggregate',
          config: {
            groupBy: 'group',
            aggregations: [{ field: 'value', operation: 'sum' }]
          }
        }]
      };

      const input: TransformInput = { data: numericData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      const groupA = result.data?.transformed.find((g: any) => g.group === 'A');
      const groupB = result.data?.transformed.find((g: any) => g.group === 'B');
      
      expect(groupA.sum_value).toBe(30);
      expect(groupB.sum_value).toBe(45);
    });

    it('should calculate average aggregation', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'aggregate',
          config: {
            groupBy: 'group',
            aggregations: [{ field: 'value', operation: 'avg', alias: 'average' }]
          }
        }]
      };

      const input: TransformInput = { data: numericData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      const groupA = result.data?.transformed.find((g: any) => g.group === 'A');
      const groupB = result.data?.transformed.find((g: any) => g.group === 'B');
      
      expect(groupA.average).toBe(15);
      expect(groupB.average).toBe(15);
    });

    it('should calculate min/max aggregations', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'aggregate',
          config: {
            groupBy: 'group',
            aggregations: [
              { field: 'value', operation: 'min' },
              { field: 'value', operation: 'max' }
            ]
          }
        }]
      };

      const input: TransformInput = { data: numericData };
      const result = await connector.execute(config, input);

      expect(result.success).toBe(true);
      const groupB = result.data?.transformed.find((g: any) => g.group === 'B');
      
      expect(groupB.min_value).toBe(5);
      expect(groupB.max_value).toBe(25);
    });
  });

  describe('test', () => {
    it('should run test with sample data', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'filter',
          config: {
            conditions: [{ field: 'age', operator: 'gte', value: 30 }]
          }
        }]
      };

      const result = await connector.test(config);

      expect(result.success).toBe(true);
      expect(result.data?.transformed).toHaveLength(2); // John (30) and Bob (35)
      expect(result.data?.operations).toBe(1);
    });

    it('should handle test failures', async () => {
      const config: TransformConfig = {
        operations: [{
          type: 'invalid' as any,
          config: {}
        }]
      };

      const result = await connector.test(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported transformation type');
      expect(result.message).toBe('Data transform connector test failed');
    });
  });

  describe('schema methods', () => {
    it('should return valid config schema', () => {
      const schema = connector.getConfigSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('operations');
      expect(schema.properties).toHaveProperty('outputFormat');
      expect(schema.properties).toHaveProperty('preserveOriginal');
      expect(schema.properties).toHaveProperty('errorHandling');
      expect(schema.required).toEqual(['operations']);

      expect(schema.properties.operations.items.properties.type.enum).toEqual([
        'map', 'filter', 'aggregate', 'sort', 'custom'
      ]);
    });

    it('should return valid input schema', () => {
      const schema = connector.getInputSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('data');
      expect(schema.properties).toHaveProperty('context');
      expect(schema.required).toEqual(['data']);
    });

    it('should return valid output schema', () => {
      const schema = connector.getOutputSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('transformed');
      expect(schema.properties).toHaveProperty('original');
      expect(schema.properties).toHaveProperty('operations');
      expect(schema.properties).toHaveProperty('errors');
      expect(schema.properties).toHaveProperty('warnings');
    });
  });
});