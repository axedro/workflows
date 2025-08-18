import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface ExecutionHistoryPanelProps {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenExecution?: (executionId: string) => void;
}

interface ExecutionItem {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  errorDetails?: string;
  executionTimeMs?: number | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'RUNNING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDuration = (ms?: number | null) => {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({
  workflowId,
  isOpen,
  onClose,
  onOpenExecution,
}) => {
  const [executions, setExecutions] = useState<ExecutionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExecutionItem['status'] | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadExecutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getWorkflowExecutions(
        workflowId,
        statusFilter === 'ALL' ? undefined : { status: statusFilter }
      );
      let list = res.executions || [];
      // client-side date filtering
      if (startDate) {
        const start = new Date(startDate).getTime();
        list = list.filter(e => new Date(e.startedAt).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        list = list.filter(e => new Date(e.startedAt).getTime() <= end);
      }
      setExecutions(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadExecutions();
  }, [isOpen, workflowId, statusFilter, startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Execution History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-600">Loading…</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-3">{error}</div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Filters */}
          <div className="mb-3 flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {['ALL','PENDING','RUNNING','COMPLETED','FAILED','CANCELLED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <button
              onClick={loadExecutions}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {executions.length === 0 && !loading ? (
            <div className="text-center text-gray-500 py-12">No executions found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {executions.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(e.status)}`}>{e.status}</span>
                      <code className="text-xs text-gray-500 truncate">{e.id}</code>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Started {new Date(e.startedAt).toLocaleString()}
                      {e.completedAt && (
                        <span className="ml-2">• Completed {new Date(e.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                    {e.errorDetails && (
                      <div className="text-xs text-red-600 mt-1 truncate max-w-xl">{e.errorDetails}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-gray-600">{formatDuration(e.executionTimeMs)}</span>
                    {onOpenExecution && (
                      <button
                        onClick={() => onOpenExecution(e.id)}
                        className="inline-flex items-center px-2 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                        title="View details"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionHistoryPanel;


