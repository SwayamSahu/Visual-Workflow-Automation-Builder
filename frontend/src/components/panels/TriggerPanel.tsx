import { useState } from 'react';
import { Play } from 'lucide-react';
import Button from '../ui/Button';
import JsonEditor from '../ui/JsonEditor';
import { useExecution } from '../../hooks/useExecution';
import { useWorkflowStore } from '../../store/workflowStore';

const DEFAULT_PAYLOAD = { name: 'John', email: 'john@example.com', message: 'Hello' };

interface TriggerPanelProps {
  onBeforeRun?: () => Promise<void>;
}

export default function TriggerPanel({ onBeforeRun }: TriggerPanelProps) {
  const [payload, setPayload] = useState<Record<string, unknown>>(DEFAULT_PAYLOAD);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { workflowId, setActiveTab } = useWorkflowStore();
  const { trigger } = useExecution();

  const handleRun = async () => {
    if (!workflowId) return;
    setRunning(true);
    setError(null);
    try {
      if (onBeforeRun) await onBeforeRun();
      await trigger(workflowId, payload);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger workflow');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Trigger Workflow</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Send a JSON payload to start execution
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600">Input Payload</label>
        <JsonEditor value={payload} onChange={setPayload} minRows={8} />
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      <Button
        onClick={handleRun}
        loading={running}
        disabled={!workflowId}
        className="w-full justify-center"
      >
        <Play className="w-3.5 h-3.5" />
        {running ? 'Running…' : 'Run Workflow'}
      </Button>
    </div>
  );
}
