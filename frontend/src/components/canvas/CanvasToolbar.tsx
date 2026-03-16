import { Save, ArrowLeft, Link, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useWorkflowStore } from '../../store/workflowStore';

interface CanvasToolbarProps {
  workflowId: string;
  onSave: () => Promise<void>;
  saving: boolean;
  onRun: () => void;
}

export default function CanvasToolbar({
  workflowId,
  onSave,
  saving,
  onRun,
}: CanvasToolbarProps) {
  const navigate = useNavigate();
  const { workflowName, setWorkflowName } = useWorkflowStore();

  const webhookUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/webhook/${workflowId}`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
  };

  return (
    <header className="h-12 flex-shrink-0 bg-slate-800 flex items-center gap-3 px-4 shadow-md z-10">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="text-slate-400 hover:text-white transition-colors"
        title="Back to workflows"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-600" />

      {/* Workflow name */}
      <input
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        className="bg-transparent text-white text-sm font-medium w-56 focus:outline-none border-b border-transparent focus:border-slate-400 pb-0.5 transition-colors"
        placeholder="Workflow name…"
      />

      <div className="ml-auto flex items-center gap-2">
        {/* Webhook URL copy */}
        <button
          onClick={copyWebhook}
          title={`Copy webhook URL: ${webhookUrl}`}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
        >
          <Link className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Webhook</span>
        </button>

        {/* Run */}
        <Button size="sm" variant="ghost" onClick={onRun} className="text-green-400 hover:bg-slate-700 hover:text-green-300">
          <Play className="w-3.5 h-3.5" />
          Run
        </Button>

        {/* Save */}
        <Button size="sm" variant="primary" onClick={onSave} loading={saving}>
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
      </div>
    </header>
  );
}
