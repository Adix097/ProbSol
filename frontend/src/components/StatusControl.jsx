const OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

// Segmented control for a node's status.
export default function StatusControl({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Status" className="flex max-w-full overflow-x-auto rounded-md border border-ink/15 text-xs font-medium">
      {OPTIONS.map((o) => {
        const active = value === o.value;
        const activeCls = o.value === 'completed' ? 'bg-brand text-white' : o.value === 'in_progress' ? 'bg-amber-100 text-amber-900' : 'bg-ink/10 text-ink';
        return (
          <button
            key={o.value} type="button" role="radio" aria-checked={active} disabled={disabled}
            onClick={() => !active && onChange(o.value)}
            className={`shrink-0 px-2.5 py-1.5 transition-colors disabled:opacity-60 sm:px-3 ${active ? activeCls : 'bg-white text-ink/60 hover:bg-ink/5'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
