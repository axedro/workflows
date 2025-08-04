/**
 * Data Visualization Utilities - FlowCraft Workflow Automation Platform
 * 
 * This module provides utility components for visualizing data flow information
 * in workflow nodes without using invasive tooltips.
 */

import React from 'react';
import { DataSchema, DataField } from '@flowcraft/shared-types';

interface DataStatsProps {
  schema: DataSchema;
  title?: string;
  className?: string;
}

export const DataStats: React.FC<DataStatsProps> = ({ schema, title = "Data Stats", className = "" }) => {
  const inputFields = Object.keys(schema.input);
  const outputFields = Object.keys(schema.output);
  const totalFields = inputFields.length + outputFields.length;

  const getTypeCounts = (fields: Record<string, DataField>) => {
    const counts: Record<string, number> = {};
    Object.values(fields).forEach(field => {
      counts[field.type] = (counts[field.type] || 0) + 1;
    });
    return counts;
  };

  const inputTypeCounts = getTypeCounts(schema.input);
  const outputTypeCounts = getTypeCounts(schema.output);

  return (
    <div className={`bg-black bg-opacity-30 rounded px-2 py-1 ${className}`}>
      <div className="text-xs text-white font-semibold">{title}</div>
      <div className="flex gap-2 mt-1">
        <div className="text-xs text-blue-300">
          In: {inputFields.length}
        </div>
        <div className="text-xs text-green-300">
          Out: {outputFields.length}
        </div>
        <div className="text-xs text-gray-300">
          Total: {totalFields}
        </div>
      </div>
    </div>
  );
};

interface FieldListProps {
  fields: Record<string, DataField>;
  title: string;
  maxFields?: number;
  color?: string;
  className?: string;
}

export const FieldList: React.FC<FieldListProps> = ({ 
  fields, 
  title, 
  maxFields = 3, 
  color = "bg-blue-500", 
  className = "" 
}) => {
  const fieldKeys = Object.keys(fields);
  const displayFields = fieldKeys.slice(0, maxFields);
  const remainingCount = fieldKeys.length - maxFields;

  return (
    <div className={`bg-black bg-opacity-30 rounded px-2 py-1 ${className}`}>
      <div className="text-xs text-white font-semibold">{title}:</div>
      <div className="flex flex-wrap gap-1 mt-1">
        {displayFields.map(fieldKey => (
          <div key={fieldKey} className={`text-xs ${color} bg-opacity-80 text-white px-1 rounded`}>
            {fieldKey}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className={`text-xs ${color} bg-opacity-80 text-white px-1 rounded`}>
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

interface TypeIndicatorProps {
  type: string;
  className?: string;
}

export const TypeIndicator: React.FC<TypeIndicatorProps> = ({ type, className = "" }) => {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'string': return 'bg-green-500';
      case 'number': return 'bg-blue-500';
      case 'boolean': return 'bg-yellow-500';
      case 'object': return 'bg-purple-500';
      case 'array': return 'bg-orange-500';
      case 'date': return 'bg-indigo-500';
      case 'email': return 'bg-pink-500';
      case 'url': return 'bg-teal-500';
      case 'file': return 'bg-gray-500';
      case 'json': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`text-xs ${getTypeColor(type)} bg-opacity-80 text-white px-1 rounded ${className}`}>
      {type}
    </div>
  );
};

interface ValidationIndicatorProps {
  isValid: boolean;
  hasWarnings?: boolean;
  className?: string;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({ 
  isValid, 
  hasWarnings = false, 
  className = "" 
}) => {
  const getStatusColor = () => {
    if (!isValid) return 'bg-red-500';
    if (hasWarnings) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!isValid) return '✗';
    if (hasWarnings) return '!';
    return '✓';
  };

  return (
    <div className={`w-3 h-3 ${getStatusColor()} rounded-full border border-white shadow-sm flex items-center justify-center ${className}`}>
      <span className="text-white text-xs font-bold">{getStatusIcon()}</span>
    </div>
  );
}; 