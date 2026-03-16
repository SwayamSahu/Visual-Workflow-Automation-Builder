import { NODE_TYPES_LIST } from '../../config/nodeRegistry';

export default function NodePalette() {
  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-3 py-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Node Types
        </h2>
        <p className="text-[10px] text-gray-400 mt-0.5">Drag onto canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
        {NODE_TYPES_LIST.map((meta) => (
          <div
            key={meta.type}
            draggable
            onDragStart={(e) => onDragStart(e, meta.type)}
            style={{ borderLeftColor: meta.color }}
            className="
              flex flex-col gap-0.5 px-2.5 py-2 rounded-md border border-l-4 border-gray-100
              bg-white cursor-grab active:cursor-grabbing
              hover:shadow-sm hover:border-gray-200
              transition-shadow duration-100 select-none
            "
          >
            <span
              className="text-xs font-semibold"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-[10px] text-gray-400 leading-tight">
              {meta.description}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
