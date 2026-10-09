import { useEffect, useState } from 'react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMsg {
  id: number;
  text: string;
  kind: 'ok' | 'bad';
  action?: ToastAction;
}

const listeners = new Set<(m: ToastMsg) => void>();
let seq = 0;

/** Fire-and-forget notice. Pass an `action` (e.g. Undo) to show a button next to the text. */
export function toast(text: string, kind: 'ok' | 'bad' = 'ok', action?: ToastAction) {
  const m = { id: ++seq, text, kind, action };
  for (const l of listeners) l(m);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    const l = (m: ToastMsg) => {
      setItems((xs) => [...xs, m]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== m.id)), m.kind === 'bad' ? 7000 : m.action ? 6000 : 3500);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  if (items.length === 0) return null;
  return (
    <div style={{ position: 'fixed', bottom: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
      {items.map((m) => (
        <div key={m.id} className={`toast ${m.kind}`} style={{ position: 'static' }} role="status">
          <span>{m.text}</span>
          {m.action && (
            <button
              className="toast-action"
              onClick={() => {
                m.action?.onClick();
                setItems((xs) => xs.filter((x) => x.id !== m.id));
              }}
            >
              {m.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
