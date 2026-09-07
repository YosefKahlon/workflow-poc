import { useEffect, useState } from 'react';

import { useCanvasStore } from './canvas-store';
import { ALL_PALETTE_ITEMS } from './node-registry';

export function CanvasSwitcher() {
  const canvases = useCanvasStore((s) => s.canvases);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setActiveCanvas = useCanvasStore((s) => s.setActiveCanvas);
  const addCanvas = useCanvasStore((s) => s.addCanvas);
  const load = useCanvasStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleCreate = () => {
    if (!name.trim() || selectedTypes.length === 0) {
      return;
    }
    addCanvas({ id: `canvas-${Date.now().toString(36)}`, name: name.trim(), nodeTypeKeys: selectedTypes });
    setName('');
    setSelectedTypes([]);
    setIsAdding(false);
  };

  return (
    // No positioning here — this renders as plain content inside the shared
    // floating bar in App.tsx. The add-canvas form is placed *above* the tab
    // row in DOM order so it expands upward, away from the bar's pinned
    // bottom edge, instead of pushing the tabs around when it opens.
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {canvases.map((canvas) => (
          <button
            key={canvas.id}
            type="button"
            onClick={() => setActiveCanvas(canvas.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: canvas.id === activeCanvasId ? 700 : 400,
              background: canvas.id === activeCanvasId ? '#111827' : 'white',
              color: canvas.id === activeCanvasId ? 'white' : '#111827',
              border: '1px solid #d1d5db',
            }}
          >
            {canvas.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: '1px dashed #9ca3af', background: 'white' }}
        >
          + New Canvas
        </button>
      </div>

      {isAdding && (
        <div style={{ background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, width: 220 }}>
          <input
            type="text"
            placeholder="Canvas name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {ALL_PALETTE_ITEMS.map((item) => (
              <label key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedTypes.includes(item.type)} onChange={() => toggleType(item.type)} />
                {item.label}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: '#16a34a', color: 'white', border: 'none' }}
          >
            Create
          </button>
        </div>
      )}
    </div>
  );
}
