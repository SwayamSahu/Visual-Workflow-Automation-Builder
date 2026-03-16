import { Node } from 'reactflow';
import { NodeData } from '../../types';

interface ConfigPanelProps {
  node: Node<NodeData>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

// ─── Shared form helpers ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white';
const textareaCls =
  'w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none font-mono';

// ─── Per-type config forms ────────────────────────────────────────────────────

function WebhookConfig() {
  return (
    <p className="text-xs text-gray-400 italic">
      No configuration needed. This node receives the incoming webhook payload.
    </p>
  );
}

function StoreConfig() {
  return (
    <p className="text-xs text-gray-400 italic">
      No configuration needed. This node saves the current data to the database.
    </p>
  );
}

function TransformConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  type Mapping = { source?: string; target: string; value?: string };
  const mappings: Mapping[] = (config.mappings as Mapping[]) ?? [];

  const update = (updated: Mapping[]) => onChange({ ...config, mappings: updated });

  const add = () => update([...mappings, { source: '', target: '' }]);
  const remove = (i: number) => update(mappings.filter((_, idx) => idx !== i));
  const set = (i: number, field: keyof Mapping, val: string) => {
    const copy = mappings.map((m, idx) =>
      idx === i ? { ...m, [field]: val } : m
    );
    update(copy);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">Field Mappings</label>
      {mappings.length === 0 && (
        <p className="text-xs text-gray-400 italic">No mappings yet.</p>
      )}
      {mappings.map((m, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <input
            className={`${inputCls} flex-1`}
            placeholder="source"
            value={m.source ?? ''}
            onChange={(e) => set(i, 'source', e.target.value)}
          />
          <span className="text-gray-300 text-sm">→</span>
          <input
            className={`${inputCls} flex-1`}
            placeholder="target"
            value={m.target}
            onChange={(e) => set(i, 'target', e.target.value)}
          />
          <input
            className={`${inputCls} flex-1`}
            placeholder="value"
            value={m.value ?? ''}
            onChange={(e) => set(i, 'value', e.target.value)}
          />
          <button
            onClick={() => remove(i)}
            className="text-gray-300 hover:text-red-500 text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        + Add Mapping
      </button>
    </div>
  );
}

function AIConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <Field label="Prompt (supports {{field}} interpolation)">
      <textarea
        className={`${textareaCls} h-32`}
        placeholder={'Extract intent from {{message}}. Return JSON like:\n{"intent": "sales"}'}
        value={(config.prompt as string) ?? ''}
        onChange={(e) => onChange({ ...config, prompt: e.target.value })}
      />
    </Field>
  );
}

function ConditionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  type Branch = { operator: string; value: string; target: string };
  const branches: Branch[] = (config.branches as Branch[]) ?? [];
  const operators = ['equals', 'not_equals', 'contains', 'gt', 'lt'];

  const updateBranches = (updated: Branch[]) =>
    onChange({ ...config, branches: updated });

  const add = () =>
    updateBranches([...branches, { operator: 'equals', value: '', target: '' }]);
  const remove = (i: number) => updateBranches(branches.filter((_, idx) => idx !== i));
  const set = (i: number, field: keyof Branch, val: string) =>
    updateBranches(
      branches.map((b, idx) => (idx === i ? { ...b, [field]: val } : b))
    );

