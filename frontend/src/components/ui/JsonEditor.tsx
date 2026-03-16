import React, { useState, useEffect } from 'react';

interface JsonEditorProps {
  value: Record<string, unknown>;
  onChange?: (value: Record<string, unknown>) => void;
  readOnly?: boolean;
  minRows?: number;
  placeholder?: string;
}

export default function JsonEditor({
  value,
  onChange,
  readOnly = false,
  minRows = 6,
  placeholder = '{\n  \n}',
}: JsonEditorProps) {
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  // Sync external value changes (e.g. when results arrive)
  useEffect(() => {
    if (readOnly) setRaw(JSON.stringify(value, null, 2));
  }, [value, readOnly]);

  const handleChange = (text: string) => {
    setRaw(text);
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      setError(null);
      onChange?.(parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div className="relative">
      <textarea
        readOnly={readOnly}
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
        spellCheck={false}
        className={`
          w-full font-mono text-xs rounded-md border px-3 py-2
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          bg-gray-900 text-green-300
          resize-y
          ${error ? 'border-red-400' : 'border-gray-700'}
          ${readOnly ? 'cursor-default opacity-90' : ''}
        `}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
