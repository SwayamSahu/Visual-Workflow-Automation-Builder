export interface NodeMeta {
  type: string;
  label: string;
  color: string;       // text / border color
  bgColor: string;     // badge background
  description: string;
  defaultConfig: Record<string, unknown>;
}

export const NODE_REGISTRY: Record<string, NodeMeta> = {
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    color: '#6366f1',
    bgColor: '#eef2ff',
    description: 'Entry point — starts the workflow',
    defaultConfig: {},
  },
  transform: {
    type: 'transform',
    label: 'Transform',
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
    description: 'Rename, add or compute fields',
    defaultConfig: { mappings: [] },
  },
  ai: {
    type: 'ai',
    label: 'AI',
    color: '#8b5cf6',
    bgColor: '#f3e8ff',
    description: 'LLM extraction or transformation',
    defaultConfig: { prompt: '' },
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Branch on a field value',
    defaultConfig: { field: '', branches: [] },
  },
  email: {
    type: 'email',
    label: 'Email',
    color: '#10b981',
    bgColor: '#d1fae5',
    description: 'Send an email',
    defaultConfig: { mode: 'template', to: '', subject: '', body: '' },
  },
  store: {
    type: 'store',
    label: 'Store',
    color: '#64748b',
    bgColor: '#f1f5f9',
    description: 'Save result to database',
    defaultConfig: {},
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    color: '#f97316',
    bgColor: '#ffedd5',
    description: 'Pause execution for N ms',
    defaultConfig: { delayMs: 1000 },
  },
};

export const NODE_TYPES_LIST = Object.values(NODE_REGISTRY);
