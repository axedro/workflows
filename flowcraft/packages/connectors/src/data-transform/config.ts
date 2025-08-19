import { z } from 'zod';

export const DataTransformConfigSchema = z.object({
  operations: z.array(z.object({
    type: z.enum([
      'map',
      'filter',
      'rename',
      'type_convert',
      'aggregate',
      'sort',
      'flatten',
      'nest',
      'join',
      'split',
      'format',
      'validate'
    ]),
    config: z.record(z.any()),
    enabled: z.boolean().default(true),
  })),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  validation: z.object({
    strict: z.boolean().default(false),
    allowUnknown: z.boolean().default(true),
    removeUnknown: z.boolean().default(false),
  }).optional(),
  errorHandling: z.object({
    onError: z.enum(['fail', 'skip', 'continue']).default('fail'),
    defaultValue: z.any().optional(),
  }).optional(),
});

export type DataTransformConfig = z.infer<typeof DataTransformConfigSchema>;

export const DataTransformConfigDefaults: DataTransformConfig = {
  operations: [],
  validation: {
    strict: false,
    allowUnknown: true,
    removeUnknown: false,
  },
  errorHandling: {
    onError: 'fail',
  },
};

export const DataTransformConfigDescription = {
  operations: 'Array of data transformation operations to apply',
  inputSchema: 'Expected input data schema (optional)',
  outputSchema: 'Expected output data schema (optional)',
  validation: {
    strict: 'Strict validation mode',
    allowUnknown: 'Allow unknown fields in input',
    removeUnknown: 'Remove unknown fields from output',
  },
  errorHandling: {
    onError: 'Action to take when an operation fails',
    defaultValue: 'Default value to use on error',
  },
};

// Operation-specific schemas
export const OperationSchemas = {
  map: z.object({
    field: z.string(),
    expression: z.string(),
    target: z.string().optional(),
  }),
  filter: z.object({
    condition: z.string(),
    operator: z.enum(['and', 'or']).default('and'),
  }),
  rename: z.object({
    mappings: z.record(z.string()),
  }),
  type_convert: z.object({
    field: z.string(),
    targetType: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
    format: z.string().optional(),
  }),
  aggregate: z.object({
    groupBy: z.array(z.string()),
    operations: z.record(z.enum(['sum', 'avg', 'min', 'max', 'count', 'first', 'last'])),
  }),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
  flatten: z.object({
    field: z.string(),
    separator: z.string().default('.'),
  }),
  nest: z.object({
    fields: z.array(z.string()),
    target: z.string(),
  }),
  join: z.object({
    field: z.string(),
    separator: z.string().default(','),
  }),
  split: z.object({
    field: z.string(),
    separator: z.string(),
    target: z.string(),
  }),
  format: z.object({
    template: z.string(),
    variables: z.record(z.string()),
  }),
  validate: z.object({
    rules: z.record(z.any()),
  }),
};
