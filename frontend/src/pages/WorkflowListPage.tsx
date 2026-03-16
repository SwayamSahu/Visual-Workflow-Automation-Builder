import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Workflow, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/ui/Button';
import { workflowsApi } from '../api/workflows.api';
import { WorkflowRecord } from '../types';

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    workflowsApi
      .list()
      .then(setWorkflows)
      .catch(() => toast.error('Failed to load workflows'))
      .finally(() => setLoading(false));
  }, []);

  const createNew = async () => {
    setCreating(true);
    try {
      const wf = await workflowsApi.create('Untitled Workflow', {
        nodes: [],
        edges: [],
      });
      navigate(`/workflows/${wf.id}`);
    } catch {
      toast.error('Failed to create workflow');
      setCreating(false);
    }
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this workflow?')) return;
    try {
      await workflowsApi.delete(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      toast.success('Workflow deleted');
    } catch {
      toast.error('Failed to delete workflow');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">Workflow Builder</h1>
          </div>
          <Button onClick={createNew} loading={creating}>
            <Plus className="w-4 h-4" />
            New Workflow
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-20">
            <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No workflows yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">
              Create your first workflow to get started
            </p>
            <Button onClick={createNew} loading={creating}>
              <Plus className="w-4 h-4" />
              Create Workflow
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => navigate(`/workflows/${wf.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {wf.definition.nodes.length} node
                      {wf.definition.nodes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => remove(wf.id, e)}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0"
                    title="Delete workflow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-3 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(wf.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
