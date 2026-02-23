import type { PlatformDetection } from '../lib/api.ts';

interface PlatformPickerProps {
  platforms: PlatformDetection[];
  selected: string;
  onSelect: (id: string) => void;
}

const OTHER_ID = '__other__';

export function PlatformPicker({ platforms, selected, onSelect }: PlatformPickerProps) {
  return (
    <div className="space-y-2">
      {platforms.map((p) => (
        <label
          key={p.id}
          className={`flex cursor-pointer items-center gap-3 rounded-[8px] border p-3 transition-colors duration-100 ${
            selected === p.id
              ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]'
              : 'border-[var(--border-primary)] bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <input
            type="radio"
            name="platform"
            value={p.id}
            checked={selected === p.id}
            onChange={() => onSelect(p.id)}
            className="sr-only"
          />
          <div
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
              selected === p.id
                ? 'border-[var(--accent-primary)]'
                : 'border-[var(--border-primary)]'
            }`}
          >
            {selected === p.id && (
              <div className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
            )}
          </div>
          <span className="text-[0.875rem] font-medium text-[var(--text-primary)]">
            {p.name}
          </span>
          {p.detected && (
            <span className="rounded-full bg-[var(--status-pass-bg)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--status-pass)]">
              Detected
            </span>
          )}
        </label>
      ))}

      {/* Other / Generic */}
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-[8px] border p-3 transition-colors duration-100 ${
          selected === OTHER_ID
            ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]'
            : 'border-[var(--border-primary)] bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)]'
        }`}
      >
        <input
          type="radio"
          name="platform"
          value={OTHER_ID}
          checked={selected === OTHER_ID}
          onChange={() => onSelect(OTHER_ID)}
          className="sr-only"
        />
        <div
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
            selected === OTHER_ID
              ? 'border-[var(--accent-primary)]'
              : 'border-[var(--border-primary)]'
          }`}
        >
          {selected === OTHER_ID && (
            <div className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
          )}
        </div>
        <span className="text-[0.875rem] font-medium text-[var(--text-primary)]">
          Other / Generic
        </span>
      </label>
    </div>
  );
}
