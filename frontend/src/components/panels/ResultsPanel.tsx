import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import JsonEditor from '../ui/JsonEditor';
import { useExecutionStore } from '../../store/executionStore';
import { ExecLogEntry } from '../../types';

function LogEntry({ entry }: { entry: ExecLogEntry }) {
  const [open, setOpen] = useState(false);
  const isError = entry.status === 'error';

  return (
    <div className={`rounded-md border text-xs ${isError ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}
        <span
          className={`font-semibold ${isError ? 'text-red-600' : 'text-gray-700'}`}
        >
          {entry.nodeType}
        </span>
        <span className="text-gray-400 font-mono">{entry.nodeId}</span>
        <span className="ml-auto text-gray-300">{entry.durationMs}ms</span>
        <Badge variant={entry.status === 'success' ? 'success' : 'error'}>
          {entry.status}
        </Badge>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
          {entry.error && (
            <p className="text-red-500 text-xs font-mono bg-red-50 px-2 py-1 rounded">
              {entry.error}
            </p>
          )}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Input</p>
            <JsonEditor value={entry.input} readOnly minRows={3} />
          </div>
          {entry.status === 'success' && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Output</p>
              <JsonEditor value={entry.output} readOnly minRows={3} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPanel() {
  const { status, execLog, resultJson, executionId } = useExecutionStore();

  if (status === 'idle') {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <p>No execution yet.</p>
        <p className="text-xs mt-1">Run the workflow to see results here.</p>
      </div>
    );
  }

  const statusVariant =
    status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'running';

  // Top-level error stored by the backend when the whole execution throws
  const executionError = resultJson?._error as string | undefined;

  // Only show "Final Output" when there's real data (not just the internal _error key)
  const outputJson = resultJson
    ? Object.fromEntries(Object.entries(resultJson).filter(([k]) => k !== '_error'))
    : null;
  const hasOutput = outputJson && Object.keys(outputJson).length > 0;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Execution Result</h3>
        <Badge variant={statusVariant}>{status}</Badge>
      </div>

      {executionId && (
        <p className="text-[10px] font-mono text-gray-400 truncate">
          {executionId}
        </p>
      )}

      {/* Top-level execution error (e.g. no start node, unhandled throw) */}
      {executionError && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 space-y-0.5">
          <p className="text-xs font-semibold text-red-600">Execution Error</p>
          <p className="text-xs font-mono text-red-500 break-words">{executionError}</p>
        </div>
      )}

      {/* Execution Log */}
      {execLog.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Execution Log
          </p>
          {execLog.map((entry, i) => (
            <LogEntry key={`${entry.nodeId}-${i}`} entry={entry} />
          ))}
        </div>
      )}

      {/* No nodes ran and no error detail — generic hint */}
      {status === 'failed' && execLog.length === 0 && !executionError && (
        <p className="text-xs text-gray-400 italic">
          Execution failed before any nodes ran. Check the server logs for details.
        </p>
      )}

      {/* Final Result */}
      {hasOutput && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Final Output
          </p>
          <JsonEditor value={outputJson} readOnly minRows={5} />
        </div>
      )}
    </div>
  );
}