  return (
    <div className="space-y-4">
      <Field label="Evaluate field">
        <input
          className={inputCls}
          placeholder="e.g. intent"
          value={(config.field as string) ?? ''}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
        />
      </Field>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Branches</label>

        {branches.length === 0 && (
          <p className="text-xs text-gray-400 italic">No branches yet.</p>
        )}

        {branches.map((b, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2"
          >
            {/* Branch header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Branch {i + 1}
              </span>
              <button
                onClick={() => remove(i)}
                className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none px-1"
                title="Remove branch"
              >
                ×
              </button>
            </div>

            {/* Operator */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Operator</label>
              <select
                className={inputCls}
                value={b.operator}
                onChange={(e) => set(i, 'operator', e.target.value)}
              >
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Value</label>
              <input
                className={inputCls}
                placeholder="e.g. sales"
                value={b.value}
                onChange={(e) => set(i, 'value', e.target.value)}
              />
            </div>
          </div>
        ))}

        <button
          onClick={add}
          className="w-full rounded-md border border-dashed border-indigo-300 py-1.5 text-xs font-medium text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          + Add Branch
        </button>

        <p className="text-[10px] text-gray-400 leading-tight">
          Connect each branch handle at the bottom of the node to a downstream node.
        </p>
      </div>
    </div>
  );
}

function DelayConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const delayMs = (config.delayMs as number) ?? 1000;
  return (
    <Field label="Delay duration (milliseconds)">
      <input
        type="number"
        className={inputCls}
        min={0}
        max={30000}
        step={100}
        value={delayMs}
        onChange={(e) => onChange({ ...config, delayMs: Number(e.target.value) })}
      />
      <p className="text-[10px] text-gray-400 mt-1">
        {delayMs >= 1000 ? `${delayMs / 1000}s` : `${delayMs}ms`} — max 30s
      </p>
    </Field>
  );
}

function EmailConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const mode = (config.mode as string) ?? 'template';
  return (
    <div className="space-y-3">
      <Field label="To (supports {{field}})">
        <input
          className={inputCls}
          placeholder="{{email}}"
          value={(config.to as string) ?? ''}
          onChange={(e) => onChange({ ...config, to: e.target.value })}
        />
      </Field>
      <Field label="Subject (supports {{field}})">
        <input
          className={inputCls}
          placeholder="Hello {{name}}"
          value={(config.subject as string) ?? ''}
          onChange={(e) => onChange({ ...config, subject: e.target.value })}
        />
      </Field>
      <div className="flex gap-4 text-sm">
        {['template', 'ai'].map((m) => (
          <label key={m} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="email-mode"
              value={m}
              checked={mode === m}
              onChange={() => onChange({ ...config, mode: m })}
            />
            <span className="capitalize text-gray-600">{m}</span>
          </label>
        ))}
      </div>
      <Field label={mode === 'ai' ? 'AI Prompt' : 'Body (supports {{field}})'}>
        <textarea
          className={`${textareaCls} h-24`}
          placeholder={
            mode === 'ai'
              ? 'Write a friendly welcome email for {{name}}'
              : 'Hi {{name}}, thanks for reaching out!'
          }
          value={((mode === 'ai' ? config.prompt : config.body) as string) ?? ''}
          onChange={(e) =>
            onChange({
              ...config,
              ...(mode === 'ai' ? { prompt: e.target.value } : { body: e.target.value }),
            })
          }
        />
      </Field>
    </div>
  );
}

// ─── Main ConfigPanel ─────────────────────────────────────────────────────────

export default function ConfigPanel({ node, onConfigChange }: ConfigPanelProps) {
  const { type } = node.data;
  const config = node.data.config;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{node.data.label}</h3>
        <p className="text-xs text-gray-400">Node ID: {node.id}</p>
      </div>

      <div className="border-t pt-3">
        {type === 'webhook' && <WebhookConfig />}
        {type === 'store' && <StoreConfig />}
        {type === 'transform' && (
          <TransformConfig config={config} onChange={onConfigChange} />
        )}
        {type === 'ai' && <AIConfig config={config} onChange={onConfigChange} />}
        {type === 'condition' && (
          <ConditionConfig config={config} onChange={onConfigChange} />
        )}
        {type === 'email' && (
          <EmailConfig config={config} onChange={onConfigChange} />
        )}
        {type === 'delay' && (
          <DelayConfig config={config} onChange={onConfigChange} />
        )}
      </div>
    </div>
  );
}
